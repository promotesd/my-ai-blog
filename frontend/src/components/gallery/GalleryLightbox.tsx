"use client"

import { useEffect, useCallback, useState } from "react"
import Image from "next/image"
import { GalleryPhoto } from "@/types/gallery"
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  MapPin,
  Calendar,
  Tag,
  Camera,
  Copy,
  Check,
  User,
} from "lucide-react"
import { FaWhatsapp, FaTwitter, FaInstagram } from "react-icons/fa"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import TranslateWidget from "@/components/TranslateWidget"

interface GalleryLightboxProps {
  photos: GalleryPhoto[]
  initialIndex: number
  onClose: () => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function GalleryLightbox({
  photos,
  initialIndex,
  onClose,
}: GalleryLightboxProps) {
  const t = useTranslations("galleryPage")
  const [index, setIndex] = useState(initialIndex)
  const [showShare, setShowShare] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [imgTransition, setImgTransition] = useState(true)

  // Translation state
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null)
  const [translatedDescription, setTranslatedDescription] = useState<string | null>(null)

  const photo = photos[index]

  // Reset translation when photo changes
  useEffect(() => {
    setTranslatedTitle(null)
    setTranslatedDescription(null)
  }, [index])

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  const close = useCallback(() => {
    setIsVisible(false)
    setTimeout(onClose, 250)
  }, [onClose])

  const navigate = useCallback(
    (dir: 1 | -1) => {
      setImgTransition(false)
      setTimeout(() => {
        setIndex((i) => (i + dir + photos.length) % photos.length)
        setImgTransition(true)
        setShowShare(false)
      }, 150)
    },
    [photos.length]
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
      if (e.key === "ArrowLeft") navigate(-1)
      if (e.key === "ArrowRight") navigate(1)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [close, navigate])

