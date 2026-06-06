"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Masonry from "react-masonry-css"
import { useTranslations } from "next-intl"
import {
  BookOpen,
  Users,
  MapPin,
  Star,
  Clock,
  Search,
  SlidersHorizontal,
  Edit3,
  CheckCircle2,
  ChevronDown,
  X,
  Pencil,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import GuestbookCard, { GuestbookEntry } from "./GuestbookCard"
import GuestbookFormModal, { MOODS } from "./GuestbookFormModal"

// ─── Constants ────────────────────────────────────────────────────────────────

const BREAKPOINT_COLS = {
  default: 3,
  1100: 3,
  768: 2,
  500: 1,
}

// ─── Toast ─────────────────────────────────────────────────────────────────────

function Toast({
  message,
  type,
  onClose,
}: {
  message: string
  type: "success" | "error"
  onClose: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium max-w-sm",
        "animate-in slide-in-from-bottom-4 duration-300",
        type === "success"
          ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
          : "bg-red-600 text-white"
      )}
    >
      <span className="text-base">{type === "success" ? "✅" : "❌"}</span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  )
}

// ─── Animated Stat ─────────────────────────────────────────────────────────────

function AnimatedStat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
}) {
  const [displayed, setDisplayed] = useState(0)
  const isNum = typeof value === "number"

  useEffect(() => {
    if (!isNum) return
    let frame: number
    const duration = 1200
    const start = Date.now()
    const animate = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(eased * (value as number)))
      if (progress < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [value, isNum])

  return (
    <div className="flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-100 dark:border-gray-700/50 min-w-[130px]">
      <div className="text-accentColor">{icon}</div>
      <div className="font-bold text-gray-900 dark:text-white text-lg leading-none">
        {isNum
          ? displayed
          : value}
      </div>
      {sub && (
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate max-w-full px-1 text-center">
          {sub}
        </div>
      )}
      <div className="text-xs text-gray-400 dark:text-gray-500 text-center">{label}</div>
    </div>
  )
}

// ─── Not-Submitted Callout ───────────────────────────────────────────────────

function NotSubmittedCallout({ onOpen }: { onOpen: () => void }) {
  const t = useTranslations("guestbookPage")
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 px-5 py-4">
      {/* Decorative blob */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-300/20 dark:bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Left: icon + text */}
        <div className="flex items-start gap-3 flex-1">
          {/* Pulsing dot */}
          <div className="relative mt-0.5 shrink-0">
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <Sparkles size={13} className="shrink-0" />
              {t("callout_title")}
            </p>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
              {t("callout_desc")}
            </p>
          </div>
        </div>

        {/* Right: CTA */}
        <button
          onClick={onOpen}
          className="group shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 text-white text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-amber-400/30 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 self-start sm:self-center"
        >
          <Pencil size={13} className="transition-transform group-hover:rotate-12" />
          {t("callout_btn")}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function GuestbookPage() {
  const t = useTranslations("guestbookPage")
  const SORT_OPTIONS = useMemo(() => [
    { value: "newest", label: t("sort_newest") },
    { value: "oldest", label: t("sort_oldest") },
    { value: "rating_high", label: t("sort_rating_high") },
    { value: "name_az", label: t("sort_name_az") },
  ], [t])

  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newEntryIds, setNewEntryIds] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  // Filters
  const [search, setSearch] = useState("")
  const [filterMood, setFilterMood] = useState("All")
  const [filterRating, setFilterRating] = useState("All")
  const [filterCity, setFilterCity] = useState("All")
  const [sortBy, setSortBy] = useState("newest")
  const [showFilters, setShowFilters] = useState(false)

  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ message, type })
    },
    []
  )

  // ── Fetch initial entries ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("guestbook")
        .select("*")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })

      if (!error && data) setEntries(data as GuestbookEntry[])
      setLoading(false)
    }
    fetchEntries()
  }, [])

  // ── Check if already submitted (localStorage + fingerprint server-side) ──────
  useEffect(() => {
    if (typeof window === "undefined") return

    // 1. Cek localStorage terlebih dahulu (cepat)
    if (localStorage.getItem("guestbook_submitted") === "true") {
      setHasSubmitted(true)
      return
    }

    // 2. Cek fingerprint server-side — mencegah bypass dengan hapus localStorage.
    //    Fingerprint unik per perangkat/browser, tidak terpengaruh shared IP.
    const checkFingerprint = async () => {
      try {
        const { generateFingerprint } = await import("@/lib/fingerprint")
        const fp  = await generateFingerprint()
        const res = await fetch(`/api/visitor-check?type=guestbook_submitted&fp=${fp}`)
        const data = await res.json()
        if (data.checked) {
          // Fingerprint sudah tercatat → sync localStorage & tandai sudah submit
          localStorage.setItem("guestbook_submitted", "true")
          setHasSubmitted(true)
        }
      } catch {
        // Gagal cek → fail-open, biarkan user mengisi (tidak blok)
      }
    }

    checkFingerprint()
  }, [])

  // ── Supabase Realtime subscription ──────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("guestbook_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "guestbook" },
        (payload) => {
          const newEntry = payload.new as GuestbookEntry
          if (!newEntry.is_approved) return
          setEntries((prev) => {
            if (prev.find((e) => e.id === newEntry.id)) return prev
            return [newEntry, ...prev]
          })
          setNewEntryIds((prev) => new Set([...prev, newEntry.id]))
          setTimeout(() => {
            setNewEntryIds((prev) => {
              const next = new Set(prev)
              next.delete(newEntry.id)
              return next
            })
          }, 3000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // ── Confetti ─────────────────────────────────────────────────────────────────
  const triggerConfetti = useCallback(async () => {
    const confetti = (await import("canvas-confetti")).default
    const duration = 3000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#0EBD7A", "#6366f1", "#ec4899", "#f59e0b"],
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#0EBD7A", "#6366f1", "#ec4899", "#f59e0b"],
      })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }, [])

  // ── Handle successful submission ──────────────────────────────────────────────
  const handleSuccess = useCallback(
    (entry: GuestbookEntry) => {
      setHasSubmitted(true)
      setEntries((prev) => [entry, ...prev])
      setNewEntryIds((prev) => new Set([...prev, entry.id]))
      triggerConfetti()
      showToast(t("toast_success"))
    },
    [triggerConfetti, showToast]
  )

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const uniqueCities = new Set(entries.map((e) => e.city.trim())).size
    const avgRating =
      entries.length > 0
        ? (entries.reduce((s, e) => s + e.rating, 0) / entries.length).toFixed(1)
        : "0"
    const latest = entries[0]
    return { uniqueCities, avgRating, latest }
  }, [entries])

  // ── Unique cities for filter dropdown ─────────────────────────────────────────
  const uniqueCities = useMemo(
    () => ["All", ...Array.from(new Set(entries.map((e) => e.city.trim()))).sort()],
    [entries]
  )

  // ── Filtered + sorted entries ─────────────────────────────────────────────────
  const displayed = useMemo(() => {
    let result = [...entries]
    const q = search.toLowerCase().trim()
    if (q) {
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.city.toLowerCase().includes(q) ||
          e.profession.toLowerCase().includes(q) ||
          e.message.toLowerCase().includes(q)
      )
    }
    if (filterMood !== "All") {
      result = result.filter((e) => e.mood === filterMood)
    }
    if (filterRating !== "All") {
      if (filterRating === "lte3") {
        result = result.filter((e) => e.rating <= 3)
      } else {
        const minRating = parseInt(filterRating)
        result = result.filter((e) => e.rating >= minRating)
      }
    }
    if (filterCity !== "All") {
      result = result.filter((e) => e.city.trim() === filterCity)
    }
    switch (sortBy) {
      case "oldest":
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case "rating_high":
        result.sort((a, b) => b.rating - a.rating)
        break
      case "name_az":
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
    return result
  }, [entries, search, filterMood, filterRating, filterCity, sortBy])

  const gridRef = useRef<HTMLDivElement>(null)
  const scrollToForm = () => {
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    setIsModalOpen(true)
  }

  // ── Active filter count ────────────────────────────────────────────────────────
  const activeFilterCount = [
    filterMood !== "All",
    filterRating !== "All",
    filterCity !== "All",
  ].filter(Boolean).length

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[hsl(193,20%,9%)]">
      {/* ─────────────────────────── HERO ─────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-16 px-4">
        {/* Decorative gradient blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-accentColor/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-20 -right-32 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Icon + Tag */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accentColor/10 text-accentColor text-xs font-medium border border-accentColor/20">
              <BookOpen size={12} />
              {t("tag")}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
            {t("title")}
            <span className="block text-accentColor">{t("title_accent")}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            {t("subtitle")}
          </p>

          {/* CTA Button */}
          <div className="flex justify-center mb-10">
            {hasSubmitted ? (
              <button
                disabled
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-sm font-medium cursor-not-allowed border border-gray-200 dark:border-gray-700"
              >
                <CheckCircle2 size={17} />
                {t("cta_filled")}
              </button>
            ) : (
              <button
                onClick={scrollToForm}
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-accentColor text-white text-sm font-semibold border-2 border-accentColor hover:bg-transparent hover:text-accentColor transition-all duration-200 shadow-lg hover:shadow-accentColor/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                <Edit3 size={16} className="transition-transform group-hover:rotate-12" />
                {t("cta_fill")}
              </button>
            )}
          </div>

          {/* Animated Stats */}
          {!loading && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <AnimatedStat
                icon={<Users size={20} />}
                label={t("stat_total")}
                value={entries.length}
              />
              <AnimatedStat
                icon={<MapPin size={20} />}
                label={t("stat_cities")}
                value={stats.uniqueCities}
              />
              <AnimatedStat
                icon={<Star size={20} className="fill-amber-400 text-amber-400" />}
                label={t("stat_avg_rating")}
                value={stats.avgRating}
              />
              {stats.latest && (
                <AnimatedStat
                  icon={<Clock size={20} />}
                  label={t("stat_latest")}
                  value={stats.latest.name}
                  sub={new Date(stats.latest.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                />
              )}
            </div>
          )}
        </div>
      </section>

      {/* ─────────────── NOT-SUBMITTED CALLOUT ──────────────────────── */}
      {!loading && !hasSubmitted && (
        <section className="max-w-7xl mx-auto px-4 pb-4">
          <NotSubmittedCallout onOpen={() => setIsModalOpen(true)} />
        </section>
      )}

      {/* ───────────────────── SEARCH & FILTER ─────────────────────── */}
      <section ref={gridRef} className="max-w-7xl mx-auto px-4 pb-6">
        <div className="flex flex-col gap-3">
          {/* Top row: search + filter toggle */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("search_placeholder")}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-accentColor/30 focus:border-accentColor transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter toggle button */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all whitespace-nowrap",
                showFilters || activeFilterCount > 0
                  ? "border-accentColor bg-accentColor/10 text-accentColor"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:border-accentColor/50"
              )}
            >
              <SlidersHorizontal size={14} />
              {t("filter_btn")}
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-accentColor text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort */}
            <div className="relative hidden sm:block">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-accentColor/30 focus:border-accentColor cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              {/* Mood filter */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t("filter_mood")}:</span>
                {[null, ...MOODS].map((moodItem) => {
                  const key = moodItem?.label ?? "All"
                  const isActive = filterMood === key
                  return (
                    <button
                      key={key}
                      onClick={() => setFilterMood(key)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium transition-all border",
                        isActive
                          ? "bg-accentColor text-white border-accentColor"
                          : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-accentColor/50"
                      )}
                    >
                      {moodItem ? `${moodItem.emoji} ${t(`mood_${moodItem.label.toLowerCase()}`)}` : t("filter_all")}
                    </button>
                  )
                })}
              </div>

              <div className="w-full h-px bg-gray-100 dark:bg-gray-800" />

              {/* Rating filter */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t("filter_rating")}:</span>
                {[
                  { value: "All", label: t("filter_all") },
                  { value: "5", label: t("filter_rating_5") },
                  { value: "4", label: t("filter_rating_4") },
                  { value: "lte3", label: t("filter_rating_lte3") },
                ].map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setFilterRating(r.value)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-all border",
                      filterRating === r.value
                        ? "bg-accentColor text-white border-accentColor"
                        : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-accentColor/50"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="w-full h-px bg-gray-100 dark:bg-gray-800" />

              {/* City filter */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t("filter_city")}:</span>
                <div className="relative">
                  <select
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    className="appearance-none pl-3 pr-7 py-1 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-accentColor/30 cursor-pointer"
                  >
                    {uniqueCities.map((c) => (
                      <option key={c} value={c}>{c === "All" ? t("filter_all") : c}</option>
                    ))}
                  </select>
                  <ChevronDown
                    size={10}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* Reset filters */}
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setFilterMood("All")
                    setFilterRating("All")
                    setFilterCity("All")
                  }}
                  className="ml-auto text-xs text-red-500 hover:text-red-600 underline"
                >
                  {t("filter_reset")}
                </button>
              )}
            </div>
          )}

          {/* Sort on mobile */}
          <div className="flex items-center justify-between sm:hidden">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-accentColor/30 cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {t("showing")} {displayed.length} {t("of")} {entries.length} {t("guests")}
            </span>
          </div>

          {/* Counter (desktop) */}
          <div className="hidden sm:flex items-center justify-between">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {t("showing")}{" "}
              <span className="font-semibold text-gray-600 dark:text-gray-300">
                {displayed.length}
              </span>{" "}
              {t("of")}{" "}
              <span className="font-semibold text-gray-600 dark:text-gray-300">
                {entries.length}
              </span>{" "}
              {t("guests")}
            </span>
          </div>
        </div>
      </section>

      {/* ───────────────────── MASONRY GRID ─────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        {/* Loading skeleton */}
        {loading && (
          <Masonry breakpointCols={BREAKPOINT_COLS} className="flex gap-4" columnClassName="flex flex-col gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-gray-100 dark:bg-gray-800/60 animate-pulse h-52" />
            ))}
          </Masonry>
        )}

        {/* Empty state */}
        {!loading && displayed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="text-6xl">📭</div>
            <div className="text-center">
              <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {entries.length === 0
                  ? t("empty_no_guests")
                  : t("empty_no_results")}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {entries.length === 0
                  ? t("empty_be_first")
                  : t("empty_try_filter")}
              </p>
            </div>
            {entries.length === 0 && !hasSubmitted && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accentColor text-white text-sm font-medium hover:bg-accentColor/90 transition-all"
              >
                <Edit3 size={14} />
                {t("empty_fill_now")}
              </button>
            )}
          </div>
        )}

        {/* Masonry grid */}
        {!loading && displayed.length > 0 && (
          <Masonry
            breakpointCols={BREAKPOINT_COLS}
            className="flex -mx-2"
            columnClassName="px-2 flex flex-col gap-4"
          >
            {displayed.map((entry) => (
              <GuestbookCard
                key={entry.id}
                entry={entry}
                isNew={newEntryIds.has(entry.id)}
              />
            ))}
          </Masonry>
        )}
      </section>

      {/* ───────────────────── FORM MODAL ───────────────────────────── */}
      <GuestbookFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />

      {/* ───────────────────── TOAST ─────────────────────────────────── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </main>
  )
}
