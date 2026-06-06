"use client"

import React, { useState, useMemo, useEffect } from "react"
import {
  Search, Plus, Edit2, Trash2, BookOpen, Clock,
  Users, Shield, ChevronLeft, ChevronRight, X,
  Tag, RefreshCw, ListFilter, Database, Menu,
  AlertCircle, CheckCircle2, CheckSquare
} from "lucide-react"
import { cn } from "@/lib/utils"
import BlogFormModal, { type BlogFormData } from "@/components/dashboard/blogs/BlogFormModal"
import BlogDeleteModal from "@/components/dashboard/blogs/BlogDeleteModal"
import { useBlogStore } from "@/stores/BlogStore"
import { supabase } from "@/lib/supabase"
import { useSidebar } from "@/components/dashboard/SidebarContext"
import type { Blog } from "@/types/blog"
import { saveBlogOnServer, deleteBlogOnServer, bulkDeleteBlogsOnServer } from "./blogActions"

// ─── Types ───────────────────────────────────────────────────────────────────

interface BlogEntry {
  id: string
  title: string
  excerpt: string
  content: string
  thumbnail: string
  category: string
  author_name: string
  author_email: string
  author_phone: string
  author_avatar: string
  author_type: "developer" | "visitor"
  published_at: string
  reading_time: number
  tags: string[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function blogToEntry(blog: any): BlogEntry {
  const authorName = blog.author?.name || blog.author_name || "Unknown Author"
  const authorEmail = blog.author?.email || blog.author_email || ""
  const authorPhone = blog.author?.phone || blog.author_phone || ""
  const authorAvatar = blog.author?.avatar || blog.author_avatar || ""
  const authorType = blog.author?.type || blog.author_type || "visitor"

  return {
    id: blog.id,
    title: blog.title || "Untitled",
    excerpt: blog.excerpt || "",
    content: blog.content || "",
    thumbnail: blog.thumbnail || "",
    category: blog.category || "General",
    author_name: authorName,
    author_email: authorEmail,
    author_phone: authorPhone,
    author_avatar: authorAvatar,
    author_type: authorType,
    published_at: blog.publishedAt || blog.published_at || new Date().toISOString(),
    reading_time: blog.readingTime || blog.reading_time || 0,
    tags: blog.tags || [],
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "All", "Technology", "Tutorial", "Tips & Tricks",
  "Programming", "Design", "General", "News", "Career",
]

const CATEGORY_STYLE: Record<string, string> = {
  Technology:      "bg-blue-500/15 text-blue-400 border-blue-500/20",
  Tutorial:        "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "Tips & Tricks": "bg-orange-500/15 text-orange-400 border-orange-500/20",
  Programming:     "bg-purple-500/15 text-purple-400 border-purple-500/20",
  Design:          "bg-pink-500/15 text-pink-400 border-pink-500/20",
  General:         "bg-gray-500/15 text-gray-400 border-gray-500/20",
  News:            "bg-yellow-500/15 text-yellow-500 border-yellow-500/20",
  Career:          "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
}

const ITEMS_PER_PAGE = 5

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"]

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

function getInitials(name: string) {
  if (!name) return "U"
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
}

function generateId() {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastMsg {
  type: "success" | "error"
  text: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BlogsDashboardPage() {
  const { blogs: storeBlogs, loading, fetchBlogs } = useBlogStore()
  const { toggle: toggleSidebar } = useSidebar()

  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("All")
  const [filterType, setFilterType] = useState<"all" | "developer" | "visitor">("all")
  const [page, setPage] = useState(1)
  
  const [saving, setSaving] = useState(false)
  const [isDeletingBulk, setIsDeletingBulk] = useState(false)
  const [toast, setToast] = useState<ToastMsg | null>(null)
  const STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "blog-thumbnails"

  // Checkbox State
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Modals state
  const [formModal, setFormModal] = useState<{
    open: boolean
    mode: "create" | "edit"
    data?: BlogFormData
  }>({ open: false, mode: "create" })

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean
    id: string
    title: string
  }>({ open: false, id: "", title: "" })

  const [bulkDeleteModal, setBulkDeleteModal] = useState(false)

  // Fetch on mount
  useEffect(() => {
    fetchBlogs()
  }, [fetchBlogs])

  // Reset checkboxes if page or filter changes
  useEffect(() => {
    setSelectedIds([])
  }, [page, search, filterCategory, filterType])

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const blogs = useMemo(() => storeBlogs.map(blogToEntry), [storeBlogs])

  const filtered = useMemo(() => {
    return blogs.filter((b) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        (b.title?.toLowerCase() || "").includes(q) ||
        (b.author_name?.toLowerCase() || "").includes(q) ||
        (b.category?.toLowerCase() || "").includes(q) ||
        (b.tags || []).some((t) => (t?.toLowerCase() || "").includes(q))
      const matchCat = filterCategory === "All" || b.category === filterCategory
      const matchType = filterType === "all" || b.author_type === filterType
      return matchSearch && matchCat && matchType
    })
  }, [blogs, search, filterCategory, filterType])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const totalBlogs = blogs.length
  const devBlogs = blogs.filter((b) => b.author_type === "developer").length
  const visitorBlogs = blogs.filter((b) => b.author_type === "visitor").length
  const categoryCount = new Set(blogs.map((b) => b.category)).size

  // ─── Selection Handlers ───────────────────────────────────────────────────

  function toggleSelectAll() {
    if (paginated.length === 0) return
    if (selectedIds.length === paginated.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(paginated.map(b => b.id))
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  // ─── Action Handlers ──────────────────────────────────────────────────────

  function openCreate() {
    setFormModal({ open: true, mode: "create" })
  }

  function openEdit(blog: BlogEntry) {
    setFormModal({
      open: true,
      mode: "edit",
      data: {
        id: blog.id,
        title: blog.title,
        category: blog.category as BlogFormData["category"],
        author_name: blog.author_name,
        author_email: blog.author_email,
        author_phone: blog.author_phone,
        author_avatar: blog.author_avatar,
        author_type: blog.author_type,
        thumbnail: blog.thumbnail,
        tags: blog.tags,
        excerpt: blog.excerpt,
        reading_time: blog.reading_time,
        published_at: blog.published_at.slice(0, 16),
        content: blog.content,
      },
    })
  }

  function openDelete(blog: BlogEntry) {
    setDeleteModal({ open: true, id: blog.id, title: blog.title })
  }

  async function handleSave(data: BlogFormData) {
    setSaving(true)
    try {
      const row: any = {
        title: data.title,
        category: data.category,
        author_name: data.author_name,
        author_email: data.author_email || null,
        author_phone: data.author_phone || null,
        author_avatar: data.author_avatar || null,
        author_type: data.author_type,
        thumbnail: data.thumbnail || null,
        tags: data.tags || [],
        excerpt: data.excerpt || data.content.replace(/<[^>]+>/g, "").slice(0, 180),
        reading_time: data.reading_time,
        published_at: data.published_at ? new Date(data.published_at).toISOString() : new Date().toISOString(),
        content: data.content,
      }

      let error: { message: string } | null = null

      if (formModal.mode === "create") {
        if (data.id && data.id.trim() !== "") {
          row.id = data.id;
        } else {
          row.id = generateId();
        }
        
        const result = await saveBlogOnServer(row, "create")
        if (!result.success) error = { message: result.error as string }
      } else {
        const idToUpdate = data.id || formModal.data?.id
        if (!idToUpdate) throw new Error("ID tidak ditemukan untuk update.")

        const result = await saveBlogOnServer(row, "edit", idToUpdate)
        if (!result.success) error = { message: result.error as string }
      }

      if (error) {
        throw new Error(error.message)
      } else {
        await fetchBlogs() 
        setFormModal({ open: false, mode: "create" })
        setToast({
          type: "success",
          text: formModal.mode === "create" ? "Blog post berhasil dibuat." : "Blog post berhasil diperbarui.",
        })
      }
    } catch (err: any) {
      console.error("Save Error:", err)
      setToast({ type: "error", text: `Gagal menyimpan: ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    try {
      if (!deleteModal.id) return

      const blogToDelete = storeBlogs.find((b) => String(b.id) === String(deleteModal.id))

      let filePathToDel: string | undefined = undefined
      if (blogToDelete?.thumbnail) {
        const fileUrl = blogToDelete.thumbnail
        const pathIdentifier = `/public/${STORAGE_BUCKET}/`
        const pathIndex = fileUrl.indexOf(pathIdentifier)
        
        if (pathIndex !== -1) {
          filePathToDel = fileUrl.substring(pathIndex + pathIdentifier.length)
        }
      }

      const result = await deleteBlogOnServer(deleteModal.id, STORAGE_BUCKET, filePathToDel)
      if (!result.success) {
        throw new Error(result.error as string)
      }

      await fetchBlogs()
      setSelectedIds(prev => prev.filter(id => id !== deleteModal.id))
      setToast({ type: "success", text: "Blog post dan thumbnail berhasil dihapus." })

    } catch (err: any) {
      console.error("Delete Error:", err)
      setToast({ type: "error", text: `Gagal menghapus: ${err.message}` })
    } finally {
      setDeleteModal({ open: false, id: "", title: "" })
    }
  }

  async function handleBulkDelete() {
    setIsDeletingBulk(true)
    try {
      const itemsToDelete = selectedIds.map(id => {
        const blog = storeBlogs.find((b) => String(b.id) === String(id))
        let filePath: string | undefined = undefined
        
        if (blog?.thumbnail) {
          const pathIdentifier = `/public/${STORAGE_BUCKET}/`
          const pathIndex = blog.thumbnail.indexOf(pathIdentifier)
          if (pathIndex !== -1) {
            filePath = blog.thumbnail.substring(pathIndex + pathIdentifier.length)
          }
        }
        return { id, storageBucket: STORAGE_BUCKET, filePath }
      })

      const result = await bulkDeleteBlogsOnServer(itemsToDelete)
      if (!result.success) throw new Error(result.error as string)

      await fetchBlogs()
      setSelectedIds([])
      
      // Hitung ulang total halaman jika yang dihapus adalah semua yang ada di page saat ini
      const newTotal = filtered.length - itemsToDelete.length
      const maxPage = Math.ceil(newTotal / ITEMS_PER_PAGE) || 1
      if (page > maxPage) setPage(maxPage)

      setToast({ type: "success", text: `${result.count} Blog post berhasil dihapus.` })
    } catch (err: any) {
      console.error("Bulk Delete Error:", err)
      setToast({ type: "error", text: `Gagal menghapus: ${err.message}` })
    } finally {
      setIsDeletingBulk(false)
      setBulkDeleteModal(false)
    }
  }

  function resetFilters() {
    setSearch("")
    setFilterCategory("All")
    setFilterType("all")
    setPage(1)
  }

  const hasActiveFilters = search || filterCategory !== "All" || filterType !== "all"

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-col h-full">

        {/* ── Page Header ── */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-8 py-4 border-b border-white/[0.06] bg-[#070e0e]/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 -ml-1 rounded-xl hover:bg-white/[0.06] text-gray-400 hover:text-gray-200 transition-colors md:hidden"
              aria-label="Toggle sidebar"
            >
              <Menu size={18} />
            </button>
            <div className="w-8 h-8 rounded-xl bg-accentColor/15 border border-accentColor/25 flex items-center justify-center">
              <BookOpen size={14} className="text-accentColor" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-tight">Blog Manager</h1>
              <p className="text-[10px] text-gray-500 leading-tight hidden sm:block">
                Kelola tabel <span className="font-mono text-gray-400">public.blogs</span>
              </p>
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
              onClick={openCreate}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-accentColor text-white rounded-xl hover:brightness-[0.85] transition-all hover:shadow-lg hover:shadow-accentColor/20"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">New Post</span>
              <span className="sm:hidden">Baru</span>
            </button>
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-6 space-y-5 md:space-y-6 scrollbar-none">

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatCard
              label="Total Blog Posts"
              value={totalBlogs}
              icon={<Database size={15} className="text-gray-400" />}
              color="default"
              loading={loading}
            />
            <StatCard
              label="Developer Posts"
              value={devBlogs}
              icon={<Shield size={15} className="text-accentColor" />}
              color="green"
              sub={totalBlogs > 0 ? `${Math.round((devBlogs / totalBlogs) * 100)}% dari total` : undefined}
              loading={loading}
            />
            <StatCard
              label="Visitor Posts"
              value={visitorBlogs}
              icon={<Users size={15} className="text-blue-400" />}
              color="blue"
              sub={totalBlogs > 0 ? `${Math.round((visitorBlogs / totalBlogs) * 100)}% dari total` : undefined}
              loading={loading}
            />
            <StatCard
              label="Kategori Aktif"
              value={categoryCount}
              icon={<Tag size={15} className="text-purple-400" />}
              color="purple"
              sub="dari 8 kategori"
              loading={loading}
            />
          </div>

          {/* ── Toolbar ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Cari judul, penulis, tag..."
                className="w-full pl-9 pr-9 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-accentColor/50 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-none">
                <ListFilter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <select
                  value={filterCategory}
                  onChange={(e) => { setFilterCategory(e.target.value); setPage(1) }}
                  className="w-full sm:w-auto pl-8 pr-8 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-300 outline-none focus:border-accentColor/50 transition-colors appearance-none cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#0d1a1a]">{c}</option>
                  ))}
                </select>
              </div>

              <select
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value as typeof filterType); setPage(1) }}
                className="flex-1 sm:flex-none px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-300 outline-none focus:border-accentColor/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="all" className="bg-[#0d1a1a]">Semua Tipe</option>
                <option value="developer" className="bg-[#0d1a1a]">Developer</option>
                <option value="visitor" className="bg-[#0d1a1a]">Visitor</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-gray-400 hover:text-gray-200 border border-white/[0.08] hover:border-white/20 rounded-xl transition-all shrink-0"
                >
                  <RefreshCw size={12} />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <span className="text-xs text-gray-500 shrink-0">
                {filtered.length}/{blogs.length}
              </span>
            )}
          </div>

          {/* ── Loading skeleton ── */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
              ))}
            </div>
          )}

          {/* ── Content (when not loading) ── */}
          {!loading && (
            <>
              {/* ── Mobile Card List (< md) ── */}
              <div className="md:hidden space-y-3">
                {paginated.length === 0 ? (
                  <EmptyState onReset={resetFilters} />
                ) : (
                  paginated.map((blog, idx) => (
                    <BlogCard
                      key={blog.id}
                      blog={blog}
                      rowNum={(page - 1) * ITEMS_PER_PAGE + idx + 1}
                      isSelected={selectedIds.includes(blog.id)}
                      onToggle={() => toggleSelect(blog.id)}
                      onEdit={() => openEdit(blog)}
                      onDelete={() => openDelete(blog)}
                    />
                  ))
                )}
              </div>

              {/* ── Desktop Table (>= md) ── */}
              <div className="hidden md:block rounded-2xl border border-white/[0.07] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px]">
                    <thead>
                      <tr className="bg-white/[0.04] border-b border-white/[0.06]">
                        {/* Checkbox Header */}
                        <th className="px-4 py-3.5 w-12 text-left">
                          <input
                            type="checkbox"
                            checked={paginated.length > 0 && selectedIds.length === paginated.length}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]"
                          />
                        </th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-2 py-3.5 w-8">#</th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5">Post</th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-32">Kategori</th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-44">Author</th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-28">Published</th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-20">Tags</th>
                        <th className="text-right text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-5 py-3.5 w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {paginated.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-16">
                            <EmptyState onReset={resetFilters} />
                          </td>
                        </tr>
                      ) : (
                        paginated.map((blog, idx) => (
                          <BlogTableRow
                            key={blog.id}
                            blog={blog}
                            rowNum={(page - 1) * ITEMS_PER_PAGE + idx + 1}
                            isSelected={selectedIds.includes(blog.id)}
                            onToggle={() => toggleSelect(blog.id)}
                            onEdit={() => openEdit(blog)}
                            onDelete={() => openDelete(blog)}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-5 py-3.5 border-t border-white/[0.06] bg-white/[0.02]">
                  <p className="text-xs text-gray-500">
                    Menampilkan{" "}
                    <span className="text-gray-300 font-medium">
                      {filtered.length === 0 ? 0 : Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–
                      {Math.min(page * ITEMS_PER_PAGE, filtered.length)}
                    </span>{" "}
                    dari{" "}
                    <span className="text-gray-300 font-medium">{filtered.length}</span> entri
                  </p>
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              </div>

              {/* ── Mobile Pagination ── */}
              {totalPages > 1 && (
                <div className="md:hidden flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {filtered.length === 0 ? 0 : Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–
                    {Math.min(page * ITEMS_PER_PAGE, filtered.length)} / {filtered.length}
                  </p>
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <BlogFormModal
        isOpen={formModal.open}
        mode={formModal.mode}
        initialData={formModal.data}
        onClose={() => setFormModal({ open: false, mode: "create" })}
        onSave={handleSave}
        externalSaving={saving}
      />

      <BlogDeleteModal
        isOpen={deleteModal.open}
        blogTitle={deleteModal.title}
        blogId={deleteModal.id}
        onClose={() => setDeleteModal({ open: false, id: "", title: "" })}
        onConfirm={handleDelete}
      />

      {/* ── Bulk Delete Modal (Inline) ── */}
      {bulkDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={() => !isDeletingBulk && setBulkDeleteModal(false)} />
          <div className="relative w-full max-w-md bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4 mt-2">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/20">
                <AlertCircle size={26} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1.5">Hapus {selectedIds.length} Data Sekaligus?</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Apakah Anda yakin ingin menghapus {selectedIds.length} data yang dicentang beserta gambar thumbnail-nya? <br/>
                  <span className="font-semibold text-gray-300">Tindakan ini tidak dapat dibatalkan.</span>
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

      {/* ── Toast fixed top-right ── */}
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
            {toast.type === "success"
              ? <CheckCircle2 size={15} className="shrink-0" />
              : <AlertCircle size={15} className="shrink-0" />}
            <span className="flex-1 text-xs leading-snug">{toast.text}</span>
            <button
              onClick={() => setToast(null)}
              className="hover:opacity-70 transition-opacity ml-1 shrink-0"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onPageChange }: { page: number, totalPages: number, onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const visible =
    totalPages <= 5
      ? pages
      : pages.filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-white/[0.08] hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        <ChevronLeft size={13} className="text-gray-400" />
      </button>
      {visible.map((p, i, arr) => (
        <React.Fragment key={p}>
          {i > 0 && arr[i - 1] !== p - 1 && <span className="text-xs text-gray-600 px-1">…</span>}
          <button onClick={() => onPageChange(p)} className={cn("w-7 h-7 rounded-lg text-xs font-medium transition-all", page === p ? "bg-accentColor text-white" : "border border-white/[0.08] text-gray-400 hover:border-white/20 hover:text-gray-200")}>
            {p}
          </button>
        </React.Fragment>
      ))}
      <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border border-white/[0.08] hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        <ChevronRight size={13} className="text-gray-400" />
      </button>
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-gray-500">
      <BookOpen size={28} className="opacity-30" />
      <p className="text-sm">Tidak ada blog yang cocok.</p>
      <button onClick={onReset} className="text-xs text-accentColor hover:underline">
        Reset filter
      </button>
    </div>
  )
}

// ─── StatCard ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, sub, loading }: { label: string, value: number, icon: React.ReactNode, color: "default" | "green" | "blue" | "purple", sub?: string, loading?: boolean }) {
  const borderColor = {
    default: "border-white/[0.07]",
    green:   "border-accentColor/20",
    blue:    "border-blue-500/20",
    purple:  "border-purple-500/20",
  }[color]

  const valueCls = {
    default: "text-white",
    green:   "text-accentColor",
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

// ─── BlogCard (mobile) ────────────────────────────────────────────────────────

function BlogCard({ blog, rowNum, onEdit, onDelete, isSelected, onToggle }: { blog: BlogEntry, rowNum: number, onEdit: () => void, onDelete: () => void, isSelected: boolean, onToggle: () => void }) {
  const isDev = blog.author_type === "developer"

  return (
    <div className={cn("rounded-2xl border bg-white/[0.02] p-4 space-y-3 transition-colors", isSelected ? "border-accentColor/40 bg-accentColor/5" : "border-white/[0.07]")}>
      {/* Top row: Checkbox, thumbnail + meta */}
      <div className="flex items-start gap-3">
        <div className="pt-0.5 shrink-0">
          <input 
            type="checkbox" checked={isSelected} onChange={onToggle}
            className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]" 
          />
        </div>

        {/* Thumbnail */}
        <div className="w-14 h-11 rounded-xl overflow-hidden shrink-0 bg-white/[0.04] border border-white/[0.06]">
          {blog.thumbnail ? (
            <img src={blog.thumbnail} alt={blog.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen size={14} className="text-gray-600" />
            </div>
          )}
        </div>

        {/* Title + ID */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-200 line-clamp-2 leading-snug">{blog.title}</p>
          <p className="text-[10px] text-gray-600 font-mono mt-0.5 truncate">{blog.id}</p>
        </div>

        {/* Row number */}
        <span className="text-xs text-gray-600 tabular-nums shrink-0">#{rowNum}</span>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap pl-7">
        <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-lg border", CATEGORY_STYLE[blog.category] ?? "bg-gray-500/15 text-gray-400 border-gray-500/20")}>
          {blog.category}
        </span>
        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-md", isDev ? "text-accentColor bg-accentColor/10" : "text-blue-400 bg-blue-500/10")}>
          {isDev ? "DEV" : "VISITOR"}
        </span>
        <span className="text-[11px] text-gray-500">{blog.author_name}</span>
        <span className="text-[11px] text-gray-600 flex items-center gap-1">
          <Clock size={9} /> {blog.reading_time} min
        </span>
      </div>

      {/* Date + tags + actions */}
      <div className="flex items-center justify-between pl-7">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-gray-400">{formatDate(blog.published_at)}</span>
          {blog.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 bg-white/[0.05] border border-white/[0.07] rounded-md text-gray-400">
              {tag}
            </span>
          ))}
          {blog.tags.length > 2 && (
            <span className="text-[10px] text-gray-600">+{blog.tags.length - 2}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={onEdit} className="p-2 rounded-xl text-gray-500 hover:text-accentColor hover:bg-accentColor/10 border border-transparent hover:border-accentColor/20 transition-all">
            <Edit2 size={13} />
          </button>
          <button onClick={onDelete} className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── BlogTableRow (desktop) ───────────────────────────────────────────────────

function BlogTableRow({ blog, rowNum, onEdit, onDelete, isSelected, onToggle }: { blog: BlogEntry, rowNum: number, onEdit: () => void, onDelete: () => void, isSelected: boolean, onToggle: () => void }) {
  const isDev = blog.author_type === "developer"

  return (
    <tr className={cn("group transition-colors", isSelected ? "bg-accentColor/5" : "hover:bg-white/[0.025]")}>
      <td className="px-4 py-3.5">
        <input 
          type="checkbox" checked={isSelected} onChange={onToggle}
          className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]" 
        />
      </td>
      <td className="px-2 py-3.5">
        <span className="text-xs text-gray-600 tabular-nums">{rowNum}</span>
      </td>

      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-9 rounded-lg overflow-hidden shrink-0 bg-white/[0.04] border border-white/[0.06]">
            {blog.thumbnail ? (
              <img src={blog.thumbnail} alt={blog.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen size={12} className="text-gray-600" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-200 line-clamp-1 group-hover:text-accentColor transition-colors leading-snug">
              {blog.title}
            </p>
            <p className="text-[10px] text-gray-600 font-mono mt-0.5 truncate max-w-[260px]">
              {blog.id}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-lg border", CATEGORY_STYLE[blog.category] ?? "bg-gray-500/15 text-gray-400 border-gray-500/20")}>
          {blog.category}
        </span>
      </td>

      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden", isDev ? "bg-accentColor/20 text-accentColor" : "bg-white/[0.08] text-gray-400")}>
            {blog.author_avatar ? (
              <img src={blog.author_avatar} alt={blog.author_name} className="w-full h-full object-cover" />
            ) : (
              getInitials(blog.author_name)
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-300 truncate max-w-[110px]">{blog.author_name}</p>
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-md", isDev ? "text-accentColor bg-accentColor/10" : "text-blue-400 bg-blue-500/10")}>
              {isDev ? "DEV" : "VISITOR"}
            </span>
          </div>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <div className="space-y-0.5">
          <p className="text-xs text-gray-300">{formatDate(blog.published_at)}</p>
          <div className="flex items-center gap-1 text-[10px] text-gray-600">
            <Clock size={9} /> {blog.reading_time} min read
          </div>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1 flex-wrap">
          {blog.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 bg-white/[0.05] border border-white/[0.07] rounded-md text-gray-400">
              {tag}
            </span>
          ))}
          {blog.tags.length > 2 && (
            <span className="text-[10px] text-gray-600">+{blog.tags.length - 2}</span>
          )}
        </div>
      </td>

      <td className="px-5 py-3.5">
        <div className="flex items-center justify-end gap-1.5">
          <button onClick={onEdit} className="p-2 rounded-xl text-gray-500 hover:text-accentColor hover:bg-accentColor/10 border border-transparent hover:border-accentColor/20 transition-all" title="Edit">
            <Edit2 size={13} />
          </button>
          <button onClick={onDelete} className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all" title="Hapus">
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  )
}
