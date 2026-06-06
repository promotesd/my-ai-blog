"use client";

import { useEffect, useState, useRef } from "react";
import { Music, Headphones, ExternalLink, List, Album, Search, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { MusicTrack, CustomAlbum } from "@/types/entertainment";

type MusicSubTab = "tracks" | "albums";

// Resolve Spotify embed URL: use stored ID or search via API
async function resolveSpotifyEmbed(track: MusicTrack): Promise<string | null> {
  if (track.spotify_track_id) {
    return `https://open.spotify.com/embed/track/${track.spotify_track_id}`;
  }
  try {
    const res = await fetch(`/api/spotify-search?q=${encodeURIComponent(`${track.title} ${track.artist}`)}`);
    const data = await res.json();
    if (data.track_id) return `https://open.spotify.com/embed/track/${data.track_id}`;
  } catch {
    // ignore
  }
  return null;
}

export default function MusicSection() {
  const t = useTranslations("entertainment");
  const [subTab, setSubTab] = useState<MusicSubTab>("tracks");
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [albums, setAlbums] = useState<CustomAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTrack, setActiveTrack] = useState<MusicTrack | null>(null);
  const [activeAlbum, setActiveAlbum] = useState<CustomAlbum | null>(null);
  const [search, setSearch] = useState("");
  const resolvedRef = useRef(new Set<number>());

  useEffect(() => {
    fetch("/api/music-data")
      .then((r) => r.json())
      .then((d) => {
        const newTracks: MusicTrack[] = (d.tracks ?? []).map((tr: MusicTrack) => ({ ...tr, loading: true }));
        const a: CustomAlbum[] = d.albums ?? [];
        setTracks(newTracks);
        setAlbums(a);
        if (newTracks.length) setActiveTrack(newTracks[0]);
        if (a.length) setActiveAlbum(a[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Resolve Spotify embeds lazily
  useEffect(() => {
    tracks.forEach(async (track) => {
      if (resolvedRef.current.has(track.id)) return;
      resolvedRef.current.add(track.id);
      const embedUrl = await resolveSpotifyEmbed(track);
      setTracks((prev) =>
        prev.map((t) => t.id === track.id ? { ...t, spotify_embed_url: embedUrl, loading: false } : t)
      );
    });
  }, [tracks.length]);

  const filtered = tracks.filter((tr) =>
    search.trim()
      ? tr.title.toLowerCase().includes(search.toLowerCase()) ||
        tr.artist.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const SUB_TABS = [
    { id: "tracks" as const, label: t("music_sub_tracks"), icon: <List size={14} /> },
    { id: "albums" as const, label: t("music_sub_albums"), icon: <Album size={14} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { icon: "🎵", label: t("stat_total_tracks"),   value: tracks.length },
          { icon: "💿", label: t("stat_total_albums"),   value: albums.length },
          { icon: "🎧", label: t("stat_total_playlists"), value: albums.length },
        ].map(({ icon, label, value }) => (
          <div key={label} className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 p-4 flex items-center gap-3">
            <span className="text-xl">{icon}</span>
            <div><p className="text-xs text-gray-500 dark:text-gray-400">{label}</p><p className="font-bold text-gray-900 dark:text-white">{value}</p></div>
          </div>
        ))}
      </div>

      {/* Sub-tab */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {SUB_TABS.map((tab) => (
          <button key={tab.id} onClick={() => setSubTab(tab.id)} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all", subTab === tab.id ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200")}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-accentColor" /></div>
      ) : subTab === "tracks" ? (
        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          {/* Track list */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Headphones size={16} className="text-accentColor" />{t("my_tracks")}
            </h3>
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search_track")} className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accentColor/40 transition" />
              {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={12} /></button>}
            </div>
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
              {filtered.map((tr) => (
                <button key={tr.id} onClick={() => setActiveTrack(tr)} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all", activeTrack?.id === tr.id ? "border-accentColor/60 bg-accentColor/5 dark:bg-accentColor/10" : "border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 hover:border-accentColor/40")}>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-800 flex items-center justify-center flex-shrink-0">
                    <Music size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{tr.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{tr.artist}</p>
                  </div>
                  {tr.loading && <Loader2 size={12} className="animate-spin text-gray-400 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Spotify embed */}
          <div className="space-y-4">
            {activeTrack ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{activeTrack.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{activeTrack.artist}</p>
                  </div>
                  {activeTrack.spotify_embed_url && (
                    <a href={activeTrack.spotify_embed_url.replace("/embed/", "/")} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 hover:underline">
                      <ExternalLink size={13} /> {t("open_in_spotify")}
                    </a>
                  )}
                </div>
                {activeTrack.loading ? (
                  <div className="flex justify-center items-center h-48 rounded-2xl border border-gray-200 dark:border-gray-700/50"><Loader2 size={24} className="animate-spin text-accentColor" /></div>
                ) : activeTrack.spotify_embed_url ? (
                  <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700/50 shadow-sm">
                    <iframe src={activeTrack.spotify_embed_url} width="100%" height="152" frameBorder="0" allowTransparency allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title={activeTrack.title} className="block" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 rounded-2xl border border-gray-200 dark:border-gray-700/50 text-gray-400">
                    <Music size={40} className="opacity-30 mb-2" />
                    <p className="text-sm">{t("spotify_not_found")}</p>
                  </div>
                )}
                {activeTrack.notes && <p className="text-sm text-gray-500 dark:text-gray-400 italic">“{activeTrack.notes}”</p>}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <Music size={40} className="opacity-30 mb-2" />
                <p className="text-sm">{t("select_track")}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Albums */
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Album list */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("custom_albums")}</h3>
            {albums.map((album) => (
              <button key={album.id} onClick={() => setActiveAlbum(album)} className={cn("w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all", activeAlbum?.id === album.id ? "border-accentColor/60 bg-accentColor/5 dark:bg-accentColor/10" : "border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 hover:border-accentColor/40")}>
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-green-500 to-green-800 flex-shrink-0">
                  {album.cover_url ? (
                    <Image src={album.cover_url} alt={album.name} fill className="object-cover" unoptimized />
                  ) : (
                    <Music size={20} className="absolute inset-0 m-auto text-white/80" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{album.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{album.tracks?.length ?? 0} {t("tracks_word")}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Album tracks with embeds */}
          <div className="space-y-4">
            {activeAlbum ? (
              <>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{activeAlbum.name}</h3>
                  {activeAlbum.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{activeAlbum.description}</p>}
                </div>
                <div className="space-y-3">
                  {(activeAlbum.tracks ?? []).map((tr) => {
                    const resolved = tracks.find((t) => t.id === tr.id);
                    const embedUrl = resolved?.spotify_embed_url;
                    return embedUrl ? (
                      <div key={tr.id} className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700/50">
                        <iframe src={embedUrl} width="100%" height="80" frameBorder="0" allowTransparency allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title={tr.title} className="block" />
                      </div>
                    ) : (
                      <div key={tr.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-800 flex items-center justify-center flex-shrink-0">
                          <Music size={14} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{tr.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{tr.artist}</p>
                        </div>
                        {resolved?.loading && <Loader2 size={12} className="animate-spin text-gray-400 ml-auto" />}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <Music size={40} className="opacity-30 mb-2" />
                <p className="text-sm">{t("select_album")}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
