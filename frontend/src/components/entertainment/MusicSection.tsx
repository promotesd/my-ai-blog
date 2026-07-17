"use client"

import { useEffect, useMemo, useState } from "react"
import { ExternalLink, Headphones, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FavoriteArtist {
  name: string
  english_name: string
  spotify_artist_id: string
  spotify_url?: string
}

const FALLBACK_ARTISTS: FavoriteArtist[] = [
  { name: "卢广仲", english_name: "Crowd Lu", spotify_artist_id: "2JBUyLiFvpFPWdZGqIGYLD" },
  { name: "周杰伦", english_name: "Jay Chou", spotify_artist_id: "2elBjNSdBE2Y3f0j1mjrql" },
  { name: "林俊杰", english_name: "JJ Lin", spotify_artist_id: "7Dx7RhX0mFuXhCOUgB01uM" },
  { name: "王力宏", english_name: "Leehom Wang", spotify_artist_id: "2F5W6Rsxwzg0plQ0w8dSyt" },
  { name: "郭静", english_name: "Claire Kuo", spotify_artist_id: "6OiFtK426XJWnOJ2HYlSbf" },
  { name: "梁静茹", english_name: "Fish Leong", spotify_artist_id: "3aIDSTKS9yH745GUQBxDcS" },
  { name: "陈奕迅", english_name: "Eason Chan", spotify_artist_id: "2QcZxAgcs2I1q7CtCkl6MI" },
  { name: "孙燕姿", english_name: "Stefanie Sun", spotify_artist_id: "0SIXZXJCAhNU8sxK0qm7hn" },
]

const ACCENTS = [
  "border-t-amber-400",
  "border-t-sky-500",
  "border-t-emerald-500",
  "border-t-violet-500",
  "border-t-cyan-500",
  "border-t-rose-500",
  "border-t-red-500",
  "border-t-lime-500",
]

export default function MusicSection() {
  const [query, setQuery] = useState("")
  const [artists, setArtists] = useState<FavoriteArtist[]>(FALLBACK_ARTISTS)

  useEffect(() => {
    let cancelled = false
    fetch("/api/music-data")
      .then((response) => {
        if (!response.ok) throw new Error("音乐接口请求失败")
        return response.json() as Promise<{ artists?: FavoriteArtist[] }>
      })
      .then((payload) => {
        if (!cancelled && payload.artists?.length) setArtists(payload.artists)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const visibleArtists = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return artists
    return artists.filter((artist) => `${artist.name} ${artist.english_name}`.toLowerCase().includes(keyword))
  }, [artists, query])

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 dark:border-gray-700 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-accentColor">
            <Headphones size={17} />
            小嘟嘟的常听歌手
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">喜欢的声音</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">每位歌手都可以直接浏览并播放多首热门歌曲。</p>
        </div>
        <label className="relative block w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索歌手" className="w-full rounded-md border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-900 outline-none focus:border-accentColor dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          {query && <button onClick={() => setQuery("")} aria-label="清空搜索" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"><X size={14} /></button>}
        </label>
      </header>

      {visibleArtists.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-500">没有找到对应的歌手</div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {visibleArtists.map((artist, index) => {
            const spotifyUrl = artist.spotify_url || `https://open.spotify.com/artist/${artist.spotify_artist_id}`
            return (
              <article key={artist.spotify_artist_id} className={cn("overflow-hidden rounded-lg border border-t-4 border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800/50", ACCENTS[index % ACCENTS.length])}>
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-gray-900 dark:text-white">{artist.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{artist.english_name}</p>
                  </div>
                  <a href={spotifyUrl} target="_blank" rel="noreferrer" aria-label={`在 Spotify 打开 ${artist.name}`} title="在 Spotify 打开" className="rounded-md p-2 text-gray-400 transition hover:bg-gray-100 hover:text-accentColor dark:hover:bg-gray-700">
                    <ExternalLink size={16} />
                  </a>
                </div>
                <iframe
                  title={`${artist.name} Spotify 热门歌曲`}
                  src={`https://open.spotify.com/embed/artist/${artist.spotify_artist_id}?utm_source=generator&theme=0`}
                  width="100%"
                  height="352"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="block border-0"
                />
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
