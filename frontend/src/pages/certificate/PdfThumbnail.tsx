"use client"

import { useState } from "react"
import Image from "next/image"
import { Award, Eye } from "lucide-react"
import type { Certificate } from "@/types/certificate"

interface PdfThumbnailProps {
  cert: Certificate
  onClick: () => void
}

export default function PdfThumbnailComponent({ cert, onClick }: PdfThumbnailProps) {
  const [thumbError, setThumbError] = useState(false)

  return (
    <div
      className="relative w-full aspect-[3/2] overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer group"
      onClick={onClick}
    >
      {/* Thumbnail image */}
      {cert.thumbnail_url && !thumbError ? (
        <Image
          src={cert.thumbnail_url}
          alt={cert.title}
          fill
          className="object-cover"
          onError={() => setThumbError(true)}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        /* Placeholder if no thumbnail or load error */
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
          <Award className="w-10 h-10 text-accentColor/40" />
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium text-center px-3 line-clamp-2">
            {cert.title}
          </p>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg">
          <Eye className="w-5 h-5 text-accentColor" />
        </div>
      </div>
    </div>
  )
}
