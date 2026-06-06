"use client"

import React, { useState, useEffect, useMemo } from "react"
import { 
  Search, Plus, Edit2, Trash2, Menu, AlertCircle, 
  CheckCircle2, ChevronLeft, ChevronRight, X, RefreshCw, 
  ListFilter, Image as ImageIcon, MapPin, Database, CheckSquare, 
  GraduationCap, Briefcase
} from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useSidebar } from "@/components/dashboard/SidebarContext"

import TimelineFormModal, { type TimelineFormData } from "./TimelineFormModal"
import TimelineDeleteModal from "./TimelineDeleteModal"
import { saveTimelineOnServer, deleteTimelineOnServer, bulkDeleteTimelinesOnServer } from "./timelineActions"

const CATEGORIES = ["Pendidikan", "Kursus & Bootcamp", "Karir & Magang", "Pencapaian & Award", "Organisasi & Komunitas"]

const ITEMS_PER_PAGE = 6

interface ToastMsg {
  type: "success" | "error"
  text: string
}

export default function TimelineDashboardPage() {
  const { toggle: toggleSidebar } = useSidebar()
  
  const [timelines, setTimelines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [page, setPage] = useState(1)
  
  const [saving, setSaving] = useState(false)
  const [isDeletingBulk, setIsDeletingBulk] = useState(false)
  const [toast, setToast] = useState<ToastMsg | null>(null)

  // Checkbox State
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Modals
  const [formModal, setFormModal] = useState<{ open: boolean, mode: "create" | "edit", data?: TimelineFormData }>({ open: false, mode: "create" })
  const [deleteModal, setDeleteModal] = useState<{ open: boolean, item: any | null }>({ open: false, item: null })
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false)

  const STORAGE_BUCKET = "timeline"

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(t)
    }
  }, [toast])

  // Reset checkboxes if filter changes
  useEffect(() => {
    setSelectedIds([])
  }, [page, search, filterCategory])

  async function fetchTimelines() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("timelines")
        .select("*")
        .order("id", { ascending: false })

      if (error) throw error
      setTimelines(data || [])
    } catch (err: any) {
      setToast({ type: "error", text: `Gagal memuat data: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTimelines() }, [])

  const filtered = useMemo(() => {
    return timelines.filter((t) => {
      const q = search.toLowerCase()
      const matchSearch = !q || (t.title || "").toLowerCase().includes(q) || (t.type || "").toLowerCase().includes(q)
      const matchCat = filterCategory === "all" || t.category === filterCategory
      
      return matchSearch && matchCat
    })
  }, [timelines, search, filterCategory])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const totalItems = timelines.length
  const completedCount = timelines.filter(t => t.status === "Selesai").length
  const eduCount = timelines.filter(t => t.category === "Pendidikan").length
  const workCount = timelines.filter(t => t.category === "Karir & Magang").length

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

  // ─── Extraction Helper for Deletion ───────────────────────────────────────
  function getPathsFromTimeline(item: any) {
    if (!item.photos || !Array.isArray(item.photos)) return []
    const paths: string[] = []
    const pathIdentifier = `/public/${STORAGE_BUCKET}/`
    
    item.photos.forEach((photo: any) => {
      if (photo.src && photo.src.includes(pathIdentifier)) {
        paths.push(photo.src.substring(photo.src.indexOf(pathIdentifier) + pathIdentifier.length))
      }
    })
    return paths
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function openDelete(item: any) {
    setDeleteModal({ open: true, item })
  }

  async function handleSave(data: TimelineFormData) {
    setSaving(true)
    try {
      const row: any = { ...data }
      delete row.id // ID biarkan database yang mengurus saat create

      let res;
      if (formModal.mode === "create") {
        res = await saveTimelineOnServer(row, "create")
      } else {
        res = await saveTimelineOnServer(row, "edit", formModal.data?.id)
      }

      if (!res.success) throw new Error(res.error)

      await fetchTimelines()
      setFormModal({ open: false, mode: "create" })
      setToast({ type: "success", text: formModal.mode === "create" ? "Data berhasil ditambahkan." : "Data berhasil diperbarui." })
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
      const pathsToDelete = getPathsFromTimeline(item)
      const res = await deleteTimelineOnServer(item.id, STORAGE_BUCKET, pathsToDelete)
      if (!res.success) throw new Error(res.error)

      await fetchTimelines()
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
        const item = timelines.find((t) => t.id === id)
        return { id, storageBucket: STORAGE_BUCKET, filePaths: getPathsFromTimeline(item) }
      })

      const result = await bulkDeleteTimelinesOnServer(itemsToDelete)
      if (!result.success) throw new Error(result.error as string)

      await fetchTimelines()
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
    setFilterCategory("all")
    setPage(1)
  }

  const hasActiveFilters = search || filterCategory !== "all"

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
              <GraduationCap size={14} className="text-accentColor" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-tight">Timeline & Journey</h1>
              <p className="text-[10px] text-gray-500 leading-tight hidden sm:block">Kelola entri perjalanan hidup/karir</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                onClick={() => setBulkDeleteModal(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 hover:border-red-500/30 transition-all"
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Hapus ({selectedIds.length})</span>
                <span className="sm:hidden">({selectedIds.length})</span>
              </button>
            )}
            <button
              onClick={() => setFormModal({ open: true, mode: "create" })}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-accentColor text-white rounded-xl hover:brightness-[0.85] transition-all hover:shadow-lg hover:shadow-accentColor/20"
            >
              <Plus size={14} /> <span className="hidden sm:inline">New Entry</span>
              <span className="sm:hidden">Baru</span>
            </button>
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-6 space-y-5 md:space-y-6 scrollbar-none">
          
          {/* ── Stats ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatCard label="Total Entri" value={totalItems} icon={<Database size={15} className="text-gray-400" />} color="default" loading={loading} />
            <StatCard label="Status Selesai" value={completedCount} icon={<CheckSquare size={15} className="text-emerald-400" />} color="green" loading={loading} />
            <StatCard label="Pendidikan" value={eduCount} icon={<GraduationCap size={15} className="text-blue-400" />} color="blue" loading={loading} />
            <StatCard label="Karir & Magang" value={workCount} icon={<Briefcase size={15} className="text-amber-400" />} color="yellow" loading={loading} />
          </div>

          {/* ── Toolbar ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Cari judul / tipe..."
                className="w-full pl-9 pr-9 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-accentColor/50 transition-colors"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1) }} className="flex-1 sm:w-auto px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-300 outline-none focus:border-accentColor/50 transition-colors appearance-none cursor-pointer">
                <option value="all" className="bg-[#0d1a1a]">Semua Kategori</option>
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0d1a1a]">{c}</option>)}
              </select>

              {hasActiveFilters && (
                <button onClick={resetFilters} className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-gray-400 hover:text-gray-200 border border-white/[0.08] hover:border-white/20 rounded-xl transition-all shrink-0">
                  <RefreshCw size={12} />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
            
            {hasActiveFilters && (
              <span className="text-xs text-gray-500 shrink-0">
                {filtered.length}/{timelines.length}
              </span>
            )}
          </div>

          {/* ── Table / Content ── */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />)}
            </div>
          ) : (
            <>
              {/* ── Mobile Card List (< md) ── */}
              <div className="md:hidden space-y-3">
                {paginated.length === 0 ? (
                  <EmptyState onReset={resetFilters} />
                ) : (
                  paginated.map((t, idx) => (
                    <TimelineCard
                      key={t.id} item={t}
                      rowNum={(page - 1) * ITEMS_PER_PAGE + idx + 1}
                      isSelected={selectedIds.includes(t.id)}
                      onToggle={() => toggleSelect(t.id)}
                      onEdit={() => setFormModal({ open: true, mode: "edit", data: t })}
                      onDelete={() => openDelete(t)} 
                    />
                  ))
                )}
              </div>

              {/* ── Desktop Table (>= md) ── */}
              <div className="hidden md:block rounded-2xl border border-white/[0.07] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px]">
                    <thead>
                      <tr className="bg-white/[0.04] border-b border-white/[0.06]">
                        <th className="px-4 py-3.5 w-12 text-left">
                          <input
                            type="checkbox" checked={paginated.length > 0 && selectedIds.length === paginated.length} onChange={toggleSelectAll}
                            className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]"
                          />
                        </th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-2 py-3.5 w-8">#</th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 min-w-[260px]">Informasi Timeline</th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-40">Kategori</th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-36">Periode</th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-24">Media</th>
                        <th className="text-right text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-5 py-3.5 w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {paginated.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-16">
                            <EmptyState onReset={resetFilters} />
                          </td>
                        </tr>
                      ) : (
                        paginated.map((t, idx) => (
                          <TimelineTableRow
                            key={t.id} item={t}
                            rowNum={(page - 1) * ITEMS_PER_PAGE + idx + 1}
                            isSelected={selectedIds.includes(t.id)}
                            onToggle={() => toggleSelect(t.id)}
                            onEdit={() => setFormModal({ open: true, mode: "edit", data: t })}
                            onDelete={() => openDelete(t)}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Table Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-5 py-3.5 border-t border-white/[0.06] bg-white/[0.02]">
                  <p className="text-xs text-gray-500">
                    Menampilkan <span className="text-gray-300 font-medium">{filtered.length === 0 ? 0 : Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)}</span> dari <span className="text-gray-300 font-medium">{filtered.length}</span> entri
                  </p>
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <TimelineFormModal
        isOpen={formModal.open}
        mode={formModal.mode}
        initialData={formModal.data}
        onClose={() => setFormModal({ open: false, mode: "create" })}
        onSave={handleSave}
        externalSaving={saving}
      />

      <TimelineDeleteModal
        isOpen={deleteModal.open}
        timelineTitle={deleteModal.item?.title || ""}
        onClose={() => setDeleteModal({ open: false, item: null })}
        onConfirm={handleDelete}
      />

      {/* ── Bulk Delete Modal ── */}
      {bulkDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={() => !isDeletingBulk && setBulkDeleteModal(false)} />
          <div className="relative w-full max-w-md bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4 mt-2">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/20">
                <AlertCircle size={26} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1.5">Hapus {selectedIds.length} Data?</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Apakah Anda yakin ingin menghapus {selectedIds.length} entri timeline beserta foto-fotonya? <br/>
                  <span className="font-semibold text-gray-300">Tindakan ini tidak dapat dibatalkan.</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 bg-white/[0.02] border-t border-white/[0.06]">
              <button onClick={() => setBulkDeleteModal(false)} disabled={isDeletingBulk} className="flex-1 py-2.5 text-sm font-medium text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-all disabled:opacity-50">
                Batal
              </button>
              <button onClick={handleBulkDelete} disabled={isDeletingBulk} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-red-500/90 hover:bg-red-500 rounded-xl transition-all disabled:opacity-50">
                {isDeletingBulk ? <RefreshCw size={16} className="animate-spin" /> : "Ya, Hapus Semua"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-4 right-4 z-[70] animate-in slide-in-from-right-4 fade-in duration-300">
          <div className={cn("flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm shadow-2xl min-w-[260px] max-w-[360px]", toast.type === "success" ? "bg-[#0a1f1a] border-emerald-500/30 text-emerald-400 shadow-emerald-900/30" : "bg-[#1f0a0a] border-red-500/30 text-red-400 shadow-red-900/30")}>
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
  const borderColor = { default: "border-white/[0.07]", green: "border-emerald-500/20", blue: "border-blue-500/20", yellow: "border-amber-500/20" }[color as string]
  const valueCls = { default: "text-white", green: "text-emerald-400", blue: "text-blue-400", yellow: "text-amber-400" }[color as string]
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
      <GraduationCap size={28} className="opacity-30" />
      <p className="text-sm">Tidak ada data yang ditemukan.</p>
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

function TimelineCard({ item, rowNum, onEdit, onDelete, isSelected, onToggle }: any) {
  return (
    <div className={cn("rounded-2xl border bg-white/[0.02] p-4 space-y-4 transition-colors", isSelected ? "border-accentColor/40 bg-accentColor/5" : "border-white/[0.07]")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="pt-0.5 shrink-0">
            <input type="checkbox" checked={isSelected} onChange={onToggle} className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-200 leading-snug">{item.title}</p>
            <p className="text-[11px] text-accentColor font-medium mt-0.5">{item.type}</p>
          </div>
        </div>
        <span className="text-xs text-gray-600 tabular-nums shrink-0">#{rowNum}</span>
      </div>

      <div className="flex flex-col gap-1.5 pl-7">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-gray-400">{item.category}</span>
          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md border", item.status === "Selesai" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-blue-500/15 text-blue-400 border-blue-500/20")}>{item.status}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <MapPin size={12} className="text-gray-500" />
          <span className="text-[11px] text-gray-400">{item.location}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pl-7 pt-2">
        <span className="text-[10px] text-gray-500">{item.period_start} - {item.period_end}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={onEdit} className="p-2 rounded-xl text-gray-500 hover:text-accentColor hover:bg-accentColor/10 border border-transparent hover:border-accentColor/20 transition-all"><Edit2 size={13} /></button>
          <button onClick={onDelete} className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"><Trash2 size={13} /></button>
        </div>
      </div>
    </div>
  )
}

function TimelineTableRow({ item, rowNum, onEdit, onDelete, isSelected, onToggle }: any) {
  return (
    <tr className={cn("group transition-colors", isSelected ? "bg-accentColor/5" : "hover:bg-white/[0.025]")}>
      <td className="px-4 py-3.5"><input type="checkbox" checked={isSelected} onChange={onToggle} className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]" /></td>
      <td className="px-2 py-3.5"><span className="text-xs text-gray-600 tabular-nums">{rowNum}</span></td>
      
      <td className="px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-gray-200 line-clamp-1">{item.title}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] text-accentColor font-semibold">{item.type}</span>
            <span className="text-[10px] text-gray-500 flex items-center gap-1"><MapPin size={10}/> {item.location.split(',')[0]}</span>
          </div>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <span className="text-[11px] font-medium px-2 py-1 rounded bg-white/[0.05] border border-white/[0.08] text-gray-400">{item.category}</span>
      </td>

      <td className="px-4 py-3.5">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-gray-300 font-mono">{item.period_start} - {item.period_end}</span>
          <span className={cn("inline-flex w-fit px-1.5 py-0.5 rounded text-[9px] font-medium", item.status === "Selesai" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400")}>{item.status}</span>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <ImageIcon size={12} /> {item.photos?.length || 0} Foto
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
