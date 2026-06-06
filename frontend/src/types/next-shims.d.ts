declare module "next/link" {
  export { default } from "@/shims/next-link"
}

declare module "next/image" {
  export { default } from "@/shims/next-image"
  export type { StaticImageData } from "@/shims/next-image"
}

declare module "next/navigation" {
  export * from "@/shims/next-navigation"
}

declare module "next/headers" {
  export * from "@/shims/next-headers"
}

declare module "canvas-confetti"

declare module "next/dynamic" {
  export { default } from "@/shims/next-dynamic"
}

declare module "next-intl" {
  export * from "@/shims/next-intl"
}

declare module "next-themes" {
  export * from "@/shims/next-themes"
}

declare module "@supabase/supabase-js" {
  export * from "@/shims/supabase"
}

declare module "@supabase/ssr" {
  export * from "@/shims/supabase"
}
