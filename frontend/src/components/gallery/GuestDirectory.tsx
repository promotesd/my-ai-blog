"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { ChevronLeft, Users, FolderOpen, ImageIcon, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { GalleryGuest, GalleryAlbum } from "@/types/gallery"
import GalleryAlbumCard from "@/components/gallery/GalleryAlbumCard"
import { useTranslations } from "next-intl"

// ─── Initials Avatar ──────────────────────────────────────────────────────────

function InitialsAvatar({ name, size = 56 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join("")

  const palette = [
    "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-rose-500",
    "bg-amber-500", "bg-cyan-500", "bg-pink-500", "bg-indigo-500",
    "bg-teal-500", "bg-orange-500",
  ]
  const idx = name.charCodeAt(0) % palette.length

  return (
    <div
      className={cn("rounded-full flex items-center justify-center text-white font-bold shrink-0", palette[idx])}
      style={{ width: size, height: size, fontSize: size * 0.33 }}
    >
      {initials || <User size={size * 0.4} />}
    </div>
  )
}

// ─── Guest Card ───────────────────────────────────────────────────────────────

function GuestCard({ guest, onClick }: { guest: GalleryGuest; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex items-center gap-4 w-full p-4 rounded-2xl",
        "bg-white dark:bg-gray-800/60",
        "ring-1 ring-black/5 dark:ring-white/5",
        "hover:ring-accentColor/40 hover:shadow-lg hover:shadow-accentColor/10",
        "hover:-translate-y-0.5 transition-all duration-200",
        "text-left"
      )}
    >
      {/* Avatar */}
      <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0">
        {guest.avatarUrl ? (
          <Image
            src={guest.avatarUrl}
            alt={guest.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="56px"
          />
        ) : (
          <InitialsAvatar name={guest.name} size={56} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 dark:text-white text-base leading-tight group-hover:text-accentColor transition-colors truncate">
          {guest.name}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <FolderOpen className="w-3.5 h-3.5" />
            {guest.albumCount} album
          </span>
          <span className="flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5" />
            {guest.photoCount} foto
          </span>
        </div>
      </div>

      {/* Chevron */}
      <div className="text-gray-300 dark:text-gray-600 group-hover:text-accentColor group-hover:translate-x-1 transition-all">
        <ChevronLeft className="w-5 h-5 rotate-180" />
      </div>
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface GuestDirectoryProps {
  guests: GalleryGuest[]
  albums: GalleryAlbum[]
  loading?: boolean
}

export default function GuestDirectory({ guests, albums, loading }: GuestDirectoryProps) {
  const t = useTranslations("galleryPage")
  const [selectedGuestId, setSelectedGuestId] = useState<number | null>(null)
  const [activeLetter, setActiveLetter] = useState<string | null>(null)

  // Sort guests A-Z
  const sortedGuests = useMemo(
    () => [...guests].sort((a, b) => a.name.localeCompare(b.name, "id")),
    [guests]
  )

  // Group by first letter
  const groups = useMemo(() => {
    const map: Record<string, GalleryGuest[]> = {}
    for (const g of sortedGuests) {
      const letter = g.name.charAt(0).toUpperCase()
      if (!map[letter]) map[letter] = []
      map[letter].push(g)
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [sortedGuests])

  const allLetters = groups.map(([letter]) => letter)

  const filteredGroups = useMemo(() => {
    if (!activeLetter) return groups
    return groups.filter(([letter]) => letter === activeLetter)
  }, [groups, activeLetter])

  const selectedGuest = useMemo(
    () => guests.find((g) => g.id === selectedGuestId) ?? null,
    [guests, selectedGuestId]
  )

  const guestAlbums = useMemo(
    () => albums.filter((a) => a.guestId === selectedGuestId),
    [albums, selectedGuestId]
  )

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 shimmer">
            <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!loading && guests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
        <Users className="w-16 h-16 opacity-30" />
        <p className="text-lg font-medium">{t("guest_dir_empty")}</p>
        <p className="text-sm">{t("guest_dir_empty_sub")}</p>
      </div>
    )
  }

  // ── Guest Albums view ───────────────────────────────────────────────────────
  if (selectedGuestId !== null && selectedGuest) {
    return (
      <div>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setSelectedGuestId(null)}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-accentColor transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            {t("guest_back")}
          </button>
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
              {selectedGuest.avatarUrl ? (
                <Image
                  src={selectedGuest.avatarUrl}
                  alt={selectedGuest.name}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <InitialsAvatar name={selectedGuest.name} size={40} />
              )}
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">{selectedGuest.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {guestAlbums.length} album
              </p>
            </div>
          </div>
        </div>

        {/* Albums grid */}
        {guestAlbums.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <FolderOpen className="w-12 h-12 opacity-30" />
            <p className="font-medium">{t("empty_albums")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {guestAlbums.map((album) => (
              <GalleryAlbumCard key={album.slug} album={album} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Directory A-Z ───────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header + stats */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-accentColor" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t("guest_dir_title")}
          </h3>
          <span className="text-xs text-gray-400 font-normal">({guests.length} tamu)</span>
        </div>
      </div>

      {/* A-Z Letter filter */}
      {allLetters.length > 3 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          <button
            onClick={() => setActiveLetter(null)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold transition-all",
              activeLetter === null
                ? "bg-accentColor text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            Semua
          </button>
          {allLetters.map((letter) => (
            <button
              key={letter}
              onClick={() => setActiveLetter(activeLetter === letter ? null : letter)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold transition-all",
                activeLetter === letter
                  ? "bg-accentColor text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              {letter}
            </button>
          ))}
        </div>
      )}

      {/* Grouped guest list */}
      <div className="space-y-6">
        {filteredGroups.map(([letter, groupGuests]) => (
          <div key={letter}>
            {/* Letter separator */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-lg font-black text-accentColor w-6">{letter}</span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
            </div>

            {/* Guest cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {groupGuests.map((g) => (
                <GuestCard
                  key={g.id}
                  guest={g}
                  onClick={() => setSelectedGuestId(g.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
