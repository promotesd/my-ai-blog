import {
  LocalMovie,
  AnimeSeries,
  SpotifyPlaylist,
  LocalBook,
  CollectionItem,
  SteamGame,
  GameStatus,
} from "@/types/entertainment";

// ─── Game manual status overrides ─────────────────────────────────────────────
// Map: appid → { status, achievements_done, achievements_total }
export const GAME_MANUAL_DATA: Record<
  number,
  { status?: GameStatus; achievements_done?: number; achievements_total?: number }
> = {
  730: { status: "playing", achievements_done: 12, achievements_total: 167 },      // CS2
  570: { status: "playing", achievements_done: 5, achievements_total: 520 },       // Dota 2
  1172470: { status: "completed", achievements_done: 50, achievements_total: 50 }, // Apex Legends
  292030: { status: "completed", achievements_done: 78, achievements_total: 78 },  // Witcher 3
  1245620: { status: "wishlist" },                                                  // Elden Ring placeholder
};

// Steam fallback data (shown when API key is unavailable)
export const STEAM_GAMES_FALLBACK: SteamGame[] = [
  {
    appid: 730,
    name: "Counter-Strike 2",
    playtime_forever: 4320,
    img_icon_url: "d0595ff02f5c79fd19b06f4d6165c3fda2372520",
    status: "playing",
    achievements_done: 12,
    achievements_total: 167,
  },
  {
    appid: 570,
    name: "Dota 2",
    playtime_forever: 8900,
    img_icon_url: "0bbb630d63262dd66d2fdd0f7d37e8661a410075",
    status: "playing",
    achievements_done: 5,
    achievements_total: 520,
  },
  {
    appid: 292030,
    name: "The Witcher 3: Wild Hunt",
    playtime_forever: 3600,
    img_icon_url: "4b2e1f67c0f9ea54c0e3cd3ead9a4a8dcdab8440",
    status: "completed",
    achievements_done: 78,
    achievements_total: 78,
  },
  {
    appid: 1245620,
    name: "Elden Ring",
    playtime_forever: 0,
    img_icon_url: "",
    status: "wishlist",
  },
  {
    appid: 1172470,
    name: "Apex Legends",
    playtime_forever: 1200,
    img_icon_url: "",
    status: "completed",
    achievements_done: 50,
    achievements_total: 50,
  },
  {
    appid: 881020,
    name: "Squad",
    playtime_forever: 540,
    img_icon_url: "",
    status: "playing",
  },
  {
    appid: 2358720,
    name: "The Finals",
    playtime_forever: 960,
    img_icon_url: "",
    status: "playing",
  },
  {
    appid: 1623730,
    name: "Palworld",
    playtime_forever: 0,
    img_icon_url: "",
    status: "never_played",
  },
];

// ─── Movies ───────────────────────────────────────────────────────────────────
export const LOCAL_MOVIES: LocalMovie[] = [
  { title: "Interstellar", status: "watched", personal_rating: 5, review: "Film terbaik sepanjang masa bagi saya", watched_date: "2023-08-15" },
  { title: "Inception", status: "watched", personal_rating: 5, review: "Mind-blowing, nonton berkali-kali masih seru", watched_date: "2022-12-10" },
  { title: "The Dark Knight", status: "watched", personal_rating: 5, review: "Joker karakter terbaik superhero movie", watched_date: "2023-02-20" },
  { title: "Avengers: Endgame", status: "watched", personal_rating: 4, review: "Epic finale MCU, tapi agak dragged", watched_date: "2023-05-01" },
  { title: "Spider-Man: No Way Home", status: "watched", personal_rating: 5, review: "Nostalgia banget, momen Andrew Garfield terbaik", watched_date: "2022-01-03" },
  { title: "Dune: Part Two", status: "watched", personal_rating: 4, review: "Visually stunning, world-building solid", watched_date: "2024-03-10" },
  { title: "Oppenheimer", status: "watched", personal_rating: 5, review: "Karya Nolan yang paling matang", watched_date: "2023-07-20" },
  { title: "Everything Everywhere All at Once", status: "watched", personal_rating: 5, review: "Surreal, emosional, orisinil banget", watched_date: "2023-04-05" },
  { title: "The Shawshank Redemption", status: "wishlist", personal_rating: 0, review: "" },
  { title: "Parasite", status: "watched", personal_rating: 4, review: "Satire kelas sosial yang sangat cerdas", watched_date: "2023-09-12" },
  { title: "Your Name", status: "watched", personal_rating: 5, review: "Anime film yang mengharukan, visual cantik", watched_date: "2023-03-18" },
  { title: "Weathering With You", status: "watched", personal_rating: 4, review: "Visual Makoto Shinkai selalu memukau", watched_date: "2023-03-20" },
  { title: "Godzilla x Kong: The New Empire", status: "watched", personal_rating: 3, review: "Tontonan fun, jangan expect lebih", watched_date: "2024-04-05" },
  { title: "Deadpool & Wolverine", status: "watching", personal_rating: 4, review: "Lucu parah, Ryan Reynolds memang terbaik", watched_date: "2024-07-28" },
  { title: "A Quiet Place", status: "watched", personal_rating: 4, review: "Tension-nya luar biasa sepanjang film", watched_date: "2022-11-05" },
];

