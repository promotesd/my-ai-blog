"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { GalleryAlbum } from "@/types/gallery"
import { Images, Calendar, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface GalleryAlbumCardProps {
  album: GalleryAlbum
  uploaderName?: string
  uploaderAvatar?: any // can be string or StaticImageData
}

const DESC_THRESHOLD = 80

export default function GalleryAlbumCard({
  album,
  uploaderName,
  uploaderAvatar,
}: GalleryAlbumCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasLongDesc = (album.description?.length ?? 0) > DESC_THRESHOLD

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl overflow-hidden",
        "bg-gray-100 dark:bg-gray-800/60",
        "ring-1 ring-black/5 dark:ring-white/5",
        "transition-all duration-300 hover:ring-accentColor/50 hover:shadow-xl hover:shadow-accentColor/10",
        "hover:-translate-y-1"
      )}
    >
      {/* Cover image — the whole image area is a link */}
      <Link href={`/gallery/album/${album.slug}`} className="block relative h-24 sm:h-40 md:h-48 overflow-hidden">
        <Image
          src={album.coverUrl}
          alt={album.name}
          fill
          unoptimized={true}
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Category badge */}
        <div className="absolute top-2 left-2 hidden xs:block sm:block">
          <span className="text-[10px] sm:text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-accentColor/90 text-white backdrop-blur-sm">
            {album.category.split(" & ")[0]}
          </span>
        </div>

        {/* Photo count */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 text-white text-[10px] sm:text-xs font-semibold bg-black/40 backdrop-blur-sm px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-white/20">
          <Images className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>{album.photoCount}</span>
        </div>
      </Link>

      {/* Info */}
      <div className="p-2 sm:p-4 flex flex-col gap-1 sm:gap-1.5 flex-1">
        {/* Name — clickable */}
        <Link href={`/gallery/album/${album.slug}`}>
          <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-base leading-snug line-clamp-2 group-hover:text-accentColor transition-colors duration-200">
            {album.name}
          </h3>
        </Link>

        {/* Description with expand/collapse */}
        {album.description && (
          <div className="hidden sm:block flex-1">
            <p className={cn(
              "text-gray-500 dark:text-gray-400 text-sm transition-all duration-200",
              !isExpanded && "line-clamp-2"
            )}>
              {album.description}
            </p>
            {hasLongDesc && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  setIsExpanded((v) => !v)
                }}
                className="inline-flex items-center gap-1 text-xs text-accentColor font-medium mt-1 hover:underline select-none"
              >
                {isExpanded ? "Lihat Lebih Sedikit ↑" : "Lihat Lengkap ↓"}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-1 mt-1 sm:mt-2">
          <div className="hidden sm:flex items-center gap-1.5 text-gray-400 text-xs min-w-0">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{album.period}</span>
          </div>
          <Link
            href={`/gallery/album/${album.slug}`}
            className="flex items-center gap-0.5 sm:gap-1 text-accentColor text-[10px] sm:text-xs font-semibold shrink-0 group-hover:gap-1.5 sm:group-hover:gap-2 transition-all duration-200 ml-auto"
          >
            Lihat <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </Link>
        </div>
      </div>

      {/* Uploader Info */}
      {(uploaderName || uploaderAvatar) && (
        <div className="flex items-center gap-2 px-2 pb-2 sm:px-4 sm:pb-3">
          {uploaderAvatar ? (
            <div className="relative w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden shrink-0 ring-1 ring-black/10 dark:ring-white/10">
              <Image unoptimized={true} src={uploaderAvatar} alt={uploaderName || "Uploader"} fill className="object-cover" sizes="24px" />
            </div>
          ) : (
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-accentColor shrink-0 flex items-center justify-center text-[9px] sm:text-[10px] text-white font-bold ring-1 ring-accentColor/30">
              {uploaderName?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
          <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
            {uploaderName || "Unknown"}
          </p>
        </div>
      )}
    </div>
  )
}
