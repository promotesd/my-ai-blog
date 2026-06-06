"use client"

/**
 * TranslateWidget.tsx
 *
 * Global reusable translate toggle — wraps useTranslate + TranslateButton
 * into a single self-contained component.
 *
 * Usage:
 *   <TranslateWidget
 *     fields={{ title: item.title, description: item.description }}
 *     onTranslated={(out) => setTranslated(out)}
 *     onReverted={() => setTranslated(null)}
 *   />
 *
 * Props:
 *   fields       — key/value map of text strings to translate
 *   onTranslated — called with translated key/value map on success
 *   onReverted   — called when user reverts to original
 *   size         — "sm" (default) | "md" — passed to TranslateButton
 *   className    — extra class for the button element
 */

import { useCallback } from "react"
import { useTranslate } from "@/hooks/useTranslate"
import TranslateButton from "@/components/blog/TranslateButton"

interface TranslateWidgetProps {
  fields: Record<string, string>
  onTranslated: (out: Record<string, string>) => void
  onReverted: () => void
  size?: "sm" | "md"
  className?: string
}

export default function TranslateWidget({
  fields,
  onTranslated,
  onReverted,
  size = "sm",
  className,
}: TranslateWidgetProps) {
  const {
    translate,
    revert,
    translating,
    isTranslated,
    targetLang,
    targetLangLabel,
    error,
  } = useTranslate()

  const handleTranslate = useCallback(async () => {
    try {
      const out = await translate(fields)
      onTranslated(out)
    } catch {
      // error state managed by the hook
    }
  }, [translate, fields, onTranslated])

  const handleRevert = useCallback(() => {
    revert()
    onReverted()
  }, [revert, onReverted])

  return (
    <TranslateButton
      onTranslate={handleTranslate}
      onRevert={handleRevert}
      translating={translating}
      isTranslated={isTranslated}
      targetLang={targetLang}
      targetLangLabel={targetLangLabel}
      error={error}
      size={size}
      className={className}
    />
  )
}
