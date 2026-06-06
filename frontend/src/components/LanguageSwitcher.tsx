"use client"

import { useState, useRef, useEffect } from "react"
import { useLanguageStore, type Locale } from "@/stores/LanguageStore"
import { cn } from "@/lib/utils"
import { ChevronDown, Check } from "lucide-react"
import Image from "next/image"

const LANGUAGES = [
  {
    code: "id" as Locale,
    label: "Indonesia",
    native: "Bahasa Indonesia",
    short: "ID",
    flagUrl: "https://flagcdn.com/id.svg",
    region: "ID",
  },
  {
    code: "en" as Locale,
    label: "English",
    native: "English (UK)",
    short: "EN",
    flagUrl: "https://flagcdn.com/gb.svg",
    region: "GB",
  },
  {
    code: "de" as Locale,
    label: "Deutsch",
    native: "Deutsch",
    short: "DE",
    flagUrl: "https://flagcdn.com/de.svg",
    region: "DE",
  },
  {
    code: "zh" as Locale,
    label: "中文",
    native: "简体中文",
    short: "ZH",
    flagUrl: "https://flagcdn.com/cn.svg",
    region: "CN",
  },
]

function FlagImage({ url, alt, size = 20 }: { url: string; alt: string; size?: number }) {
  return (
    <span
      className="shrink-0 overflow-hidden rounded-[3px] shadow-sm ring-1 ring-black/10 dark:ring-white/10"
      style={{ width: size, height: size * 0.667, display: "inline-flex", alignItems: "center" }}
    >
      <Image
        src={url}
        alt={alt}
        width={size}
        height={Math.round(size * 0.667)}
        className="object-cover w-full h-full"
        unoptimized
      />
    </span>
  )
}

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguageStore()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [open])

  const current = LANGUAGES.find((l) => l.code === locale)!

  if (!mounted) {
    return (
      <div className="w-[76px] h-9 rounded-lg bg-gray-100 dark:bg-accentColor/10 animate-pulse" />
    )
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Switch language"
        className={cn(
          "flex items-center gap-2 h-9 px-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          "border",
          open
            ? "border-accentColor/50 bg-accentColor/10 text-gray-900 dark:text-white dark:bg-accentColor/10 shadow-sm"
            : "border-gray-200 dark:border-accentColor/20 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-accentColor/10 hover:border-gray-300 dark:hover:border-accentColor/30"
        )}
      >
        <FlagImage url={current.flagUrl} alt={current.label} size={20} />
        <span className="text-xs font-bold tracking-wider tabular-nums">
          {current.short}
        </span>
        <ChevronDown
          size={11}
          className={cn(
            "opacity-40 transition-transform duration-200 -ml-0.5",
            open && "rotate-180 opacity-70"
          )}
        />
      </button>

      {/* Dropdown panel */}
      <div
        className={cn(
          "absolute top-full right-0 mt-2 w-52 origin-top-right z-[102]",
          "bg-white dark:bg-baseBackground rounded-2xl shadow-2xl",
          "border border-gray-200/80 dark:border-accentColor/20",
          "transition-all duration-200 ease-out",
          open
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="px-3.5 pt-3 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">
            Select Language
          </p>
        </div>

        <div className="px-2 pb-2 flex flex-col gap-0.5">
          {LANGUAGES.map((lang) => {
            const isActive = locale === lang.code
            return (
              <button
                key={lang.code}
                onClick={() => { setLocale(lang.code); setOpen(false) }}
                className={cn(
                  "group flex items-center gap-3 px-2.5 py-2.5 rounded-xl w-full transition-all duration-150 text-left",
                  isActive
                    ? "bg-accentColor/10 text-accentColor"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-accentColor/10 hover:text-gray-900 dark:hover:text-accentColor"
                )}
              >
                {/* Flag */}
                <FlagImage url={lang.flagUrl} alt={lang.label} size={28} />

                {/* Label */}
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-semibold leading-tight">{lang.label}</span>
                  <span className="text-[10px] opacity-50 mt-0.5 leading-none">{lang.native}</span>
                </div>

                {/* Badge */}
                <span
                  className={cn(
                    "text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md tabular-nums transition-colors",
                    isActive
                      ? "bg-accentColor/20 text-accentColor"
                      : "bg-gray-100 dark:bg-accentColor/8 text-gray-400 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-accentColor/20"
                  )}
                >
                  {lang.short}
                </span>

                {/* Active check */}
                {isActive && (
                  <span className="shrink-0 w-[18px] h-[18px] rounded-full bg-accentColor/20 flex items-center justify-center -mr-0.5">
                    <Check size={10} className="text-accentColor" strokeWidth={3} />
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-3 py-2.5 border-t border-gray-100 dark:border-accentColor/15 flex items-center justify-center gap-2">
          {LANGUAGES.map((lang) => (
            <span key={lang.code} title={lang.label}>
              <FlagImage url={lang.flagUrl} alt={lang.label} size={16} />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
