"use client"

import React, { useState, useEffect, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { 
  Search, Plus, Edit2, Trash2, Menu, AlertCircle, 
  CheckCircle2, ChevronLeft, ChevronRight, X, RefreshCw, 
  ListFilter, Database, Image as ImageIcon, Users, CheckSquare, EyeOff, Folder, User
} from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useSidebar } from "@/components/dashboard/SidebarContext"

import GalleryFormModal, { type GalleryFormData } from "./GalleryFormModal"
import GalleryDeleteModal from "./GalleryDeleteModal"
import { saveGalleryPhotoOnServer, deleteGalleryPhotoOnServer, bulkDeleteGalleryPhotosOnServer } from "./galleryActions"

import AlbumFormModal, { type AlbumFormData } from "./AlbumFormModal"
import AlbumDeleteModal from "./AlbumDeleteModal"
import AlbumList from "./AlbumList"
import { saveAlbumOnServer, deleteAlbumOnServer, bulkDeleteAlbumsOnServer } from "./albumActions"

import { GalleryGuest } from "@/types/gallery"
import { fetchGalleryGuests } from "@/lib/galleryApi"
import GuestList from "./GuestList"
import GuestFormModal, { type GuestFormData } from "./GuestFormModal"
import GuestDeleteModal from "./GuestDeleteModal"
import { saveGuestOnServer, deleteGuestOnServer, bulkDeleteGuestsOnServer } from "./guestActions"

const ITEMS_PER_PAGE = 8

interface ToastMsg {
  type: "success" | "error"
  text: string
}

// ─── Main Content Component ───────────────────────────────────────────────────

