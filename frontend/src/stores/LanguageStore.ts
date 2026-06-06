import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { safeStorage } from "@/lib/safeStorage"

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
    {
      name: "portfolio-locale",
      storage: createJSONStorage(() => safeStorage),
    }
  )
)
