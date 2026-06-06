"use client";

import { useEffect, useRef, useState } from "react";
import { Gamepad2, MonitorPlay, Music, BookOpen, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { EntertainmentTab } from "@/types/entertainment";
import { STEAM_GAMES_FALLBACK } from "@/data/entertainmentData";
import { StatCardSkeleton } from "./EntertainmentSkeletons";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  color: string;
  bgColor: string;
  tab: EntertainmentTab;
  description?: string;
  onTabClick: (tab: EntertainmentTab) => void;
}

function useCountUp(target: number, duration = 1500, inView: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, inView]);
  return count;
}

function StatCard({ icon, label, value, suffix = "", color, bgColor, tab, description, onTabClick }: StatCardProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [inView, setInView] = useState(false);
  const count = useCountUp(value, 1200, inView);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <button
      ref={ref}
      onClick={() => onTabClick(tab)}
      className={cn(
        "group relative rounded-2xl border bg-white dark:bg-gray-800/40 p-5 text-left transition-all duration-300 w-full",
        "hover:shadow-xl hover:-translate-y-1",
        "border-gray-200 dark:border-gray-700/50 hover:border-opacity-80"
      )}
      style={{ borderColor: inView ? undefined : undefined }}
    >
      {/* Glow bg */}
      <div className={cn("absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300", bgColor)} />
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-2.5 rounded-xl", bgColor, "bg-opacity-15 dark:bg-opacity-20")}>
          <span className={cn(color)}>{icon}</span>
        </div>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">{description ?? "Click to view"} →</span>
      </div>
      <p className={cn("text-3xl font-extrabold tracking-tight", color)}>
        {count.toLocaleString()}<span className="text-lg ml-0.5">{suffix}</span>
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">{label}</p>
    </button>
  );
}

export default function DashboardSection({ onTabClick }: { onTabClick: (tab: EntertainmentTab) => void }) {
  const t = useTranslations("entertainment");
  const [steamLoaded, setSteamLoaded] = useState(false);
  const [totalGames, setTotalGames] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [watchReadCount, setWatchReadCount] = useState(0);
  const [musicCount, setMusicCount] = useState(0);
  const [booksCount, setBooksCount] = useState(0);

  // Steam games
  useEffect(() => {
    fetch("/api/steam-games")
      .then((r) => r.json())
      .then((data) => {
        const games = data.response?.games ?? STEAM_GAMES_FALLBACK;
        setTotalGames(games.length || STEAM_GAMES_FALLBACK.length);
        setTotalHours(Math.floor(games.reduce((s: number, g: { playtime_forever: number }) => s + g.playtime_forever, 0) / 60) || Math.floor(STEAM_GAMES_FALLBACK.reduce((s, g) => s + g.playtime_forever, 0) / 60));
      })
      .catch(() => {
        setTotalGames(STEAM_GAMES_FALLBACK.length);
        setTotalHours(Math.floor(STEAM_GAMES_FALLBACK.reduce((s, g) => s + g.playtime_forever, 0) / 60));
      })
      .finally(() => setSteamLoaded(true));
  }, []);

  // Other tabs
  useEffect(() => {
    fetch("/api/notion-watchread")
      .then((r) => r.json())
      .then((d) => setWatchReadCount((d.items ?? []).length))
      .catch(() => {});
    fetch("/api/music-data")
      .then((r) => r.json())
      .then((d) => setMusicCount((d.tracks ?? []).length))
      .catch(() => {});
    fetch("/api/books-data")
      .then((r) => r.json())
      .then((d) => setBooksCount((d.books ?? []).filter((b: { status: string }) => b.status === "finished").length))
      .catch(() => {});
  }, []);

  const stats: Omit<StatCardProps, "onTabClick">[] = [
    {
      icon: <Gamepad2 size={20} />, label: t("stat_total_games"), value: totalGames,
      color: "text-blue-500", bgColor: "bg-blue-500", tab: "games",
      description: t("desc_game_collection"),
    },
    {
      icon: <Clock size={20} />, label: t("stat_play_hours"), value: totalHours, suffix: "h",
      color: "text-cyan-500", bgColor: "bg-cyan-500", tab: "games",
      description: t("desc_game_stats"),
    },
    {
      icon: <MonitorPlay size={20} />, label: t("stat_total_watchread"), value: watchReadCount,
      color: "text-rose-500", bgColor: "bg-rose-500", tab: "watchread",
      description: t("desc_watchread"),
    },
    {
      icon: <Music size={20} />, label: t("stat_total_tracks"), value: musicCount,
      color: "text-green-500", bgColor: "bg-green-500", tab: "music",
      description: t("desc_music"),
    },
    {
      icon: <BookOpen size={20} />, label: t("stat_books_read"), value: booksCount,
      color: "text-amber-500", bgColor: "bg-amber-500", tab: "books",
      description: t("desc_books"),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero text */}
      <div className="rounded-2xl bg-gradient-to-br from-accentColor/10 via-transparent to-purple-500/10 border border-accentColor/20 dark:border-accentColor/10 p-6 md:p-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t("dash_world_title")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {t("dash_world_desc")}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          {t("dash_stats_heading")}
        </h3>
        {!steamLoaded ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <StatCard key={s.label} {...s} onTabClick={onTabClick} />
            ))}
          </div>
        )}
      </div>

      {/* Activity highlights */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          {t("dash_highlights_heading")}
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <HighlightCard
            emoji="🎮"
            category={t("tab_games")}
            title={t("dash_hl_games_title")}
            sub={t("dash_hl_games_sub")}
            color="text-blue-500"
            bg="bg-blue-500/10 dark:bg-blue-500/5"
            borderColor="border-blue-200 dark:border-blue-800/30"
            onClick={() => onTabClick("games")}
          />
          <HighlightCard
            emoji="🎬"
            category={t("tab_watchread")}
            title={t("dash_hl_watchread_title")}
            sub={t("dash_hl_watchread_sub")}
            color="text-rose-500"
            bg="bg-rose-500/10 dark:bg-rose-500/5"
            borderColor="border-rose-200 dark:border-rose-800/30"
            onClick={() => onTabClick("watchread")}
          />
          <HighlightCard
            emoji="📚"
            category={t("tab_books")}
            title={t("dash_hl_books_title")}
            sub={t("dash_hl_books_sub")}
            color="text-amber-500"
            bg="bg-amber-500/10 dark:bg-amber-500/5"
            borderColor="border-amber-200 dark:border-amber-800/30"
            onClick={() => onTabClick("books")}
          />
        </div>
      </div>
    </div>
  );
}

function HighlightCard({ emoji, category, title, sub, rating, color, bg, borderColor, onClick }: {
  emoji: string; category: string; title: string; sub?: string; rating?: number;
  color: string; bg: string; borderColor: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className={cn("rounded-xl border p-4 text-left hover:shadow-md transition-all w-full", bg, borderColor)}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{emoji}</span>
        <span className={cn("text-xs font-semibold uppercase tracking-wide", color)}>{category}</span>
      </div>
      <p className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">{title}</p>
      {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sub}</p>}
      {rating && rating > 0 ? (
        <div className="flex gap-0.5 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={i < rating ? "text-yellow-400 text-sm" : "text-gray-300 dark:text-gray-600 text-sm"}>★</span>
          ))}
        </div>
      ) : null}
    </button>
  );
}
