"use client"

import React, { useState, useEffect, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {
    Search, Edit2, Trash2, Menu, AlertCircle,
    CheckCircle2, ChevronLeft, ChevronRight, X, RefreshCw,
    MessageSquare, Star, ShieldAlert, ShieldCheck, MailPlus, User
} from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useSidebar } from "@/components/dashboard/SidebarContext"

import GuestbookFormModal, { type GuestbookFormData } from "./GuestbookFormModal"
import GuestbookDeleteModal from "./GuestbookDeleteModal"
import { updateGuestbookOnServer, deleteGuestbookOnServer, bulkDeleteGuestbookOnServer, toggleGuestbookApproval } from "./guestbookActions"

const ITEMS_PER_PAGE = 8

interface ToastMsg {
    type: "success" | "error"
    text: string
}

// ─── Main Content Component ───────────────────────────────────────────────────

function GuestbookDashboardContent() {
    const { toggle: toggleSidebar } = useSidebar()
    const searchParams = useSearchParams()

    const [entries, setEntries] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Filters — pre-filled from notification URL (?search=X)
    const [search, setSearch] = useState(() => searchParams.get("search") || "")
    const [filterApproval, setFilterApproval] = useState<string>("all")
    const [page, setPage] = useState(1)

    const [saving, setSaving] = useState(false)
    const [isDeletingBulk, setIsDeletingBulk] = useState(false)
    const [toast, setToast] = useState<ToastMsg | null>(null)

    // Checkbox State
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    // Modals
    const [formModal, setFormModal] = useState<{ open: boolean, data: GuestbookFormData | null }>({ open: false, data: null })
    const [deleteModal, setDeleteModal] = useState<{ open: boolean, item: any | null }>({ open: false, item: null })
    const [bulkDeleteModal, setBulkDeleteModal] = useState(false)

    const STORAGE_BUCKET = "guestbook-avatars"

    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 3500)
            return () => clearTimeout(t)
        }
    }, [toast])

    useEffect(() => {
        setSelectedIds([])
    }, [page, search, filterApproval])

    async function fetchEntries() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from("guestbook")
                .select("*")
                .order("created_at", { ascending: false })

            if (error) throw error
            setEntries(data || [])
        } catch (err: any) {
            setToast({ type: "error", text: `Gagal memuat data: ${err.message}` })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchEntries() }, [])

    const filtered = useMemo(() => {
        return entries.filter((e) => {
            const q = search.toLowerCase()
            const matchSearch = !q || (e.name || "").toLowerCase().includes(q) || (e.message || "").toLowerCase().includes(q)
            
            let matchStatus = true;
            if (filterApproval === "approved") matchStatus = e.is_approved === true;
            if (filterApproval === "pending") matchStatus = e.is_approved === false;

            return matchSearch && matchStatus
        })
    }, [entries, search, filterApproval])

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
    const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

    // ─── Stats ──────────────────────────────────────────────────────────────────
    const totalEntries = entries.length
    const approvedCount = entries.filter(e => e.is_approved).length
    const pendingCount = entries.filter(e => !e.is_approved).length
    
    const validRatings = entries.map(e => e.rating).filter(r => typeof r === 'number' && r > 0)
    const avgRating = validRatings.length > 0 ? (validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(1) : "0.0"

    // ─── Selection Handlers ───────────────────────────────────────────────────

    function toggleSelectAll() {
        if (paginated.length === 0) return
        if (selectedIds.length === paginated.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(paginated.map(e => e.id))
        }
    }

    function toggleSelect(id: string) {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    function getPathFromUrl(url: string | null) {
        if (!url) return null
        const pathIdentifier = `/public/${STORAGE_BUCKET}/`
        if (url.includes(pathIdentifier)) {
            return url.substring(url.indexOf(pathIdentifier) + pathIdentifier.length)
        }
        return null
    }

    // ─── Handlers ───────────────────────────────────────────────────────────────

    function openDelete(item: any) {
        setDeleteModal({ open: true, item })
    }

    async function handleToggleApprove(id: string, currentStatus: boolean) {
        try {
            const res = await toggleGuestbookApproval(id, !currentStatus)
            if (!res.success) throw new Error(res.error)

            setEntries(prev => prev.map(e => e.id === id ? { ...e, is_approved: !currentStatus } : e))
            setToast({ type: "success", text: !currentStatus ? "Entri disetujui untuk tampil ke publik." : "Entri disembunyikan dari publik." })
        } catch (err: any) {
            setToast({ type: "error", text: err.message })
        }
    }

    async function handleSave(id: string, data: Partial<GuestbookFormData>) {
        setSaving(true)
        try {
            const res = await updateGuestbookOnServer(id, data);
            if (!res.success) throw new Error(res.error)

            await fetchEntries()
            setFormModal({ open: false, data: null })
            setToast({ type: "success", text: "Perubahan entri berhasil disimpan." })
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
            const filePath = getPathFromUrl(item.avatar_url)
            const res = await deleteGuestbookOnServer(item.id, STORAGE_BUCKET, filePath || undefined)
            if (!res.success) throw new Error(res.error)

            await fetchEntries()
            setSelectedIds(prev => prev.filter(id => id !== item.id))
            setPage(1)
            setToast({ type: "success", text: "Entri buku tamu berhasil dihapus." })
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
                const item = entries.find((e) => e.id === id)
                return { id, storageBucket: STORAGE_BUCKET, filePath: getPathFromUrl(item?.avatar_url) }
            })

            const result = await bulkDeleteGuestbookOnServer(itemsToDelete)
            if (!result.success) throw new Error(result.error as string)

            await fetchEntries()
            setSelectedIds([])

            const newTotal = filtered.length - selectedIds.length
            const maxPage = Math.ceil(newTotal / ITEMS_PER_PAGE) || 1
            if (page > maxPage) setPage(maxPage)

            setToast({ type: "success", text: `${result.count} data buku tamu berhasil dihapus.` })
        } catch (err: any) {
            setToast({ type: "error", text: `Gagal menghapus: ${err.message}` })
        } finally {
            setIsDeletingBulk(false)
            setBulkDeleteModal(false)
        }
    }

    function resetFilters() {
        setSearch("")
        setFilterApproval("all")
        setPage(1)
    }

    const hasActiveFilters = search || filterApproval !== "all"

    return (
        <>
            <div className="flex flex-col h-full bg-[#050a0a]">
                {/* ── Page Header ── */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-8 py-4 border-b border-white/[0.06] bg-[#070e0e]/90 backdrop-blur-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={toggleSidebar} className="p-2 -ml-1 rounded-xl hover:bg-white/[0.06] text-gray-400 md:hidden">
                            <Menu size={18} />
                        </button>
                        <div className="w-8 h-8 rounded-xl bg-accentColor/15 border border-accentColor/25 flex items-center justify-center">
                            <MessageSquare size={14} className="text-accentColor" />
                        </div>
                        <div>
                            <h1 className="text-sm font-semibold text-white leading-tight">Guestbook Moderation</h1>
                            <p className="text-[10px] text-gray-500 leading-tight hidden sm:block">Kelola ulasan tamu dan perizinan tampil</p>
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
                    </div>
                </div>

                {/* ── Scrollable Content ── */}
                <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-6 space-y-5 md:space-y-6 scrollbar-none">

                    {/* ── Stats ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        <StatCard label="Total Ulasan" value={totalEntries} icon={<MailPlus size={15} className="text-gray-400" />} color="default" loading={loading} />
                        <StatCard label="Approved (Publik)" value={approvedCount} icon={<ShieldCheck size={15} className="text-emerald-400" />} color="green" loading={loading} />
                        <StatCard label="Pending / Disembunyikan" value={pendingCount} icon={<ShieldAlert size={15} className="text-amber-400" />} color="yellow" loading={loading} />
                        <StatCard label="Rata-rata Rating" value={avgRating} icon={<Star size={15} className="text-purple-400" />} color="purple" loading={loading} />
                    </div>

                    {/* ── Toolbar ── */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            <input
                                type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                                placeholder="Cari nama atau isi ulasan..."
                                className="w-full pl-9 pr-9 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-accentColor/50 transition-colors"
                            />
                            {search && (
                                <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"><X size={13} /></button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <select value={filterApproval} onChange={(e) => { setFilterApproval(e.target.value); setPage(1) }} className="flex-1 sm:w-auto px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-300 outline-none focus:border-accentColor/50 transition-colors appearance-none cursor-pointer">
                                <option value="all" className="bg-[#0d1a1a]">Semua Status</option>
                                <option value="approved" className="bg-[#0d1a1a]">Approved (Publik)</option>
                                <option value="pending" className="bg-[#0d1a1a]">Pending (Tersembunyi)</option>
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
                            <div className="md:hidden space-y-3">
                                {paginated.length === 0 ? (
                                    <EmptyState onReset={resetFilters} />
                                ) : (
                                    paginated.map((e, idx) => (
                                        <EntryCard
                                            key={e.id} item={e} rowNum={(page - 1) * ITEMS_PER_PAGE + idx + 1}
                                            isSelected={selectedIds.includes(e.id)} onToggle={() => toggleSelect(e.id)}
                                            onToggleApprove={() => handleToggleApprove(e.id, e.is_approved)}
                                            onEdit={() => setFormModal({ open: true, data: e })}
                                            onDelete={() => openDelete(e)}
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
                                                <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 min-w-[240px]">Pengunjung</th>
                                                <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 min-w-[300px]">Isi Ulasan & Rating</th>
                                                <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-32">Status (Moderasi)</th>
                                                <th className="text-right text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-5 py-3.5 w-24">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.04]">
                                            {paginated.length === 0 ? (
                                                <tr><td colSpan={6} className="text-center py-16"><EmptyState onReset={resetFilters} /></td></tr>
                                            ) : (
                                                paginated.map((e, idx) => (
                                                    <EntryTableRow
                                                        key={e.id} item={e} rowNum={(page - 1) * ITEMS_PER_PAGE + idx + 1}
                                                        isSelected={selectedIds.includes(e.id)} onToggle={() => toggleSelect(e.id)}
                                                        onToggleApprove={() => handleToggleApprove(e.id, e.is_approved)}
                                                        onEdit={() => setFormModal({ open: true, data: e })}
                                                        onDelete={() => openDelete(e)}
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
                    )}
                </div>
            </div>

            {/* ── Modals ── */}
            <GuestbookFormModal isOpen={formModal.open} initialData={formModal.data} onClose={() => setFormModal({ open: false, data: null })} onSave={handleSave} externalSaving={saving} />
            <GuestbookDeleteModal isOpen={deleteModal.open} entryName={deleteModal.item?.name || ""} onClose={() => setDeleteModal({ open: false, item: null })} onConfirm={handleDelete} />

            {/* ── Bulk Delete Modal ── */}
            {bulkDeleteModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={() => !isDeletingBulk && setBulkDeleteModal(false)} />
                    <div className="relative w-full max-w-md bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center space-y-4 mt-2">
                            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/20"><AlertCircle size={26} className="text-red-400" /></div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1.5">Hapus {selectedIds.length} Entri?</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">Apakah Anda yakin ingin menghapus {selectedIds.length} buku tamu beserta avatarnya? <span className="font-semibold text-gray-300">Tindakan ini tidak dapat dibatalkan.</span></p>
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
    const borderColor = { default: "border-white/[0.07]", green: "border-emerald-500/20", blue: "border-blue-500/20", purple: "border-purple-500/20", yellow: "border-amber-500/20" }[color as string]
    const valueCls = { default: "text-white", green: "text-emerald-400", blue: "text-blue-400", purple: "text-purple-400", yellow: "text-amber-400" }[color as string]
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
            <MessageSquare size={28} className="opacity-30" />
            <p className="text-sm">Tidak ada entri yang ditemukan.</p>
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

function EntryCard({ item, rowNum, onEdit, onDelete, isSelected, onToggle, onToggleApprove }: any) {
    return (
        <div className={cn("rounded-2xl border bg-white/[0.02] p-4 space-y-4 transition-colors", isSelected ? "border-accentColor/40 bg-accentColor/5" : "border-white/[0.07]")}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="pt-0.5 shrink-0"><input type="checkbox" checked={isSelected} onChange={onToggle} className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]" /></div>
                    <div className="w-10 h-10 rounded-full border border-white/[0.1] bg-black/40 overflow-hidden shrink-0 flex items-center justify-center">
                        {item.avatar_url ? <img src={item.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : <User size={16} className="text-gray-500" />}
                    </div>
                    <div>
                        <p className="text-[13px] font-semibold text-gray-200 line-clamp-1">{item.name}</p>
                        <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{item.city} • {item.profession}</p>
                    </div>
                </div>
                <span className="text-xs text-gray-600 tabular-nums shrink-0">#{rowNum}</span>
            </div>

            <div className="flex flex-col pl-7 gap-2">
                <div className="flex items-center gap-1.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={10} className={i < (item.rating || 0) ? "fill-amber-500 text-amber-500" : "text-gray-700"} />)}
                </div>
                {item.message && <p className="text-[11px] text-gray-400 italic border-l-2 border-white/10 pl-2 line-clamp-3">"{item.message}"</p>}
            </div>

            <div className="flex items-center justify-between gap-4 pl-7 pt-2 border-t border-white/[0.06]">
                <button onClick={onToggleApprove} className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] font-medium transition-colors", item.is_approved ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20")}>
                    {item.is_approved ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                    {item.is_approved ? "Approved" : "Pending"}
                </button>
                <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={onEdit} className="p-2 rounded-xl text-gray-500 hover:text-accentColor hover:bg-accentColor/10 border border-transparent hover:border-accentColor/20 transition-all"><Edit2 size={13} /></button>
                    <button onClick={onDelete} className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"><Trash2 size={13} /></button>
                </div>
            </div>
        </div>
    )
}

function EntryTableRow({ item, rowNum, onEdit, onDelete, isSelected, onToggle, onToggleApprove }: any) {
    const d = new Date(item.created_at)
    return (
        <tr className={cn("group transition-colors", isSelected ? "bg-accentColor/5" : "hover:bg-white/[0.025]")}>
            <td className="px-4 py-3.5"><input type="checkbox" checked={isSelected} onChange={onToggle} className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]" /></td>
            <td className="px-2 py-3.5"><span className="text-xs text-gray-600 tabular-nums">{rowNum}</span></td>

            <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-white/[0.1] bg-black/40 overflow-hidden shrink-0 flex items-center justify-center">
                        {item.avatar_url ? <img src={item.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : <User size={14} className="text-gray-600" />}
                    </div>
                    <div className="min-w-0 pr-4">
                        <p className="text-[13px] font-medium text-gray-200 line-clamp-1">{item.name}</p>
                        <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{item.city} • {item.profession}</p>
                        <p className="text-[9px] text-gray-600 mt-0.5">{d.toLocaleDateString()}</p>
                    </div>
                </div>
            </td>

            <td className="px-4 py-3.5">
                <div className="flex flex-col gap-1.5 items-start">
                    <div className="flex text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={10} className={i < (item.rating || 0) ? "fill-amber-500 text-amber-500" : "text-gray-700"} />)}
                    </div>
                    <p className="text-[11px] text-gray-400 italic line-clamp-2 max-w-[280px]">"{item.message}"</p>
                </div>
            </td>

            <td className="px-4 py-3.5">
                <button onClick={onToggleApprove} className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] font-medium transition-colors", item.is_approved ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20")}>
                    {item.is_approved ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                    {item.is_approved ? "Approved" : "Pending"}
                </button>
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

function GuestbookLoadingFallback() {
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

export default function GuestbookDashboardPage() {
    return (
        <Suspense fallback={<GuestbookLoadingFallback />}>
            <GuestbookDashboardContent />
        </Suspense>
    )
}