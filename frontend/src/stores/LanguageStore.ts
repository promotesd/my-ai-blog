import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { safeStorage } from "@/lib/safeStorage"

export type Locale = "zh" | "en"

interface LanguageState {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      locale: "zh",
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "portfolio-locale",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      migrate: (persisted) => {
        const state = persisted as Partial<LanguageState> | undefined
        return {
          ...state,
          locale: state?.locale === "en" ? "en" : "zh",
        } as LanguageState
      },
    }
  )
)
