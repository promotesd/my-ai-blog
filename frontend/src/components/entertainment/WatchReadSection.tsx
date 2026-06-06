"use client";

import { useEffect, useState, useRef } from "react";
import { Search, X, Play, BookMarked, Loader2, SlidersHorizontal, ChevronDown, Tag } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { WatchReadItem, WatchReadCategory, WatchReadStatus } from "@/types/entertainment";
import { searchTMDBByTitle } from "@/lib/entertainmentApi";

/* ── Types ─────────────────────────────────────────────────────────── */
type EnrichedWatchRead = WatchReadItem & {
  poster_url?: string | null;
  vote_average?: number;
  created_time?: string;
  tmdb_loading?: boolean;
  raw_tags?: string[];
  is_adult?: boolean;
};

type SortOption = "newest" | "oldest" | "rating" | "az";

/* ── Constants ─────────────────────────────────────────────────────── */
const CATEGORY_EMOJI: Record<WatchReadCategory | "all", string> = {
  all: "🌐",
  Movie: "🎬",
  Anime: "🎌",
  Manhwa: "🇰🇷",
  Donghua: "🇨🇳",
  Manga: "📖",
  Cartoon: "🎨",
};

const STATUS_COLOR: Record<WatchReadStatus, string> = {
  watching: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  dropped: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  reading: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  plan_to_watch: "bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300",
};

