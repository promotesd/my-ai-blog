"use client"

/**
 * TranslateButton.tsx
 *
 * A small self-contained button that triggers / reverts LibreTranslate.
 *
 * Props:
 *   onTranslate  — called when the user wants to translate (first click)
 *   onRevert     — called when the user wants to go back to original
 *   translating  — show spinner
 *   isTranslated — show active/translated state
 *   targetLang   — ISO code shown as badge, e.g. "EN"
 *   error        — show error state with retry affordance
 *   size         — "sm" (default) | "md"
 */

import { Loader2, Globe, RotateCcw, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface TranslateButtonProps {
  onTranslate: () => void
  onRevert: () => void
  translating: boolean
  isTranslated: boolean
  targetLang: string | null
  targetLangLabel?: string | null
  error?: string | null
  size?: "sm" | "md"
  /** Extra class for the outer element */
  className?: string
}

export default function TranslateButton({
  onTranslate,
  onRevert,
  translating,
  isTranslated,
  targetLang,
  targetLangLabel,
  error,
  size = "sm",
  className,
}: TranslateButtonProps) {
  const isSm = size === "sm"

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onTranslate()
        }}
        title={`Translation failed — click to retry\n${error}`}
        className={cn(
          "flex items-center gap-1 rounded-full border font-medium transition-all",
          isSm
            ? "px-2 py-0.5 text-[10px] gap-1"
            : "px-3 py-1 text-xs gap-1.5",
          "border-red-300 dark:border-red-700 text-red-500 dark:text-red-400",
          "hover:bg-red-50 dark:hover:bg-red-900/20",
          className
        )}
      >
        <AlertCircle size={isSm ? 10 : 12} />
        <span>Retry</span>
      </button>
    )
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (translating) {
    return (
      <button
        type="button"
        disabled
        className={cn(
          "flex items-center gap-1 rounded-full border font-medium cursor-wait",
          isSm
            ? "px-2 py-0.5 text-[10px] gap-1"
            : "px-3 py-1 text-xs gap-1.5",
          "border-accentColor/40 text-accentColor bg-accentColor/5",
          className
        )}
      >
        <Loader2 size={isSm ? 10 : 12} className="animate-spin" />
        <span>Translating…</span>
      </button>
    )
  }

  // ── Translated (active) state ──────────────────────────────────────────────
  if (isTranslated) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onRevert()
        }}
        title="Revert to original language"
        className={cn(
          "flex items-center gap-1 rounded-full border font-medium transition-all",
          isSm
            ? "px-2 py-0.5 text-[10px] gap-1"
            : "px-3 py-1 text-xs gap-1.5",
          "border-accentColor text-accentColor bg-accentColor/10",
          "hover:bg-accentColor/20 dark:hover:bg-accentColor/20",
          className
        )}
      >
        <Globe size={isSm ? 10 : 12} />
        {targetLang && (
          <span className="uppercase tracking-wide">{targetLang}</span>
        )}
        {targetLangLabel && !isSm && (
          <span className="hidden sm:inline text-[10px] opacity-70">
            · {targetLangLabel}
          </span>
        )}
        <RotateCcw size={isSm ? 9 : 11} className="opacity-60 ml-0.5" />
      </button>
    )
  }

  // ── Idle (default) state ───────────────────────────────────────────────────
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onTranslate()
      }}
      title="Auto-translate to your language"
      className={cn(
        "flex items-center gap-1 rounded-full border font-medium transition-all",
        isSm
          ? "px-2 py-0.5 text-[10px] gap-1"
          : "px-3 py-1 text-xs gap-1.5",
        "border-gray-200 dark:border-gray-700",
        "text-gray-500 dark:text-gray-400",
        "hover:border-accentColor hover:text-accentColor hover:bg-accentColor/5",
        className
      )}
    >
      <Globe size={isSm ? 10 : 12} />
      <span>Translate</span>
    </button>
  )
}
