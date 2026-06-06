/**
 * useTranslate.ts
 *
 * Custom hook that wraps LibreTranslate + IP geolocation.
 *
 * Usage:
 *   const { translate, revert, translating, isTranslated, targetLang, error } = useTranslate()
 *
 *   // translate returns the same key-shape with translated values
 *   const out = await translate({ title: blog.title, excerpt: blog.excerpt })
 *
 */

"use client"

import { useState, useCallback, useRef } from "react"
import {
  detectUserLanguage,
  translateFields,
  LANG_NAMES,
} from "@/lib/translateApi"

// ── Module-level caches (shared across all hook instances per session) ─────────

/** Cached detected language — resolved once per session */
let _cachedLang: string | null = null

/** Translation cache: `lang:hash` → translated value map */
const _translationCache = new Map<string, Record<string, string>>()

function cacheKey(fields: Record<string, string>, lang: string): string {
  // Use first 80 chars of all values joined as cache discriminator
  const fingerprint = Object.entries(fields)
    .map(([k, v]) => `${k}:${v.slice(0, 80)}`)
    .join("|")
  return `${lang}::${fingerprint}`
}

// ── Hook ──────────────────────────────────────────────────────────────────────

interface UseTranslateReturn {
  /** Call to translate a set of fields. Returns translated values. */
  translate: (
    fields: Record<string, string>
  ) => Promise<Record<string, string>>
  /** Revert back to untranslated state */
  revert: () => void
  /** True while a translation request is in-flight */
  translating: boolean
  /** True when translated content is currently active */
  isTranslated: boolean
  /** Detected target language code, e.g. "en", "ja". Null before first call. */
  targetLang: string | null
  /** Human-readable label for the target language */
  targetLangLabel: string | null
  /** Error message, if last translation failed */
  error: string | null
}

export function useTranslate(): UseTranslateReturn {
  const [translating, setTranslating] = useState(false)
  const [isTranslated, setIsTranslated] = useState(false)
  const [targetLang, setTargetLang] = useState<string | null>(_cachedLang)
  const [error, setError] = useState<string | null>(null)

  // Prevent concurrent calls
  const inFlight = useRef(false)

  /** Resolve the user's language (cached after first call) */
  const getTargetLang = useCallback(async (): Promise<string> => {
    if (_cachedLang) {
      setTargetLang(_cachedLang)
      return _cachedLang
    }
    const lang = await detectUserLanguage()
    _cachedLang = lang
    setTargetLang(lang)
    return lang
  }, [])

  const translate = useCallback(
    async (
      fields: Record<string, string>
    ): Promise<Record<string, string>> => {
      if (inFlight.current) return fields
      inFlight.current = true
      setTranslating(true)
      setError(null)

      try {
        const lang = await getTargetLang()
        const key = cacheKey(fields, lang)

        // Return from cache if available
        if (_translationCache.has(key)) {
          setIsTranslated(true)
          return _translationCache.get(key)!
        }

        const result = await translateFields(fields, lang)
        _translationCache.set(key, result)
        setIsTranslated(true)
        return result
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Translation failed"
        setError(msg)
        throw e
      } finally {
        setTranslating(false)
        inFlight.current = false
      }
    },
    [getTargetLang]
  )

  const revert = useCallback(() => {
    setIsTranslated(false)
    setError(null)
  }, [])

  const targetLangLabel = targetLang ? (LANG_NAMES[targetLang] ?? targetLang) : null

  return {
    translate,
    revert,
    translating,
    isTranslated,
    targetLang,
    targetLangLabel,
    error,
  }
}
