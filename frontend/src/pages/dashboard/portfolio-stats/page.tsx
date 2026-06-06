"use client"

import React, { useState, useEffect, useMemo } from "react"
import { 
  Search, Plus, Edit2, Trash2, Menu, AlertCircle, 
  CheckCircle2, ChevronLeft, ChevronRight, X, RefreshCw, 
  BarChart, Database, CalendarDays
} from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useSidebar } from "@/components/dashboard/SidebarContext"

import PortfolioStatsFormModal, { type PortfolioStatFormData } from "./PortfolioStatsFormModal"
import PortfolioStatsDeleteModal from "./PortfolioStatsDeleteModal"
import { savePortfolioStatOnServer, deletePortfolioStatOnServer } from "./portfolioStatsActions"

const ITEMS_PER_PAGE = 5

interface ToastMsg {
  type: "success" | "error"
  text: string
}

function generateId() {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export default function PortfolioStatsDashboardPage() {
  const { toggle: toggleSidebar } = useSidebar()
  
  const [stats, setStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastMsg | null>(null)

  // Modals State
  const [formModal, setFormModal] = useState<{ open: boolean, mode: "create" | "edit", data?: PortfolioStatFormData }>({ open: false, mode: "create" })
  const [deleteModal, setDeleteModal] = useState<{ open: boolean, stat: any | null }>({ open: false, stat: null })
  
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(t)
    }
  }, [toast])

  async function fetchStats() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("portfolio_stats")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setStats(data || [])
    } catch (err: any) {
      setToast({ type: "error", text: `Gagal memuat data: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  const filtered = useMemo(() => {
    return stats.filter((s) => {
      const q = search.toLowerCase()
      return !q || (s.id || "").toLowerCase().includes(q)
    })
  }, [stats, search])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  // Singleton logic check
  const hasExistingData = stats.length >= 1

  function openDelete(stat: any) {
    setDeleteModal({ open: true, stat })
  }

  async function handleSave(data: PortfolioStatFormData) {
    setSaving(true)
    try {
      const row: any = {
        years_experience: data.years_experience,
      }

      let res;
      if (formModal.mode === "create") {
        row.id = (data.id && data.id.trim() !== "") ? data.id : generateId()
        res = await savePortfolioStatOnServer(row, "create")
      } else {
        res = await savePortfolioStatOnServer(row, "edit", formModal.data?.id)
      }

      if (!res.success) throw new Error(res.error)

      await fetchStats()
      setFormModal({ open: false, mode: "create" })
      setToast({ type: "success", text: formModal.mode === "create" ? "Data stat berhasil dibuat." : "Data stat berhasil diperbarui." })
    } catch (err: any) {
      setToast({ type: "error", text: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteModal.stat) return
    const stat = deleteModal.stat

    try {
      const res = await deletePortfolioStatOnServer(stat.id)
      if (!res.success) throw new Error(res.error)

      await fetchStats()
      setPage(1)
      setToast({ type: "success", text: "Data stat berhasil dihapus." })
    } catch (err: any) {
      setToast({ type: "error", text: err.message })
    } finally {
      setDeleteModal({ open: false, stat: null })
    }
  }

  function resetFilters() {
    setSearch("")
    setPage(1)
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
              <BarChart size={14} className="text-accentColor" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-tight">Portfolio Stats</h1>
              <p className="text-[10px] text-gray-500 leading-tight hidden sm:block">Kelola konfigurasi tabel <span className="font-mono">portfolio_stats</span></p>
            </div>
          </div>
          <button
            onClick={() => setFormModal({ open: true, mode: "create" })}
            disabled={hasExistingData}
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white rounded-xl transition-all",
              hasExistingData ? "bg-gray-600/50 opacity-50 cursor-not-allowed" : "bg-accentColor hover:brightness-[0.85] hover:shadow-lg hover:shadow-accentColor/20"
            )}
            title={hasExistingData ? "Maksimal 1 data (Singleton). Edit data yang ada." : "Buat konfigurasi baru"}
          >
            <Plus size={14} /> <span className="hidden sm:inline">New Entry</span>
            <span className="sm:hidden">Baru</span>
          </button>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-6 space-y-5 md:space-y-6 scrollbar-none">
          
          {/* ── Stats ── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <StatCard
              label="Total Rows (Singleton)"
              value={stats.length}
              icon={<Database size={15} className="text-gray-400" />}
              color="default"
              sub="Maksimal 1 baris diizinkan"
              loading={loading}
            />
            <StatCard
              label="Years of Experience"
              value={stats[0]?.years_experience || 0}
              icon={<CalendarDays size={15} className="text-accentColor" />}
              color="green"
              sub="Data aktif saat ini"
              loading={loading}
            />
          </div>

          {/* ── Toolbar ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Cari berdasarkan ID..."
                className="w-full pl-9 pr-9 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-accentColor/50 transition-colors"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {search && (
                <button onClick={resetFilters} className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-gray-400 hover:text-gray-200 border border-white/[0.08] hover:border-white/20 rounded-xl transition-all shrink-0">
                  <RefreshCw size={12} />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* ── Table / Content ── */}
          {loading ? (
            <div className="space-y-3">
              {[1].map((i) => <div key={i} className="h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />)}
            </div>
          ) : (
            <>
              {/* ── Mobile Card List (< md) ── */}
              <div className="md:hidden space-y-3">
                {paginated.length === 0 ? (
                  <EmptyState onReset={resetFilters} />
                ) : (
                  paginated.map((s, idx) => (
                    <StatListCard
                      key={s.id} stat={s}
                      rowNum={(page - 1) * ITEMS_PER_PAGE + idx + 1}
                      onEdit={() => setFormModal({ open: true, mode: "edit", data: s })}
                      onDelete={() => openDelete(s)} 
                    />
                  ))
                )}
              </div>

              {/* ── Desktop Table (>= md) ── */}
              <div className="hidden md:block rounded-2xl border border-white/[0.07] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead>
                      <tr className="bg-white/[0.04] border-b border-white/[0.06]">
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-5 py-3.5 w-8">#</th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5">ID Record</th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-40">Years Experience</th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-44">Last Updated</th>
                        <th className="text-right text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-5 py-3.5 w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {paginated.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-16">
                            <EmptyState onReset={resetFilters} />
                          </td>
                        </tr>
                      ) : (
                        paginated.map((s, idx) => (
                          <StatTableRow
                            key={s.id} stat={s}
                            rowNum={(page - 1) * ITEMS_PER_PAGE + idx + 1}
                            onEdit={() => setFormModal({ open: true, mode: "edit", data: s })}
                            onDelete={() => openDelete(s)}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <PortfolioStatsFormModal
        isOpen={formModal.open}
        mode={formModal.mode}
        initialData={formModal.data}
        onClose={() => setFormModal({ open: false, mode: "create" })}
        onSave={handleSave}
        externalSaving={saving}
      />

      <PortfolioStatsDeleteModal
        isOpen={deleteModal.open}
        statId={deleteModal.stat?.id || ""}
        onClose={() => setDeleteModal({ open: false, stat: null })}
        onConfirm={handleDelete}
      />

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-4 right-4 z-[70] animate-in slide-in-from-right-4 fade-in duration-300">
          <div
            className={cn(
              "flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm shadow-2xl min-w-[260px] max-w-[360px]",
              toast.type === "success"
                ? "bg-[#0a1f1a] border-emerald-500/30 text-emerald-400 shadow-emerald-900/30"
                : "bg-[#1f0a0a] border-red-500/30 text-red-400 shadow-red-900/30"
            )}
          >
            {toast.type === "success" ? <CheckCircle2 size={15} className="shrink-0" /> : <AlertCircle size={15} className="shrink-0" />}
            <span className="flex-1 text-xs leading-snug">{toast.text}</span>
            <button onClick={() => setToast(null)} className="hover:opacity-70 transition-opacity ml-1 shrink-0">
              <X size={13} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Component Helpers ────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, sub, loading }: { label: string, value: number, icon: React.ReactNode, color: "default" | "green" | "blue" | "yellow", sub?: string, loading?: boolean }) {
  const borderColor = {
    default: "border-white/[0.07]",
    green:   "border-accentColor/20",
    blue:    "border-blue-500/20",
    yellow:  "border-amber-500/20",
  }[color]

  const valueCls = {
    default: "text-white",
    green:   "text-accentColor",
    blue:    "text-blue-400",
    yellow:  "text-amber-400",
  }[color]

  return (
    <div className={cn("rounded-2xl border bg-white/[0.03] px-4 sm:px-5 py-4 space-y-2 sm:space-y-3", borderColor)}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] sm:text-xs text-gray-500 leading-tight">{label}</p>
        <div className="w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
      <div>
        {loading ? (
          <div className="h-7 w-10 bg-white/[0.06] rounded-md animate-pulse" />
        ) : (
          <p className={cn("text-xl sm:text-2xl font-bold tabular-nums", valueCls)}>{value}</p>
        )}
        {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-gray-500">
      <BarChart size={28} className="opacity-30" />
      <p className="text-sm">Tabel stat kosong.</p>
      <p className="text-[10px] text-gray-600">Buat entry baru untuk konfigurasi portfolio.</p>
    </div>
  )
}

function StatListCard({ stat, rowNum, onEdit, onDelete }: { stat: any, rowNum: number, onEdit: () => void, onDelete: () => void }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-200 truncate">{stat.id}</p>
          <p className="text-[10px] text-gray-600 mt-0.5">Updated: {new Date(stat.updated_at).toLocaleDateString("id-ID")}</p>
        </div>
        <span className="text-xs text-gray-600 tabular-nums shrink-0">#{rowNum}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
          <span className="text-[10px] text-gray-500 block mb-0.5">Years Experience</span>
          <span className="text-sm font-semibold text-accentColor">{stat.years_experience} Tahun</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={onEdit} className="p-2 rounded-xl text-gray-500 hover:text-accentColor hover:bg-accentColor/10 border border-transparent hover:border-accentColor/20 transition-all"><Edit2 size={13} /></button>
          <button onClick={onDelete} className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"><Trash2 size={13} /></button>
        </div>
      </div>
    </div>
  )
}

function StatTableRow({ stat, rowNum, onEdit, onDelete }: { stat: any, rowNum: number, onEdit: () => void, onDelete: () => void }) {
  return (
    <tr className="hover:bg-white/[0.025] transition-colors">
      <td className="px-5 py-3.5"><span className="text-xs text-gray-600 tabular-nums">{rowNum}</span></td>
      <td className="px-4 py-3.5">
        <p className="text-xs font-mono text-gray-300 hover:text-accentColor transition-colors">{stat.id}</p>
      </td>
      <td className="px-4 py-3.5">
        <span className="inline-flex px-2 py-1 rounded bg-white/[0.05] border border-white/[0.08] text-xs font-medium text-accentColor">
          {stat.years_experience} Tahun
        </span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-300">{new Date(stat.updated_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span className="text-[10px] text-gray-600">{new Date(stat.updated_at).toLocaleTimeString("id-ID")}</span>
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
