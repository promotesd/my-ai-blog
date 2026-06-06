"use client"

import React, { useState, useEffect, useMemo } from "react"
import { 
  Search, Plus, Edit2, Trash2, Award, Menu, AlertCircle, 
  CheckCircle2, ChevronLeft, ChevronRight, X, RefreshCw, 
  ListFilter, EyeOff, Building2, CheckSquare, ShieldCheck,
  FileText
} from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useSidebar } from "@/components/dashboard/SidebarContext"

import CertificatesFormModal, { type CertificateFormData } from "./CertificatesFormModal"
import CertificatesDeleteModal from "./CertificatesDeleteModal"
import { saveCertificateOnServer, deleteCertificateOnServer, bulkDeleteCertificatesOnServer } from "./certificatesActions"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const CATEGORIES = [
  "Magang / Internship", "Bootcamp", "Course Online", 
  "Webinar / Seminar", "Sertifikasi Resmi", "Kompetisi / Lomba"
]

const STATUS_STYLE: Record<string, string> = {
  Valid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  Expired: "bg-red-500/15 text-red-400 border-red-500/20",
  Lifetime: "bg-blue-500/15 text-blue-400 border-blue-500/20",
}

const ITEMS_PER_PAGE = 5

interface ToastMsg {
  type: "success" | "error"
  text: string
}

