"use client"

import React, { useState, useMemo, useEffect } from "react"
import {
  Search, Plus, Edit2, Trash2, BookMarked, Calendar,
  ChevronLeft, ChevronRight, X, RefreshCw, AlertCircle,
  CheckCircle2, Loader2, Menu, Database, Tag, AlignLeft
} from "lucide-react"
import { cn } from "@/lib/utils"
import DiaryFormModal, { type DiaryFormData } from "@/components/dashboard/diary/DiaryFormModal"
import DiaryDeleteModal from "@/components/dashboard/diary/DiaryDeleteModal"
import { useDiaryStore } from "@/stores/DiaryStore"
import { useSidebar } from "@/components/dashboard/SidebarContext"
import type { Diary, DiaryMood } from "@/types/diary"
import { saveDiaryOnServer, deleteDiaryOnServer, bulkDeleteDiariesOnServer } from "./diaryActions"
import { useTranslations } from "next-intl"

// ─── Types & Constants ────────────────────────────────────────────────────────

interface DiaryEntry {
  id: string
  title: string
  content: string
  entry_date: string
  mood?: DiaryMood
  tags: string[]
  created_at: string
  updated_at: string
}

const MOODS: DiaryMood[] = ["Reflective", "Happy", "Thoughtful", "Melancholic", "Inspired", "Grateful"]
const ITEMS_PER_PAGE = 8
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

const MOOD_ICONS: Record<DiaryMood, string> = {
  Reflective: "🤔", Happy: "😊", Thoughtful: "💭",
  Melancholic: "😢", Inspired: "✨", Grateful: "🙏",
}

const MOOD_COLORS: Record<DiaryMood, string> = {
  Reflective: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  Happy: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  Thoughtful: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  Melancholic: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  Inspired: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  Grateful: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
}

