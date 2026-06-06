import { SteamGame, TMDBMovie } from "@/types/entertainment";

// ─── Config ──────────────────────────────────────────────────────────────────
const STEAM_API_KEY = process.env.NEXT_PUBLIC_STEAM_API_KEY ?? "";
const STEAM_ID = process.env.NEXT_PUBLIC_STEAM_ID ?? "";
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY ?? "";
const GOOGLE_BOOKS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY ?? "";

// ─── Steam ───────────────────────────────────────────────────────────────────
export async function fetchSteamGames(): Promise<SteamGame[]> {
  // Steam API blocks browser-side CORS, so we route through our own Next.js API
  const res = await fetch(`/api/steam-games`);
  if (!res.ok) throw new Error("Steam API error");
  const data = await res.json();
  return (data.response?.games ?? []) as SteamGame[];
}

// ─── TMDB ────────────────────────────────────────────────────────────────────
export async function searchTMDBMovie(title: string): Promise<TMDBMovie | null> {
  if (!TMDB_API_KEY) return null;
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=id-ID`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results?.length) return null;
    const movie = data.results[0] as TMDBMovie;
    // Fetch full detail for genres
    const detail = await fetchTMDBMovieDetail(movie.id);
    return detail ?? movie;
  } catch {
    return null;
  }
}

export async function fetchTMDBMovieDetail(id: number): Promise<TMDBMovie | null> {
  if (!TMDB_API_KEY) return null;
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&language=id-ID`
    );
    if (!res.ok) return null;
    return (await res.json()) as TMDBMovie;
  } catch {
    return null;
  }
}

export async function searchTMDBTV(title: string): Promise<{
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  vote_average: number;
  genres?: { id: number; name: string }[];
  number_of_episodes?: number;
  number_of_seasons?: number;
  networks?: { name: string }[];
} | null> {
  if (!TMDB_API_KEY) return null;
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=id-ID`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results?.length) return null;
    const tv = data.results[0];
    // Fetch full detail
    const detailRes = await fetch(
      `https://api.themoviedb.org/3/tv/${tv.id}?api_key=${TMDB_API_KEY}&language=id-ID`
    );
    if (!detailRes.ok) return tv;
    return await detailRes.json();
  } catch {
    return null;
  }
}

export function tmdbPosterUrl(path: string | null | undefined, size = "w342"): string {
  if (!path) return "/placeholder-poster.png";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

// ─── Google Books ─────────────────────────────────────────────────────────────
export async function fetchGoogleBook(
  title: string,
  author?: string
): Promise<{ thumbnail?: string; google_books_id?: string; pages?: number; year?: number } | null> {
  try {
    const q = author ? `${title}+inauthor:${author}` : title;
    const url = GOOGLE_BOOKS_API_KEY
      ? `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&key=${GOOGLE_BOOKS_API_KEY}`
      : `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return null;
    const info = item.volumeInfo;
    return {
      thumbnail: info.imageLinks?.thumbnail?.replace("http://", "https://"),
      google_books_id: item.id,
      pages: info.pageCount,
      year: info.publishedDate ? parseInt(info.publishedDate.substring(0, 4)) : undefined,
    };
  } catch {
    return null;
  }
}

// ─── Steam CDN ────────────────────────────────────────────────────────────────
export function steamLogoUrl(appid: number, img_icon_url: string): string {
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${img_icon_url}.jpg`;
}

export function steamHeaderUrl(appid: number): string {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;
}

// ─── Format helpers ───────────────────────────────────────────────────────────
export function formatPlaytime(minutes: number): string {
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  return `${hours} jam`;
}

// ─── Open Library ─────────────────────────────────────────────────────────────
export interface OpenLibraryResult {
  cover_url: string | null;
  description: string | null;
  open_library_key: string | null;
  pages: number | null;
  year: number | null;
}

export async function fetchOpenLibraryBook(
  title: string,
  author?: string
): Promise<OpenLibraryResult | null> {
  try {
    const q = author
      ? `title:${encodeURIComponent(title)}+author:${encodeURIComponent(author)}`
      : `title:${encodeURIComponent(title)}`;
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${q}&limit=1&fields=key,cover_i,number_of_pages_median,first_publish_year`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const doc = data.docs?.[0];
    if (!doc) return null;
    const coverId = doc.cover_i;
    return {
      cover_url: coverId
        ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
        : null,
      description: null, // requires separate works API call
      open_library_key: doc.key ?? null,
      pages: doc.number_of_pages_median ?? null,
      year: doc.first_publish_year ?? null,
    };
  } catch {
    return null;
  }
}

// ─── TMDB for WatchRead (generic search) ────────────────────────────────────
export async function searchTMDBByTitle(
  title: string,
  category: string
): Promise<{
  id: number;
  poster_url: string | null;
  overview: string;
  vote_average: number;
} | null> {
  if (!TMDB_API_KEY) return null;
  // TV-type categories: Anime, Cartoon, Donghua/Donhua
  const tvCategories = ["Anime", "Cartoon", "Donghua", "Donhua"];
  const endpoint = tvCategories.includes(category)
    ? "tv"
    : category === "Movie"
    ? "movie"
    : "multi";
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=id-ID`,
      {}
    );
    if (!res.ok) return null;
    const data = await res.json();
    const hit = data.results?.[0];
    if (!hit) return null;
    const posterPath: string | null = hit.poster_path ?? null;
    return {
      id: hit.id,
      poster_url: posterPath ? `https://image.tmdb.org/t/p/w342${posterPath}` : null,
      overview: hit.overview ?? "",
      vote_average: hit.vote_average ?? 0,
    };
  } catch {
    return null;
  }
}