// ─── Anime & Series ───────────────────────────────────────────────────────────
export const ANIME_SERIES_DATA: AnimeSeries[] = [
  {
    id: 1, title: "Attack on Titan", original_title: "Shingeki no Kyojin",
    type: "anime", total_episodes: 94, total_seasons: 4,
    status: "completed", personal_rating: 5,
    review: "Masterpiece. Plot twist terbaik dalam anime.",
    genres: ["Action", "Drama", "Fantasy"], studio: "MAPPA / Wit Studio",
  },
  {
    id: 2, title: "Demon Slayer", original_title: "Kimetsu no Yaiba",
    type: "anime", total_episodes: 55, total_seasons: 4,
    status: "ongoing", personal_rating: 4,
    review: "Animasi ufotable memang tidak ada duanya.",
    genres: ["Action", "Supernatural"], studio: "ufotable",
  },
  {
    id: 3, title: "Jujutsu Kaisen", original_title: "Jujutsu Kaisen",
    type: "anime", total_episodes: 47, total_seasons: 2,
    status: "ongoing", personal_rating: 5,
    review: "Gojo Satoru OP, action-nya gila-gilaan.",
    genres: ["Action", "Supernatural"], studio: "MAPPA",
  },
  {
    id: 4, title: "One Piece", original_title: "One Piece",
    type: "anime", total_episodes: 1000, total_seasons: 20,
    status: "ongoing", personal_rating: 5,
    review: "Legenda. World-building terluas dalam anime.",
    genres: ["Adventure", "Fantasy", "Comedy"], studio: "Toei Animation",
  },
  {
    id: 5, title: "Fullmetal Alchemist: Brotherhood", original_title: "Hagane no Renkinjutsushi: Fullmetal Alchemist",
    type: "anime", total_episodes: 64, total_seasons: 1,
    status: "completed", personal_rating: 5,
    review: "Perfect pacing, perfect ending. Top 1 anime all time.",
    genres: ["Action", "Adventure", "Drama"], studio: "Bones",
  },
  {
    id: 6, title: "Breaking Bad", original_title: "Breaking Bad",
    type: "series", total_episodes: 62, total_seasons: 5,
    status: "completed", personal_rating: 5,
    review: "TV series terbaik yang pernah saya tonton.",
    genres: ["Drama", "Crime", "Thriller"], network: "AMC",
  },
  {
    id: 7, title: "Squid Game", original_title: "오징어 게임",
    type: "series", total_episodes: 9, total_seasons: 1,
    status: "completed", personal_rating: 4,
    review: "Konsep unik, sangat intens. Season 1 jauh lebih baik dari Season 2.",
    genres: ["Drama", "Thriller", "Survival"], network: "Netflix",
  },
  {
    id: 8, title: "Chainsaw Man", original_title: "Chainsaw Man",
    type: "anime", total_episodes: 12, total_seasons: 2,
    status: "ongoing", personal_rating: 4,
    review: "Gore + dark humor yang pas. Animasi MAPPA puncak.",
    genres: ["Action", "Dark Fantasy"], studio: "MAPPA",
  },
  {
    id: 9, title: "Vinland Saga", original_title: "Vinland Saga",
    type: "anime", total_episodes: 48, total_seasons: 2,
    status: "completed", personal_rating: 5,
    review: "Coming of age paling matang dalam anime. Thorfinn arc growth luar biasa.",
    genres: ["Action", "Adventure", "Historical"], studio: "Wit Studio / MAPPA",
  },
  {
    id: 10, title: "Spy x Family", original_title: "Spy x Family",
    type: "anime", total_episodes: 37, total_seasons: 2,
    status: "ongoing", personal_rating: 4,
    review: "Slice of life + comedy + action yang seimbang. Anya lucu banget.",
    genres: ["Action", "Comedy", "Slice of Life"], studio: "WIT Studio / CloverWorks",
  },
  {
    id: 11, title: "Arcane", original_title: "Arcane",
    type: "series", total_episodes: 18, total_seasons: 2,
    status: "completed", personal_rating: 5,
    review: "Best animated series. Art direction dan music luar biasa.",
    genres: ["Action", "Fantasy", "Drama"], network: "Netflix",
  },
  {
    id: 12, title: "Solo Leveling", original_title: "Ore Dake Level Up na Ken",
    type: "anime", total_episodes: 12, total_seasons: 1,
    status: "wishlist", personal_rating: 0,
    review: "",
    genres: ["Action", "Fantasy"], studio: "A-1 Pictures",
  },
];

