"use client"

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
import Masonry from "react-masonry-css"
import { ArrowLeft, MapPin, Calendar, Images, Loader2 } from "lucide-react"
import { galleryPhotos, galleryAlbums, getGalleryCategoryLabel } from "@/data/galleryData"
import { GalleryPhoto, GalleryAlbum, GalleryGuest } from "@/types/gallery"
import { fetchAlbumBySlug, fetchPhotosByAlbum, fetchGalleryGuests } from "@/lib/galleryApi"
import GalleryPhotoCard from "@/components/gallery/GalleryPhotoCard"
import { PROFILE } from "@/config/profile"

const GalleryLightbox = dynamic(() => import("@/components/gallery/GalleryLightbox"), {
  ssr: false,
})

const masonryBreakpoints = {
  default: 4,
  1280: 4,
  1024: 3,
  768: 2,
  640: 2,
  480: 2,
}

interface PageProps {
  params: { slug: string }
}

export default function AlbumDetailPage({ params }: PageProps) {
  const { slug } = params
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [album, setAlbum] = useState<GalleryAlbum | null | undefined>(undefined)
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [guests, setGuests] = useState<GalleryGuest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)

      // 1. Try static data first (personal albums)
      const staticAlbum = galleryAlbums.find((a) => a.slug === slug)
      if (staticAlbum) {
        const staticPhotos = galleryPhotos.filter((p) => p.albumSlug === slug)
        setAlbum(staticAlbum)
        setPhotos(staticPhotos)
        setIsLoading(false)
        return
      }

      // 2. Fetch dynamic guest album from the backend
      const [dbAlbum, dbPhotos, allGuests] = await Promise.all([
        fetchAlbumBySlug(slug),
        fetchPhotosByAlbum(slug),
        fetchGalleryGuests()
      ])

      if (!dbAlbum) {
        setAlbum(null)
        setIsLoading(false)
        return
      }

      setAlbum(dbAlbum)
      setPhotos(dbPhotos)
      setGuests(allGuests)
      setIsLoading(false)
    }

    loadData()
  }, [slug])

  const openLightbox = useCallback(
    (photo: GalleryPhoto) => {
      const idx = photos.findIndex((p) => p.id === photo.id)
      if (idx !== -1) setLightboxIndex(idx)
    },
    [photos]
  )

  const handleDownload = (photo: GalleryPhoto) => {
    const a = document.createElement("a")
    a.href = photo.imageUrl
    a.download = photo.title.replace(/\s+/g, "-").toLowerCase()
    a.target = "_blank"
    a.rel = "noopener noreferrer"
    a.click()
  }

  // Loading skeleton
  if (isLoading || album === undefined) {
    return (
      <main className="min-h-screen bg-baseBackground pt-[4.5rem]">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-accentColor" />
        </div>
      </main>
    )
  }

  // Album not found
  if (album === null) {
    return (
      <main className="min-h-screen bg-baseBackground pt-28 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">相册不存在</h1>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            这个图库相册暂时无法访问。
          </p>
          <Link href="/gallery" className="inline-flex items-center gap-2 mt-6 text-sm text-accentColor hover:underline">
            <ArrowLeft size={15} />
            返回图库
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-baseBackground pt-[4.5rem]">
      {/* ── Album Hero ── */}
      <section className="relative h-72 md:h-96 overflow-hidden">
        <Image
          src={album.coverUrl}
          alt={album.name}
          fill
          unoptimized={true}
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />

        {/* Back button */}
        <Link
          href="/gallery"
          className="absolute z-[999] top-6 left-6 flex items-center gap-2 text-white text-sm font-medium bg-black/40 hover:bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 transition-all duration-200 hover:-translate-x-0.5"
        >
          <ArrowLeft className="w-4 h-4" />
          返回图库
        </Link>

        {/* Album info */}
        <div className="absolute z-10 bottom-0 left-0 right-0 px-[5%] py-8">
          <span className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-accentColor/90 text-white mb-3">
            {getGalleryCategoryLabel(album.category)}
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{album.name}</h1>
          <p className="text-white/70 text-sm md:text-base mb-4 max-w-2xl">{album.description}</p>
          <div className="flex items-center gap-5 text-white/60 text-sm">
            <span className="flex items-center gap-1.5">
              <Images className="w-4 h-4 text-accentColor" />
              {photos.length} 张照片
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-accentColor" />
              {album.period}
            </span>
          </div>
        </div>
      </section>

      {/* ── Location summary ── */}
      {photos.length > 0 && (
        <section className="px-[5%] max-w-7xl mx-auto py-6">
          <div className="flex flex-wrap gap-2">
            {[...new Set(photos.map((p) => p.location).filter(Boolean))].map((loc) => (
              <span
                key={loc}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
              >
                <MapPin className="w-3 h-3 text-accentColor" />
                {loc}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Photos Masonry ── */}
      <section className="px-[5%] max-w-7xl mx-auto pb-16">
        {photos.length === 0 ? (
          <div className="flex flex-col items-center py-24 gap-4 text-gray-400">
            <Images className="w-16 h-16 opacity-30" />
            <p>这个相册暂无照片</p>
          </div>
        ) : (
          <Masonry
            breakpointCols={masonryBreakpoints}
            className="flex -ml-2 sm:-ml-4 w-[calc(100%+0.5rem)] sm:w-[calc(100%+1rem)]"
            columnClassName="pl-2 sm:pl-4"
          >
            {photos.map((photo) => {
              let uploaderName: string | undefined = undefined;
              let uploaderAvatar: string | null | undefined = undefined;
              if (photo.ownerType === "guest" && photo.guestId) {
                const guestUser = guests.find((g) => g.id === photo.guestId);
                uploaderName = guestUser ? guestUser.name : "访客";
                uploaderAvatar = guestUser?.avatarUrl;
              } else {
                uploaderName = "小嘟嘟";
                uploaderAvatar = PROFILE.avatarUrl;
              }

              return (
                <GalleryPhotoCard
                  key={photo.id}
                  photo={photo}
                  onView={openLightbox}
                  onDownload={handleDownload}
                  onShare={openLightbox}
                  uploaderName={uploaderName}
                  uploaderAvatar={uploaderAvatar}
                />
              )
            })}
          </Masonry>
        )}
      </section>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && photos.length > 0 && (
        <GalleryLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </main>
  )
}
