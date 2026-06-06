"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BANNER_HEIGHT, useBannerStore } from "@/stores/BannerStore"
import Header from "@/components/layouts/Header"
import GuestbookBanner from "@/components/GuestbookBanner"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { visible, initialized } = useBannerStore()
  const isDashboard = pathname?.startsWith("/dashboard")
  const isAuthRoute = pathname?.startsWith("/xhub")

  if (isDashboard || isAuthRoute) return <>{children}</>

  const isBannerVisible = initialized && visible

  return (
    <>
      <GuestbookBanner />
      <div
        className={cn("transition-[padding-top] duration-500")}
        style={{ paddingTop: isBannerVisible ? BANNER_HEIGHT : 0 }}
      >
        <Header />
        {children}
      </div>
    </>
  )
}
