"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import dynamic from "next/dynamic"
import Masonry from "react-masonry-css"
import { useTranslations } from "next-intl"
import {
  Search,
  X,
  LayoutGrid,
  FolderOpen,
  ChevronDown,
  SlidersHorizontal,
  Image as ImageIcon,
  User,
  Users,
  Plus,
  MousePointerClick,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { GalleryPhoto, GalleryAlbum, GalleryCategory, GalleryGuest, SortOption } from "@/types/gallery"
import { GALLERY_CATEGORIES } from "@/data/galleryData"
import { fetchGalleryPhotos, fetchGalleryAlbums, fetchGalleryGuests } from "@/lib/galleryApi"

import FeaturedCarousel from "@/components/gallery/FeaturedCarousel"
import GalleryPhotoCard from "@/components/gallery/GalleryPhotoCard"
import GalleryAlbumCard from "@/components/gallery/GalleryAlbumCard"
import GuestRegistrationModal from "@/components/gallery/GuestRegistrationModal"

import ProfileImg from "@/assets/SAVE_20221213_123032 (1).jpg"

// Dynamically import lightbox to avoid SSR issues
const GalleryLightbox = dynamic(() => import("@/components/gallery/GalleryLightbox"), {
  ssr: false,
})

const YEARS = ["Semua", "2025", "2024", "2023", "2022"]
const INITIAL_VISIBLE = 12

type OwnerTab = "personal" | "guest"

const masonryBreakpoints = {
  default: 4,
  1280: 4,
  1024: 3,
  768: 2,
  640: 2,
  480: 2,
}

export default function GalleryPage() {
  const t = useTranslations("galleryPage")

  // ── Data from Supabase ─────────────────────────────────────────────────────
  const [allPhotos, setAllPhotos] = useState<GalleryPhoto[]>([])
  const [allAlbums, setAllAlbums] = useState<GalleryAlbum[]>([])
  const [allGuests, setAllGuests] = useState<GalleryGuest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([fetchGalleryPhotos(), fetchGalleryAlbums(), fetchGalleryGuests()]).then(
      ([photos, albums, guests]) => {
        if (!cancelled) {
          setAllPhotos(photos)
          setAllAlbums(albums)
          setAllGuests(guests)
          setLoading(false)
        }
      }
    )
    return () => { cancelled = true }
  }, [])

  // ── UI State ─────────────────────────────────────────────────────────
  const [ownerTab, setOwnerTab] = useState<OwnerTab>("guest")
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>("Semua")
  const [sortBy, setSortBy] = useState<SortOption>("Terbaru")
  const [activeYear, setActiveYear] = useState("Semua")
  const [viewMode, setViewMode] = useState<"grid" | "album">("grid")
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showYearMenu, setShowYearMenu] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // ── Owner-tab filtered base ───────────────────────────────────────────────
  const tabPhotos = useMemo(
    () => allPhotos.filter((p) => (p.ownerType ?? "personal") === ownerTab),
    [allPhotos, ownerTab]
  )
  const tabAlbums = useMemo(
    () => allAlbums.filter((a) => (a.ownerType ?? "personal") === ownerTab),
    [allAlbums, ownerTab]
  )
  const tabGuests = useMemo(() => allGuests, [allGuests])

  // Featured photos
  const featuredPhotos = useMemo(() => tabPhotos.filter((p) => p.isFeatured), [tabPhotos])

  // Filtered & sorted photos
  const filteredPhotos = useMemo(() => {
    let result = tabPhotos.filter((p) => {
      if (activeCategory !== "Semua" && p.category !== activeCategory) return false
      if (activeYear !== "Semua" && String(p.year) !== activeYear) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return (
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q))
        )
      }
      return true
    })

    if (sortBy === "Terbaru" || sortBy === t("sort_newest"))
      result = [...result].sort((a, b) => b.date.localeCompare(a.date))
    else if (sortBy === "Terlama" || sortBy === t("sort_oldest"))
      result = [...result].sort((a, b) => a.date.localeCompare(b.date))
    else
      result = [...result].sort((a, b) => a.title.localeCompare(b.title))

    return result
  }, [search, activeCategory, activeYear, sortBy, tabPhotos, t])

  const visiblePhotos = filteredPhotos.slice(0, visibleCount)
  const hasMore = visibleCount < filteredPhotos.length

  const openLightbox = useCallback(
    (photo: GalleryPhoto) => {
      const idx = filteredPhotos.findIndex((p) => p.id === photo.id)
      if (idx !== -1) setLightboxIndex(idx)
    },
    [filteredPhotos]
  )

  const handleDownload = (photo: GalleryPhoto) => {
    const a = document.createElement("a")
    a.href = photo.imageUrl
    a.download = photo.title.replace(/\s+/g, "-").toLowerCase()
    a.target = "_blank"
    a.rel = "noopener noreferrer"
    a.click()
  }

  const handleShare = (photo: GalleryPhoto) => {
    openLightbox(photo)
  }

  const resetFilters = () => {
    setSearch("")
    setActiveCategory("Semua")
    setActiveYear("Semua")
    setSortBy("Terbaru")
    setVisibleCount(INITIAL_VISIBLE)
  }

  const switchOwnerTab = (tab: OwnerTab) => {
    setOwnerTab(tab)
    resetFilters()
  }

  const hasActiveFilters =
    search || activeCategory !== "Semua" || activeYear !== "Semua" || sortBy !== "Terbaru"

  return (
    <main className="min-h-screen bg-baseBackground pt-[4.5rem]">
      {/* ────────────────────── Hero Section ────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Decorative bg */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-accentColor/5 blur-3xl" />
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-accentColor/3 blur-2xl" />
        </div>

        <div className="relative px-[5%] pt-12 pb-8 max-w-7xl mx-auto">
          {/* Badge */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 text-accentColor text-sm font-semibold mb-3 px-4 py-1.5 rounded-full border border-accentColor/30 bg-accentColor/5">
              <ImageIcon className="w-4 h-4" />
              {t("tag")}
            </div>
          </div>

          {/* ── Owner Tabs ─────── */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 gap-1 shadow-inner">
              <button
                onClick={() => switchOwnerTab("guest")}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                  ownerTab === "guest"
                    ? "bg-accentColor text-white shadow-md shadow-accentColor/30"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <Users className="w-4 h-4" />
                <span>{t("tab_guest")}</span>
                {ownerTab !== "guest" && (
                  <span className="ml-1 flex items-center gap-1 text-[10px] font-normal opacity-70 bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded-md border border-black/5 dark:border-white/10">
                    <MousePointerClick className="w-3 h-3" />
                    {t("click_hint")}
                  </span>
                )}
              </button>
              <button
                onClick={() => switchOwnerTab("personal")}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                  ownerTab === "personal"
                    ? "bg-accentColor text-white shadow-md shadow-accentColor/30"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <User className="w-4 h-4" />
                <span>{t("tab_personal")}</span>
                {ownerTab !== "personal" && (
                  <span className="ml-1 flex items-center gap-1 text-[10px] font-normal opacity-70 bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded-md border border-black/5 dark:border-white/10">
                    <MousePointerClick className="w-3 h-3" />
                    {t("click_hint")}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
              {ownerTab === "personal" ? t("tab_personal") : t("tab_guest")}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto">
              {t("subtitle")}
            </p>
          </div>

          {/* Stats bar */}
          <div className="flex items-center justify-center gap-6 mb-8 text-sm text-gray-500 dark:text-gray-400">
            {loading ? (
              <>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="h-8 w-10 rounded-lg bg-gray-200 dark:bg-gray-700 shimmer" />
                    <div className="h-3 w-14 rounded bg-gray-200 dark:bg-gray-700 shimmer" />
                  </div>
                ))}
              </>
            ) : (
              (
                ownerTab === "guest"
                  ? [
                      { n: tabGuests.length, label: t("stat_guests") },
                      { n: tabPhotos.length, label: t("stat_photos") },
                      { n: tabAlbums.length, label: t("stat_albums") },
                    ]
                  : [
                      { n: tabPhotos.length, label: t("stat_photos") },
                      { n: tabAlbums.length, label: t("stat_albums") },
                      { n: GALLERY_CATEGORIES.length - 1, label: t("stat_categories") },
                    ]
              ).map(({ n, label }) => (
                <div key={label} className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-accentColor">{n}</span>
                  <span className="text-xs">{label}</span>
                </div>
              ))
            )}
          </div>

          {/* ── Guest Tab: Add Button ── */}
          {ownerTab === "guest" && !loading && (
            <div className="flex justify-center mb-6">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold",
                  "bg-accentColor hover:bg-accentColor/80 text-white",
                  "shadow-lg shadow-accentColor/30 hover:shadow-xl hover:shadow-accentColor/40",
                  "transition-all duration-200 hover:scale-105 hover:-translate-y-0.5"
                )}
              >
                <Plus className="w-4 h-4" />
                {t("guest_add_btn")}
              </button>
            </div>
          )}

          {/* Search */}
          <div className="relative max-w-xl mx-auto mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setVisibleCount(INITIAL_VISIBLE)
              }}
              placeholder={t("search_placeholder")}
              className={cn(
                "w-full pl-12 pr-12 py-3.5 rounded-2xl text-sm",
                "bg-white dark:bg-gray-800/80",
                "border border-gray-200 dark:border-gray-700",
                "text-gray-900 dark:text-white placeholder:text-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-accentColor/40 focus:border-accentColor",
                "transition-all duration-200 shadow-sm"
              )}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-center flex-wrap">
            {GALLERY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat as GalleryCategory)
                  setVisibleCount(INITIAL_VISIBLE)
                }}
                className={cn(
                  "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
                  activeCategory === cat
                    ? "bg-accentColor text-white shadow-md shadow-accentColor/30"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── Loading state ─────────── */}
      {loading && (
        <div className="px-[5%] max-w-7xl mx-auto pb-16">
          {/* Filter bar shimmer */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4">
            <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-700 shimmer" />
            <div className="flex items-center gap-2">
              <div className="h-9 w-28 rounded-lg bg-gray-200 dark:bg-gray-700 shimmer" />
              <div className="h-9 w-24 rounded-lg bg-gray-200 dark:bg-gray-700 shimmer" />
              <div className="h-9 w-20 rounded-lg bg-gray-200 dark:bg-gray-700 shimmer" />
            </div>
          </div>
          {/* Masonry shimmer — 3 columns */}
          <div className="flex gap-4">
            {[
              [260, 180, 320, 200, 260],
              [220, 300, 160, 280, 220],
              [300, 200, 240, 300, 180],
            ].map((heights, col) => (
              <div key={col} className="flex-1 flex flex-col gap-4">
                {heights.map((h, i) => (
                  <div
                    key={i}
                    className="w-full rounded-xl bg-gray-200 dark:bg-gray-700 shimmer"
                    style={{ height: h }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* ─────────── Featured Carousel ─────────── */}
          {featuredPhotos.length > 0 && activeCategory === "Semua" && !search && activeYear === "Semua" && (
            <section className="px-[5%] max-w-7xl mx-auto pb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-accentColor">⭐</span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("featured_title")}</h2>
              </div>
              <FeaturedCarousel photos={featuredPhotos} onPhotoClick={openLightbox} />
            </section>
          )}

          {/* ─────────── Filter Bar + View Toggle ─────────── */}
          <section className="px-[5%] max-w-7xl mx-auto py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              {/* Left: counter + reset */}
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("showing")}{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {Math.min(visibleCount, filteredPhotos.length)}
                  </span>{" "}
                  {t("of")}{" "}
                  <span className="font-semibold text-accentColor">{filteredPhotos.length}</span>{" "}
                  {t("photos")}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-xs text-accentColor hover:text-accentColor/70 underline transition-colors"
                  >
                    {t("filter_reset")}
                  </button>
                )}
              </div>

              {/* Right: sort, year, view mode */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Sort dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowSortMenu((v) => !v)
                      setShowYearMenu(false)
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    {sortBy}
                    <ChevronDown className={cn("w-4 h-4 transition-transform", showSortMenu && "rotate-180")} />
                  </button>
                  {showSortMenu && (
                    <div className="absolute right-0 top-full mt-1 z-50 min-w-36 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                      {([t("sort_newest"), t("sort_oldest"), t("sort_az")] as SortOption[]).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => {
                            setSortBy(opt)
                            setShowSortMenu(false)
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2.5 text-sm transition-colors",
                            sortBy === opt
                              ? "bg-accentColor/10 text-accentColor font-semibold"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Year dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowYearMenu((v) => !v)
                      setShowSortMenu(false)
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                  >
                    {activeYear === "Semua" ? t("year_label") : activeYear}
                    <ChevronDown className={cn("w-4 h-4 transition-transform", showYearMenu && "rotate-180")} />
                  </button>
                  {showYearMenu && (
                    <div className="absolute right-0 top-full mt-1 z-50 min-w-28 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                      {YEARS.map((y) => (
                        <button
                          key={y}
                          onClick={() => {
                            setActiveYear(y)
                            setShowYearMenu(false)
                            setVisibleCount(INITIAL_VISIBLE)
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2.5 text-sm transition-colors",
                            activeYear === y
                              ? "bg-accentColor/10 text-accentColor font-semibold"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          )}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* View mode toggle */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-2 rounded-md transition-all duration-200",
                      viewMode === "grid"
                        ? "bg-white dark:bg-gray-700 text-accentColor shadow-sm"
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                    title={t("view_grid")}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("album")}
                    className={cn(
                      "p-2 rounded-md transition-all duration-200",
                      viewMode === "album"
                        ? "bg-white dark:bg-gray-700 text-accentColor shadow-sm"
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                    title={t("view_album")}
                  >
                    <FolderOpen className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ─────────── Grid / Album View ─────────── */}
          <section
            className="px-[5%] max-w-7xl mx-auto pb-16"
            onClick={() => {
              setShowSortMenu(false)
              setShowYearMenu(false)
            }}
          >
            {viewMode === "grid" ? (
              <>
                {filteredPhotos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
                    <ImageIcon className="w-16 h-16 opacity-30" />
                    <p className="text-lg font-medium">{t("empty_title")}</p>
                    <button
                      onClick={resetFilters}
                      className="text-accentColor text-sm underline hover:no-underline"
                    >
                      {t("empty_reset")}
                    </button>
                  </div>
                ) : (
                  <>
                    <Masonry
                      breakpointCols={masonryBreakpoints}
                      className="flex -ml-2 sm:-ml-4 w-[calc(100%+0.5rem)] sm:w-[calc(100%+1rem)]"
                      columnClassName="pl-2 sm:pl-4"
                    >
                      {visiblePhotos.map((photo) => {
                        let uploaderName: string | undefined = undefined;
                        let uploaderAvatar: string | null | undefined = undefined;
                        if (photo.ownerType === "guest" && photo.guestId) {
                          const guestUser = allGuests.find((g) => g.id === photo.guestId);
                          uploaderName = guestUser ? guestUser.name : "Guest";
                          uploaderAvatar = guestUser?.avatarUrl;
                        } else {
                          uploaderName = "Agung Kurniawan";
                          uploaderAvatar = ProfileImg;
                        }

                        return (
                          <GalleryPhotoCard
                            key={photo.id}
                            photo={photo}
                            onView={openLightbox}
                            onDownload={handleDownload}
                            onShare={handleShare}
                            uploaderName={uploaderName}
                            uploaderAvatar={uploaderAvatar}
                          />
                        )
                      })}
                    </Masonry>

                    {/* Load More */}
                    {hasMore && (
                      <div className="flex justify-center mt-10">
                        <button
                          onClick={() => setVisibleCount((v) => v + INITIAL_VISIBLE)}
                          className="px-8 py-3 rounded-2xl bg-accentColor hover:bg-accentColor/80 text-white font-semibold text-sm transition-all duration-200 hover:scale-105 shadow-lg shadow-accentColor/20"
                        >
                          {t("load_more").replace(
                            "{n}",
                            String(Math.min(INITIAL_VISIBLE, filteredPhotos.length - visibleCount))
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              /* ── Album View ── */
              <>
                {/* Both personal and guest tabs: show flat album grid */}
                {tabAlbums.filter(
                  (a) => activeCategory === "Semua" || a.category === activeCategory
                ).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
                    <FolderOpen className="w-16 h-16 opacity-30" />
                    <p className="text-lg font-medium">{t("empty_albums")}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                    {tabAlbums
                      .filter(
                        (a) => activeCategory === "Semua" || a.category === activeCategory
                      )
                      .filter((a) => {
                        if (!search.trim()) return true
                        return (
                          a.name.toLowerCase().includes(search.toLowerCase()) ||
                          a.description.toLowerCase().includes(search.toLowerCase())
                        )
                      })
                      .map((album) => {
                        let uploaderName: string | undefined = undefined;
                        let uploaderAvatar: string | null | undefined = undefined;
                        if (album.ownerType === "guest" && album.guestId) {
                          const guestUser = allGuests.find((g) => g.id === album.guestId);
                          uploaderName = guestUser ? guestUser.name : "Guest";
                          uploaderAvatar = guestUser?.avatarUrl;
                        } else {
                          uploaderName = "Agung Kurniawan";
                          uploaderAvatar = ProfileImg;
                        }

                        return (
                          <GalleryAlbumCard 
                            key={album.slug} 
                            album={album} 
                            uploaderName={uploaderName}
                            uploaderAvatar={uploaderAvatar}
                          />
                        )
                      })}
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}

      {/* ─────────── Lightbox ─────────── */}
      {lightboxIndex !== null && filteredPhotos.length > 0 && (
        <GalleryLightbox
          photos={filteredPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* ─────────── Guest Registration Modal ─────────── */}
      <GuestRegistrationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(updatedGuest) => {
          // Re-fetch photos & albums agar data terbaru langsung muncul tanpa refresh
          Promise.all([fetchGalleryPhotos(), fetchGalleryAlbums()]).then(([photos, albums]) => {
            setAllPhotos(photos)
            setAllAlbums(albums)
          })
          // Update data guest di state
          setAllGuests((prev) => {
            const idx = prev.findIndex((g) => g.id === updatedGuest.id)
            if (idx !== -1) {
              const copy = [...prev]
              copy[idx] = updatedGuest
              return copy
            }
            return [...prev, updatedGuest]
          })
          setIsAddModalOpen(false)
          // Switch ke guest tab & album view agar album baru langsung terlihat
          setOwnerTab("guest")
          setViewMode("album")
        }}
      />
    </main>
  )
}
