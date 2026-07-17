import type {
  AnimeSeries,
  CollectionItem,
  LocalBook,
  LocalMovie,
  SpotifyPlaylist,
} from "@/types/entertainment"

// These collections stay empty until Xiaodudu adds personal entries. Keeping
// sample preferences here would incorrectly attribute the original author's
// watch history, books, and physical collection to the current owner.
export const LOCAL_MOVIES: LocalMovie[] = []
export const ANIME_SERIES_DATA: AnimeSeries[] = []
export const SPOTIFY_PLAYLISTS: SpotifyPlaylist[] = []
export const BOOKS_DATA: LocalBook[] = []
export const COLLECTIONS_DATA: CollectionItem[] = []
