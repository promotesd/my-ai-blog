"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
    Search, Plus, Edit2, Trash2, Menu, AlertCircle,
    CheckCircle2, ChevronLeft, ChevronRight, X, RefreshCw,
    Database, Music, Mic2, Disc, ListMusic, ListVideo, Layers
} from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useSidebar } from "@/components/dashboard/SidebarContext"

import MusicFormModal, { type MusicTrackFormData } from "./MusicFormModal"
import MusicDeleteModal from "./MusicDeleteModal"
import AlbumFormModal, { type AlbumFormData } from "./AlbumFormModal"
import AlbumDeleteModal from "./AlbumDeleteModal"

import { 
    saveMusicTrackOnServer, 
    deleteMusicTrackOnServer, 
    bulkDeleteMusicTracksOnServer,
    saveCustomAlbumOnServer,
    deleteCustomAlbumOnServer,
    bulkDeleteCustomAlbumsOnServer
} from "./musicActions"

const ITEMS_PER_PAGE = 8

interface ToastMsg {
    type: "success" | "error"
    text: string
}

type TabType = "tracks" | "albums"

export default function MusicDashboardPage() {
    const { toggle: toggleSidebar } = useSidebar()

    const [activeTab, setActiveTab] = useState<TabType>("tracks")

    const [tracks, setTracks] = useState<any[]>([])
    const [albums, setAlbums] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Filters
    const [search, setSearch] = useState("")
    const [filterAlbum, setFilterAlbum] = useState<string>("all")
    const [page, setPage] = useState(1)

    const [saving, setSaving] = useState(false)
    const [isDeletingBulk, setIsDeletingBulk] = useState(false)
    const [toast, setToast] = useState<ToastMsg | null>(null)

    // Checkbox State
    const [selectedIds, setSelectedIds] = useState<number[]>([])

    // Modals - Tracks
    const [formModal, setFormModal] = useState<{ open: boolean, mode: "create" | "edit", data?: MusicTrackFormData }>({ open: false, mode: "create" })
    const [deleteModal, setDeleteModal] = useState<{ open: boolean, item: any | null }>({ open: false, item: null })
    
    // Modals - Albums
    const [albumFormModal, setAlbumFormModal] = useState<{ open: boolean, mode: "create" | "edit", data?: AlbumFormData }>({ open: false, mode: "create" })
    const [albumDeleteModal, setAlbumDeleteModal] = useState<{ open: boolean, item: any | null }>({ open: false, item: null })

    const [bulkDeleteModal, setBulkDeleteModal] = useState(false)

    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 3500)
            return () => clearTimeout(t)
        }
    }, [toast])

    useEffect(() => {
        setSelectedIds([])
        setPage(1)
        setSearch("")
        setFilterAlbum("all")
    }, [activeTab])

    useEffect(() => {
        setSelectedIds([])
    }, [page, search, filterAlbum])

    async function fetchMusicData() {
        setLoading(true)
        try {
            // 1. Fetch Tracks beserta relasi ke Custom Albums
            const { data: trackData, error: trackError } = await supabase
                .from("music_tracks")
                .select(`
          *,
          custom_album_tracks (
            custom_albums ( id, name )
          )
        `)
                .order("id", { ascending: false })

            if (trackError) throw trackError

            const formattedTracks = (trackData || []).map((t: any) => {
                const linkedAlbums = t.custom_album_tracks
                    .map((cat: any) => cat.custom_albums)
                    .filter(Boolean)

                return {
                    ...t,
                    linked_albums: linkedAlbums,
                    album_ids: linkedAlbums.map((a: any) => a.id)
                }
            })
            setTracks(formattedTracks)

            // 2. Fetch daftar Custom Albums beserta info lags (custom_album_tracks)
            const { data: albumData, error: albumError } = await supabase
                .from("custom_albums")
                .select(`
                    *,
                    custom_album_tracks(track_id)
                `)
                .order("id", { ascending: true })

            if (albumError) throw albumError
            
            const formattedAlbums = (albumData || []).map((a: any) => ({
                ...a,
                track_ids: a.custom_album_tracks.map((ct: any) => ct.track_id)
            }))
            setAlbums(formattedAlbums)

        } catch (err: any) {
            setToast({ type: "error", text: `Gagal memuat data: ${err.message}` })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchMusicData() }, [])

    // ─── Filter & Pagination ──────────────────────────────────────────────────
    
    const filteredTracks = useMemo(() => {
        return tracks.filter((t) => {
            const q = search.toLowerCase()
            const matchSearch = !q || (t.title || "").toLowerCase().includes(q) || (t.artist || "").toLowerCase().includes(q)
            const matchAlbum = filterAlbum === "all" || t.album_ids.includes(Number(filterAlbum))
            return matchSearch && matchAlbum
        })
    }, [tracks, search, filterAlbum])

    const filteredAlbums = useMemo(() => {
        return albums.filter((a) => {
            const q = search.toLowerCase()
            return !q || (a.name || "").toLowerCase().includes(q) || (a.description || "").toLowerCase().includes(q)
        })
    }, [albums, search])

    const activeList = activeTab === "tracks" ? filteredTracks : filteredAlbums
    const totalPages = Math.ceil(activeList.length / ITEMS_PER_PAGE)
    const paginated = activeList.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

    // ─── Stats ──────────────────────────────────────────────────────────────────
    const totalTracksCount = tracks.length
    const withSpotifyCount = tracks.filter(t => t.spotify_track_id).length
    const totalAlbumsCount = albums.length

    // ─── Selection Handlers ───────────────────────────────────────────────────

    function toggleSelectAll() {
        if (paginated.length === 0) return
        if (selectedIds.length === paginated.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(paginated.map(t => t.id))
        }
    }

    function toggleSelect(id: number) {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    // ─── Track Handlers ───────────────────────────────────────────────────────

    function openDeleteTrack(item: any) { setDeleteModal({ open: true, item }) }

    async function handleSaveTrack(data: MusicTrackFormData) {
        setSaving(true)
        try {
            const row: any = {
                title: data.title,
                artist: data.artist,
                spotify_track_id: data.spotify_track_id || null,
                notes: data.notes || null,
            }

            let res;
            if (formModal.mode === "create") {
                res = await saveMusicTrackOnServer(row, data.albumIds, "create")
            } else {
                res = await saveMusicTrackOnServer(row, data.albumIds, "edit", formModal.data?.id)
            }

            if (!res.success) throw new Error(res.error)

            await fetchMusicData()
            setFormModal({ open: false, mode: "create" })
            setToast({ type: "success", text: formModal.mode === "create" ? "Lagu berhasil ditambahkan." : "Lagu berhasil diperbarui." })
        } catch (err: any) {
            setToast({ type: "error", text: err.message })
        } finally {
            setSaving(false)
        }
    }

    async function handleDeleteTrack() {
        if (!deleteModal.item) return
        const item = deleteModal.item
        try {
            const res = await deleteMusicTrackOnServer(item.id)
            if (!res.success) throw new Error(res.error)
            await fetchMusicData()
            setSelectedIds(prev => prev.filter(id => id !== item.id))
            setPage(1)
            setToast({ type: "success", text: "Lagu berhasil dihapus." })
        } catch (err: any) {
            setToast({ type: "error", text: err.message })
        } finally {
            setDeleteModal({ open: false, item: null })
        }
    }

    // ─── Album Handlers ───────────────────────────────────────────────────────

    function openDeleteAlbum(item: any) { setAlbumDeleteModal({ open: true, item }) }

    async function handleSaveAlbum(data: AlbumFormData) {
        setSaving(true)
        try {
            const row: any = {
                name: data.name,
                description: data.description || null,
                cover_url: data.cover_url || null,
            }

            let res;
            if (albumFormModal.mode === "create") {
                res = await saveCustomAlbumOnServer(row, data.trackIds, "create")
            } else {
                res = await saveCustomAlbumOnServer(row, data.trackIds, "edit", albumFormModal.data?.id)
            }

            if (!res.success) throw new Error(res.error)

            await fetchMusicData()
            setAlbumFormModal({ open: false, mode: "create" })
            setToast({ type: "success", text: albumFormModal.mode === "create" ? "Playlist berhasil ditambahkan." : "Playlist berhasil diperbarui." })
        } catch (err: any) {
            setToast({ type: "error", text: err.message })
        } finally {
            setSaving(false)
        }
    }

    async function handleDeleteAlbum() {
        if (!albumDeleteModal.item) return
        const item = albumDeleteModal.item
        try {
            const res = await deleteCustomAlbumOnServer(item.id)
            if (!res.success) throw new Error(res.error)
            await fetchMusicData()
            setSelectedIds(prev => prev.filter(id => id !== item.id))
            setPage(1)
            setToast({ type: "success", text: "Playlist berhasil dihapus." })
        } catch (err: any) {
            setToast({ type: "error", text: err.message })
        } finally {
            setAlbumDeleteModal({ open: false, item: null })
        }
    }

    // ─── Bulk Actions ─────────────────────────────────────────────────────────

    async function handleBulkDelete() {
        setIsDeletingBulk(true)
        try {
            let result;
            if (activeTab === "tracks") {
                result = await bulkDeleteMusicTracksOnServer(selectedIds)
            } else {
                result = await bulkDeleteCustomAlbumsOnServer(selectedIds)
            }
            
            if (!result.success) throw new Error(result.error as string)

            await fetchMusicData()
            setSelectedIds([])

            const newTotal = activeList.length - selectedIds.length
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
        setFilterAlbum("all")
        setPage(1)
    }

    const hasActiveFilters = search || (activeTab === "tracks" && filterAlbum !== "all")

    return (
        <>
            <div className="flex flex-col h-full bg-[#050a0a]">
                {/* ── Page Header ── */}
                <div className="sticky top-0 z-10 flex flex-col px-4 md:px-8 pt-4 pb-2 border-b border-white/[0.06] bg-[#070e0e] shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <button onClick={toggleSidebar} className="p-2 -ml-1 rounded-xl hover:bg-white/[0.06] text-gray-400 md:hidden">
                                <Menu size={18} />
                            </button>
                            <div className="w-8 h-8 rounded-xl bg-accentColor/15 border border-accentColor/25 flex items-center justify-center">
                                <Music size={14} className="text-accentColor" />
                            </div>
                            <div>
                                <h1 className="text-sm font-semibold text-white leading-tight">Music Manager</h1>
                                <p className="text-[10px] text-gray-500 leading-tight hidden sm:block">Kelola Music Tracks & Playlist Albums</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {selectedIds.length > 0 && (
                                <button onClick={() => setBulkDeleteModal(true)} className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all">
                                    <Trash2 size={14} />
                                    <span className="hidden sm:inline">Hapus ({selectedIds.length})</span>
                                </button>
                            )}
                            {activeTab === "tracks" ? (
                                <button
                                    onClick={() => setFormModal({ open: true, mode: "create" })}
                                    className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-accentColor text-white rounded-xl hover:brightness-[0.85] transition-all"
                                >
                                    <Plus size={14} /> <span className="hidden sm:inline">Tambah Lagu</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => setAlbumFormModal({ open: true, mode: "create" })}
                                    className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-purple-500/90 text-white rounded-xl hover:bg-purple-500 transition-all"
                                >
                                    <Plus size={14} /> <span className="hidden sm:inline">Buat Playlist Baru</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Sub Tabs ── */}
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setActiveTab("tracks")}
                            className={cn("flex items-center gap-2 px-4 py-2 rounded-t-xl text-xs sm:text-sm font-medium transition-all border-b-2", activeTab === "tracks" ? "text-accentColor border-accentColor bg-accentColor/5" : "text-gray-400 border-transparent hover:bg-white/[0.02] hover:text-gray-300")}
                        >
                            <ListMusic size={14} /> Tracks
                        </button>
                        <button 
                            onClick={() => setActiveTab("albums")}
                            className={cn("flex items-center gap-2 px-4 py-2 rounded-t-xl text-xs sm:text-sm font-medium transition-all border-b-2", activeTab === "albums" ? "text-purple-400 border-purple-500 bg-purple-500/5" : "text-gray-400 border-transparent hover:bg-white/[0.02] hover:text-gray-300")}
                        >
                            <Layers size={14} /> Playlists / Albums
                        </button>
                    </div>
                </div>

                {/* ── Scrollable Content ── */}
                <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-6 space-y-5 md:space-y-6 scrollbar-none">

                    {/* ── Stats ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        <StatCard label="Total Lagu" value={totalTracksCount} icon={<Database size={15} className="text-gray-400" />} color="default" loading={loading} />
                        <StatCard label="Spotify Connected" value={withSpotifyCount} icon={<Disc size={15} className="text-emerald-400" />} color="green" loading={loading} />
                        <StatCard label="Total Playlist/Album" value={totalAlbumsCount} icon={<Layers size={15} className="text-purple-400" />} color="purple" loading={loading} />
                    </div>

                    {/* ── Toolbar ── */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            <input
                                type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                                placeholder={activeTab === "tracks" ? "Cari judul / artis..." : "Cari playlist..."}
                                className="w-full pl-9 pr-9 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-accentColor/50 transition-colors"
                            />
                            {search && (
                                <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"><X size={13} /></button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {activeTab === "tracks" && (
                                <select value={filterAlbum} onChange={(e) => { setFilterAlbum(e.target.value); setPage(1) }} className="flex-1 sm:w-auto px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-300 outline-none focus:border-accentColor/50 transition-colors appearance-none cursor-pointer">
                                    <option value="all" className="bg-[#0d1a1a]">Semua Album</option>
                                    {albums.map(a => <option key={a.id} value={a.id.toString()} className="bg-[#0d1a1a]">{a.name}</option>)}
                                </select>
                            )}

                            {hasActiveFilters && (
                                <button onClick={resetFilters} className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-gray-400 hover:text-gray-200 border border-white/[0.08] hover:border-white/20 rounded-xl transition-all shrink-0">
                                    <RefreshCw size={12} />
                                    <span className="hidden sm:inline">Reset</span>
                                </button>
                            )}
                        </div>

                        {hasActiveFilters && (
                            <span className="text-xs text-gray-500 shrink-0">{activeList.length}/{activeTab === "tracks" ? tracks.length : albums.length}</span>
                        )}
                    </div>

                    {/* ── Table / Content ── */}
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />)}
                        </div>
                    ) : (
                        <>
                            {/* Mobile View */}
                            <div className="md:hidden space-y-3">
                                {paginated.length === 0 ? (
                                    <EmptyState onReset={resetFilters} isAlbum={activeTab === "albums"} />
                                ) : activeTab === "tracks" ? (
                                    paginated.map((t, idx) => (
                                        <TrackCard
                                            key={t.id} item={t} rowNum={(page - 1) * ITEMS_PER_PAGE + idx + 1}
                                            isSelected={selectedIds.includes(t.id)} onToggle={() => toggleSelect(t.id)}
                                            onEdit={() => setFormModal({ open: true, mode: "edit", data: { ...t, albumIds: t.album_ids || [] } })}
                                            onDelete={() => openDeleteTrack(t)}
                                        />
                                    ))
                                ) : (
                                    paginated.map((a, idx) => (
                                        <AlbumCard
                                            key={a.id} item={a} rowNum={(page - 1) * ITEMS_PER_PAGE + idx + 1}
                                            isSelected={selectedIds.includes(a.id)} onToggle={() => toggleSelect(a.id)}
                                            onEdit={() => setAlbumFormModal({ open: true, mode: "edit", data: { ...a, trackIds: a.track_ids || [] } })}
                                            onDelete={() => openDeleteAlbum(a)}
                                        />
                                    ))
                                )}
                            </div>

                            {/* Desktop View */}
                            <div className="hidden md:block rounded-2xl border border-white/[0.07] overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[860px]">
                                        <thead>
                                            <tr className="bg-white/[0.04] border-b border-white/[0.06]">
                                                <th className="px-4 py-3.5 w-12 text-left"><input type="checkbox" checked={paginated.length > 0 && selectedIds.length === paginated.length} onChange={toggleSelectAll} className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]" /></th>
                                                <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-2 py-3.5 w-8">#</th>
                                                
                                                {activeTab === "tracks" ? (
                                                    <>
                                                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 min-w-[200px]">Track Info</th>
                                                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-48">Spotify ID</th>
                                                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 min-w-[180px]">Dalam Album</th>
                                                    </>
                                                ) : (
                                                    <>
                                                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 min-w-[220px]">Playlist Name</th>
                                                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-32">Jumlah Lagu</th>
                                                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 min-w-[220px]">Deskripsi</th>
                                                    </>
                                                )}
                                                
                                                <th className="text-right text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-5 py-3.5 w-24">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.04]">
                                            {paginated.length === 0 ? (
                                                <tr><td colSpan={activeTab === "tracks" ? 6 : 6} className="text-center py-16"><EmptyState onReset={resetFilters} isAlbum={activeTab === "albums"} /></td></tr>
                                            ) : activeTab === "tracks" ? (
                                                paginated.map((t, idx) => (
                                                    <TrackTableRow
                                                        key={t.id} item={t} rowNum={(page - 1) * ITEMS_PER_PAGE + idx + 1}
                                                        isSelected={selectedIds.includes(t.id)} onToggle={() => toggleSelect(t.id)}
                                                        onEdit={() => setFormModal({ open: true, mode: "edit", data: { ...t, albumIds: t.album_ids || [] } })}
                                                        onDelete={() => openDeleteTrack(t)}
                                                    />
                                                ))
                                            ) : (
                                                paginated.map((a, idx) => (
                                                    <AlbumTableRow
                                                        key={a.id} item={a} rowNum={(page - 1) * ITEMS_PER_PAGE + idx + 1}
                                                        isSelected={selectedIds.includes(a.id)} onToggle={() => toggleSelect(a.id)}
                                                        onEdit={() => setAlbumFormModal({ open: true, mode: "edit", data: { ...a, trackIds: a.track_ids || [] } })}
                                                        onDelete={() => openDeleteAlbum(a)}
                                                    />
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-5 py-3.5 border-t border-white/[0.06] bg-white/[0.02]">
                                    <p className="text-xs text-gray-500">Menampilkan <span className="text-gray-300 font-medium">{activeList.length === 0 ? 0 : Math.min((page - 1) * ITEMS_PER_PAGE + 1, activeList.length)}–{Math.min(page * ITEMS_PER_PAGE, activeList.length)}</span> dari <span className="text-gray-300 font-medium">{activeList.length}</span> entri</p>
                                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                                </div>
                            </div>

                            {totalPages > 1 && (
                                <div className="md:hidden flex items-center justify-between mt-4">
                                    <p className="text-xs text-gray-500">{activeList.length === 0 ? 0 : Math.min((page - 1) * ITEMS_PER_PAGE + 1, activeList.length)}–{Math.min(page * ITEMS_PER_PAGE, activeList.length)} / {activeList.length}</p>
                                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── Modals ── */}
            <MusicFormModal isOpen={formModal.open} mode={formModal.mode} initialData={formModal.data} albums={albums} onClose={() => setFormModal({ open: false, mode: "create" })} onSave={handleSaveTrack} externalSaving={saving} />
            <MusicDeleteModal isOpen={deleteModal.open} title={deleteModal.item?.title || ""} artist={deleteModal.item?.artist || ""} onClose={() => setDeleteModal({ open: false, item: null })} onConfirm={handleDeleteTrack} />

            <AlbumFormModal isOpen={albumFormModal.open} mode={albumFormModal.mode} initialData={albumFormModal.data} allTracks={tracks} onClose={() => setAlbumFormModal({ open: false, mode: "create" })} onSave={handleSaveAlbum} externalSaving={saving} />
            <AlbumDeleteModal isOpen={albumDeleteModal.open} albumName={albumDeleteModal.item?.name || ""} tracksCount={albumDeleteModal.item?.track_ids?.length || 0} onClose={() => setAlbumDeleteModal({ open: false, item: null })} onConfirm={handleDeleteAlbum} />

            {/* ── Bulk Delete Modal ── */}
            {bulkDeleteModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={() => !isDeletingBulk && setBulkDeleteModal(false)} />
                    <div className="relative w-full max-w-md bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center space-y-4 mt-2">
                            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/20"><AlertCircle size={26} className="text-red-400" /></div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1.5">Hapus {selectedIds.length} Data?</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">Apakah Anda yakin ingin menghapus {selectedIds.length} {activeTab === "tracks" ? "lagu" : "playlist"} yang dicentang? <span className="font-semibold text-gray-300">Tindakan ini tidak dapat dibatalkan.</span></p>
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

function StatCard({ label, value, icon, color, sub, loading }: any) {
    const borderColor = { default: "border-white/[0.07]", green: "border-emerald-500/20", purple: "border-purple-500/20" }[color as string]
    const valueCls = { default: "text-white", green: "text-emerald-400", purple: "text-purple-400" }[color as string]
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

function EmptyState({ onReset, isAlbum }: { onReset: () => void, isAlbum?: boolean }) {
    return (
        <div className="flex flex-col items-center gap-3 py-14 text-gray-500">
            {isAlbum ? <Layers size={28} className="opacity-30" /> : <Music size={28} className="opacity-30" />}
            <p className="text-sm">Tidak ada {isAlbum ? "playlist" : "lagu"} yang ditemukan.</p>
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

// ─── Sub-Components ──────────────────────────────────────────────────────────

function TrackCard({ item, rowNum, onEdit, onDelete, isSelected, onToggle }: any) {
    return (
        <div className={cn("rounded-2xl border bg-white/[0.02] p-4 space-y-4 transition-colors", isSelected ? "border-accentColor/40 bg-accentColor/5" : "border-white/[0.07]")}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="pt-0.5 shrink-0"><input type="checkbox" checked={isSelected} onChange={onToggle} className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]" /></div>
                    <div>
                        <p className="text-[13px] font-semibold text-gray-200 leading-snug truncate max-w-[200px]">{item.title}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1"><Mic2 size={10} /> {item.artist}</p>
                    </div>
                </div>
                <span className="text-xs text-gray-600 tabular-nums shrink-0">#{rowNum}</span>
            </div>

            <div className="flex flex-col pl-7 gap-2">
                {item.spotify_track_id ? (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded w-fit flex items-center gap-1.5"><Disc size={10} /> {item.spotify_track_id}</span>
                ) : (
                    <span className="text-[10px] text-gray-600 italic">No Spotify ID</span>
                )}

                <div className="flex flex-wrap gap-1 mt-1">
                    {item.linked_albums?.length > 0 ? (
                        item.linked_albums.map((a: any) => <span key={a.id} className="text-[9px] bg-white/[0.05] text-gray-400 border border-white/[0.08] px-1.5 py-0.5 rounded">{a.name}</span>)
                    ) : (
                        <span className="text-[10px] text-gray-500">- Tidak masuk album -</span>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-end gap-1.5 pl-7 pt-2 border-t border-white/[0.06]">
                <button onClick={onEdit} className="p-2 rounded-xl text-gray-500 hover:text-accentColor hover:bg-accentColor/10 border border-transparent hover:border-accentColor/20 transition-all"><Edit2 size={13} /></button>
                <button onClick={onDelete} className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"><Trash2 size={13} /></button>
            </div>
        </div>
    )
}

function TrackTableRow({ item, rowNum, onEdit, onDelete, isSelected, onToggle }: any) {
    return (
        <tr className={cn("group transition-colors", isSelected ? "bg-accentColor/5" : "hover:bg-white/[0.025]")}>
            <td className="px-4 py-3.5"><input type="checkbox" checked={isSelected} onChange={onToggle} className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]" /></td>
            <td className="px-2 py-3.5"><span className="text-xs text-gray-600 tabular-nums">{rowNum}</span></td>

            <td className="px-4 py-3.5">
                <div className="min-w-0 pr-4">
                    <p className="text-[13px] font-medium text-gray-200 line-clamp-1 group-hover:text-accentColor transition-colors">{item.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5"><Mic2 size={10} className="text-gray-600" /> {item.artist}</p>
                </div>
            </td>

            <td className="px-4 py-3.5">
                {item.spotify_track_id ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        <Disc size={11} /> {item.spotify_track_id}
                    </span>
                ) : (
                    <span className="text-[10px] text-gray-600 italic">-</span>
                )}
            </td>

            <td className="px-4 py-3.5">
                <div className="flex flex-col gap-1.5 items-start">
                    {item.linked_albums?.length > 0 ? (
                        item.linked_albums.map((a: any) => <span key={a.id} className="text-[10px] bg-white/[0.04] text-gray-300 border border-white/[0.08] px-2 py-0.5 rounded">{a.name}</span>)
                    ) : (
                        <span className="text-[10px] text-gray-600">-</span>
                    )}
                </div>
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

function AlbumCard({ item, rowNum, onEdit, onDelete, isSelected, onToggle }: any) {
    return (
        <div className={cn("rounded-2xl border bg-white/[0.02] p-4 space-y-4 transition-colors", isSelected ? "border-purple-500/40 bg-purple-500/5" : "border-white/[0.07]")}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="pt-0.5 shrink-0"><input type="checkbox" checked={isSelected} onChange={onToggle} className="w-4 h-4 rounded cursor-pointer accent-purple-500 bg-white/[0.05] border-white/[0.1]" /></div>
                    <div>
                        <p className="text-[13px] font-semibold text-gray-200 leading-snug truncate max-w-[200px]">{item.name}</p>
                        <p className="text-[11px] text-purple-400 mt-0.5 flex items-center gap-1"><ListMusic size={10} /> {item.track_ids?.length || 0} Lagu</p>
                    </div>
                </div>
                <span className="text-xs text-gray-600 tabular-nums shrink-0">#{rowNum}</span>
            </div>

            <div className="pl-7">
                <p className="text-[11px] text-gray-500 line-clamp-2">{item.description || <span className="italic">Tidak ada deskripsi</span>}</p>
            </div>

            <div className="flex items-center justify-end gap-1.5 pl-7 pt-2 border-t border-white/[0.06]">
                <button onClick={onEdit} className="p-2 rounded-xl text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-all"><Edit2 size={13} /></button>
                <button onClick={onDelete} className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"><Trash2 size={13} /></button>
            </div>
        </div>
    )
}

function AlbumTableRow({ item, rowNum, onEdit, onDelete, isSelected, onToggle }: any) {
    return (
        <tr className={cn("group transition-colors", isSelected ? "bg-purple-500/5" : "hover:bg-white/[0.025]")}>
            <td className="px-4 py-3.5"><input type="checkbox" checked={isSelected} onChange={onToggle} className="w-4 h-4 rounded cursor-pointer accent-purple-500 bg-white/[0.05] border-white/[0.1]" /></td>
            <td className="px-2 py-3.5"><span className="text-xs text-gray-600 tabular-nums">{rowNum}</span></td>

            <td className="px-4 py-3.5">
                <div className="min-w-0 pr-4">
                    <p className="text-[13px] font-medium text-gray-200 line-clamp-1 group-hover:text-purple-400 transition-colors">{item.name}</p>
                </div>
            </td>

            <td className="px-4 py-3.5">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-purple-500/10 text-[10px] font-medium text-purple-400 border border-purple-500/20">
                    <ListMusic size={11} /> {item.track_ids?.length || 0} Lagu
                </span>
            </td>

            <td className="px-4 py-3.5">
                <p className="text-[11px] text-gray-500 line-clamp-2">{item.description || <span className="italic">Tidak ada deskripsi</span>}</p>
            </td>

            <td className="px-5 py-3.5">
                <div className="flex items-center justify-end gap-1.5">
                    <button onClick={onEdit} title="Edit" className="p-2 rounded-xl text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-all">
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
