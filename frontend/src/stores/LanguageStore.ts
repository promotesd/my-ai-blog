import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Locale = "id" | "en" | "de" | "zh"

interface LanguageState {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      locale: "id",
      setLocale: (locale) => set({ locale }),
    }),
    { name: "portfolio-locale" }
  )
)
