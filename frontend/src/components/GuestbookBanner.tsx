"use client"

import { useEffect } from "react"
import Link from "next/link"
import { X, BookOpen, ArrowRight } from "lucide-react"
import { useBannerStore, BANNER_HEIGHT } from "@/stores/BannerStore"
import { cn } from "@/lib/utils"

export default function GuestbookBanner() {
  const { visible, initialized, init, dismiss } = useBannerStore()

  // Init once on mount — reads localStorage
  useEffect(() => {
    init()
  }, [init])

  // Not yet initialized (SSR) or dismissed → render nothing.
  // Keep the element in DOM but hidden during init to avoid layout shift.
  if (!initialized || !visible) return null

  return (
    <div
      style={{ height: BANNER_HEIGHT }}
      className={cn(
        "fixed top-0 left-0 right-0 z-[200] flex items-center justify-center",
        "bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-700",
        "dark:from-accentColor dark:via-emerald-500 dark:to-accentColor",
        "border-b border-emerald-800/40 dark:border-accentColor/30",
        "animate-in slide-in-from-top-full duration-500"
      )}
    >
      {/* Subtle shimmer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_ease_infinite]" />
      </div>

      {/* Content */}
      <Link
        href="/guestbook"
        className="group flex items-center gap-2 text-white text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity px-4 py-1 flex-1 justify-center"
      >
        <BookOpen size={13} className="shrink-0 opacity-80" />
        <span className="hidden sm:inline">
          👋 Hai! Tinggalkan pesan di{" "}
          <span className="underline underline-offset-2 font-semibold">Buku Tamu</span>{" "}
          saya — kunjungan kamu sangat berarti!
        </span>
        <span className="sm:hidden">
          👋 Isi{" "}
          <span className="underline underline-offset-2 font-semibold">Buku Tamu</span>{" "}
          saya!
        </span>
        <ArrowRight
          size={13}
          className="shrink-0 opacity-80 -translate-x-0.5 group-hover:translate-x-1 transition-transform duration-200"
        />
      </Link>

      {/* Dismiss button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          dismiss()
        }}
        title="Jangan tampilkan lagi"
        aria-label="Tutup pengumuman"
        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-all text-[10px] sm:text-xs"
      >
        <X size={11} />
        <span className="hidden sm:inline">Jangan tampilkan lagi</span>
      </button>
    </div>
  )
}