interface ToastMsg {
  type: "success" | "error"
  text: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function diaryToDiaryEntry(diary: Diary): DiaryEntry {
  return {
    id: diary.id,
    title: diary.title || "Untitled",
    content: diary.content || "",
    entry_date: diary.entry_date || new Date().toISOString().split('T')[0],
    mood: diary.mood,
    tags: diary.tags || [],
    created_at: diary.created_at || new Date().toISOString(),
    updated_at: diary.updated_at || new Date().toISOString(),
  }
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

function generateId() {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DiaryDashboardPage() {
  const t = useTranslations("diaryDashboard")
  const { diaries: storeDiaries, loading, fetchDiaries } = useDiaryStore()
  const { toggle: toggleSidebar } = useSidebar()

  const [search, setSearch] = useState("")
  const [filterMood, setFilterMood] = useState<"All" | DiaryMood>("All")
  const [page, setPage] = useState(1)

  const [saving, setSaving] = useState(false)
  const [isDeletingBulk, setIsDeletingBulk] = useState(false)
  const [toast, setToast] = useState<ToastMsg | null>(null)

  // Checkbox State
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Modals state
  const [formModal, setFormModal] = useState<{ open: boolean, mode: "create" | "edit", data?: DiaryFormData }>({ open: false, mode: "create" })
  const [deleteModal, setDeleteModal] = useState<{ open: boolean, entry: DiaryEntry | null }>({ open: false, entry: null })
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false)

  useEffect(() => { fetchDiaries() }, [fetchDiaries])

  useEffect(() => { setSelectedIds([]) }, [page, search, filterMood])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const entries = useMemo(() => storeDiaries.map(diaryToDiaryEntry), [storeDiaries])

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      const q = search.toLowerCase()
      const matchSearch = !q || (entry.title?.toLowerCase() || "").includes(q) || (entry.tags || []).some((tag) => (tag?.toLowerCase() || "").includes(q))
      const matchMood = filterMood === "All" || entry.mood === filterMood
      return matchSearch && matchMood
    })
  }, [entries, search, filterMood])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const totalEntries = entries.length
  const moodCounts: Record<string, number> = {}
  entries.forEach((e) => {
    if (e.mood) moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1
  })

  // ─── Selection Handlers ───────────────────────────────────────────────────

  function toggleSelectAll() {
    if (paginated.length === 0) return
    if (selectedIds.length === paginated.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(paginated.map((e) => e.id))
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }

  // ─── Action Handlers ──────────────────────────────────────────────────────

  function openDelete(entry: DiaryEntry) {
    setDeleteModal({ open: true, entry })
  }

  async function handleSave(data: DiaryFormData) {
    setSaving(true)
    try {
      const row: any = {
        title: data.title,
        content: data.content,
        entry_date: data.entry_date,
        mood: data.mood || null,
        tags: data.tags || [],
      }

      let res;
      if (formModal.mode === "create") {
        row.id = (data.id && data.id.trim() !== "") ? data.id : generateId()
        res = await saveDiaryOnServer(row, "create")
      } else {
        res = await saveDiaryOnServer(row, "edit", formModal.data?.id)
      }

      if (!res.success) throw new Error(res.error)

      await fetchDiaries()
      setFormModal({ open: false, mode: "create" })
      setToast({ type: "success", text: formModal.mode === "create" ? (t("toast_create_success") || "Diary entry berhasil dibuat.") : (t("toast_edit_success") || "Diary entry berhasil diperbarui.") })
    } catch (err: any) {
      setToast({ type: "error", text: `${t("toast_error") || "Gagal menyimpan"}: ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteModal.entry) return
    const entry = deleteModal.entry

    try {
      const res = await deleteDiaryOnServer(entry.id)
      if (!res.success) throw new Error(res.error as string)

      await fetchDiaries()
      setSelectedIds(prev => prev.filter(id => id !== entry.id))
      setPage(1)
      setToast({ type: "success", text: t("toast_delete_success") || "Diary entry berhasil dihapus." })
    } catch (err: any) {
      setToast({ type: "error", text: `${t("toast_delete_error") || "Gagal menghapus"}: ${err.message}` })
    } finally {
      setDeleteModal({ open: false, entry: null })
    }
  }

  async function handleBulkDelete() {
    setIsDeletingBulk(true)
    try {
      const res = await bulkDeleteDiariesOnServer(selectedIds)
      if (!res.success) throw new Error(res.error as string)

      await fetchDiaries()
      setSelectedIds([])
      
      const newTotal = filtered.length - selectedIds.length
      const maxPage = Math.ceil(newTotal / ITEMS_PER_PAGE) || 1
      if (page > maxPage) setPage(maxPage)

      setToast({ type: "success", text: t("toast_bulk_delete_success") || `${res.count} diary entries berhasil dihapus.` })
    } catch (err: any) {
      setToast({ type: "error", text: `${t("toast_bulk_delete_error") || "Gagal menghapus"}: ${err.message}` })
    } finally {
      setIsDeletingBulk(false)
      setBulkDeleteModal(false)
    }
  }

  function resetFilters() {
    setSearch("")
    setFilterMood("All")
    setPage(1)
  }

  const hasActiveFilters = search || filterMood !== "All"

  // ─── Render ───────────────────────────────────────────────────────────────

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
              <BookMarked size={14} className="text-accentColor" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-tight">{t("title") || "Diary Management"}</h1>
              <p className="text-[10px] text-gray-500 leading-tight hidden sm:block">Kelola jurnal & refleksi pribadi</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <button onClick={() => setBulkDeleteModal(true)} className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all">
                <Trash2 size={14} />
                <span className="hidden sm:inline">Hapus ({selectedIds.length})</span>
                <span className="sm:hidden">({selectedIds.length})</span>
              </button>
            )}
            <button onClick={() => setFormModal({ open: true, mode: "create" })} className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-accentColor text-white rounded-xl hover:brightness-[0.85] transition-all hover:shadow-lg hover:shadow-accentColor/20">
              <Plus size={14} /> <span className="hidden sm:inline">{t("btn_new") || "New Entry"}</span>
              <span className="sm:hidden">Baru</span>
            </button>
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-6 space-y-5 md:space-y-6 scrollbar-none">
          
          {/* ── Stats ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatCard label="Total Entries" value={totalEntries} icon={<Database size={15} className="text-gray-400" />} color="default" loading={loading} />
            <StatCard label="Reflective" value={moodCounts["Reflective"] || 0} icon={<span className="text-sm">🤔</span>} color="blue" loading={loading} />
            <StatCard label="Inspired" value={moodCounts["Inspired"] || 0} icon={<span className="text-sm">✨</span>} color="purple" loading={loading} />
            <StatCard label="Grateful" value={moodCounts["Grateful"] || 0} icon={<span className="text-sm">🙏</span>} color="green" loading={loading} />
          </div>

          {/* ── Toolbar ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder={t("search_placeholder") || "Cari judul atau tags..."}
                className="w-full pl-9 pr-9 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-accentColor/50 transition-colors"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"><X size={13} /></button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select value={filterMood} onChange={(e) => { setFilterMood(e.target.value as any); setPage(1) }} className="flex-1 sm:w-auto px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-300 outline-none focus:border-accentColor/50 transition-colors appearance-none cursor-pointer">
                <option value="All" className="bg-[#0d1a1a]">{t("filter_all_moods") || "Semua Mood"}</option>
                {MOODS.map(m => <option key={m} value={m} className="bg-[#0d1a1a]">{m}</option>)}
              </select>

              {hasActiveFilters && (
                <button onClick={resetFilters} className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-gray-400 hover:text-gray-200 border border-white/[0.08] hover:border-white/20 rounded-xl transition-all shrink-0">
                  <RefreshCw size={12} />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
            
            {hasActiveFilters && (
              <span className="text-xs text-gray-500 shrink-0">{filtered.length}/{entries.length}</span>
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
                  paginated.map((e, idx) => (
                    <DiaryCard
                      key={e.id} item={e} rowNum={(page - 1) * ITEMS_PER_PAGE + idx + 1}
                      isSelected={selectedIds.includes(e.id)} onToggle={() => toggleSelect(e.id)}
                      onEdit={() => setFormModal({ open: true, mode: "edit", data: e as any })}
                      onDelete={() => openDelete(e)} 
                    />
                  ))
                )}
              </div>

              {/* ── Desktop Table (>= md) ── */}
              <div className="hidden md:block rounded-2xl border border-white/[0.07] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="bg-white/[0.04] border-b border-white/[0.06]">
                        <th className="px-4 py-3.5 w-12 text-left"><input type="checkbox" checked={paginated.length > 0 && selectedIds.length === paginated.length} onChange={toggleSelectAll} className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]" /></th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-2 py-3.5 w-8">#</th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 min-w-[260px]">{t("col_title") || "Info Diary"}</th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-40">{t("col_date") || "Tanggal"}</th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-36">{t("col_mood") || "Mood"}</th>
                        <th className="text-right text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-5 py-3.5 w-24">{t("col_actions") || "Aksi"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {paginated.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-16"><EmptyState onReset={resetFilters} /></td></tr>
                      ) : (
                        paginated.map((e, idx) => (
                          <DiaryTableRow
                            key={e.id} item={e} rowNum={(page - 1) * ITEMS_PER_PAGE + idx + 1}
                            isSelected={selectedIds.includes(e.id)} onToggle={() => toggleSelect(e.id)}
                            onEdit={() => setFormModal({ open: true, mode: "edit", data: e as any })}
                            onDelete={() => openDelete(e)}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Table Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-5 py-3.5 border-t border-white/[0.06] bg-white/[0.02]">
                  <p className="text-xs text-gray-500">
                    {t("pagination_showing") || "Menampilkan"} <span className="text-gray-300 font-medium">{filtered.length === 0 ? 0 : Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)}</span> {t("pagination_of") || "dari"} <span className="text-gray-300 font-medium">{filtered.length}</span> entri
                  </p>
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              </div>

              {/* ── Mobile Pagination ── */}
              {totalPages > 1 && (
                <div className="md:hidden flex items-center justify-between mt-4">
                  <p className="text-xs text-gray-500">{filtered.length === 0 ? 0 : Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} / {filtered.length}</p>
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <DiaryFormModal isOpen={formModal.open} mode={formModal.mode} initialData={formModal.data} onClose={() => setFormModal({ open: false, mode: "create" })} onSave={handleSave} externalSaving={saving} />
      <DiaryDeleteModal isOpen={deleteModal.open} title={deleteModal.entry?.title || ""} onClose={() => setDeleteModal({ open: false, entry: null })} onConfirm={handleDelete} />

      {/* ── Bulk Delete Modal ── */}
      {bulkDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={() => !isDeletingBulk && setBulkDeleteModal(false)} />
          <div className="relative w-full max-w-md bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4 mt-2">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/20"><AlertCircle size={26} className="text-red-400" /></div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1.5">Hapus {selectedIds.length} Diary?</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Apakah Anda yakin ingin menghapus {selectedIds.length} diary yang dicentang? <span className="font-semibold text-gray-300">Tindakan ini tidak dapat dibatalkan.</span></p>
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
  const borderColor = { default: "border-white/[0.07]", green: "border-emerald-500/20", blue: "border-blue-500/20", purple: "border-purple-500/20" }[color as string]
  const valueCls = { default: "text-white", green: "text-emerald-400", blue: "text-blue-400", purple: "text-purple-400" }[color as string]
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
      <BookMarked size={28} className="opacity-30" />
      <p className="text-sm">Tidak ada catatan yang ditemukan.</p>
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

function DiaryCard({ item, rowNum, onEdit, onDelete, isSelected, onToggle }: any) {
  return (
    <div className={cn("rounded-2xl border bg-white/[0.02] p-4 space-y-4 transition-colors", isSelected ? "border-accentColor/40 bg-accentColor/5" : "border-white/[0.07]")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="pt-0.5 shrink-0"><input type="checkbox" checked={isSelected} onChange={onToggle} className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]" /></div>
          <div>
            <p className="text-sm font-semibold text-gray-200 leading-snug line-clamp-2">{item.title}</p>
            <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-1"><Calendar size={10}/> {formatShortDate(item.entry_date)}</p>
          </div>
        </div>
        <span className="text-xs text-gray-600 tabular-nums shrink-0">#{rowNum}</span>
      </div>

      <div className="flex flex-col pl-7 gap-1.5">
        <div className="flex items-center gap-2">
          {item.mood ? (
            <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-medium", MOOD_COLORS[item.mood as DiaryMood])}>
              {MOOD_ICONS[item.mood as DiaryMood]} {item.mood}
            </span>
          ) : <span className="text-[10px] text-gray-600 italic">No mood</span>}
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {item.tags?.slice(0, 3).map((t: string) => <span key={t} className="text-[9px] bg-white/[0.03] text-gray-500 border border-white/[0.06] px-1.5 py-0.5 rounded">#{t}</span>)}
          {item.tags?.length > 3 && <span className="text-[9px] text-gray-600">+{item.tags.length - 3}</span>}
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-white/[0.06]">
        <button onClick={onEdit} className="p-2 rounded-xl text-gray-500 hover:text-accentColor hover:bg-accentColor/10 border border-transparent hover:border-accentColor/20 transition-all"><Edit2 size={13} /></button>
        <button onClick={onDelete} className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"><Trash2 size={13} /></button>
      </div>
    </div>
  )
}

function DiaryTableRow({ item, rowNum, onEdit, onDelete, isSelected, onToggle }: any) {
  return (
    <tr className={cn("group transition-colors", isSelected ? "bg-accentColor/5" : "hover:bg-white/[0.025]")}>
      <td className="px-4 py-3.5"><input type="checkbox" checked={isSelected} onChange={onToggle} className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]" /></td>
      <td className="px-2 py-3.5"><span className="text-xs text-gray-600 tabular-nums">{rowNum}</span></td>
      
      <td className="px-4 py-3.5">
        <div className="min-w-0 pr-4">
          <p className="text-[13px] font-medium text-gray-200 line-clamp-1">{item.title}</p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {item.tags?.slice(0, 2).map((t: string) => <span key={t} className="text-[9px] bg-white/[0.03] text-gray-500 border border-white/[0.06] px-1.5 py-0.5 rounded">#{t}</span>)}
            {item.tags?.length > 2 && <span className="text-[9px] text-gray-600">+{item.tags.length - 2}</span>}
          </div>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <span className="text-[11px] text-gray-400 flex items-center gap-1.5 font-mono"><Calendar size={11} className="text-gray-600"/>{formatShortDate(item.entry_date)}</span>
      </td>

      <td className="px-4 py-3.5">
        {item.mood ? (
          <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-medium", MOOD_COLORS[item.mood as DiaryMood])}>
            {MOOD_ICONS[item.mood as DiaryMood]} {item.mood}
          </span>
        ) : <span className="text-[10px] text-gray-600 italic">-</span>}
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