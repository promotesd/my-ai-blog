"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { GalleryPhoto } from "@/types/gallery"
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeaturedCarouselProps {
  photos: GalleryPhoto[]
  onPhotoClick: (photo: GalleryPhoto) => void
}

export default function FeaturedCarousel({ photos, onPhotoClick }: FeaturedCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const goTo = useCallback(
    (index: number) => {
      if (isAnimating) return
      setIsAnimating(true)
      setTimeout(() => {
        setCurrent((index + photos.length) % photos.length)
        setIsAnimating(false)
      }, 300)
    },
    [isAnimating, photos.length]
  )

  const next = useCallback(() => goTo(current + 1), [current, goTo])
  const prev = useCallback(() => goTo(current - 1), [current, goTo])

  useEffect(() => {
    const timer = setInterval(next, 4000)
    return () => clearInterval(timer)
  }, [next])

  if (!photos.length) return null

  const photo = photos[current]

  return (
    <div className="relative w-full h-[50vh] min-h-[260px] sm:min-h-[360px] md:min-h-[420px] rounded-2xl overflow-hidden group">
      {/* Background images (cross-fade) */}
      {photos.map((p, i) => (
        <div
          key={p.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            i === current ? "opacity-100" : "opacity-0"
          )}
        >
          <Image
            src={p.imageUrl}
            alt={p.title}
            fill
            className="object-cover scale-[1.02]"
            sizes="100vw"
            priority={i === 0}
          />
        </div>
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Category Badge */}
      <div
        className={cn(
          "absolute top-5 left-5 transition-all duration-500",
          isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        )}
      >
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-accentColor/90 text-white backdrop-blur-sm">
          {photo.category}
        </span>
      </div>

      {/* Featured badge */}
      <div className="absolute top-5 right-5">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-400/90 text-yellow-900 backdrop-blur-sm">
          ⭐ Featured
        </span>
      </div>

      {/* Content */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 transition-all duration-500",
          isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        )}
      >
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-2 line-clamp-2">
              {photo.title}
            </h2>
            <p className="text-white/80 text-sm md:text-base mb-3 line-clamp-2 max-w-2xl">
              {photo.description}
            </p>
            <div className="flex items-center gap-1 text-white/70 text-sm">
              <MapPin className="w-4 h-4 shrink-0 text-accentColor" />
              <span>{photo.location}</span>
            </div>
          </div>

          <button
            onClick={() => onPhotoClick(photo)}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-white/20 hover:bg-accentColor backdrop-blur-sm text-white text-sm font-semibold transition-all duration-200 hover:scale-105 border border-white/20"
          >
            Lihat Foto
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center gap-2 mt-5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === current ? "w-8 bg-accentColor" : "w-1.5 bg-white/40 hover:bg-white/60"
              )}
            />
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white flex items-center justify-center transition-all duration-200 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:scale-110 border border-white/20"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white flex items-center justify-center transition-all duration-200 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:scale-110 border border-white/20"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}