/* ── Component ─────────────────────────────────────────────────────── */
export default function WatchReadSection({ globalSearch }: { globalSearch?: string }) {
  const t = useTranslations("entertainment");

  const STATUS_LABEL: Record<WatchReadStatus, string> = {
    watching: t("wr_status_watching"),
    completed: t("wr_status_completed"),
    dropped: t("wr_status_dropped"),
    reading: t("wr_status_reading"),
    paused: t("wr_status_paused"),
    plan_to_watch: t("wr_status_plan"),
  };

  const [items, setItems] = useState<EnrichedWatchRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<WatchReadCategory | "all">("all");
  const [filterStatus, setFilterStatus] = useState<WatchReadStatus | "all">("all");
  const [search, setSearch] = useState("");
  
  // State & Ref untuk Sort Custom Dropdown
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSort, setShowSort] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  /* Fetch API Notion */
  useEffect(() => {
    fetch("/api/notion-watchread")
      .then((r) => r.json())
      .then((d) =>
        setItems(
          (d.items ?? []).map((item: EnrichedWatchRead) => ({
            ...item,
            tmdb_loading: true,
          }))
        )
      )
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  /* Ambil Poster dari TMDB */
  useEffect(() => {
    if (loading || items.length === 0) return;
    items.forEach(async (item, i) => {
      if (!item.tmdb_loading) return;
      const result = await searchTMDBByTitle(item.title, item.category as WatchReadCategory).catch(() => null);
      setItems((prev) =>
        prev.map((it, idx) =>
          idx === i
            ? { 
                ...it, 
                tmdb_loading: false, 
                poster_url: result?.poster_url ?? null,
                vote_average: result?.vote_average ?? 0 
              }
            : it
        )
      );
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, items.length]);

  /* Handle klik di luar untuk menutup dropdown urutkan */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSort(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* 1. Filter Data */
  const activeSearch = globalSearch || search;
  const filtered = items.filter((item) => {
    if (filterCategory !== "all" && item.category !== filterCategory) return false;
    if (filterStatus !== "all" && item.status !== filterStatus) return false;
    if (activeSearch.trim() && !item.title.toLowerCase().includes(activeSearch.toLowerCase())) return false;
    return true;
  });

  /* 2. Sort Data */
  const sortedAndFiltered = [...filtered].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.created_time || 0).getTime() - new Date(a.created_time || 0).getTime();
    }
    if (sortBy === "oldest") {
      return new Date(a.created_time || 0).getTime() - new Date(b.created_time || 0).getTime();
    }
    if (sortBy === "rating") {
      return (b.vote_average || 0) - (a.vote_average || 0);
    }
    if (sortBy === "az") {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  /* Stats */
  const totalCompleted = items.filter((i) => i.status === "completed").length;
  const totalWatching  = items.filter((i) => i.status === "watching" || i.status === "reading").length;
  const totalPlanTo    = items.filter((i) => i.status === "plan_to_watch").length;

  const CATEGORIES: (WatchReadCategory | "all")[] = ["all", "Movie", "Anime", "Manhwa", "Donghua", "Manga", "Cartoon"];
  const STATUSES: (WatchReadStatus | "all")[] = ["all", "watching", "reading", "completed", "plan_to_watch"];
  
  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Terbaru" },
    { value: "rating", label: "Rating Tertinggi" },
    { value: "az",     label: "A - Z" },
    { value: "oldest", label: "Terlama" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: "✅", label: t("wr_stat_completed"), value: totalCompleted, color: "text-green-500" },
          { icon: "▶️", label: t("wr_stat_in_progress"), value: totalWatching, color: "text-blue-500" },
          { icon: "📋", label: t("wr_stat_planned"), value: totalPlanTo, color: "text-gray-500" },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 p-4 flex items-center gap-3">
            <span className={cn("text-xl", color)}>{icon}</span>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              <p className="font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Sort Container */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("wr_search")}
            className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accentColor/40 transition"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        
        {/* Custom Sort Dropdown */}
        <div className="relative shrink-0" ref={sortRef}>
          <button 
            onClick={() => setShowSort((v) => !v)} 
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-sm text-gray-700 dark:text-gray-300 hover:border-accentColor/60 transition"
          >
            <SlidersHorizontal size={14} />
            {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
            <ChevronDown size={13} />
          </button>
          
          {showSort && (
            <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl z-20 overflow-hidden">
              {SORT_OPTIONS.map((o) => (
                <button 
                  key={o.value} 
                  onClick={() => { setSortBy(o.value); setShowSort(false); }} 
                  className={cn(
                    "block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition", 
                    sortBy === o.value ? "text-accentColor font-medium" : "text-gray-700 dark:text-gray-300"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
              filterCategory === cat
                ? "bg-accentColor text-white border-accentColor"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 hover:border-accentColor/60"
            )}
          >
            <span>{CATEGORY_EMOJI[cat]}</span>
            {cat === "all" ? t("all") : cat}
          </button>
        ))}
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
              filterStatus === s
                ? "bg-accentColor text-white border-accentColor"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 hover:border-accentColor/60"
            )}
          >
            {s === "all" ? t("all") : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Loader2 size={32} className="animate-spin text-accentColor" />
            <p className="text-sm">{t("wr_loading")}</p>
          </div>
        </div>
      ) : sortedAndFiltered.length === 0 ? (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          <Play size={48} className="mx-auto mb-3 opacity-30" />
          <p>{t("wr_empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {sortedAndFiltered.map((item, i) => (
            <WatchReadCard key={`${item.id}-${i}`} item={item} statusLabel={STATUS_LABEL} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Card ──────────────────────────────────────────────────────────── */
function WatchReadCard({
  item,
  statusLabel,
}: {
  item: EnrichedWatchRead;
  statusLabel: Record<WatchReadStatus, string>;
}) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div className="group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 hover:border-accentColor/60 hover:shadow-md transition-all flex flex-col relative">
      {/* Adult Content Warning (Opsional) */}
      {item.is_adult && (
        <span className="absolute top-2 right-2 z-10 text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-red-600 text-white backdrop-blur-sm shadow-sm">
          18+
        </span>
      )}

      {/* Poster */}
      <div className="relative w-full aspect-[2/3] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
        {item.tmdb_loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>
        ) : item.poster_url && !imgErr ? (
          <Image
            src={item.poster_url}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgErr(true)}
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2">
            <span className="text-3xl">{CATEGORY_EMOJI[item.category as WatchReadCategory] ?? "🎬"}</span>
            <p className="text-[10px] text-center text-gray-500 dark:text-gray-400 line-clamp-3">{item.title}</p>
          </div>
        )}
        
        {/* Category badge */}
        <span className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-sm">
          {item.category}
        </span>
        
        {/* TMDB Rating overlay */}
        {item.vote_average && item.vote_average > 0 ? (
          <span className="absolute bottom-2 right-2 flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-black/60 text-yellow-400 backdrop-blur-sm">
            ★ {item.vote_average.toFixed(1)}
          </span>
        ) : null}
      </div>

      {/* Info */}
      <div className="p-2.5 flex flex-col flex-1 gap-1.5">
        <p className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug">{item.title}</p>
        
        {/* Display Notion Tags if exist */}
        {item.raw_tags && item.raw_tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.raw_tags.map(tag => (
               <span key={tag} className="text-[8px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                 <Tag size={8} />
                 {tag}
               </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-1.5 items-start">
          <span className={cn("inline-block text-[9px] font-medium px-1.5 py-0.5 rounded-full mt-1", STATUS_COLOR[item.status])}>
            {statusLabel[item.status]}
          </span>
          {item.progress && item.progress !== "-" && (
            <p className="text-[10px] text-gray-400 flex items-center gap-1">
              <BookMarked size={9} />
              {item.progress}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