// ─── Music / Spotify playlists ────────────────────────────────────────────────
export const SPOTIFY_PLAYLISTS: SpotifyPlaylist[] = [
  {
    id: "37i9dQZF1DXcBWIGoYBM5M",
    name: "Today's Top Hits",
    description: "Lagu-lagu populer yang suka diputar sehari-hari",
    track_count: 50,
    mood_labels: ["Pop", "Upbeat", "Trending"],
    embed_url: "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M",
    cover_url: "https://i.scdn.co/image/ab67706f00000003b0fe40a6e1692822353c3b73",
  },
  {
    id: "37i9dQZF1DX0XUsuxWHRQd",
    name: "RapCaviar",
    description: "Hip-hop & rap terbaik saat ini",
    track_count: 50,
    mood_labels: ["Hip-Hop", "Rap", "Urban"],
    embed_url: "https://open.spotify.com/embed/playlist/37i9dQZF1DX0XUsuxWHRQd",
    cover_url: "https://i.scdn.co/image/ab67706f00000003b46b2b15e1a9ad2a0a7b3d70",
  },
  {
    id: "37i9dQZF1DX4sWSpwq3LiO",
    name: "Peaceful Piano",
    description: "Untuk ngoding, fokus, dan relaksasi",
    track_count: 160,
    mood_labels: ["Classical", "Focus", "Chill"],
    embed_url: "https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO",
    cover_url: "https://i.scdn.co/image/ab67706f00000003df760e5552f4b09ac4c45f9e",
  },
  {
    id: "37i9dQZF1DXaXB8fQg7xof",
    name: "All Out 2010s",
    description: "Nostalgia hits dari era 2010an",
    track_count: 100,
    mood_labels: ["Nostalgia", "Pop", "Decade"],
    embed_url: "https://open.spotify.com/embed/playlist/37i9dQZF1DXaXB8fQg7xof",
    cover_url: "https://i.scdn.co/image/ab67706f00000003e435c6f5aa7c8d7c9c9c7b5e",
  },
];

