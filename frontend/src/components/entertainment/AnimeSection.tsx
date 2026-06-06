"use client";

import { useEffect, useState, useRef } from "react";
import { Tv, Search, X, Star, SlidersHorizontal, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { searchTMDBTV, tmdbPosterUrl } from "@/lib/entertainmentApi";
import { AnimeSeries, SeriesStatus } from "@/types/entertainment";
import { ANIME_SERIES_DATA } from "@/data/entertainmentData";
import { MovieCardSkeleton } from "./EntertainmentSkeletons";

const STATUS_COLOR: Record<SeriesStatus, string> = {
  completed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  ongoing: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  wishlist: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

type SortOption = "rating_high" | "az" | "episodes";

interface EnrichedSeries extends AnimeSeries {
  loading?: boolean;
  tmdb_poster?: string | null;
  tmdb_overview?: string;
  tmdb_rating?: number;
  tmdb_episodes?: number;
  tmdb_seasons?: number;
  tmdb_network?: string;
}

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} size={11} className={i < value ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"} />
      ))}
    </div>
  );
}

export default function AnimeSection({ globalSearch }: { globalSearch?: string }) {
  const t = useTranslations("entertainment");
  const STATUS_LABEL: Record<SeriesStatus, string> = {
    completed: t("anime_status_completed"),
    ongoing:   t("anime_status_ongoing"),
    wishlist:  t("anime_status_watchlist"),
  };
  const [series, setSeries] = useState<EnrichedSeries[]>(
    ANIME_SERIES_DATA.map((s) => ({ ...s, loading: true }))
  );
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<SeriesStatus | "all">("all");
  const [filterType, setFilterType] = useState<"all" | "anime" | "series">("all");
  const [sortBy, setSortBy] = useState<SortOption>("rating_high");
  const [showSort, setShowSort] = useState(false);
  const [visibleCount, setVisibleCount] = useState(16);
  const sortRef = useRef<HTMLDivElement>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    ANIME_SERIES_DATA.forEach(async (s, i) => {
      const tmdb = await searchTMDBTV(s.title).catch(() => null);
      setSeries((prev) =>
        prev.map((item, idx) =>
          idx === i
            ? {
                ...item,
                loading: false,
                tmdb_poster: tmdb?.poster_path,
                tmdb_overview: tmdb?.overview,
                tmdb_rating: tmdb?.vote_average,
                tmdb_episodes: tmdb?.number_of_episodes ?? s.total_episodes,
                tmdb_seasons: tmdb?.number_of_seasons ?? s.total_seasons,
                tmdb_network: tmdb?.networks?.[0]?.name ?? s.network ?? s.studio,
              }
            : item
        )
      );
    });
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSort(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeSearch = globalSearch || search;

  const filtered = series
    .filter((s) => {
      if (filterStatus !== "all" && s.status !== filterStatus) return false;
      if (filterType !== "all" && s.type !== filterType) return false;
      if (activeSearch.trim()) {
        return (
          s.title.toLowerCase().includes(activeSearch.toLowerCase()) ||
          (s.original_title?.toLowerCase().includes(activeSearch.toLowerCase()) ?? false)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "rating_high") return b.personal_rating - a.personal_rating;
      if (sortBy === "episodes") return (b.tmdb_episodes ?? 0) - (a.tmdb_episodes ?? 0);
      return a.title.localeCompare(b.title);
    });

  const totalCompleted = series.filter((s) => s.status === "completed").length;
  const avgRating =
    series.filter((s) => s.personal_rating > 0).reduce((sum, s) => sum + s.personal_rating, 0) /
    (series.filter((s) => s.personal_rating > 0).length || 1);

  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "rating_high", label: t("sort_rating_high") },
    { value: "episodes",   label: t("sort_most_episodes") },
    { value: "az",         label: t("sort_az") },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: "📺", label: t("stat_total_titles"), value: series.length,              color: "text-blue-500" },
          { icon: "✅",    label: t("stat_completed"),    value: totalCompleted,           color: "text-green-500" },
          { icon: "⭐",   label: t("avg_rating"),       value: avgRating.toFixed(1),     color: "text-yellow-500" },
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

      {/* Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search_anime")} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accentColor/40 transition" />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
          </div>
          <div className="relative" ref={sortRef}>
            <button onClick={() => setShowSort((v) => !v)} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-sm text-gray-700 dark:text-gray-300 hover:border-accentColor/60 transition">
              <SlidersHorizontal size={14} />{SORT_OPTIONS.find((o) => o.value === sortBy)?.label}<ChevronDown size={13} />
            </button>
            {showSort && (
              <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl z-20 overflow-hidden">
                {SORT_OPTIONS.map((o) => (
                  <button key={o.value} onClick={() => { setSortBy(o.value); setShowSort(false); }} className={cn("block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition", sortBy === o.value ? "text-accentColor font-medium" : "text-gray-700 dark:text-gray-300")}>{o.label}</button>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "completed", "ongoing", "wishlist"] as const).map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)} className={cn("px-3 py-1.5 rounded-xl text-xs font-medium border transition-all", filterStatus === s ? "bg-accentColor text-white border-accentColor" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 hover:border-accentColor/60")}>
              {s === "all" ? t("all") : STATUS_LABEL[s]}
            </button>
          ))}
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 self-center" />
          {(["all", "anime", "series"] as const).map((type) => (
            <button key={type} onClick={() => setFilterType(type)} className={cn("px-3 py-1.5 rounded-xl text-xs font-medium border transition-all", filterType === type ? "bg-accentColor/20 text-accentColor border-accentColor/40" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 hover:border-accentColor/60")}>
              {type === "all" ? t("all_types") : type === "anime" ? "🃌 Anime" : "📺 Series"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          <Tv size={48} className="mx-auto mb-3 opacity-30" />
          <p>{t("no_anime")}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.slice(0, visibleCount).map((s, i) =>
              s.loading ? <MovieCardSkeleton key={i} /> : <SeriesCard key={s.id} series={s} statusLabel={STATUS_LABEL} />
            )}
          </div>
          {visibleCount < filtered.length && (
            <div className="text-center">
              <button onClick={() => setVisibleCount((v) => v + 12)} className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-sm text-gray-700 dark:text-gray-300 hover:border-accentColor hover:text-accentColor transition">
                {t("load_more")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SeriesCard({ series, statusLabel }: { series: EnrichedSeries; statusLabel: Record<SeriesStatus, string> }) {
  const [imgErr, setImgErr] = useState(false);
  const posterUrl = series.tmdb_poster ? tmdbPosterUrl(series.tmdb_poster, "w185") : series.poster_path ? tmdbPosterUrl(series.poster_path, "w185") : null;

  return (
    <div className="group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 hover:border-accentColor/60 hover:shadow-lg transition-all duration-300 flex flex-col">
      <div className="relative w-full aspect-[2/3] bg-gray-100 dark:bg-gray-700">
        {posterUrl && !imgErr ? (
          <Image src={posterUrl} alt={series.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" onError={() => setImgErr(true)} unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
            <Tv size={28} className="text-gray-500" />
          </div>
        )}
        <span className={cn("absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full", STATUS_COLOR[series.status])}>{statusLabel[series.status].split(" ")[0]}</span>
        {series.type === "anime" && (
          <span className="absolute bottom-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-pink-500/90 text-white">🎌 Anime</span>
        )}
        {series.tmdb_rating ? (
          <span className="absolute top-2 right-2 bg-black/70 text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">⭐ {series.tmdb_rating.toFixed(1)}</span>
        ) : null}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight">{series.title}</p>
        {series.original_title && series.original_title !== series.title && (
          <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{series.original_title}</p>
        )}
        <p className="text-[10px] text-gray-400 mt-0.5">
          {(series.tmdb_episodes ?? series.total_episodes) ? `${series.tmdb_episodes ?? series.total_episodes} eps` : ""}
          {(series.tmdb_seasons ?? series.total_seasons) ? ` · Season ${series.tmdb_seasons ?? series.total_seasons}` : ""}
        </p>
        <div className="flex flex-wrap gap-0.5 mt-1">
          {series.genres.slice(0, 2).map((g) => (
            <span key={g} className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400">{g}</span>
          ))}
        </div>
        {series.personal_rating > 0 && <StarRating value={series.personal_rating} />}
        {series.review && <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 italic">&ldquo;{series.review}&rdquo;</p>}
        {(series.tmdb_network ?? series.studio) && (
          <p className="text-[10px] text-gray-400 mt-1">{series.tmdb_network ?? series.studio}</p>
        )}
      </div>
    </div>
  );
}
