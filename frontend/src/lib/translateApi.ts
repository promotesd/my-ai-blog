/**
 * translateApi.ts
 *
 * Translation via internal Next.js proxy route (/api/translate → MyMemory).
 * Keeping LibreTranslate-compatible interface for easy future swapping.
 *
 * Geolocation: https://ipapi.co/json/ (free, no key needed)
 */

// ── Config ────────────────────────────────────────────────────────────────────

// Internal API route — avoids CORS/DNS issues with third-party translation hosts
const TRANSLATE_API = "/api/translate"

const IPAPI_URL = "https://ipapi.co/json/"

const FETCH_TIMEOUT = 10_000 // ms

// ── Country → language code mapping ─────────────────────────────────────────
// Only includes languages supported by LibreTranslate
const COUNTRY_TO_LANG: Record<string, string> = {
  // English-speaking
  US: "en", GB: "en", AU: "en", CA: "en", NZ: "en", IE: "en", ZA: "en",
  // German
  DE: "de", AT: "de",
  // French
  FR: "fr", BE: "fr",
  // Spanish
  ES: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es", VE: "es",
  // Portuguese
  PT: "pt", BR: "pt",
  // Japanese
  JP: "ja",
  // Korean
  KR: "ko",
  // Chinese (Simplified)
  CN: "zh", TW: "zh", HK: "zh", SG: "zh",
  // Russian
  RU: "ru",
  // Italian
  IT: "it",
  // Dutch
  NL: "nl",
  // Polish
  PL: "pl",
  // Turkish
  TR: "tr",
  // Arabic
  SA: "ar", EG: "ar", AE: "ar", IQ: "ar", MA: "ar", DZ: "ar",
  // Hindi
  IN: "hi",
  // Vietnamese
  VN: "vi",
  // Thai
  TH: "th",
  // Swedish
  SE: "sv",
  // Czech
  CZ: "cs",
  // Ukrainian
  UA: "uk",
  // Romanian
  RO: "ro",
  // Finnish
  FI: "fi",
  // Danish
  DK: "da",
  // Indonesian — keep native
  ID: "id",
}

// Languages LibreTranslate can reliably translate TO from "auto"
export const SUPPORTED_TARGETS = new Set([
  "en", "ar", "az", "cs", "da", "de", "el", "eo", "es", "fi",
  "fr", "ga", "he", "hi", "hu", "id", "it", "ja", "ko", "nl",
  "pl", "pt", "ro", "ru", "sk", "sv", "th", "tr", "uk", "vi", "zh",
])

// Human-readable language name for UI badge
export const LANG_NAMES: Record<string, string> = {
  en: "English", ar: "Arabic", az: "Azerbaijani", cs: "Czech",
  da: "Danish", de: "German", el: "Greek", eo: "Esperanto",
  es: "Spanish", fi: "Finnish", fr: "French", ga: "Irish",
  he: "Hebrew", hi: "Hindi", hu: "Hungarian", id: "Indonesian",
  it: "Italian", ja: "Japanese", ko: "Korean", nl: "Dutch",
  pl: "Polish", pt: "Portuguese", ro: "Romanian", ru: "Russian",
  sk: "Slovak", sv: "Swedish", th: "Thai", tr: "Turkish",
  uk: "Ukrainian", vi: "Vietnamese", zh: "Chinese",
}

// ── Geolocation ───────────────────────────────────────────────────────────────

/** Detect the user's preferred language from their IP address.
 *  Falls back to browser language, then "en". */
export async function detectUserLanguage(): Promise<string> {
  try {
    const res = await fetch(IPAPI_URL, {
      signal: AbortSignal.timeout(3_000),
      cache: "no-store",
    })
    if (!res.ok) throw new Error("ipapi non-200")
    const data = await res.json()
    const country = (data.country_code as string)?.toUpperCase()
    const lang = COUNTRY_TO_LANG[country] ?? null
    if (lang && SUPPORTED_TARGETS.has(lang)) return lang
  } catch {
    // ignore — fall through to browser language
  }

  // Browser language fallback
  if (typeof navigator !== "undefined") {
    const bl = navigator.language?.split("-")[0]?.toLowerCase()
    if (bl && SUPPORTED_TARGETS.has(bl)) return bl
  }

  return "en"
}

// ── Translation ────────────────────────────────────────────────────────────────

/**
 * Translate a single string via LibreTranslate.
 *
 * @param text       The content to translate
 * @param targetLang ISO 639-1 target language code, e.g. "en", "ja"
 * @param sourceLang Source language (default "auto")
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang = "auto"
): Promise<string> {
  if (!text.trim()) return text

  const body: Record<string, string> = {
    text,
    source: sourceLang,
    target: targetLang,
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

  let res: Response
  try {
    res = await fetch(TRANSLATE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText)
    throw new Error(`Translate API ${res.status}: ${errText}`)
  }

  const data = await res.json()
  return (data.translatedText as string) ?? text
}

/**
 * Translate several strings in one call group.
 * Strings are translated sequentially to avoid rate-limiting.
 *
 * @param fields     Object of  key → original text
 * @param targetLang ISO 639-1 target language code
 * @returns          Object of  key → translated text
 */
export async function translateFields(
  fields: Record<string, string>,
  targetLang: string
): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(fields)) {
    result[key] = await translateText(value, targetLang)
  }
  return result
}