function GalleryDashboardContent() {
  const { toggle: toggleSidebar } = useSidebar()
  const searchParams = useSearchParams()
  
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters — pre-filled from notification URL (?view=X&search=Y)
  const [search, setSearch] = useState(() => searchParams.get("view") === "photos" || !searchParams.get("view") ? searchParams.get("search") || "" : "")
  const [filterOwner, setFilterOwner] = useState<string>("all") // all, personal, guest
  const [filterStatus, setFilterStatus] = useState<string>("all") // all, approved, pending
  const [page, setPage] = useState(1)
  
  const [saving, setSaving] = useState(false)
  const [isDeletingBulk, setIsDeletingBulk] = useState(false)
  const [toast, setToast] = useState<ToastMsg | null>(null)
  const [view, setView] = useState<"photos" | "albums" | "guests">(
    (searchParams.get("view") as "photos" | "albums" | "guests") || "photos"
  )

  // Data
  const [albums, setAlbums] = useState<any[]>([])
  const [loadingAlbums, setLoadingAlbums] = useState(false)

  // Checkbox State
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Search for albums/guests tab — pre-filled from notification URL
  const [searchAlbum, setSearchAlbum] = useState(() => searchParams.get("view") === "albums" ? searchParams.get("search") || "" : "")

  // Modals
  const [formModal, setFormModal] = useState<{ open: boolean, mode: "create" | "edit", data?: GalleryFormData }>({ open: false, mode: "create" })
  const [deleteModal, setDeleteModal] = useState<{ open: boolean, item: any | null }>({ open: false, item: null })
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false)

  // Album Modals
  const [albumFormModal, setAlbumFormModal] = useState<{ open: boolean, mode: "create" | "edit", data?: AlbumFormData }>({ open: false, mode: "create" })
  const [albumDeleteModal, setAlbumDeleteModal] = useState<{ open: boolean, item: any | null }>({ open: false, item: null })
  const [savingAlbum, setSavingAlbum] = useState(false)

  // Album Bulk Delete
  const [selectedAlbumIds, setSelectedAlbumIds] = useState<string[]>([])
  const [bulkDeleteAlbumsModal, setBulkDeleteAlbumsModal] = useState(false)
  const [isDeletingBulkAlbums, setIsDeletingBulkAlbums] = useState(false)

  // Guest State
  const [guests, setGuests] = useState<GalleryGuest[]>([])
  const [loadingGuests, setLoadingGuests] = useState(false)
  const [searchGuest, setSearchGuest] = useState(() => searchParams.get("view") === "guests" ? searchParams.get("search") || "" : "")
  const [selectedGuestIds, setSelectedGuestIds] = useState<number[]>([])

  // Guest Modals
  const [guestFormModal, setGuestFormModal] = useState<{ open: boolean, mode: "create" | "edit", data?: GuestFormData }>({ open: false, mode: "create" })
  const [guestDeleteModal, setGuestDeleteModal] = useState<{ open: boolean, item: GalleryGuest | null }>({ open: false, item: null })
  const [savingGuest, setSavingGuest] = useState(false)
  
  // Guest Bulk Delete
  const [bulkDeleteGuestsModal, setBulkDeleteGuestsModal] = useState(false)
  const [isDeletingBulkGuests, setIsDeletingBulkGuests] = useState(false)

  const STORAGE_BUCKET = "gallery-photos"

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(t)
    }
  }, [toast])

  useEffect(() => {
    setSelectedIds([])
  }, [page, search, filterOwner, filterStatus, view])

  useEffect(() => {
    setSearchAlbum("")
    setSelectedAlbumIds([])
    setSearchGuest("")
    setSelectedGuestIds([])
  }, [view])

  async function fetchPhotos() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("gallery_photos")
        .select("*")
        .order("date", { ascending: false })

      if (error) throw error
      setPhotos(data || [])
    } catch (err: any) {
      setToast({ type: "error", text: `Gagal memuat data: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  async function fetchAlbums() {
    setLoadingAlbums(true)
    try {
      const { data, error } = await supabase
        .from("gallery_albums")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setAlbums(data || [])
    } catch (err: any) {
      setToast({ type: "error", text: `Gagal memuat data album: ${err.message}` })
    } finally {
      setLoadingAlbums(false)
    }
  }

  async function fetchGuests() {
    setLoadingGuests(true)
    try {
      const data = await fetchGalleryGuests()
      setGuests(data || [])
    } catch (err: any) {
      setToast({ type: "error", text: `Gagal memuat data tamu: ${err.message}` })
    } finally {
      setLoadingGuests(false)
    }
  }

  useEffect(() => {
    fetchPhotos()
    fetchAlbums()
    fetchGuests()
  }, [])

  const filtered = useMemo(() => {
    return photos.filter((p) => {
      const q = search.toLowerCase()
      const matchSearch = !q || (p.title || "").toLowerCase().includes(q) || (p.album || "").toLowerCase().includes(q) || (p.uploader_name || "").toLowerCase().includes(q)
      const matchOwner = filterOwner === "all" || p.owner_type === filterOwner
      const matchStatus = filterStatus === "all" || (filterStatus === "approved" ? p.is_approved : !p.is_approved)
      
      return matchSearch && matchOwner && matchStatus
    })
  }, [photos, search, filterOwner, filterStatus])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const totalItems = photos.length
  const personalCount = photos.filter(p => p.owner_type === "personal").length
  const guestCount = photos.filter(p => p.owner_type === "guest").length
  const pendingCount = photos.filter(p => !p.is_approved).length

  // ─── Selection Handlers ───────────────────────────────────────────────────

  function toggleSelectAll() {
    if (paginated.length === 0) return
    if (selectedIds.length === paginated.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(paginated.map(p => p.id))
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  function getPathsFromPhoto(item: any) {
    const paths: string[] = []
    const pathIdentifier = `/public/${STORAGE_BUCKET}/`
    
    if (item.image_url && item.image_url.includes(pathIdentifier)) {
      paths.push(item.image_url.substring(item.image_url.indexOf(pathIdentifier) + pathIdentifier.length))
    }
    if (item.thumbnail_url && item.thumbnail_url.includes(pathIdentifier) && item.thumbnail_url !== item.image_url) {
      paths.push(item.thumbnail_url.substring(item.thumbnail_url.indexOf(pathIdentifier) + pathIdentifier.length))
    }
    return paths
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function openDelete(item: any) {
    setDeleteModal({ open: true, item })
  }

  async function handleSave(data: GalleryFormData) {
    setSaving(true)
    try {
      const row: any = { ...data }
      let res;
      if (formModal.mode === "create") {
        delete row.id // Biarkan DB generate
        res = await saveGalleryPhotoOnServer(row, "create")
      } else {
        res = await saveGalleryPhotoOnServer(row, "edit", formModal.data?.id)
      }

      if (!res.success) throw new Error(res.error)

      await fetchPhotos()
      setFormModal({ open: false, mode: "create" })
      setToast({ type: "success", text: formModal.mode === "create" ? "Data berhasil disimpan." : "Data berhasil diperbarui." })
    } catch (err: any) {
      setToast({ type: "error", text: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteModal.item) return
    const item = deleteModal.item

    try {
      const pathsToDelete = getPathsFromPhoto(item)
      const res = await deleteGalleryPhotoOnServer(item.id, STORAGE_BUCKET, pathsToDelete)
      if (!res.success) throw new Error(res.error)

      await fetchPhotos()
      setSelectedIds(prev => prev.filter(id => id !== item.id))
      setPage(1)
      setToast({ type: "success", text: "Data berhasil dihapus." })
    } catch (err: any) {
      setToast({ type: "error", text: err.message })
    } finally {
      setDeleteModal({ open: false, item: null })
    }
  }

  async function handleBulkDelete() {
    setIsDeletingBulk(true)
    try {
      const itemsToDelete = selectedIds.map(id => {
        const item = photos.find((p) => p.id === id)
        return { id, storageBucket: STORAGE_BUCKET, filePaths: getPathsFromPhoto(item) }
      })

      const result = await bulkDeleteGalleryPhotosOnServer(itemsToDelete)
      if (!result.success) throw new Error(result.error as string)

      await fetchPhotos()
      setSelectedIds([])
      
      const newTotal = filtered.length - selectedIds.length
      const maxPage = Math.ceil(newTotal / ITEMS_PER_PAGE) || 1
      if (page > maxPage) setPage(maxPage)

      setToast({ type: "success", text: `${result.count} data berhasil dihapus.` })
    } catch (err: any) {
      setToast({ type: "error", text: `Gagal menghapus: ${err.message}` })
    } finally {
      setIsDeletingBulk(false)
      setBulkDeleteModal(false)
    }
  }

  function resetFilters() {
    setSearch("")
    setFilterOwner("all")
    setFilterStatus("all")
    setPage(1)
  }

  const hasActiveFilters = search || filterOwner !== "all" || filterStatus !== "all"

  // ─── Album Handlers ──────────────────────────────────────────────────────────

  async function handleAlbumSave(data: AlbumFormData) {
    setSavingAlbum(true)
    try {
      const row: any = { ...data }
      let res
      if (albumFormModal.mode === "create") {
        delete row.id
        res = await saveAlbumOnServer(row, "create")
      } else {
        res = await saveAlbumOnServer(row, "edit", albumFormModal.data?.slug)
      }
      if (!res.success) throw new Error(res.error)
      await fetchAlbums()
      setAlbumFormModal({ open: false, mode: "create" })
      setToast({ type: "success", text: albumFormModal.mode === "create" ? "Album berhasil disimpan." : "Album berhasil diperbarui." })
    } catch (err: any) {
      setToast({ type: "error", text: err.message })
    } finally {
      setSavingAlbum(false)
    }
  }

  async function handleAlbumDelete() {
    if (!albumDeleteModal.item) return
    const item = albumDeleteModal.item
    try {
      const res = await deleteAlbumOnServer(item.slug)
      if (!res.success) throw new Error(res.error)
      await fetchAlbums()
      setSelectedAlbumIds(prev => prev.filter(slug => slug !== item.slug))
      setToast({ type: "success", text: "Album berhasil dihapus." })
    } catch (err: any) {
      setToast({ type: "error", text: err.message })
    } finally {
      setAlbumDeleteModal({ open: false, item: null })
    }
  }

  async function handleBulkDeleteAlbums() {
    setIsDeletingBulkAlbums(true)
    try {
      const result = await bulkDeleteAlbumsOnServer(selectedAlbumIds)
      if (!result.success) throw new Error(result.error as string)
      await fetchAlbums()
      setSelectedAlbumIds([])
      setToast({ type: "success", text: `${result.count} album berhasil dihapus.` })
    } catch (err: any) {
      setToast({ type: "error", text: `Gagal menghapus: ${err.message}` })
    } finally {
      setIsDeletingBulkAlbums(false)
      setBulkDeleteAlbumsModal(false)
    }
  }

  // ─── Guest Handlers ──────────────────────────────────────────────────────────

  async function handleGuestSave(data: GuestFormData) {
    setSavingGuest(true)
    try {
      const res = await saveGuestOnServer(data, guestFormModal.mode, guestFormModal.data?.id)
      if (!res.success) throw new Error(res.error)

      await fetchGuests()
      setGuestFormModal({ open: false, mode: "create" })
      setToast({ type: "success", text: guestFormModal.mode === "create" ? "Tamu berhasil didaftarkan." : "Profil tamu berhasil diperbarui." })
    } catch (err: any) {
      setToast({ type: "error", text: err.message })
    } finally {
      setSavingGuest(false)
    }
  }

  async function handleGuestDelete() {
    if (!guestDeleteModal.item) return
    const item = guestDeleteModal.item

    try {
      const res = await deleteGuestOnServer(item.id)
      if (!res.success) throw new Error(res.error)

      await fetchGuests()
      await fetchPhotos()
      await fetchAlbums()
      
      setSelectedGuestIds(prev => prev.filter(id => id !== item.id))
      setToast({ type: "success", text: "Tamu dan seluruh datanya berhasil dihapus." })
    } catch (err: any) {
      setToast({ type: "error", text: err.message })
    } finally {
      setGuestDeleteModal({ open: false, item: null })
    }
  }

  async function handleBulkDeleteGuests() {
    setIsDeletingBulkGuests(true)
    try {
      const result = await bulkDeleteGuestsOnServer(selectedGuestIds)
      if (!result.success) throw new Error(result.error as string)

      await fetchGuests()
      await fetchPhotos()
      await fetchAlbums()
      
      setSelectedGuestIds([])
      setToast({ type: "success", text: `${result.count} tamu berhasil dihapus.` })
    } catch (err: any) {
      setToast({ type: "error", text: `Gagal menghapus: ${err.message}` })
    } finally {
      setIsDeletingBulkGuests(false)
      setBulkDeleteGuestsModal(false)
    }
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* ── Page Header ── */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-8 py-4 border-b border-white/[0.06] bg-[#070e0e]/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={toggleSidebar} className="p-2 -ml-1 rounded-xl hover:bg-white/[0.06] text-gray-400 md:hidden">
              <Menu size={18} />
            </button>
            <div className="w-8 h-8 rounded-xl bg-accentColor/15 border border-accentColor/25 flex items-center justify-center">
              <ImageIcon size={14} className="text-accentColor" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-tight">Gallery Manager</h1>
              <p className="text-[10px] text-gray-500 leading-tight hidden sm:block">Kelola foto personal & kiriman tamu</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {view === "photos" && selectedIds.length > 0 && (
              <button onClick={() => setBulkDeleteModal(true)} className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all">
                <Trash2 size={14} />
                <span className="hidden sm:inline">Hapus ({selectedIds.length})</span>
                <span className="sm:hidden">({selectedIds.length})</span>
              </button>
            )}
            {view === "albums" && selectedAlbumIds.length > 0 && (
              <button onClick={() => setBulkDeleteAlbumsModal(true)} className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all">
                <Trash2 size={14} />
                <span className="hidden sm:inline">Hapus ({selectedAlbumIds.length})</span>
                <span className="sm:hidden">({selectedAlbumIds.length})</span>
              </button>
            )}
            {view === "guests" && selectedGuestIds.length > 0 && (
              <button onClick={() => setBulkDeleteGuestsModal(true)} className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all">
                <Trash2 size={14} />
                <span className="hidden sm:inline">Hapus ({selectedGuestIds.length})</span>
                <span className="sm:hidden">({selectedGuestIds.length})</span>
              </button>
            )}
            {view === "photos" ? (
              <button onClick={() => setFormModal({ open: true, mode: "create" })} className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-accentColor text-white rounded-xl hover:brightness-[0.85] transition-all hover:shadow-lg hover:shadow-accentColor/20">
                <Plus size={14} /> <span className="hidden sm:inline">New Photo</span>
                <span className="sm:hidden">Baru</span>
              </button>
            ) : view === "albums" ? (
              <button onClick={() => setAlbumFormModal({ open: true, mode: "create" })} className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-accentColor text-white rounded-xl hover:brightness-[0.85] transition-all hover:shadow-lg hover:shadow-accentColor/20">
                <Plus size={14} /> <span className="hidden sm:inline">New Album</span>
                <span className="sm:hidden">Baru</span>
              </button>
            ) : (
              <button onClick={() => setGuestFormModal({ open: true, mode: "create" })} className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-accentColor text-white rounded-xl hover:brightness-[0.85] transition-all hover:shadow-lg hover:shadow-accentColor/20">
                <Plus size={14} /> <span className="hidden sm:inline">New Guest</span>
                <span className="sm:hidden">Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-6 space-y-5 md:space-y-6 scrollbar-none">

          {/* ── Tab Switcher ── */}
          <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.07] rounded-xl w-fit">
            <button
              onClick={() => setView("photos")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                view === "photos"
                  ? "bg-accentColor text-white shadow-lg shadow-accentColor/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
              )}
            >
              <ImageIcon size={14} /> <span>Photos</span>
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md tabular-nums", view === "photos" ? "bg-white/20" : "bg-white/[0.06] text-gray-500")}>{photos.length}</span>
            </button>
            <button
              onClick={() => setView("albums")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                view === "albums"
                  ? "bg-accentColor text-white shadow-lg shadow-accentColor/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
              )}
            >
              <Folder size={14} /> <span>Albums</span>
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md tabular-nums", view === "albums" ? "bg-white/20" : "bg-white/[0.06] text-gray-500")}>{albums.length}</span>
            </button>
            <button
              onClick={() => setView("guests")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                view === "guests"
                  ? "bg-accentColor text-white shadow-lg shadow-accentColor/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
              )}
            >
              <User size={14} /> <span>Guests</span>
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md tabular-nums", view === "guests" ? "bg-white/20" : "bg-white/[0.06] text-gray-500")}>{guests.length}</span>
            </button>
          </div>

          {/* ── Stats ── */}
          {view === "photos" ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <StatCard label="Total Photos" value={totalItems} icon={<Database size={15} className="text-gray-400" />} color="default" loading={loading} />
              <StatCard label="Personal Photos" value={personalCount} icon={<ImageIcon size={15} className="text-emerald-400" />} color="green" loading={loading} />
              <StatCard label="Guest Uploads" value={guestCount} icon={<Users size={15} className="text-blue-400" />} color="blue" loading={loading} />
              <StatCard label="Menunggu Approval" value={pendingCount} icon={<AlertCircle size={15} className="text-red-400" />} color="red" loading={loading} />
            </div>
          ) : view === "albums" ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <StatCard label="Total Album" value={albums.length} icon={<Folder size={15} className="text-gray-400" />} color="default" loading={loadingAlbums} />
              <StatCard label="Album dengan Foto" value={albums.filter(a => photos.some(p => p.album_slug === a.slug)).length} icon={<ImageIcon size={15} className="text-emerald-400" />} color="green" loading={loadingAlbums} />
              <StatCard label="Album Kosong" value={albums.filter(a => !photos.some(p => p.album_slug === a.slug)).length} icon={<Folder size={15} className="text-amber-400" />} color="yellow" loading={loadingAlbums} />
              <StatCard label="Total Foto di Album" value={photos.filter(p => p.album_slug).length} icon={<CheckSquare size={15} className="text-blue-400" />} color="blue" loading={loadingAlbums} />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <StatCard label="Total Guests" value={guests.length} icon={<Users size={15} className="text-gray-400" />} color="default" loading={loadingGuests} />
              <StatCard label="Guest dengan Foto" value={guests.filter(g => g.photoCount > 0).length} icon={<ImageIcon size={15} className="text-emerald-400" />} color="green" loading={loadingGuests} />
              <StatCard label="Guest dengan Album" value={guests.filter(g => g.albumCount > 0).length} icon={<Folder size={15} className="text-blue-400" />} color="blue" loading={loadingGuests} />
              <StatCard label="Guest Pasif" value={guests.filter(g => g.photoCount === 0 && g.albumCount === 0).length} icon={<User size={15} className="text-amber-400" />} color="yellow" loading={loadingGuests} />
            </div>
          )}

          {/* ── Toolbar ── */}
          {view === "photos" ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Cari foto, album, atau nama tamu..."
                  className="w-full pl-9 pr-9 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-accentColor/50 transition-colors"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"><X size={13} /></button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select value={filterOwner} onChange={(e) => { setFilterOwner(e.target.value); setPage(1) }} className="flex-1 sm:w-auto px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-300 outline-none focus:border-accentColor/50 transition-colors appearance-none cursor-pointer">
                  <option value="all" className="bg-[#0d1a1a]">Semua Owner</option>
                  <option value="personal" className="bg-[#0d1a1a]">Personal (Saya)</option>
                  <option value="guest" className="bg-[#0d1a1a]">Guest (Tamu)</option>
                </select>

                <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }} className="flex-1 sm:w-auto px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-300 outline-none focus:border-accentColor/50 transition-colors appearance-none cursor-pointer">
                  <option value="all" className="bg-[#0d1a1a]">Semua Status</option>
                  <option value="approved" className="bg-[#0d1a1a]">Approved</option>
                  <option value="pending" className="bg-[#0d1a1a]">Pending</option>
                </select>

                {hasActiveFilters && (
                  <button onClick={resetFilters} className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-gray-400 hover:text-gray-200 border border-white/[0.08] hover:border-white/20 rounded-xl transition-all shrink-0">
                    <RefreshCw size={12} />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                )}
              </div>
              
              {hasActiveFilters && (
                <span className="text-xs text-gray-500 shrink-0">{filtered.length}/{photos.length}</span>
              )}
            </div>
          ) : view === "albums" ? (
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="text" value={searchAlbum} onChange={(e) => setSearchAlbum(e.target.value)}
                  placeholder="Cari nama album, kategori, atau slug..."
                  className="w-full pl-9 pr-9 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-accentColor/50 transition-colors"
                />
                {searchAlbum && (
                  <button onClick={() => setSearchAlbum("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"><X size={13} /></button>
                )}
              </div>
              <button onClick={fetchAlbums} className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-gray-400 hover:text-gray-200 border border-white/[0.08] hover:border-white/20 rounded-xl transition-all shrink-0">
                <RefreshCw size={12} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="text" value={searchGuest} onChange={(e) => setSearchGuest(e.target.value)}
                  placeholder="Cari nama tamu..."
                  className="w-full pl-9 pr-9 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-accentColor/50 transition-colors"
                />
                {searchGuest && (
                  <button onClick={() => setSearchGuest("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"><X size={13} /></button>
                )}
              </div>
              <button onClick={fetchGuests} className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-gray-400 hover:text-gray-200 border border-white/[0.08] hover:border-white/20 rounded-xl transition-all shrink-0">
                <RefreshCw size={12} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          )}

          {/* ── Content ── */}
          {view === "photos" ? (
            loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />)}
              </div>
            ) : (
              <>
                <div className="md:hidden space-y-3">
                  {paginated.length === 0 ? (
                    <EmptyState onReset={resetFilters} />
                  ) : (
                    paginated.map((p, idx) => (
                      <GalleryCard
                        key={p.id} item={p} rowNum={(page - 1) * ITEMS_PER_PAGE + idx + 1}
                        isSelected={selectedIds.includes(p.id)} onToggle={() => toggleSelect(p.id)}
                        onEdit={() => setFormModal({ open: true, mode: "edit", data: p })}
                        onDelete={() => openDelete(p)} 
                      />
                    ))
                  )}
                </div>

                <div className="hidden md:block rounded-2xl border border-white/[0.07] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[960px]">
                      <thead>
                        <tr className="bg-white/[0.04] border-b border-white/[0.06]">
                          <th className="px-4 py-3.5 w-12 text-left"><input type="checkbox" checked={paginated.length > 0 && selectedIds.length === paginated.length} onChange={toggleSelectAll} className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]" /></th>
                          <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-2 py-3.5 w-8">#</th>
                          <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 min-w-[280px]">Informasi Foto</th>
                          <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-40">Album & Dimensi</th>
                          <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-32">Owner</th>
                          <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-28">Status</th>
                          <th className="text-right text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-5 py-3.5 w-24">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {paginated.length === 0 ? (
                          <tr><td colSpan={7} className="text-center py-16"><EmptyState onReset={resetFilters} /></td></tr>
                        ) : (
                          paginated.map((p, idx) => (
                            <GalleryTableRow
                              key={p.id} item={p} rowNum={(page - 1) * ITEMS_PER_PAGE + idx + 1}
                              isSelected={selectedIds.includes(p.id)} onToggle={() => toggleSelect(p.id)}
                              onEdit={() => setFormModal({ open: true, mode: "edit", data: p })}
                              onDelete={() => openDelete(p)}
                            />
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-5 py-3.5 border-t border-white/[0.06] bg-white/[0.02]">
                    <p className="text-xs text-gray-500">Menampilkan <span className="text-gray-300 font-medium">{filtered.length === 0 ? 0 : Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)}</span> dari <span className="text-gray-300 font-medium">{filtered.length}</span> entri</p>
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="md:hidden flex items-center justify-between mt-4">
                    <p className="text-xs text-gray-500">{filtered.length === 0 ? 0 : Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} / {filtered.length}</p>
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                  </div>
                )}
              </>
            )
          ) : view === "albums" ? (
            /* ── Albums Tab ── */
            <AlbumList
              albums={albums}
              photos={photos}
              loading={loadingAlbums}
              searchAlbum={searchAlbum}
              selectedIds={selectedAlbumIds}
              onToggle={(slug) => setSelectedAlbumIds(prev => prev.includes(slug) ? prev.filter(i => i !== slug) : [...prev, slug])}
              onToggleAll={(slugs) => setSelectedAlbumIds(slugs)}
              onEdit={(album) => setAlbumFormModal({ open: true, mode: "edit", data: album as AlbumFormData })}
              onDelete={(album) => setAlbumDeleteModal({ open: true, item: album })}
            />
          ) : (
            /* ── Guests Tab ── */
            <GuestList
              guests={guests}
              loading={loadingGuests}
              searchGuest={searchGuest}
              selectedIds={selectedGuestIds}
              onToggle={(id) => setSelectedGuestIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
              onToggleAll={(ids) => setSelectedGuestIds(ids)}
              onEdit={(guest) => setGuestFormModal({ open: true, mode: "edit", data: { id: guest.id, name: guest.name, avatar_url: guest.avatarUrl || "" } })}
              onDelete={(guest) => setGuestDeleteModal({ open: true, item: guest })}
            />
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <GalleryFormModal isOpen={formModal.open} mode={formModal.mode} initialData={formModal.data} onClose={() => setFormModal({ open: false, mode: "create" })} onSave={handleSave} externalSaving={saving} />
      <GalleryDeleteModal isOpen={deleteModal.open} title={deleteModal.item?.title || ""} onClose={() => setDeleteModal({ open: false, item: null })} onConfirm={handleDelete} />

      {/* ── Album Modals ── */}
      <AlbumFormModal isOpen={albumFormModal.open} mode={albumFormModal.mode} initialData={albumFormModal.data} onClose={() => setAlbumFormModal({ open: false, mode: "create" })} onSave={handleAlbumSave} externalSaving={savingAlbum} />
      <AlbumDeleteModal
        isOpen={albumDeleteModal.open}
        albumName={albumDeleteModal.item?.name || ""}
        photoCount={albumDeleteModal.item ? photos.filter(p => p.album_slug === albumDeleteModal.item.slug).length : 0}
        onClose={() => setAlbumDeleteModal({ open: false, item: null })}
        onConfirm={handleAlbumDelete}
      />

      {/* ── Guest Modals ── */}
      <GuestFormModal isOpen={guestFormModal.open} mode={guestFormModal.mode} initialData={guestFormModal.data} onClose={() => setGuestFormModal({ open: false, mode: "create" })} onSave={handleGuestSave} externalSaving={savingGuest} />
      <GuestDeleteModal
        isOpen={guestDeleteModal.open}
        guestName={guestDeleteModal.item?.name || ""}
        photoCount={guestDeleteModal.item?.photoCount || 0}
        albumCount={guestDeleteModal.item?.albumCount || 0}
        onClose={() => setGuestDeleteModal({ open: false, item: null })}
        onConfirm={handleGuestDelete}
      />

      {/* ── Bulk Delete Modal (Photos) ── */}
      {bulkDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={() => !isDeletingBulk && setBulkDeleteModal(false)} />
          <div className="relative w-full max-w-md bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4 mt-2">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/20"><AlertCircle size={26} className="text-red-400" /></div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1.5">Hapus {selectedIds.length} Foto?</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Apakah Anda yakin ingin menghapus {selectedIds.length} foto beserta file gambarnya secara permanen dari Storage?</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 bg-white/[0.02] border-t border-white/[0.06]">
              <button onClick={() => setBulkDeleteModal(false)} disabled={isDeletingBulk} className="flex-1 py-2.5 text-sm font-medium text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-all">Batal</button>
              <button onClick={handleBulkDelete} disabled={isDeletingBulk} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-red-500/90 hover:bg-red-500 rounded-xl transition-all">
                {isDeletingBulk ? <RefreshCw size={16} className="animate-spin" /> : "Ya, Hapus Semua"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Delete Modal (Albums) ── */}
      {bulkDeleteAlbumsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={() => !isDeletingBulkAlbums && setBulkDeleteAlbumsModal(false)} />
          <div className="relative w-full max-w-md bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4 mt-2">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/20"><AlertCircle size={26} className="text-red-400" /></div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1.5">Hapus {selectedAlbumIds.length} Album?</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Album akan dihapus secara permanen. Foto-foto yang ada di dalamnya tidak ikut dihapus, namun akan kehilangan tautan ke album.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 bg-white/[0.02] border-t border-white/[0.06]">
              <button onClick={() => setBulkDeleteAlbumsModal(false)} disabled={isDeletingBulkAlbums} className="flex-1 py-2.5 text-sm font-medium text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-all">Batal</button>
              <button onClick={handleBulkDeleteAlbums} disabled={isDeletingBulkAlbums} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-red-500/90 hover:bg-red-500 rounded-xl transition-all">
                {isDeletingBulkAlbums ? <RefreshCw size={16} className="animate-spin" /> : "Ya, Hapus Semua"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Delete Modal (Guests) ── */}
      {bulkDeleteGuestsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={() => !isDeletingBulkGuests && setBulkDeleteGuestsModal(false)} />
          <div className="relative w-full max-w-md bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4 mt-2">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/20"><AlertCircle size={26} className="text-red-400" /></div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1.5">Hapus {selectedGuestIds.length} Tamu?</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Tamu yang dipilih beserta semua foto dan albumnya akan ikut terhapus secara permanen dari database dan storage.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 bg-white/[0.02] border-t border-white/[0.06]">
              <button onClick={() => setBulkDeleteGuestsModal(false)} disabled={isDeletingBulkGuests} className="flex-1 py-2.5 text-sm font-medium text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-all">Batal</button>
              <button onClick={handleBulkDeleteGuests} disabled={isDeletingBulkGuests} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-red-500/90 hover:bg-red-500 rounded-xl transition-all">
                {isDeletingBulkGuests ? <RefreshCw size={16} className="animate-spin" /> : "Ya, Hapus Semua"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-4 right-4 z-[70] animate-in slide-in-from-right-4 fade-in duration-300">
          <div className={cn("flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm shadow-2xl min-w-[260px]", toast.type === "success" ? "bg-[#0a1f1a] border-emerald-500/30 text-emerald-400" : "bg-[#1f0a0a] border-red-500/30 text-red-400")}>
            {toast.type === "success" ? <CheckCircle2 size={15} className="shrink-0" /> : <AlertCircle size={15} className="shrink-0" />}
            <span className="flex-1 text-xs leading-snug">{toast.text}</span>
            <button onClick={() => setToast(null)} className="hover:opacity-70 transition-opacity ml-1 shrink-0"><X size={13} /></button>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Component Helpers ────────────────────────────────────────────────────────

function formatDateShort(dateString: string) {
  if (!dateString) return ""
  return new Date(dateString).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
}

function StatCard({ label, value, icon, color, sub, loading }: any) {
  const borderColor = { default: "border-white/[0.07]", green: "border-emerald-500/20", blue: "border-blue-500/20", red: "border-red-500/20", yellow: "border-amber-500/20" }[color as string] ?? "border-white/[0.07]"
  const valueCls = { default: "text-white", green: "text-emerald-400", blue: "text-blue-400", red: "text-red-400", yellow: "text-amber-400" }[color as string] ?? "text-white"
  return (
    <div className={cn("rounded-2xl border bg-white/[0.03] px-4 sm:px-5 py-4 space-y-2 sm:space-y-3", borderColor)}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] sm:text-xs text-gray-500 leading-tight">{label}</p>
        <div className="w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0">{icon}</div>
      </div>
      <div>
        {loading ? <div className="h-7 w-10 bg-white/[0.06] rounded-md animate-pulse" /> : <p className={cn("text-xl sm:text-2xl font-bold tabular-nums", valueCls)}>{value}</p>}
        {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-gray-500">
      <ImageIcon size={28} className="opacity-30" />
      <p className="text-sm">Tidak ada foto yang ditemukan.</p>
      <button onClick={onReset} className="text-xs text-accentColor hover:underline">Reset filter</button>
    </div>
  )
}

function Pagination({ page, totalPages, onPageChange }: any) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const visible = totalPages <= 5 ? pages : pages.filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-white/[0.08] hover:border-white/20 disabled:opacity-30 transition-all text-gray-400"><ChevronLeft size={13} /></button>
      {visible.map((p, i, arr) => (
        <React.Fragment key={p}>
          {i > 0 && arr[i - 1] !== p - 1 && <span className="text-xs text-gray-600 px-1">…</span>}
          <button onClick={() => onPageChange(p)} className={cn("w-7 h-7 rounded-lg text-xs font-medium transition-all", page === p ? "bg-accentColor text-white" : "border border-white/[0.08] text-gray-400 hover:border-white/20 hover:text-gray-200")}>{p}</button>
        </React.Fragment>
      ))}
      <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border border-white/[0.08] hover:border-white/20 disabled:opacity-30 transition-all text-gray-400"><ChevronRight size={13} /></button>
    </div>
  )
}

// ─── Sub-Components (Card & Row) ──────────────────────────────────────────────

function GalleryCard({ item, rowNum, onEdit, onDelete, isSelected, onToggle }: any) {
  return (
    <div className={cn("rounded-2xl border bg-white/[0.02] p-4 space-y-4 transition-colors", isSelected ? "border-accentColor/40 bg-accentColor/5" : "border-white/[0.07]")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="pt-0.5 shrink-0"><input type="checkbox" checked={isSelected} onChange={onToggle} className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]" /></div>
          <div className="w-16 h-12 rounded-lg overflow-hidden border border-white/[0.08] shrink-0 bg-black/40">
            {item.thumbnail_url ? <img src={item.thumbnail_url} alt="img" className="w-full h-full object-cover" /> : <ImageIcon className="m-auto h-full text-gray-600" size={16}/>}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-200 leading-snug line-clamp-2">{item.title}</p>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5 truncate">{formatDateShort(item.date)}</p>
          </div>
        </div>
        <span className="text-xs text-gray-600 tabular-nums shrink-0">#{rowNum}</span>
      </div>

      <div className="flex flex-col pl-7 gap-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-gray-300">
            <Folder size={10} className="text-gray-500" /> {item.album || "No Album"}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-1">
          {item.owner_type === "personal" ? (
            <span className="text-[10px] text-accentColor bg-accentColor/10 border border-accentColor/20 px-1.5 py-0.5 rounded">Personal</span>
          ) : (
            <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded flex items-center gap-1"><Users size={10}/> Guest: {item.uploader_name}</span>
          )}
          {item.is_approved ? (
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1"><CheckSquare size={10}/> Approved</span>
          ) : (
            <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded flex items-center gap-1"><EyeOff size={10}/> Pending</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-white/[0.06]">
        <button onClick={onEdit} className="p-2 rounded-xl text-gray-500 hover:text-accentColor hover:bg-accentColor/10 border border-transparent hover:border-accentColor/20 transition-all"><Edit2 size={13} /></button>
        <button onClick={onDelete} className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"><Trash2 size={13} /></button>
      </div>
    </div>
  )
}

function GalleryTableRow({ item, rowNum, onEdit, onDelete, isSelected, onToggle }: any) {
  return (
    <tr className={cn("group transition-colors", isSelected ? "bg-accentColor/5" : "hover:bg-white/[0.025]")}>
      <td className="px-4 py-3.5"><input type="checkbox" checked={isSelected} onChange={onToggle} className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]" /></td>
      <td className="px-2 py-3.5"><span className="text-xs text-gray-600 tabular-nums">{rowNum}</span></td>
      
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-14 h-10 rounded-md overflow-hidden shrink-0 border border-white/[0.08] bg-black/40">
            {item.thumbnail_url ? <img src={item.thumbnail_url} alt="img" className="w-full h-full object-cover" /> : <ImageIcon className="m-auto h-full text-gray-600" size={14}/>}
          </div>
          <div className="min-w-0 pr-4">
            <p className="text-[13px] font-medium text-gray-200 line-clamp-1">{item.title}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{formatDateShort(item.date)}</p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-gray-300 flex items-center gap-1.5"><Folder size={10} className="text-gray-500"/> {item.album || "-"}</span>
          <span className="text-[9px] text-gray-500 font-mono">{item.width} x {item.height}px</span>
        </div>
      </td>

      <td className="px-4 py-3.5">
        {item.owner_type === "personal" ? (
          <span className="inline-flex px-2 py-1 rounded-md text-[10px] font-semibold bg-accentColor/10 text-accentColor border border-accentColor/20">Personal</span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20"><Users size={10}/> Guest: {item.uploader_name?.split(' ')[0] || "Unknown"}</span>
        )}
      </td>

      <td className="px-4 py-3.5">
        {item.is_approved ? (
          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"><CheckSquare size={10} className="mr-1"/> Approved</span>
        ) : (
          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-red-500/10 border border-red-500/20 text-red-400"><EyeOff size={10} className="mr-1"/> Pending</span>
        )}
      </td>

      <td className="px-5 py-3.5">
        <div className="flex items-center justify-end gap-1.5">
          <button onClick={onEdit} title="Edit" className="p-2 rounded-xl text-gray-500 hover:text-accentColor hover:bg-accentColor/10 border border-transparent hover:border-accentColor/20 transition-all">
            <Edit2 size={13} />
          </button>
          <button onClick={onDelete} title="Hapus" className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all">
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Suspense Fallback ────────────────────────────────────────────────────────

function GalleryLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-accentColor border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500">Memuat halaman...</p>
      </div>
    </div>
  )
}

// ─── Default Export (with Suspense) ──────────────────────────────────────────

export default function GalleryDashboardPage() {
  return (
    <Suspense fallback={<GalleryLoadingFallback />}>
      <GalleryDashboardContent />
    </Suspense>
  )
}