// ─── Books ────────────────────────────────────────────────────────────────────
export const BOOKS_DATA: LocalBook[] = [
  {
    id: 1, title: "Atomic Habits", author: "James Clear",
    genre: ["Self-Help", "Productivity"], status: "finished",
    personal_rating: 5, review: "Perubahan kecil, dampak luar biasa. Buku wajib baca.",
    pages: 320,
  },
  {
    id: 2, title: "Clean Code", author: "Robert C. Martin",
    genre: ["Programming", "Software Engineering"], status: "finished",
    personal_rating: 5, review: "Panduan menulis kode yang bisa dibaca dan dipelihara.",
    pages: 464,
  },
  {
    id: 3, title: "The Pragmatic Programmer", author: "David Thomas",
    genre: ["Programming", "Career"], status: "finished",
    personal_rating: 4, review: "Mindset programmer profesional, timeless advice.",
    pages: 352,
  },
  {
    id: 4, title: "Deep Work", author: "Cal Newport",
    genre: ["Self-Help", "Productivity"], status: "finished",
    personal_rating: 5, review: "Mengubah cara saya bekerja. Fokus adalah kemampuan langka.",
    pages: 296,
  },
  {
    id: 5, title: "The Art of War", author: "Sun Tzu",
    genre: ["Strategy", "Classic"], status: "finished",
    personal_rating: 4, review: "Strategi yang berlaku di berbagai konteks kehidupan.",
    pages: 273,
  },
  {
    id: 6, title: "You Don't Know JS", author: "Kyle Simpson",
    genre: ["Programming", "JavaScript"], status: "reading",
    personal_rating: 4, review: "Deep dive JavaScript yang selama ini kuanggap sudah tahu.",
    pages: 278,
  },
  {
    id: 7, title: "Dune", author: "Frank Herbert",
    genre: ["Science Fiction", "Fantasy"], status: "wishlist",
    personal_rating: 0, review: "",
    pages: 896,
  },
  {
    id: 8, title: "The Hitchhiker's Guide to the Galaxy", author: "Douglas Adams",
    genre: ["Science Fiction", "Comedy"], status: "wishlist",
    personal_rating: 0, review: "",
    pages: 224,
  },
  {
    id: 9, title: "Designing Data-Intensive Applications", author: "Martin Kleppmann",
    genre: ["Programming", "System Design"], status: "reading",
    personal_rating: 5, review: "Wajib baca untuk memahami sistem backend skala besar.",
    pages: 616,
  },
];

// ─── Collections ──────────────────────────────────────────────────────────────
export const COLLECTIONS_DATA: CollectionItem[] = [
  {
    id: 1, name: "Funko Pop! Naruto", category: "Funko Pop",
    year_acquired: 2023, condition: "mint",
    description: "Funko Pop Naruto Uzumaki dengan Rasengan. Item pertama koleksi Funko.",
    estimated_value: "Rp 150.000",
  },
  {
    id: 2, name: "Funko Pop! Itachi Uchiha", category: "Funko Pop",
    year_acquired: 2023, condition: "mint",
    description: "Itachi versi Anbu. Favorit karena pose-nya keren.",
    estimated_value: "Rp 175.000",
  },
  {
    id: 3, name: "Action Figure Attack on Titan Levi", category: "Action Figure",
    year_acquired: 2022, condition: "good",
    description: "Figure Captain Levi skala 1/10. Detail ODM Gear-nya sangat detail.",
    estimated_value: "Rp 350.000",
  },
  {
    id: 4, name: "Catan Board Game", category: "Board Game",
    year_acquired: 2024, condition: "good",
    description: "Board game klasik untuk 3-4 pemain. Sering dimainkan bersama teman.",
    estimated_value: "Rp 450.000",
  },
  {
    id: 5, name: "Kaos Merchandise Valorant", category: "Merchandise",
    year_acquired: 2023, condition: "good",
    description: "Kaos resmi Valorant edisi Killjoy. Limited edition dari event.",
    estimated_value: "Rp 200.000",
  },
  {
    id: 6, name: "Gundam RX-78-2 Model Kit", category: "Action Figure",
    year_acquired: 2024, condition: "mint",
    description: "Master Grade 1/100 scale. Rakitnya 2 hari, hasilnya worth it banget.",
    estimated_value: "Rp 750.000",
  },
];
