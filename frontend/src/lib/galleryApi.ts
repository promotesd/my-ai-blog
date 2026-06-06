/**
 * galleryApi.ts
 *
 * Fetches gallery photos, albums, and guest profiles from Supabase.
 * Converts snake_case DB columns → camelCase TypeScript types.
 */

import { supabase } from "@/lib/supabase"
import { GalleryPhoto, GalleryAlbum, GalleryOwnerType, GalleryGuest } from "@/types/gallery"

// ── Row types (raw from Supabase) ────────────────────────────────────────────

interface GalleryPhotoRow {
  id: number
  title: string
  description: string
  location: string
  date: string
  year: number
  category: string
  album: string
  album_slug: string
  device: string
  image_url: string
  thumbnail_url: string
  width: number
  height: number
  is_featured: boolean
  tags: string[]
  owner_type: GalleryOwnerType
  uploader_name: string | null
  guest_id: number | null
}

interface GalleryAlbumRow {
  slug: string
  name: string
  description: string
  category: string
  cover_url: string
  period: string
  photo_count: number
  owner_type: GalleryOwnerType
  guest_id: number | null
}

interface GalleryGuestRow {
  id: number
  name: string
  avatar_url: string | null
  album_count: number
  photo_count: number
  created_at: string
}

// ── Mappers ──────────────────────────────────────────────────────────────────

function mapPhoto(row: GalleryPhotoRow): GalleryPhoto {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    date: row.date,
    year: row.year,
    category: row.category as GalleryPhoto["category"],
    album: row.album,
    albumSlug: row.album_slug,
    device: row.device,
    imageUrl: row.image_url,
    thumbnailUrl: row.thumbnail_url,
    width: row.width,
    height: row.height,
    isFeatured: row.is_featured,
    tags: row.tags ?? [],
    ownerType: row.owner_type,
    uploaderName: row.uploader_name,
    guestId: row.guest_id,
  }
}

function mapAlbum(row: GalleryAlbumRow): GalleryAlbum {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category as GalleryAlbum["category"],
    coverUrl: row.cover_url,
    period: row.period,
    photoCount: row.photo_count,
    ownerType: row.owner_type,
    guestId: row.guest_id,
  }
}

function mapGuest(row: GalleryGuestRow): GalleryGuest {
  return {
    id: row.id,
    name: row.name,
    avatarUrl: row.avatar_url,
    albumCount: row.album_count,
    photoCount: row.photo_count,
    createdAt: row.created_at,
  }
}

// ── Fetch functions ──────────────────────────────────────────────────────────

/**
 * Fetch all approved gallery photos.
 * Ordered by date descending.
 */
export async function fetchGalleryPhotos(): Promise<GalleryPhoto[]> {
  const { data, error } = await supabase
    .from("gallery_photos")
    .select("*")
    .eq("is_approved", true)
    .order("date", { ascending: false })

  if (error) {
    console.error("[galleryApi] fetchGalleryPhotos error:", error.message)
    return []
  }

  return (data as GalleryPhotoRow[]).map(mapPhoto)
}

/**
 * Fetch gallery photos filtered by owner_type.
 */
export async function fetchGalleryPhotosByOwner(
  ownerType: GalleryOwnerType
): Promise<GalleryPhoto[]> {
  const { data, error } = await supabase
    .from("gallery_photos")
    .select("*")
    .eq("is_approved", true)
    .eq("owner_type", ownerType)
    .order("date", { ascending: false })

  if (error) {
    console.error("[galleryApi] fetchGalleryPhotosByOwner error:", error.message)
    return []
  }

  return (data as GalleryPhotoRow[]).map(mapPhoto)
}

/**
 * Fetch all gallery albums.
 */
export async function fetchGalleryAlbums(): Promise<GalleryAlbum[]> {
  const { data, error } = await supabase
    .from("gallery_albums")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[galleryApi] fetchGalleryAlbums error:", error.message)
    return []
  }

  return (data as GalleryAlbumRow[]).map(mapAlbum)
}

/**
 * Fetch photos for a specific album slug.
 */
export async function fetchPhotosByAlbum(albumSlug: string): Promise<GalleryPhoto[]> {
  const { data, error } = await supabase
    .from("gallery_photos")
    .select("*")
    .eq("album_slug", albumSlug)
    .order("date", { ascending: false })

  if (error) {
    console.error("[galleryApi] fetchPhotosByAlbum error:", error.message)
    return []
  }

  return (data as GalleryPhotoRow[]).map(mapPhoto)
}

/**
 * Fetch a single album by slug.
 * Returns null if not found.
 */
export async function fetchAlbumBySlug(slug: string): Promise<GalleryAlbum | null> {
  const { data, error } = await supabase
    .from("gallery_albums")
    .select("*")
    .eq("slug", slug)
    .maybeSingle()

  if (error) {
    console.error("[galleryApi] fetchAlbumBySlug error:", error.message)
    return null
  }

  return data ? mapAlbum(data as GalleryAlbumRow) : null
}

/**
 * Fetch all gallery guests (sorted A-Z by name).
 */
export async function fetchGalleryGuests(): Promise<GalleryGuest[]> {
  const { data, error } = await supabase
    .from("gallery_guests")
    .select("id, name, avatar_url, album_count, photo_count, created_at")
    .order("name", { ascending: true })

  if (error) {
    console.error("[galleryApi] fetchGalleryGuests error:", error.message)
    return []
  }

  return (data as GalleryGuestRow[]).map(mapGuest)
}
