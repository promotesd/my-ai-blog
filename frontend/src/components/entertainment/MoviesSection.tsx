"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Film, Search, X, Star, SlidersHorizontal, ChevronDown, LayoutGrid, List, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { searchTMDBMovie, tmdbPosterUrl } from "@/lib/entertainmentApi";
import { EnrichedMovie, MovieStatus, TMDBMovie } from "@/types/entertainment";
import { LOCAL_MOVIES } from "@/data/entertainmentData";
import { MovieCardSkeleton, MovieListSkeleton } from "./EntertainmentSkeletons";

const STATUS_COLOR: Record<MovieStatus, string> = {
  watched: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  watching: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  wishlist: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

type SortOption = "recent" | "rating_high" | "az";
type ViewMode = "grid" | "list";

export default function MoviesSection({ globalSearch }: { globalSearch?: string }) {
  const t = useTranslations("entertainment");
  const STATUS_LABEL: Record<MovieStatus, string> = {
    watched:  t("movie_status_watched"),
    watching: t("movie_status_watching"),
    wishlist: t("movie_status_watchlist"),
  };
  const [movies, setMovies] = useState<EnrichedMovie[]>(
    LOCAL_MOVIES.map((m) => ({ ...m, loading: true }))
  );
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<MovieStatus | "all">("all");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showSort, setShowSort] = useState(false);
  const [visibleCount, setVisibleCount] = useState(18);
  const sortRef = useRef<HTMLDivElement>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    LOCAL_MOVIES.forEach(async (m, i) => {
      const tmdb = await searchTMDBMovie(m.title).catch(() => null);
      setMovies((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, tmdb: tmdb ?? undefined, loading: false, error: !tmdb } : item
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

  // Collect all genres
  const allGenres = Array.from(
    new Set(
      movies.flatMap((m) => m.tmdb?.genres?.map((g) => g.name) ?? [])
    )
  ).sort();

  const filtered = movies
    .filter((m) => {
      if (filterStatus !== "all" && m.status !== filterStatus) return false;
      if (filterGenre !== "all" && !m.tmdb?.genres?.some((g) => g.name === filterGenre)) return false;
      if (activeSearch.trim()) {
        return (m.tmdb?.title ?? m.title).toLowerCase().includes(activeSearch.toLowerCase());
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        return (b.watched_date ?? "").localeCompare(a.watched_date ?? "");
      }
      if (sortBy === "rating_high") return b.personal_rating - a.personal_rating;
      return (a.tmdb?.title ?? a.title).localeCompare(b.tmdb?.title ?? b.title);
    });

  const totalWatched = movies.filter((m) => m.status === "watched").length;
  const totalWishlist = movies.filter((m) => m.status === "wishlist").length;
  const avgRating =
    movies.filter((m) => m.personal_rating > 0).reduce((s, m) => s + m.personal_rating, 0) /
    (movies.filter((m) => m.personal_rating > 0).length || 1);

  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "recent",      label: t("sort_recent_watched") },
    { value: "rating_high", label: t("sort_rating_high") },
    { value: "az",         label: t("sort_az") },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: "👀", label: t("stat_watched"),    value: totalWatched,               color: "text-green-500" },
          { icon: "📋", label: t("stat_watchlist"),  value: totalWishlist,             color: "text-purple-500" },
          { icon: "⭐", label: t("avg_rating"),    value: avgRating.toFixed(1),       color: "text-yellow-500" },
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
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search_movie")}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accentColor/40 transition"
            />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
          </div>

          <div className="flex gap-2 items-center">
            {/* Sort */}
            <div className="relative" ref={sortRef}>
              <button onClick={() => setShowSort((v) => !v)} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-sm text-gray-700 dark:text-gray-300 hover:border-accentColor/60 transition">
                <SlidersHorizontal size={14} />
                {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
                <ChevronDown size={13} />
              </button>
              {showSort && (
                <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl z-20 overflow-hidden">
                  {SORT_OPTIONS.map((o) => (
                    <button key={o.value} onClick={() => { setSortBy(o.value); setShowSort(false); }} className={cn("block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition", sortBy === o.value ? "text-accentColor font-medium" : "text-gray-700 dark:text-gray-300")}>{o.label}</button>
                  ))}
                </div>
              )}
            </div>
            {/* View toggle */}
            <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button onClick={() => setViewMode("grid")} className={cn("p-2.5 transition", viewMode === "grid" ? "bg-accentColor text-white" : "bg-white dark:bg-gray-800/40 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700")}>
                <LayoutGrid size={16} />
              </button>
              <button onClick={() => setViewMode("list")} className={cn("p-2.5 transition", viewMode === "list" ? "bg-accentColor text-white" : "bg-white dark:bg-gray-800/40 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700")}>
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Status filters */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "watched", "watching", "wishlist"] as const).map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)} className={cn("px-3 py-1.5 rounded-xl text-xs font-medium border transition-all", filterStatus === s ? "bg-accentColor text-white border-accentColor" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 hover:border-accentColor/60")}>
              {s === "all" ? t("all") : STATUS_LABEL[s]}
            </button>
          ))}
          {allGenres.slice(0, 8).map((g) => (
            <button key={g} onClick={() => setFilterGenre(filterGenre === g ? "all" : g)} className={cn("px-3 py-1.5 rounded-xl text-xs font-medium border transition-all", filterGenre === g ? "bg-accentColor/20 text-accentColor border-accentColor/40" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 hover:border-accentColor/60")}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          <Film size={48} className="mx-auto mb-3 opacity-30" />
          <p>{t("no_movies")}</p>
        </div>
      ) : viewMode === "grid" ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.slice(0, visibleCount).map((m, i) =>
              m.loading ? <MovieCardSkeleton key={i} /> : <MovieCard key={i} movie={m} statusLabel={STATUS_LABEL} />
            )}
          </div>
          {visibleCount < filtered.length && (
            <div className="text-center">
              <button onClick={() => setVisibleCount((v) => v + 18)} className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-sm text-gray-700 dark:text-gray-300 hover:border-accentColor hover:text-accentColor transition">
                {t("load_more_n").replace("{n}", String(filtered.length - visibleCount))}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          {filtered.slice(0, visibleCount).map((m, i) =>
            m.loading ? <MovieListSkeleton key={i} /> : <MovieListRow key={i} movie={m} statusLabel={STATUS_LABEL} />
          )}
          {visibleCount < filtered.length && (
            <div className="text-center">
              <button onClick={() => setVisibleCount((v) => v + 18)} className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-sm text-gray-700 dark:text-gray-300 hover:border-accentColor hover:text-accentColor transition">
                Muat lebih banyak
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MovieCard({ movie, statusLabel }: { movie: EnrichedMovie; statusLabel: Record<MovieStatus, string> }) {
  const [imgError, setImgError] = useState(false);
  const posterUrl = movie.tmdb?.poster_path ? tmdbPosterUrl(movie.tmdb.poster_path, "w185") : null;
  const title = movie.tmdb?.title ?? movie.title;
  const year = movie.tmdb?.release_date?.slice(0, 4) ?? "";

  return (
    <div className="group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 hover:border-accentColor/60 hover:shadow-lg transition-all duration-300 flex flex-col">
      <div className="relative w-full aspect-[2/3] bg-gray-100 dark:bg-gray-700">
        {posterUrl && !imgError ? (
          <Image src={posterUrl} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" onError={() => setImgError(true)} unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900"><Film size={28} className="text-gray-500" /></div>
        )}
        <span className={cn("absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full", STATUS_COLOR[movie.status])}>{statusLabel[movie.status].split(" ")[0]}</span>
        {movie.tmdb?.vote_average ? (
          <span className="absolute top-2 right-2 bg-black/70 text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">⭐ {movie.tmdb.vote_average.toFixed(1)}</span>
        ) : null}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight">{title}</p>
        {year && <p className="text-[11px] text-gray-400 mt-0.5">{year}</p>}
        {(movie.tmdb?.genres?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {movie.tmdb!.genres!.slice(0, 2).map((g) => (
              <span key={g.id} className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400">{g.name}</span>
            ))}
          </div>
        )}
        {movie.personal_rating > 0 && <StarRating value={movie.personal_rating} />}
        {movie.review && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 line-clamp-2 italic">&ldquo;{movie.review}&rdquo;</p>}
      </div>
    </div>
  );
}

function MovieListRow({ movie, statusLabel }: { movie: EnrichedMovie; statusLabel: Record<MovieStatus, string> }) {
  const [imgError, setImgError] = useState(false);
  const posterUrl = movie.tmdb?.poster_path ? tmdbPosterUrl(movie.tmdb.poster_path, "w92") : null;
  const title = movie.tmdb?.title ?? movie.title;
  const year = movie.tmdb?.release_date?.slice(0, 4) ?? "";

  return (
    <div className="flex gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 hover:border-accentColor/50 transition">
      <div className="relative w-14 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
        {posterUrl && !imgError ? (
          <Image src={posterUrl} alt={title} fill className="object-cover" onError={() => setImgError(true)} unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Film size={20} className="text-gray-400" /></div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">{title}</p>
            <p className="text-xs text-gray-400">{year} {movie.tmdb?.genres?.slice(0, 2).map((g) => g.name).join(", ")}</p>
          </div>
          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0", STATUS_COLOR[movie.status])}>{statusLabel[movie.status]}</span>
        </div>
        {movie.tmdb?.overview && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{movie.tmdb.overview}</p>}
        <div className="flex items-center gap-3 mt-1.5">
          {movie.tmdb?.vote_average ? <span className="text-xs text-yellow-500 font-medium">⭐ {movie.tmdb.vote_average.toFixed(1)} TMDB</span> : null}
          {movie.personal_rating > 0 && <StarRating value={movie.personal_rating} />}
          {movie.review && <p className="text-xs text-gray-400 italic line-clamp-1">&ldquo;{movie.review}&rdquo;</p>}
        </div>
      </div>
    </div>
  );
}

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex gap-0.5 mt-1">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} size={11} className={i < value ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"} />
      ))}
    </div>
  );
}

