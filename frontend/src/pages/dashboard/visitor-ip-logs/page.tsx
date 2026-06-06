"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
    Search, Plus, Edit2, Trash2, Menu, AlertCircle,
    CheckCircle2, ChevronLeft, ChevronRight, X, RefreshCw,
    ListFilter, Activity, Globe, Fingerprint, MousePointerClick, ShieldAlert
} from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useSidebar } from "@/components/dashboard/SidebarContext"

import VisitorIpLogFormModal, { type VisitorIpLogFormData } from "./VisitorIpLogFormModal"
import VisitorIpLogDeleteModal from "./VisitorIpLogDeleteModal"
import { saveVisitorLogOnServer, deleteVisitorLogOnServer, bulkDeleteVisitorLogsOnServer } from "./visitorIpLogActions"

const ACTION_TYPES = [
    "welcome_popup_submitted",
    "welcome_popup_hidden",
    "banner_dismissed",
    "guestbook_submitted",
    "gallery_guest_registered"
]

const ACTION_STYLES: Record<string, string> = {
    "welcome_popup_submitted": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "welcome_popup_hidden": "bg-gray-500/10 text-gray-400 border-gray-500/20",
    "banner_dismissed": "bg-orange-500/10 text-orange-400 border-orange-500/20",
    "guestbook_submitted": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "gallery_guest_registered": "bg-purple-500/10 text-purple-400 border-purple-500/20",
}

const ITEMS_PER_PAGE = 8

interface ToastMsg {
    type: "success" | "error"
    text: string
}