export default function CertificatesDashboardPage() {
  const { toggle: toggleSidebar } = useSidebar()
  
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all")
  const [page, setPage] = useState(1)
  
  const [saving, setSaving] = useState(false)
  const [isDeletingBulk, setIsDeletingBulk] = useState(false)
  const [toast, setToast] = useState<ToastMsg | null>(null)

  // Checkbox State
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Modals
  const [formModal, setFormModal] = useState<{ open: boolean, mode: "create" | "edit", data?: CertificateFormData }>({ open: false, mode: "create" })
  const [deleteModal, setDeleteModal] = useState<{ open: boolean, cert: any | null }>({ open: false, cert: null })
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false)

  const STORAGE_BUCKET = "certificates"

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(t)
    }
  }, [toast])

  // Reset checkboxes if page or filter changes
  useEffect(() => {
    setSelectedIds([])
  }, [page, search, filterCategory, filterStatus])

  async function fetchCertificates() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .order("issue_date", { ascending: false })

      if (error) throw error
      setCertificates(data || [])
    } catch (err: any) {
      setToast({ type: "error", text: `Gagal memuat data: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCertificates() }, [])

  const filtered = useMemo(() => {
    return certificates.filter((c) => {
      const q = search.toLowerCase()
      const matchSearch = !q || (c.title || "").toLowerCase().includes(q) || (c.issuer_name || "").toLowerCase().includes(q)
      const matchCat = filterCategory === "all" || c.category === filterCategory
      const matchStatus = filterStatus === "all" || (filterStatus === "published" ? c.is_published : !c.is_published)
      
      return matchSearch && matchCat && matchStatus
    })
  }, [certificates, search, filterCategory, filterStatus])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const totalCerts = certificates.length
  const publishedCount = certificates.filter(c => c.is_published).length
  const lifetimeOrValid = certificates.filter(c => c.status !== "Expired").length
  const categoryCount = new Set(certificates.map(c => c.category)).size

  // ─── Selection Handlers ───────────────────────────────────────────────────

  function toggleSelectAll() {
    if (paginated.length === 0) return
    if (selectedIds.length === paginated.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(paginated.map(c => c.id))
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  // ─── Extraction Helper for Deletion ───────────────────────────────────────
  
  function getPathsFromCertificate(cert: any) {
    const paths: string[] = []
    const pathIdentifier = `/public/${STORAGE_BUCKET}/`
    
    ;[cert.thumbnail_url, cert.pdf_url, cert.issuer_logo_url].forEach(url => {
      if (url && url.includes(pathIdentifier)) {
        paths.push(url.substring(url.indexOf(pathIdentifier) + pathIdentifier.length))
      }
    })
    return paths
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function openDelete(cert: any) {
    setDeleteModal({ open: true, cert })
  }

  async function handleSave(data: CertificateFormData) {
    setSaving(true)
    try {
      const row: any = {
        title: data.title,
        description: data.description,
        category: data.category,
        issuer_name: data.issuer_name,
        issuer_logo_url: data.issuer_logo_url || null,
        issue_date: data.issue_date,
        expiry_date: data.status === "Lifetime" ? null : data.expiry_date || null,
        status: data.status,
        pdf_url: data.pdf_url || null,
        thumbnail_url: data.thumbnail_url || null,
        display_order: data.display_order,
        is_published: data.is_published,
      }

      let res;
      if (formModal.mode === "create") {
        row.id = (data.id && data.id.trim() !== "") ? data.id : generateId()
        res = await saveCertificateOnServer(row, "create")
      } else {
        res = await saveCertificateOnServer(row, "edit", formModal.data?.id)
      }

      if (!res.success) throw new Error(res.error)

      await fetchCertificates()
      setFormModal({ open: false, mode: "create" })
      setToast({ type: "success", text: formModal.mode === "create" ? "Sertifikat berhasil ditambahkan." : "Sertifikat berhasil diperbarui." })
    } catch (err: any) {
      setToast({ type: "error", text: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteModal.cert) return
    const cert = deleteModal.cert

    try {
      const pathsToDelete = getPathsFromCertificate(cert)
      const res = await deleteCertificateOnServer(cert.id, STORAGE_BUCKET, pathsToDelete)
      if (!res.success) throw new Error(res.error)

      await fetchCertificates()
      setSelectedIds(prev => prev.filter(id => id !== cert.id))
      setPage(1)
      setToast({ type: "success", text: "Sertifikat berhasil dihapus." })
    } catch (err: any) {
      setToast({ type: "error", text: err.message })
    } finally {
      setDeleteModal({ open: false, cert: null })
    }
  }

  async function handleBulkDelete() {
    setIsDeletingBulk(true)
    try {
      const itemsToDelete = selectedIds.map(id => {
        const cert = certificates.find((c) => String(c.id) === String(id))
        return { id, storageBucket: STORAGE_BUCKET, filePaths: getPathsFromCertificate(cert) }
      })

      const result = await bulkDeleteCertificatesOnServer(itemsToDelete)
      if (!result.success) throw new Error(result.error as string)

      await fetchCertificates()
      setSelectedIds([])
      
      const newTotal = filtered.length - selectedIds.length
      const maxPage = Math.ceil(newTotal / ITEMS_PER_PAGE) || 1
      if (page > maxPage) setPage(maxPage)

      setToast({ type: "success", text: `${result.count} Sertifikat berhasil dihapus.` })
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
    setFilterStatus("all")
    setPage(1)
  }

  const hasActiveFilters = search || filterCategory !== "all" || filterStatus !== "all"

  // ─── Render ─────────────────────────────────────────────────────────────────

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
              <Award size={14} className="text-accentColor" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-tight">Certificates</h1>
              <p className="text-[10px] text-gray-500 leading-tight hidden sm:block">Kelola dokumen sertifikasi</p>
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
              <Plus size={14} /> <span className="hidden sm:inline">New Cert</span>
              <span className="sm:hidden">Baru</span>
            </button>
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-6 space-y-5 md:space-y-6 scrollbar-none">
          
          {/* ── Stats ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatCard label="Total Sertifikat" value={totalCerts} icon={<Award size={15} className="text-gray-400" />} color="default" loading={loading} />
            <StatCard label="Published" value={publishedCount} icon={<CheckSquare size={15} className="text-emerald-400" />} color="green" sub="Tampil ke public" loading={loading} />
            <StatCard label="Valid / Lifetime" value={lifetimeOrValid} icon={<ShieldCheck size={15} className="text-blue-400" />} color="blue" sub="Sertifikat yang masih aktif" loading={loading} />
            <StatCard label="Kategori Digunakan" value={categoryCount} icon={<ListFilter size={15} className="text-purple-400" />} color="purple" sub="dari 6 kategori" loading={loading} />
          </div>

          {/* ── Toolbar ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Cari judul / penerbit..."
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

              <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as any); setPage(1) }} className="flex-1 sm:w-auto px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-300 outline-none focus:border-accentColor/50 transition-colors appearance-none cursor-pointer">
                <option value="all" className="bg-[#0d1a1a]">Semua Publish Status</option>
                <option value="published" className="bg-[#0d1a1a]">Published</option>
                <option value="draft" className="bg-[#0d1a1a]">Draft</option>
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
                {filtered.length}/{certificates.length}
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
                  paginated.map((c, idx) => (
                    <CertificateCard
                      key={c.id} cert={c}
                      rowNum={(page - 1) * ITEMS_PER_PAGE + idx + 1}
                      isSelected={selectedIds.includes(c.id)}
                      onToggle={() => toggleSelect(c.id)}
                      onEdit={() => setFormModal({ open: true, mode: "edit", data: c })}
                      onDelete={() => openDelete(c)} 
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
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 min-w-[260px]">Sertifikat</th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-40">Issuer</th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-32">Status Aktif</th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-28">Publish</th>
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
                        paginated.map((c, idx) => (
                          <CertificateTableRow
                            key={c.id} cert={c}
                            rowNum={(page - 1) * ITEMS_PER_PAGE + idx + 1}
                            isSelected={selectedIds.includes(c.id)}
                            onToggle={() => toggleSelect(c.id)}
                            onEdit={() => setFormModal({ open: true, mode: "edit", data: c })}
                            onDelete={() => openDelete(c)}
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

              {/* ── Mobile Pagination ── */}
              {totalPages > 1 && (
                <div className="md:hidden flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {filtered.length === 0 ? 0 : Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} / {filtered.length}
                  </p>
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <CertificatesFormModal
        isOpen={formModal.open}
        mode={formModal.mode}
        initialData={formModal.data}
        onClose={() => setFormModal({ open: false, mode: "create" })}
        onSave={handleSave}
        externalSaving={saving}
      />

      <CertificatesDeleteModal
        isOpen={deleteModal.open}
        certificateTitle={deleteModal.cert?.title || ""}
        certificateId={deleteModal.cert?.id || ""}
        onClose={() => setDeleteModal({ open: false, cert: null })}
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
                <h3 className="text-lg font-semibold text-white mb-1.5">Hapus {selectedIds.length} Sertifikat?</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Semua file gambar dan PDF terkait sertifikat yang dicentang akan terhapus juga dari penyimpanan. <br/>
                  <span className="font-semibold text-gray-300">Tindakan ini permanen.</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 bg-white/[0.02] border-t border-white/[0.06]">
              <button 
                onClick={() => setBulkDeleteModal(false)} 
                disabled={isDeletingBulk} 
                className="flex-1 py-2.5 text-sm font-medium text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                onClick={handleBulkDelete} 
                disabled={isDeletingBulk} 
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-red-500/90 hover:bg-red-500 rounded-xl transition-all disabled:opacity-50"
              >
                {isDeletingBulk ? <RefreshCw size={16} className="animate-spin" /> : "Ya, Hapus Semua"}
              </button>
            </div>
          </div>
        </div>
      )}

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

function StatCard({ label, value, icon, color, sub, loading }: { label: string, value: string | number, icon: React.ReactNode, color: "default" | "green" | "blue" | "purple", sub?: string, loading?: boolean }) {
  const borderColor = {
    default: "border-white/[0.07]",
    green:   "border-emerald-500/20",
    blue:    "border-blue-500/20",
    purple:  "border-purple-500/20",
  }[color]

  const valueCls = {
    default: "text-white",
    green:   "text-emerald-400",
    blue:    "text-blue-400",
    purple:  "text-purple-400",
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
      <Award size={28} className="opacity-30" />
      <p className="text-sm">Tidak ada sertifikat yang ditemukan.</p>
      <button onClick={onReset} className="text-xs text-accentColor hover:underline">
        Reset filter
      </button>
    </div>
  )
}

function Pagination({ page, totalPages, onPageChange }: { page: number, totalPages: number, onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const visible = totalPages <= 5 ? pages : pages.filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-white/[0.08] hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-400">
        <ChevronLeft size={13} />
      </button>
      {visible.map((p, i, arr) => (
        <React.Fragment key={p}>
          {i > 0 && arr[i - 1] !== p - 1 && <span className="text-xs text-gray-600 px-1">…</span>}
          <button onClick={() => onPageChange(p)} className={cn("w-7 h-7 rounded-lg text-xs font-medium transition-all", page === p ? "bg-accentColor text-white" : "border border-white/[0.08] text-gray-400 hover:border-white/20 hover:text-gray-200")}>
            {p}
          </button>
        </React.Fragment>
      ))}
      <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border border-white/[0.08] hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-400">
        <ChevronRight size={13} />
      </button>
    </div>
  )
}

// ─── Sub-Components (Card & Row) ──────────────────────────────────────────────

function CertificateCard({ cert, rowNum, onEdit, onDelete, isSelected, onToggle }: { cert: any, rowNum: number, onEdit: () => void, onDelete: () => void, isSelected: boolean, onToggle: () => void }) {
  return (
    <div className={cn("rounded-2xl border bg-white/[0.02] p-4 space-y-4 transition-colors", isSelected ? "border-accentColor/40 bg-accentColor/5" : "border-white/[0.07]")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="pt-0.5 shrink-0">
            <input 
              type="checkbox" checked={isSelected} onChange={onToggle}
              className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]" 
            />
          </div>
          <div className="w-14 h-10 rounded-lg overflow-hidden shrink-0 bg-white/[0.04] border border-white/[0.06]">
            {cert.thumbnail_url ? (
              <img src={cert.thumbnail_url} alt="img" className="w-full h-full object-cover" />
            ) : <Award className="m-auto h-full text-gray-600" size={14} />}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-200 line-clamp-1">{cert.title}</p>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5 truncate max-w-[150px]">{cert.id}</p>
          </div>
        </div>
        <span className="text-xs text-gray-600 tabular-nums shrink-0">#{rowNum}</span>
      </div>

      <div className="flex flex-col gap-1.5 pl-7">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-gray-400 capitalize">
            {cert.category}
          </span>
          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md border", STATUS_STYLE[cert.status])}>
            {cert.status}
          </span>
          {!cert.is_published && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/20">
              <EyeOff size={10} /> Draft
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {cert.issuer_logo_url && (
            <img src={cert.issuer_logo_url} alt="logo" className="w-4 h-4 rounded-full bg-white object-contain" />
          )}
          <span className="text-[11px] text-gray-300">{cert.issuer_name}</span>
          <span className="text-[11px] text-gray-600">•</span>
          <span className="text-[10px] text-gray-500">{new Date(cert.issue_date).getFullYear()}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 pt-2">
        <button onClick={onEdit} className="p-2 rounded-xl text-gray-500 hover:text-accentColor hover:bg-accentColor/10 border border-transparent hover:border-accentColor/20 transition-all"><Edit2 size={13} /></button>
        <button onClick={onDelete} className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"><Trash2 size={13} /></button>
      </div>
    </div>
  )
}

function CertificateTableRow({ cert, rowNum, onEdit, onDelete, isSelected, onToggle }: { cert: any, rowNum: number, onEdit: () => void, onDelete: () => void, isSelected: boolean, onToggle: () => void }) {
  return (
    <tr className={cn("group transition-colors", isSelected ? "bg-accentColor/5" : "hover:bg-white/[0.025]")}>
      <td className="px-4 py-3.5">
        <input 
          type="checkbox" checked={isSelected} onChange={onToggle}
          className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]" 
        />
      </td>
      <td className="px-2 py-3.5"><span className="text-xs text-gray-600 tabular-nums">{rowNum}</span></td>
      
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-8 rounded-md overflow-hidden shrink-0 bg-white/[0.04] border border-white/[0.06]">
            {cert.thumbnail_url ? (
              <img src={cert.thumbnail_url} alt="img" className="w-full h-full object-cover" />
            ) : <Award className="m-auto h-full text-gray-600" size={14} />}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-gray-200 group-hover:text-accentColor transition-colors line-clamp-1">{cert.title}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-gray-400 bg-white/[0.05] px-1.5 py-0.5 rounded border border-white/[0.08]">{cert.category}</span>
            </div>
          </div>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          {cert.issuer_logo_url ? (
            <img src={cert.issuer_logo_url} alt="logo" className="w-5 h-5 rounded bg-white object-contain shrink-0" />
          ) : <Building2 size={16} className="text-gray-500 shrink-0" />}
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-gray-300">{cert.issuer_name}</span>
            <span className="text-[10px] text-gray-600">{new Date(cert.issue_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short' })}</span>
          </div>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <span className={cn("inline-flex px-2 py-1 rounded-md border text-[10px] font-medium", STATUS_STYLE[cert.status])}>
          {cert.status}
        </span>
      </td>

      <td className="px-4 py-3.5">
        {cert.is_published ? (
          <span className="inline-flex px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400">
            Published
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-[10px] font-medium text-red-400">
            <EyeOff size={10} /> Draft
          </span>
        )}
      </td>

      <td className="px-5 py-3.5">
        <div className="flex items-center justify-end gap-1.5">
          {cert.pdf_url && (
            <a href={cert.pdf_url} target="_blank" rel="noreferrer" title="Lihat PDF" className="p-2 rounded-xl text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all">
              <FileText size={13} />
            </a>
          )}
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
