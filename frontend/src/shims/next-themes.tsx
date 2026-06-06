import { createContext, useContext, useEffect, useMemo, useState } from "react"

export interface ThemeProviderProps {
  children: React.ReactNode
  attribute?: "class" | string
  defaultTheme?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

interface ThemeContextValue {
  theme?: string
  resolvedTheme?: string
  setTheme: (theme: string) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  resolvedTheme: "dark",
  setTheme: () => undefined,
})

function resolveTheme(theme: string, enableSystem?: boolean) {
  if (theme !== "system") return theme
  if (!enableSystem || typeof window === "undefined") return "dark"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "dark",
  enableSystem,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState(() => localStorage.getItem("theme") || defaultTheme)
  const resolvedTheme = resolveTheme(theme, enableSystem)

  useEffect(() => {
    const root = document.documentElement
    if (attribute === "class") {
      root.classList.toggle("dark", resolvedTheme === "dark")
      root.classList.toggle("light", resolvedTheme === "light")
    }
    root.style.colorScheme = resolvedTheme === "dark" ? "dark" : "light"
    localStorage.setItem("theme", theme)
  }, [attribute, resolvedTheme, theme])

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (nextTheme: string) => setThemeState(nextTheme),
    }),
    [resolvedTheme, theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
