import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const publicEnv = (key: string) => JSON.stringify(env[key] || "")

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": "http://localhost:8080",
        "/uploads": "http://localhost:8080",
      },
    },
    define: {
      "process.env.NEXT_PUBLIC_SUPABASE_URL": publicEnv("VITE_SUPABASE_URL"),
      "process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": publicEnv("VITE_SUPABASE_ANON_KEY"),
      "process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET": publicEnv("VITE_SUPABASE_STORAGE_BUCKET"),
      "process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID": publicEnv("VITE_EMAILJS_SERVICE_ID"),
      "process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID": publicEnv("VITE_EMAILJS_TEMPLATE_ID"),
      "process.env.NEXT_PUBLIC_EMAILJS_CONTACT_TEMPLATE_ID": publicEnv("VITE_EMAILJS_CONTACT_TEMPLATE_ID"),
      "process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY": publicEnv("VITE_EMAILJS_PUBLIC_KEY"),
      "process.env.NEXT_PUBLIC_STEAM_API_KEY": publicEnv("VITE_STEAM_API_KEY"),
      "process.env.NEXT_PUBLIC_STEAM_ID": publicEnv("VITE_STEAM_ID"),
      "process.env.NEXT_PUBLIC_TMDB_API_KEY": publicEnv("VITE_TMDB_API_KEY"),
      "process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY": publicEnv("VITE_GOOGLE_BOOKS_API_KEY"),
      "process.env.GITHUB_TOKEN": publicEnv("VITE_GITHUB_TOKEN"),
      "process.env.SUPABASE_SERVICE_ROLE_KEY": JSON.stringify(""),
    },
    resolve:{
      alias:{
        "@": path.resolve(__dirname, "./src"),
        "next/link": path.resolve(__dirname, "./src/shims/next-link.tsx"),
        "next/image": path.resolve(__dirname, "./src/shims/next-image.tsx"),
        "next/navigation": path.resolve(__dirname, "./src/shims/next-navigation.ts"),
        "next/headers": path.resolve(__dirname, "./src/shims/next-headers.ts"),
        "next/dynamic": path.resolve(__dirname, "./src/shims/next-dynamic.tsx"),
        "next-intl": path.resolve(__dirname, "./src/shims/next-intl.tsx"),
        "next-themes": path.resolve(__dirname, "./src/shims/next-themes.tsx"),
        "@supabase/supabase-js": path.resolve(__dirname, "./src/services/supabaseAdapter.ts"),
        "@supabase/ssr": path.resolve(__dirname, "./src/services/supabaseAdapter.ts"),
      }
    },
  }
})