  const handleDownload = () => {
    const a = document.createElement("a")
    a.href = photo.imageUrl
    a.download = photo.title.replace(/\s+/g, "-").toLowerCase()
    a.target = "_blank"
    a.rel = "noopener noreferrer"
    a.click()
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.origin + "/gallery")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${photo.title} — ${window.location.origin}/gallery`)}`,
      "_blank"
    )
  }

  const shareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(photo.title)}&url=${encodeURIComponent(window.location.origin + "/gallery")}`,
      "_blank"
    )
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] flex items-center justify-center transition-all duration-250",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={close}
      />

      {/* Container: stacked on mobile, side-by-side on md+ */}
      <div
        className={cn(
          "relative z-10 w-full h-full flex flex-col md:flex-row max-w-7xl mx-auto transition-all duration-250",
          isVisible ? "scale-100" : "scale-95"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Image Area ─────────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center relative min-h-0 p-4 md:p-6 pb-0 md:pb-6">
          {/* Single close button — top-right of the whole modal */}
          <button
            onClick={close}
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-white/20 backdrop-blur-sm text-white flex items-center justify-center transition-all duration-200 hover:scale-110 border border-white/20"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 z-20 text-white/70 text-sm font-medium bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
            {index + 1} / {photos.length}
          </div>

          {/* Image */}
          <div
            className={cn(
              "relative max-h-full max-w-full transition-all duration-150",
              imgTransition ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]"
            )}
          >
            <Image
              key={photo.id}
              src={photo.imageUrl}
              alt={translatedTitle ?? photo.title}
              width={photo.width}
              height={photo.height}
              className="max-h-[calc(100vw*0.75)] md:max-h-[calc(100vh-2rem)] w-full md:w-auto h-auto object-contain rounded-lg shadow-2xl"
              priority
              sizes="(max-width: 768px) 100vw, 70vw"
            />
          </div>

          {/* Prev / Next buttons */}
          {photos.length > 1 && (
            <>
              <button
                onClick={() => navigate(-1)}
                className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-sm text-white flex items-center justify-center transition-all duration-200 hover:scale-110 border border-white/20"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate(1)}
                className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-sm text-white flex items-center justify-center transition-all duration-200 hover:scale-110 border border-white/20"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* ── Info Panel ─────────────────────────────────────────── */}
        {/* Mobile: fixed height at bottom, scrollable. Desktop: full right panel */}
        <div className="shrink-0 w-full md:w-80 lg:w-96 max-h-[45vh] md:max-h-none bg-white dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 md:border-t-0 md:border-l md:border-l-gray-200 md:dark:border-l-white/10 overflow-y-auto">
          <div className="p-5 space-y-4">
            {/* Title + TranslateWidget */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-gray-900 dark:text-white font-bold text-base md:text-lg leading-snug">
                  {translatedTitle ?? photo.title}
                </h3>
              </div>
              {(translatedDescription ?? photo.description) && (
                <p className="text-gray-600 dark:text-white/60 text-sm leading-relaxed mb-2">
                  {translatedDescription ?? photo.description}
                </p>
              )}
              {/* Translate widget for title + description */}
              <div className="flex justify-end">
                <TranslateWidget
                  fields={{
                    title: photo.title,
                    description: photo.description,
                  }}
                  onTranslated={(out) => {
                    setTranslatedTitle(out.title ?? null)
                    setTranslatedDescription(out.description ?? null)
                  }}
                  onReverted={() => {
                    setTranslatedTitle(null)
                    setTranslatedDescription(null)
                  }}
                  size="sm"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-white/10" />

            {/* Meta */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-accentColor shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-400 dark:text-white/40 text-xs mb-0.5">{t("lightbox_location")}</p>
                  <p className="text-gray-800 dark:text-white/90 text-sm">{photo.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-accentColor shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-400 dark:text-white/40 text-xs mb-0.5">{t("lightbox_date")}</p>
                  <p className="text-gray-800 dark:text-white/90 text-sm">{formatDate(photo.date)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Tag className="w-4 h-4 text-accentColor shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-400 dark:text-white/40 text-xs mb-0.5">{t("lightbox_category")}</p>
                  <span className="inline-flex text-xs px-2.5 py-1 rounded-full bg-accentColor/20 text-accentColor border border-accentColor/30 font-medium">
                    {photo.category}
                  </span>
                </div>
              </div>

              {photo.device && (
                <div className="flex items-start gap-3">
                  <Camera className="w-4 h-4 text-accentColor shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-400 dark:text-white/40 text-xs mb-0.5">{t("lightbox_device")}</p>
                    <p className="text-gray-800 dark:text-white/90 text-sm">{photo.device}</p>
                  </div>
                </div>
              )}

              {photo.uploaderName && (
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-accentColor shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-400 dark:text-white/40 text-xs mb-0.5">{t("lightbox_uploader")}</p>
                    <p className="text-gray-800 dark:text-white/90 text-sm">{photo.uploaderName}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            {photo.tags.length > 0 && (
              <>
                <div className="border-t border-gray-200 dark:border-white/10" />
                <div>
                  <p className="text-gray-400 dark:text-white/40 text-xs mb-2">{t("lightbox_tags")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {photo.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70 border border-gray-200 dark:border-white/10"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Album */}
            <div className="border-t border-gray-200 dark:border-white/10" />
            <div className="text-sm text-gray-500 dark:text-white/50">
              {t("lightbox_album")}:{" "}
              <span className="text-gray-800 dark:text-white/80 font-medium">{photo.album}</span>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 dark:border-white/10" />
            <div className="space-y-2">
              {/* Download */}
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accentColor hover:bg-accentColor/80 text-white text-sm font-semibold transition-all duration-200 hover:scale-[1.02]"
              >
                <Download className="w-4 h-4" />
                {t("lightbox_download")}
              </button>

              {/* Share */}
              <button
                onClick={() => setShowShare((v) => !v)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-white text-sm font-semibold transition-all duration-200 hover:scale-[1.02] border border-gray-200 dark:border-white/10"
              >
                <Share2 className="w-4 h-4" />
                {t("lightbox_share")}
              </button>

              {/* Share options */}
              {showShare && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-white text-xs font-medium transition-all duration-200 border border-gray-200 dark:border-white/10"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-accentColor" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copied ? t("lightbox_copied") : t("lightbox_copy_link")}
                  </button>
                  <button
                    onClick={shareWhatsApp}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-600/80 hover:bg-green-600 text-white text-xs font-medium transition-all duration-200"
                  >
                    <FaWhatsapp className="w-3.5 h-3.5" />
                    WhatsApp
                  </button>
                  <button
                    onClick={shareTwitter}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-sky-600/80 hover:bg-sky-600 text-white text-xs font-medium transition-all duration-200"
                  >
                    <FaTwitter className="w-3.5 h-3.5" />
                    Twitter/X
                  </button>
                  <button
                    onClick={() => window.open("https://www.instagram.com/", "_blank")}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-br from-purple-600/80 to-pink-600/80 hover:from-purple-600 hover:to-pink-600 text-white text-xs font-medium transition-all duration-200"
                  >
                    <FaInstagram className="w-3.5 h-3.5" />
                    Instagram
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


