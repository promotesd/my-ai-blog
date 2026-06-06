"use client";

import { useEffect, useState } from "react";
import { Gamepad2, Clock, Trophy, Search, X, Monitor, Smartphone } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { fetchSteamGames, steamHeaderUrl, formatPlaytime } from "@/lib/entertainmentApi";
import { SteamGame, MobileGame } from "@/types/entertainment";
import { GAME_MANUAL_DATA, STEAM_GAMES_FALLBACK } from "@/data/entertainmentData";
import { GameCardSkeleton } from "./EntertainmentSkeletons";

// ── Enrich all Steam games with manual override data, force status=playing ────
function enrichGame(game: SteamGame): SteamGame {
  const manual = GAME_MANUAL_DATA[game.appid];
  return {
    ...game,
    ...(manual ?? {}),
    status: "playing" as const,
    achievements_done: manual?.achievements_done ?? game.achievements_done,
    achievements_total: manual?.achievements_total ?? game.achievements_total,
  };
}

// ── PC Games (Steam) ─────────────────────────────────────────────────────────
function PCGamesTab({ globalSearch }: { globalSearch?: string }) {
  const t = useTranslations("entertainment");
  const [games, setGames] = useState<SteamGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    fetchSteamGames()
      .then((data) => setGames((data.length > 0 ? data : STEAM_GAMES_FALLBACK).map(enrichGame)))
      .catch(() => { setGames(STEAM_GAMES_FALLBACK.map(enrichGame)); setError(true); })
      .finally(() => setLoading(false));
  }, []);

  const activeSearch = globalSearch || search;
  const filtered = games
    .filter((g) => activeSearch.trim() ? g.name.toLowerCase().includes(activeSearch.toLowerCase()) : true)
    .sort((a, b) => b.playtime_forever - a.playtime_forever);

  const totalHours = Math.floor(games.reduce((s, g) => s + g.playtime_forever, 0) / 60);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <Gamepad2 size={16} />, label: t("stat_total_games"), value: games.length, color: "text-blue-500" },
          { icon: <Clock size={16} />, label: t("stat_total_hours"), value: `${totalHours}j`, color: "text-green-500" },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 p-4 flex items-center gap-3">
            <span className={cn("p-2 rounded-lg bg-gray-100 dark:bg-gray-700/60", color)}>{icon}</span>
            <div><p className="text-xs text-gray-500 dark:text-gray-400">{label}</p><p className="font-bold text-gray-900 dark:text-white">{value}</p></div>
          </div>
        ))}
      </div>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search_game")} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accentColor/40 transition" />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
      </div>
      {error && <div className="rounded-xl border border-yellow-200 dark:border-yellow-800/50 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-300">{t("steam_error")}</div>}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">{Array.from({ length: 15 }).map((_, i) => <GameCardSkeleton key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400"><Gamepad2 size={48} className="mx-auto mb-3 opacity-30" /><p>{t("no_games")}</p></div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.slice(0, visibleCount).map((game) => <PCGameCard key={game.appid} game={game} />)}
          </div>
          {visibleCount < filtered.length && (
            <div className="text-center">
              <button onClick={() => setVisibleCount((v) => v + 20)} className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-sm text-gray-700 dark:text-gray-300 hover:border-accentColor hover:text-accentColor transition">
                {t("load_more_n").replace("{n}", String(filtered.length - visibleCount))}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PCGameCard({ game }: { game: SteamGame }) {
  const t = useTranslations("entertainment");
  const [imgError, setImgError] = useState(false);
  return (
    <div className="group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 hover:border-accentColor/60 hover:shadow-lg transition-all duration-300">
      <div className="relative w-full aspect-[46/21] bg-gray-100 dark:bg-gray-700 overflow-hidden">
        {!imgError ? (
          <Image src={steamHeaderUrl(game.appid)} alt={game.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" onError={() => setImgError(true)} unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900"><Gamepad2 size={28} className="text-gray-500" /></div>
        )}
        <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">🎮 Playing</span>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2 mb-1">{game.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{game.playtime_forever > 0 ? `⏱ ${formatPlaytime(game.playtime_forever)}` : t("game_never_played_short")}</p>
        {game.achievements_total && game.achievements_total > 0 && (
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-gray-400 mb-0.5"><span>Achievement</span><span>{game.achievements_done ?? 0}/{game.achievements_total}</span></div>
            <div className="h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"><div className="h-full rounded-full bg-accentColor transition-all" style={{ width: `${((game.achievements_done ?? 0) / game.achievements_total) * 100}%` }} /></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mobile / Other Games (Supabase) ──────────────────────────────────────────
function MobileGamesTab({ globalSearch }: { globalSearch?: string }) {
  const t = useTranslations("entertainment");
  const [games, setGames] = useState<MobileGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/mobile-games").then((r) => r.json()).then((d) => setGames(d.games ?? [])).catch(() => setGames([])).finally(() => setLoading(false));
  }, []);

  const activeSearch = globalSearch || search;
  const filtered = games.filter((g) => activeSearch.trim() ? g.title.toLowerCase().includes(activeSearch.toLowerCase()) : true);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 p-4 flex items-center gap-3">
          <span className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/60 text-purple-500"><Smartphone size={16} /></span>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">{t("stat_total_games")}</p><p className="font-bold text-gray-900 dark:text-white">{games.length}</p></div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 p-4 flex items-center gap-3">
          <span className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/60 text-blue-500"><Trophy size={16} /></span>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">{t("stat_playing")}</p><p className="font-bold text-gray-900 dark:text-white">{games.filter(g => g.status === "playing").length}</p></div>
        </div>
      </div>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search_game")} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accentColor/40 transition" />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
      </div>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{Array.from({ length: 6 }).map((_, i) => <GameCardSkeleton key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400"><Smartphone size={48} className="mx-auto mb-3 opacity-30" /><p>{t("no_games")}</p></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((game) => <MobileGameCard key={game.id} game={game} />)}
        </div>
      )}
    </div>
  );
}

function MobileGameCard({ game }: { game: MobileGame }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className="group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 hover:border-accentColor/60 hover:shadow-lg transition-all duration-300">
      <div className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
        {game.cover_url && !imgErr ? (
          <Image src={game.cover_url} alt={game.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" onError={() => setImgErr(true)} unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Smartphone size={32} className="text-gray-400" /></div>
        )}
        <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">🎮 Playing</span>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">{game.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{game.platform}</p>
        {game.hours_played ? <p className="text-xs text-gray-400 mt-1">⏱ {game.hours_played}j</p> : null}
        {game.genre.slice(0, 2).map((g) => (
          <span key={g} className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 mr-1 mt-1">{g}</span>
        ))}
      </div>
    </div>
  );
}

// ── Main Section with Sub-tabs ────────────────────────────────────────────────
type GameSubTab = "pc" | "mobile";

export default function GamesSection({ globalSearch }: { globalSearch?: string }) {
  const t = useTranslations("entertainment");
  const [subTab, setSubTab] = useState<GameSubTab>("pc");

  const SUB_TABS = [
    { id: "pc" as const, label: t("games_sub_pc"), icon: <Monitor size={14} /> },
    { id: "mobile" as const, label: t("games_sub_mobile"), icon: <Smartphone size={14} /> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {SUB_TABS.map((tab) => (
          <button key={tab.id} onClick={() => setSubTab(tab.id)} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all", subTab === tab.id ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200")}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>
      {subTab === "pc" && <PCGamesTab globalSearch={globalSearch} />}
      {subTab === "mobile" && <MobileGamesTab globalSearch={globalSearch} />}
    </div>
  );
}
