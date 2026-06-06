export type GameStatus = "playing" | "completed" | "wishlist" | "never_played";

export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url: string;
  img_logo_url?: string;
  status?: GameStatus;
  achievements_done?: number;
  achievements_total?: number;
}

export interface SteamGamesResponse {
  response: {
    game_count: number;
    games: SteamGame[];
  };
}

export interface MobileGame {
  id: number;
  title: string;
  platform: string;
  genre: string[];
  status: "playing" | "completed" | "wishlist";
  cover_url?: string | null;
  description?: string | null;
  developer?: string | null;
  release_year?: number | null;
  personal_rating?: number | null;
  review?: string | null;
  hours_played?: number;
  created_at?: string;
}

// ─── Watch & Read (Notion → TMDB) ─────────────────────────────────────────────
export type WatchReadCategory =
  | "Movie"
  | "Anime"
  | "Manhwa"
  | "Donghua"
  | "Manga"
  | "Cartoon";

export type WatchReadStatus =
  | "watching"
  | "reading"
  | "completed"
  | "paused"
  | "dropped"
  | "plan_to_watch";

export interface WatchReadItem {
  id: string;
  title: string;
  category: WatchReadCategory;
  status: WatchReadStatus;
  progress?: string | null;
  personal_rating?: number | null;
  notes?: string | null;
  tmdb_id?: number | null;
  tmdb_poster?: string | null;
  tmdb_overview?: string | null;
  tmdb_rating?: number | null;
  tmdb_loading?: boolean;
  tmdb_error?: boolean;
}

// ─── Movies / AnimeSeries kept for backwards compat in DashboardSection ───────
export type MovieStatus = "watched" | "watching" | "wishlist";
export interface LocalMovie {
  title: string;
  status: MovieStatus;
  personal_rating: number;
  review?: string;
  watched_date?: string;
}
export interface TMDBMovie {
  id: number;
  title: string;
  release_date: string;
  overview: string;
  poster_path: string | null;
  vote_average: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
}
export interface EnrichedMovie extends LocalMovie {
  tmdb?: TMDBMovie;
  loading?: boolean;
  error?: boolean;
}
export type SeriesStatus = "completed" | "ongoing" | "wishlist";
export interface AnimeSeries {
  id: number;
  title: string;
  original_title?: string;
  type: "anime" | "series";
  total_episodes?: number;
  total_seasons?: number;
  status: SeriesStatus;
  personal_rating: number;
  review?: string;
  genres: string[];
  studio?: string;
  network?: string;
  poster_path?: string | null;
  tmdb_id?: number;
}

// ─── Music / Spotify ─────────────────────────────────────────────────────────
export interface SpotifyPlaylist {
  id: string;
  name: string;
  description?: string;
  track_count: number;
  mood_labels: string[];
  cover_url?: string;
  embed_url: string;
}

export interface MusicTrack {
  id: number;
  title: string;
  artist: string;
  spotify_track_id?: string | null;
  notes?: string | null;
  spotify_embed_url?: string | null;
  loading?: boolean;
  error?: boolean;
}

export interface CustomAlbum {
  id: number;
  name: string;
  description?: string | null;
  cover_url?: string | null;
  tracks?: MusicTrack[];
}

// ─── Books ────────────────────────────────────────────────────────────────────
export type BookStatus = "finished" | "wishlist" | "favorite" | "reading";

export interface SupabaseBook {
  id: number;
  title: string;
  author: string;
  isbn?: string | null;
  open_library_key?: string | null;
  status: BookStatus;
  personal_rating?: number | null;
  review?: string | null;
  genre: string[];
  year?: number | null;
  pages?: number | null;
  cover_url?: string | null;
  ol_description?: string | null;
  ol_loading?: boolean;
  ol_error?: boolean;
}

// LocalBook kept for type compat
export type LocalBook = SupabaseBook;

// ─── Collections (deprecated / kept for type compat) ─────────────────────────
export type CollectionCondition = "mint" | "good" | "used";
export type CollectionCategory =
  | "Action Figure"
  | "Board Game"
  | "Merchandise"
  | "Funko Pop"
  | "Trading Card"
  | "Lainnya";
export interface CollectionItem {
  id: number;
  name: string;
  category: CollectionCategory;
  year_acquired: number;
  condition: CollectionCondition;
  description: string;
  estimated_value?: string;
  image_url?: string;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export interface EntertainmentStats {
  total_games: number;
  total_hours: number;
  total_watchread: number;
  total_playlists: number;
  total_books_read: number;
}

// ─── Tab navigation ───────────────────────────────────────────────────────────
export type EntertainmentTab =
  | "dashboard"
  | "games"
  | "watchread"
  | "music"
  | "books";
