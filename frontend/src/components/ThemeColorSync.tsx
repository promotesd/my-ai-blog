"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"

// Matches --base-background values in globals.css
export const THEME_COLORS = {
  dark: "#111c20",
  light: "#ffffff",
} as const

/**
 * Replaces all theme-color / color-scheme meta tags (including any
 * media-query variants emitted by Next.js metadata) with a single,
 * unconditional tag that reflects the active theme. Also syncs the
 * <html> element's background-color and color-scheme so the Android
 * browser chrome (status bar / nav bar) always matches the page.
 */
function applyThemeToDOM(isDark: boolean) {
  const color = isDark ? THEME_COLORS.dark : THEME_COLORS.light
  const colorScheme = isDark ? "dark" : "light"

  // Remove ALL existing theme-color metas (incl. media-query SSR ones)
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((el) => el.remove())

  // Insert a single, media-free tag so the browser always reads it
  const themeMeta = document.createElement("meta")
  themeMeta.name = "theme-color"
  themeMeta.content = color
  document.head.appendChild(themeMeta)

  // Keep color-scheme meta in sync (helps browser decide scrollbar/input style)
  let schemeMeta = document.querySelector<HTMLMetaElement>(
    'meta[name="color-scheme"]'
  )
  if (!schemeMeta) {
    schemeMeta = document.createElement("meta")
    schemeMeta.name = "color-scheme"
    document.head.appendChild(schemeMeta)
  }
  schemeMeta.content = colorScheme

  // Sync <html> so the browser chrome picks up the background before
  // any CSS variables resolve (critical for Android overlay UI)
  const html = document.documentElement
  html.style.backgroundColor = color
  html.style.colorScheme = colorScheme
}

export default function ThemeColorSync() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (!resolvedTheme) return
    applyThemeToDOM(resolvedTheme === "dark")
  }, [resolvedTheme])

  return null
}
