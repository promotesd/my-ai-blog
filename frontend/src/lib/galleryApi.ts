/**
 * galleryApi.ts
 *
 * Fetches gallery photos, albums, and guest profiles from Spring Boot.
 * Converts snake_case DB columns → camelCase TypeScript types.
 */

import { GalleryPhoto, GalleryAlbum, GalleryOwnerType, GalleryGuest } from "@/types/gallery"
import { apiRequest } from "@/services/apiClient"

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
  avatarUrl?: string | null
  album_count: number
  albumCount?: number
  photo_count: number
  photoCount?: number
  created_at: string
  createdAt?: string
}

// ── Mappers ──────────────────────────────────────────────────────────────────

function mapPhoto(row: GalleryPhotoRow): GalleryPhoto {
  const imageUrl = normalizePublicUrl(row.image_url)
  const thumbnailUrl = normalizePublicUrl(row.thumbnail_url) || imageUrl
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
    imageUrl,
    thumbnailUrl,
    width: row.width,
    height: row.height,
    isFeatured: row.is_featured,
    tags: row.tags ?? [],
    ownerType: row.owner_type,
    uploaderName: row.uploader_name,
    guestId: row.guest_id,
  }
}

function normalizePublicUrl(url?: string | null) {
  const value = (url ?? "").trim()
  if (!value) return ""
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) return value
  return ""
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
    avatarUrl: row.avatarUrl ?? row.avatar_url,
    albumCount: row.albumCount ?? row.album_count ?? 0,
    photoCount: row.photoCount ?? row.photo_count ?? 0,
    createdAt: row.createdAt ?? row.created_at,
  }
}

// ── Fetch functions ──────────────────────────────────────────────────────────

/**
 * Fetch all approved gallery photos.
 * Ordered by date descending.
 */
export async function fetchGalleryPhotos(): Promise<GalleryPhoto[]> {
  try {
    const data = await apiRequest<GalleryPhotoRow[]>("/api/gallery/photos")
    return data.map(mapPhoto).filter((photo) => photo.imageUrl)
  } catch (error) {
    console.error("[galleryApi] fetchGalleryPhotos error:", error)
    return []
  }
}

/**
 * Fetch gallery photos filtered by owner_type.
 */
export async function fetchGalleryPhotosByOwner(
  ownerType: GalleryOwnerType
): Promise<GalleryPhoto[]> {
  const photos = await fetchGalleryPhotos()
  return photos.filter((photo) => (photo.ownerType ?? "personal") === ownerType)
}

/**
 * Fetch all gallery albums.
 */
export async function fetchGalleryAlbums(): Promise<GalleryAlbum[]> {
  try {
    const data = await apiRequest<GalleryAlbumRow[]>("/api/gallery/albums")
    return data.map(mapAlbum)
  } catch (error) {
    console.error("[galleryApi] fetchGalleryAlbums error:", error)
    return []
  }
}

/**
 * Fetch photos for a specific album slug.
 */
export async function fetchPhotosByAlbum(albumSlug: string): Promise<GalleryPhoto[]> {
  const photos = await fetchGalleryPhotos()
  return photos.filter((photo) => photo.albumSlug === albumSlug)
}

/**
 * Fetch a single album by slug.
 * Returns null if not found.
 */
export async function fetchAlbumBySlug(slug: string): Promise<GalleryAlbum | null> {
  const albums = await fetchGalleryAlbums()
  return albums.find((album) => album.slug === slug) ?? null
}

/**
 * Fetch all gallery guests (sorted A-Z by name).
 */
export async function fetchGalleryGuests(): Promise<GalleryGuest[]> {
  try {
    const data = await apiRequest<GalleryGuestRow[]>("/api/gallery/guests")
    return data.map(mapGuest)
  } catch (error) {
    console.error("[galleryApi] fetchGalleryGuests error:", error)
    return []
  }
}
