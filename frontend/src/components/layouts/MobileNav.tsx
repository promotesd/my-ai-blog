"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import navlinks from "@/lib/NavConfig"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSectionStore } from "@/stores/Section"
import { useLanguageStore, type Locale } from "@/stores/LanguageStore"
import { useTranslations } from "next-intl"

const LANGUAGES: { code: Locale; label: string; flag: string; short: string }[] = [
  { code: "id", label: "Indonesia", flag: "🇮🇩", short: "ID" },
  { code: "en", label: "English",   flag: "🇬🇧", short: "EN" },
  { code: "de", label: "Deutsch",   flag: "🇩🇪", short: "DE" },
]

function LanguagePicker() {
  const { locale, setLocale } = useLanguageStore()
  return (
    <div className="px-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 px-1">
        Language / Bahasa
      </p>
      <div className="flex gap-1.5">
        {LANGUAGES.map((lang) => {
          const isActive = locale === lang.code
          return (
            <button
              key={lang.code}
              onClick={() => setLocale(lang.code)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all duration-150",
                isActive
                  ? "border-accentColor bg-accentColor/10 text-accentColor"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-accentColor/40 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"
              )}
            >
              <span className="text-xl leading-none select-none">{lang.flag}</span>
              <span className="text-[10px] font-semibold tracking-wide">{lang.short}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const [lainnyaOpen, setLainnyaOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { section } = useSectionStore()
  const t = useTranslations("nav")

  useEffect(() => { setMounted(true) }, [])

  // Close on route change
  useEffect(() => {
    setIsOpen(false)
    setLainnyaOpen(false)
  }, [pathname])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const isActive = (href: string) => {
    if (href === "#") return false
    if (href.startsWith("/") && !href.startsWith("/#")) {
      return pathname === href
    }
    return href === section
  }

  const handleNavClick = (href: string) => {
    router.push(href)
    setIsOpen(false)
  }

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle menu"
        className={cn(
          "block md:hidden p-2 rounded-lg transition-all duration-200",
          "text-gray-700 dark:text-gray-300",
          "hover:bg-gray-100 dark:hover:bg-white/10",
          isOpen && "bg-gray-100 dark:bg-white/10"
        )}
      >
        <span
          className={cn(
            "flex items-center justify-center transition-transform duration-300",
            isOpen && "rotate-90"
          )}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </span>
      </button>

      {/* Backdrop + Panel — portaled to body to escape header stacking context */}
      {mounted && createPortal(
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            className={cn(
              "fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden",
              isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
            style={{ zIndex: 9998 }}
            aria-hidden="true"
          />

          {/* Slide-in Panel */}
          <div
            className={cn(
              "fixed top-0 right-0 h-full w-[300px] md:hidden",
              "bg-white dark:bg-gray-950 shadow-2xl",
              "transform transition-transform duration-300 ease-in-out",
              "border-l border-gray-200 dark:border-gray-800"
            )}
            style={{ zIndex: 9999, transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
          >
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 h-[4.5rem] border-b border-gray-100 dark:border-gray-800">
          <span className="text-base font-semibold text-gray-800 dark:text-white tracking-tight">
            Menu
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col py-3 px-3 gap-0.5 overflow-y-auto h-[calc(100%-4.5rem)]">
          {navlinks.map((link) => {
            const Icon = link.icon
            const active = isActive(link.href)

            if (link.subMenu) {
              return (
                <div key={link.titleKey}>
                  {/* Divider before Lainnya */}
                  <div className="h-px bg-gray-100 dark:bg-gray-800 my-2 mx-2" />

                  <button
                    onClick={() => setLainnyaOpen((prev) => !prev)}
                    className={cn(
                      "w-full group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left",
                      "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
                    "hover:bg-gray-100 dark:hover:bg-white/10",
                    lainnyaOpen && "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white"
                    )}
                  >
                    <span
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        lainnyaOpen
                          ? "bg-accentColor/20 text-accentColor"
                          : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 group-hover:bg-accentColor/10 group-hover:text-accentColor"
                      )}
                    >
                      <Icon size={16} />
                    </span>
                    <span className="flex-1 text-sm font-medium">{t(link.titleKey)}</span>
                    <ChevronDown
                      size={15}
                      className={cn(
                        "opacity-50 transition-transform duration-300",
                        lainnyaOpen && "rotate-180 opacity-100"
                      )}
                    />
                  </button>

                  {/* Accordion sub-menu */}
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-in-out",
                      lainnyaOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                    )}
                  >
                    <div className="pt-1 pb-2 pl-5 flex flex-col gap-0.5">
                      {link.subMenu.map((sub) => {
                        const SubIcon = sub.icon
                        return (
                          <button
                            key={sub.titleKey}
                            onClick={() => handleNavClick(sub.href)}
                            className={cn(
                              "group w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-150 text-left",
                              "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white",
                              "hover:bg-gray-100 dark:hover:bg-white/10"
                            )}
                          >
                            <span className="p-1 rounded-md bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500 group-hover:bg-accentColor/10 group-hover:text-accentColor dark:group-hover:bg-accentColor/20 transition-colors">
                              <SubIcon size={13} />
                            </span>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium leading-none">{t(sub.titleKey)}</span>
                              <span className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{t(sub.descriptionKey)}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <button
                key={link.titleKey}
                onClick={() => handleNavClick(link.href)}
                className={cn(
                  "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left",
                  active
                    ? "bg-accentColor/10 text-accentColor"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                )}
              >
                <span
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    active
                      ? "bg-accentColor/20 text-accentColor"
                      : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 group-hover:bg-accentColor/10 group-hover:text-accentColor dark:group-hover:bg-accentColor/20"
                  )}
                >
                  <Icon size={16} />
                </span>
                <span className="text-sm font-medium">{t(link.titleKey)}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accentColor" />
                )}
              </button>
            )
          })}

          {/* Bottom spacer */}
          <div className="mt-auto pt-6 pb-4 px-2">
            <div className="h-px bg-gray-100 dark:bg-gray-800 mb-4" />

            {/* Language Switcher */}
            <LanguagePicker />

            <div className="h-px bg-gray-100 dark:bg-gray-800 my-3" />
            <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
              Gungzz<span className="text-accentColor">leefy</span>
            </p>
          </div>
        </nav>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