export default function VisitorIpLogDashboardPage() {
    const { toggle: toggleSidebar } = useSidebar()

    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Filters
    const [search, setSearch] = useState("")
    const [filterAction, setFilterAction] = useState<string>("all")
    const [page, setPage] = useState(1)

    const [saving, setSaving] = useState(false)
    const [isDeletingBulk, setIsDeletingBulk] = useState(false)
    const [toast, setToast] = useState<ToastMsg | null>(null)

    // Checkbox State
    const [selectedIds, setSelectedIds] = useState<number[]>([])

    // Modals
    const [formModal, setFormModal] = useState<{ open: boolean, mode: "create" | "edit", data?: VisitorIpLogFormData }>({ open: false, mode: "create" })
    const [deleteModal, setDeleteModal] = useState<{ open: boolean, log: any | null }>({ open: false, log: null })
    const [bulkDeleteModal, setBulkDeleteModal] = useState(false)

    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 3500)
            return () => clearTimeout(t)
        }
    }, [toast])

    // Reset checkboxes if page or filter changes
    useEffect(() => {
        setSelectedIds([])
    }, [page, search, filterAction])

    async function fetchLogs() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from("visitor_ip_log")
                .select("*")
                .order("created_at", { ascending: false })

            if (error) throw error
            setLogs(data || [])
        } catch (err: any) {
            setToast({ type: "error", text: `Gagal memuat data: ${err.message}` })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchLogs() }, [])

    const filtered = useMemo(() => {
        return logs.filter((log) => {
            const q = search.toLowerCase()
            const matchSearch = !q || (log.ip_address || "").toLowerCase().includes(q) || (log.browser_fingerprint || "").toLowerCase().includes(q)
            const matchAction = filterAction === "all" || log.action_type === filterAction

            return matchSearch && matchAction
        })
    }, [logs, search, filterAction])

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
    const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

    // ─── Stats ──────────────────────────────────────────────────────────────────
    const totalItems = logs.length
    const guestbookCount = logs.filter(l => l.action_type === "guestbook_submitted").length
    const galleryCount = logs.filter(l => l.action_type === "gallery_guest_registered").length
    const popupCount = logs.filter(l => l.action_type === "welcome_popup_submitted").length

    // ─── Selection Handlers ───────────────────────────────────────────────────

    function toggleSelectAll() {
        if (paginated.length === 0) return
        if (selectedIds.length === paginated.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(paginated.map(l => l.id))
        }
    }

    function toggleSelect(id: number) {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    // ─── Handlers ───────────────────────────────────────────────────────────────

    function openDelete(log: any) {
        setDeleteModal({ open: true, log })
    }

    async function handleSave(data: VisitorIpLogFormData) {
        setSaving(true)
        try {
            const row: any = { ...data }
            let res;
            if (formModal.mode === "create") {
                delete row.id // Biarkan postgres generate
                res = await saveVisitorLogOnServer(row, "create")
            } else {
                res = await saveVisitorLogOnServer(row, "edit", formModal.data?.id)
            }

            if (!res.success) throw new Error(res.error)

            await fetchLogs()
            setFormModal({ open: false, mode: "create" })
            setToast({ type: "success", text: formModal.mode === "create" ? "Data log berhasil ditambahkan." : "Data log berhasil diperbarui." })
        } catch (err: any) {
            if (err.message.includes("visitor_ip_log_fp_action_idx")) {
                setToast({ type: "error", text: "Gagal: Fingerprint dan Tipe Aksi tersebut sudah ada di database!" })
            } else {
                setToast({ type: "error", text: err.message })
            }
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete() {
        if (!deleteModal.log) return
        const log = deleteModal.log

        try {
            const res = await deleteVisitorLogOnServer(log.id)
            if (!res.success) throw new Error(res.error)

            await fetchLogs()
            setSelectedIds(prev => prev.filter(id => id !== log.id))
            setPage(1)
            setToast({ type: "success", text: "Data log berhasil dihapus." })
        } catch (err: any) {
            setToast({ type: "error", text: err.message })
        } finally {
            setDeleteModal({ open: false, log: null })
        }
    }

    async function handleBulkDelete() {
        setIsDeletingBulk(true)
        try {
            const result = await bulkDeleteVisitorLogsOnServer(selectedIds)
            if (!result.success) throw new Error(result.error as string)

            await fetchLogs()
            setSelectedIds([])

            const newTotal = filtered.length - selectedIds.length
            const maxPage = Math.ceil(newTotal / ITEMS_PER_PAGE) || 1
            if (page > maxPage) setPage(maxPage)

            setToast({ type: "success", text: `${result.count} log aktivitas berhasil dihapus.` })
        } catch (err: any) {
            setToast({ type: "error", text: `Gagal menghapus: ${err.message}` })
        } finally {
            setIsDeletingBulk(false)
            setBulkDeleteModal(false)
        }
    }

    function resetFilters() {
        setSearch("")
        setFilterAction("all")
        setPage(1)
    }

    const hasActiveFilters = search || filterAction !== "all"

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
                            <ShieldAlert size={14} className="text-accentColor" />
                        </div>
                        <div>
                            <h1 className="text-sm font-semibold text-white leading-tight">Visitor IP Logs</h1>
                            <p className="text-[10px] text-gray-500 leading-tight hidden sm:block">Pantau log anti-spam & interaksi pengunjung</p>
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
                            <Plus size={14} /> <span className="hidden sm:inline">New Log</span>
                            <span className="sm:hidden">Baru</span>
                        </button>
                    </div>
                </div>

                {/* ── Scrollable Content ── */}
                <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-6 space-y-5 md:space-y-6 scrollbar-none">

                    {/* ── Stats ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        <StatCard label="Total Logs" value={totalItems} icon={<Activity size={15} className="text-gray-400" />} color="default" loading={loading} />
                        <StatCard label="Guestbook Submitted" value={guestbookCount} icon={<CheckCircle2 size={15} className="text-emerald-400" />} color="green" loading={loading} />
                        <StatCard label="Gallery Registered" value={galleryCount} icon={<Fingerprint size={15} className="text-purple-400" />} color="purple" loading={loading} />
                        <StatCard label="Popup Submitted" value={popupCount} icon={<MousePointerClick size={15} className="text-blue-400" />} color="blue" loading={loading} />
                    </div>

                    {/* ── Toolbar ── */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            <input
                                type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                                placeholder="Cari IP Address atau Fingerprint..."
                                className="w-full pl-9 pr-9 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-accentColor/50 transition-colors"
                            />
                            {search && (
                                <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"><X size={13} /></button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(1) }} className="flex-1 sm:w-auto px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-300 outline-none focus:border-accentColor/50 transition-colors appearance-none cursor-pointer">
                                <option value="all" className="bg-[#0d1a1a]">Semua Tipe Aksi</option>
                                {ACTION_TYPES.map(a => <option key={a} value={a} className="bg-[#0d1a1a]">{a}</option>)}
                            </select>

                            {hasActiveFilters && (
                                <button onClick={resetFilters} className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-gray-400 hover:text-gray-200 border border-white/[0.08] hover:border-white/20 rounded-xl transition-all shrink-0">
                                    <RefreshCw size={12} />
                                    <span className="hidden sm:inline">Reset</span>
                                </button>
                            )}
                        </div>

                        {hasActiveFilters && (
                            <span className="text-xs text-gray-500 shrink-0">{filtered.length}/{logs.length}</span>
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
                                    paginated.map((log, idx) => (
                                        <LogCard
                                            key={log.id} item={log} rowNum={(page - 1) * ITEMS_PER_PAGE + idx + 1}
                                            isSelected={selectedIds.includes(log.id)} onToggle={() => toggleSelect(log.id)}
                                            onEdit={() => setFormModal({ open: true, mode: "edit", data: log })}
                                            onDelete={() => openDelete(log)}
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
                                                <th className="px-4 py-3.5 w-12 text-left"><input type="checkbox" checked={paginated.length > 0 && selectedIds.length === paginated.length} onChange={toggleSelectAll} className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]" /></th>
                                                <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-2 py-3.5 w-8">#</th>
                                                <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 min-w-[160px]">IP Address</th>
                                                <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-56">Tipe Aksi</th>
                                                <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 min-w-[200px]">Browser Fingerprint</th>
                                                <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-40">Tercatat Pada</th>
                                                <th className="text-right text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-5 py-3.5 w-24">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.04]">
                                            {paginated.length === 0 ? (
                                                <tr><td colSpan={7} className="text-center py-16"><EmptyState onReset={resetFilters} /></td></tr>
                                            ) : (
                                                paginated.map((log, idx) => (
                                                    <LogTableRow
                                                        key={log.id} item={log} rowNum={(page - 1) * ITEMS_PER_PAGE + idx + 1}
                                                        isSelected={selectedIds.includes(log.id)} onToggle={() => toggleSelect(log.id)}
                                                        onEdit={() => setFormModal({ open: true, mode: "edit", data: log })}
                                                        onDelete={() => openDelete(log)}
                                                    />
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Table Footer */}
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
                    )}
                </div>
            </div>

            {/* ── Modals ── */}
            <VisitorIpLogFormModal isOpen={formModal.open} mode={formModal.mode} initialData={formModal.data} onClose={() => setFormModal({ open: false, mode: "create" })} onSave={handleSave} externalSaving={saving} />
            <VisitorIpLogDeleteModal isOpen={deleteModal.open} ipAddress={deleteModal.log?.ip_address || ""} actionType={deleteModal.log?.action_type || ""} onClose={() => setDeleteModal({ open: false, log: null })} onConfirm={handleDelete} />

            {/* ── Bulk Delete Modal ── */}
            {bulkDeleteModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={() => !isDeletingBulk && setBulkDeleteModal(false)} />
                    <div className="relative w-full max-w-md bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center space-y-4 mt-2">
                            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/20"><AlertCircle size={26} className="text-red-400" /></div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1.5">Hapus {selectedIds.length} Log?</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">Apakah Anda yakin ingin menghapus {selectedIds.length} log pengunjung yang dicentang? <span className="font-semibold text-gray-300">Tindakan ini tidak dapat dibatalkan.</span></p>
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

function formatDateShort(dateString: string) {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

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
            <Globe size={28} className="opacity-30" />
            <p className="text-sm">Tidak ada log pengunjung ditemukan.</p>
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

function LogCard({ item, rowNum, onEdit, onDelete, isSelected, onToggle }: any) {
    return (
        <div className={cn("rounded-2xl border bg-white/[0.02] p-4 space-y-4 transition-colors", isSelected ? "border-accentColor/40 bg-accentColor/5" : "border-white/[0.07]")}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="pt-0.5 shrink-0"><input type="checkbox" checked={isSelected} onChange={onToggle} className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]" /></div>
                    <div>
                        <p className="text-[13px] font-medium text-gray-200 font-mono tracking-wider">{item.ip_address}</p>
                        <p className="text-[10px] text-gray-500 mt-1">{formatDateShort(item.created_at)}</p>
                    </div>
                </div>
                <span className="text-xs text-gray-600 tabular-nums shrink-0">#{rowNum}</span>
            </div>

            <div className="flex flex-col pl-7 gap-2">
                <span className={cn("inline-flex w-fit px-2 py-1 rounded-md text-[10px] font-medium border", ACTION_STYLES[item.action_type] || "bg-gray-500/10 text-gray-400 border-gray-500/20")}>
                    {item.action_type.replace(/_/g, ' ')}
                </span>
                {item.browser_fingerprint ? (
                    <span className="text-[9px] text-gray-500 font-mono break-all line-clamp-1 border border-white/[0.05] bg-white/[0.02] p-1.5 rounded">{item.browser_fingerprint}</span>
                ) : (
                    <span className="text-[9px] text-gray-600 italic">No Fingerprint</span>
                )}
            </div>

            <div className="flex items-center justify-end gap-1.5 pl-7 pt-2 border-t border-white/[0.06]">
                <button onClick={onEdit} className="p-2 rounded-xl text-gray-500 hover:text-accentColor hover:bg-accentColor/10 border border-transparent hover:border-accentColor/20 transition-all"><Edit2 size={13} /></button>
                <button onClick={onDelete} className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"><Trash2 size={13} /></button>
            </div>
        </div>
    )
}

function LogTableRow({ item, rowNum, onEdit, onDelete, isSelected, onToggle }: any) {
    return (
        <tr className={cn("group transition-colors", isSelected ? "bg-accentColor/5" : "hover:bg-white/[0.025]")}>
            <td className="px-4 py-3.5"><input type="checkbox" checked={isSelected} onChange={onToggle} className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]" /></td>
            <td className="px-2 py-3.5"><span className="text-xs text-gray-600 tabular-nums">{rowNum}</span></td>

            <td className="px-4 py-3.5">
                <span className="text-xs font-mono text-gray-200 tracking-wider group-hover:text-accentColor transition-colors">{item.ip_address}</span>
            </td>

            <td className="px-4 py-3.5">
                <span className={cn("inline-flex px-2 py-1 rounded border text-[10px] font-medium capitalize", ACTION_STYLES[item.action_type] || "bg-gray-500/10 text-gray-400 border-gray-500/20")}>
                    {item.action_type.replace(/_/g, ' ')}
                </span>
            </td>

            <td className="px-4 py-3.5">
                {item.browser_fingerprint ? (
                    <span className="text-[10px] text-gray-400 font-mono truncate max-w-[180px] inline-block" title={item.browser_fingerprint}>{item.browser_fingerprint.substring(0, 16)}...</span>
                ) : (
                    <span className="text-[10px] text-gray-600 italic">-</span>
                )}
            </td>

            <td className="px-4 py-3.5">
                <span className="text-[11px] text-gray-400">{formatDateShort(item.created_at)}</span>
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
