"use client"

import React, { useState, useEffect, useMemo } from "react"
import { 
  Search, Plus, Edit2, Trash2, FolderKanban, Star, Menu, AlertCircle, 
  CheckCircle2, ChevronLeft, ChevronRight, Layers, EyeOff, X, RefreshCw, 
  ListFilter, Database, CheckSquare, Sparkles
} from "lucide-react"
import { FaGithub as Github } from "react-icons/fa"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useSidebar } from "@/components/dashboard/SidebarContext"
import { env } from "@/config/env"

import ProjectFormModal, { type ProjectFormData } from "./ProjectFormModal"
import ProjectDeleteModal from "./ProjectDeleteModal"
import { saveProjectOnServer, deleteProjectOnServer, bulkDeleteProjectsOnServer } from "./projectActions"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const CATEGORIES = ["personal", "academic", "freelance", "company"]

const CATEGORY_STYLE: Record<string, string> = {
  personal:  "bg-blue-500/15 text-blue-400 border-blue-500/20",
  academic:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  freelance: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  company:   "bg-orange-500/15 text-orange-400 border-orange-500/20",
}

const CATEGORY_LABELS: Record<string, string> = {
  personal: "个人",
  academic: "学术",
  freelance: "独立项目",
  company: "团队或企业",
}

const ITEMS_PER_PAGE = 5

interface ToastMsg {
  type: "success" | "error"
  text: string
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProjectsDashboardPage() {
  const { toggle: toggleSidebar } = useSidebar()
  
  const [projects, setProjects] = useState<any[]>([])
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

  // Modals State
  const [formModal, setFormModal] = useState<{ open: boolean, mode: "create" | "edit", data?: ProjectFormData }>({ open: false, mode: "create" })
  const [deleteModal, setDeleteModal] = useState<{ open: boolean, project: any | null }>({ open: false, project: null })
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false)
  
  const STORAGE_BUCKET = env.supabaseStorageBucket || "project-thumbnails"

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

  async function fetchProjects() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("projects")
        .select(`*, popular_projects ( project_id ), project_github_urls ( id, label, url, display_order )`)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (err: any) {
      console.error("Fetch Error:", err)
      setToast({ type: "error", text: `加载数据失败：${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProjects() }, [])

  const mappedProjects = useMemo(() => {
    return projects.map((p) => ({
      ...p,
      is_popular: p.popular_projects && p.popular_projects.length > 0,
      github_urls: p.project_github_urls || []
    }))
  }, [projects])

  const filtered = useMemo(() => {
    return mappedProjects.filter((p) => {
      const q = search.toLowerCase()
      const matchSearch = !q || (p.title || "").toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q)
      const matchCat = filterCategory === "all" || p.category === filterCategory
      const matchStatus = filterStatus === "all" || (filterStatus === "published" ? p.is_published : !p.is_published)
      
      return matchSearch && matchCat && matchStatus
    })
  }, [mappedProjects, search, filterCategory, filterStatus])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const totalProjects = mappedProjects.length
  const publishedCount = mappedProjects.filter((p) => p.is_published).length
  const popularCount = mappedProjects.filter((p) => p.is_popular).length
  const categoryCount = new Set(mappedProjects.map((p) => p.category).filter(Boolean)).size

  // ─── Selection Handlers ───────────────────────────────────────────────────

  function toggleSelectAll() {
    if (paginated.length === 0) return
    if (selectedIds.length === paginated.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(paginated.map(p => p.id))
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function openDelete(project: any) {
    setDeleteModal({ open: true, project })
  }

  async function handleSave(data: ProjectFormData) {
    setSaving(true)
    try {
      const row: any = {
        title: data.title,
        description: data.description,
        thumbnail_url: data.thumbnail_url || null,
        platform_apps: data.platform_apps,
        tech_stack: data.tech_stack,
        live_url: data.live_url || null,
        github_api: data.github_api || null,
        category: data.category,
        year: data.year,
        is_published: data.is_published,
        display_order: data.display_order,
      }

      let res;
      if (formModal.mode === "create") {
        row.id = (data.id && data.id.trim() !== "") ? data.id : generateId()
        res = await saveProjectOnServer(row, data.is_popular, data.github_urls, "create")
      } else {
        res = await saveProjectOnServer(row, data.is_popular, data.github_urls, "edit", formModal.data?.id)
      }

      if (!res.success) throw new Error(res.error)

      await fetchProjects()
      setFormModal({ open: false, mode: "create" })
      setToast({ type: "success", text: formModal.mode === "create" ? "项目创建成功。" : "项目更新成功。" })
    } catch (err: any) {
      setToast({ type: "error", text: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteModal.project) return
    const project = deleteModal.project

    try {
      let filePathToDel: string | undefined = undefined
      if (project.thumbnail_url) {
        const pathIdentifier = `/public/${STORAGE_BUCKET}/`
        const pathIndex = project.thumbnail_url.indexOf(pathIdentifier)
        if (pathIndex !== -1) filePathToDel = project.thumbnail_url.substring(pathIndex + pathIdentifier.length)
      }

      const res = await deleteProjectOnServer(project.id, STORAGE_BUCKET, filePathToDel)
      if (!res.success) throw new Error(res.error)

      await fetchProjects()
      setSelectedIds(prev => prev.filter(id => id !== project.id))
      setPage(1)
      setToast({ type: "success", text: "项目删除成功。" })
    } catch (err: any) {
      setToast({ type: "error", text: err.message })
    } finally {
      setDeleteModal({ open: false, project: null })
    }
  }

  async function handleBulkDelete() {
    setIsDeletingBulk(true)
    try {
      const itemsToDelete = selectedIds.map(id => {
        const project = mappedProjects.find((p) => String(p.id) === String(id))
        let filePath: string | undefined = undefined
        
        if (project?.thumbnail_url) {
          const pathIdentifier = `/public/${STORAGE_BUCKET}/`
          const pathIndex = project.thumbnail_url.indexOf(pathIdentifier)
          if (pathIndex !== -1) {
            filePath = project.thumbnail_url.substring(pathIndex + pathIdentifier.length)
          }
        }
        return { id, storageBucket: STORAGE_BUCKET, filePath }
      })

      const result = await bulkDeleteProjectsOnServer(itemsToDelete)
      if (!result.success) throw new Error(result.error as string)

      await fetchProjects()
      setSelectedIds([])
      
      const newTotal = filtered.length - itemsToDelete.length
      const maxPage = Math.ceil(newTotal / ITEMS_PER_PAGE) || 1
      if (page > maxPage) setPage(maxPage)

      setToast({ type: "success", text: `已删除 ${result.count} 个项目。` })
    } catch (err: any) {
      console.error("Bulk Delete Error:", err)
      setToast({ type: "error", text: `删除失败：${err.message}` })
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
              <FolderKanban size={14} className="text-accentColor" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-tight">项目管理</h1>
              <p className="text-[10px] text-gray-500 leading-tight hidden sm:block">管理项目内容与发布状态</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                onClick={() => setBulkDeleteModal(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 hover:border-red-500/30 transition-all"
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">删除（{selectedIds.length}）</span>
                <span className="sm:hidden">({selectedIds.length})</span>
              </button>
            )}
            <button
              onClick={() => setFormModal({ open: true, mode: "create" })}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-accentColor text-white rounded-xl hover:brightness-[0.85] transition-all hover:shadow-lg hover:shadow-accentColor/20"
            >
              <Plus size={14} /> <span className="hidden sm:inline">新建项目</span>
              <span className="sm:hidden">新建</span>
            </button>
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-6 space-y-5 md:space-y-6 scrollbar-none">
          
          {/* ── Stats ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatCard label="项目总数" value={totalProjects} icon={<Database size={15} className="text-gray-400" />} color="default" loading={loading} />
            <StatCard label="已发布" value={publishedCount} icon={<CheckSquare size={15} className="text-accentColor" />} color="green" sub={totalProjects > 0 ? `${Math.round((publishedCount / totalProjects) * 100)}%` : undefined} loading={loading} />
            <StatCard label="首页精选" value={popularCount} icon={<Sparkles size={15} className="text-amber-400" />} color="yellow" sub="在首页显示" loading={loading} />
            <StatCard label="已用分类" value={categoryCount} icon={<Layers size={15} className="text-blue-400" />} color="blue" sub="共 4 个分类" loading={loading} />
          </div>

          {/* ── Toolbar ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="搜索项目"
                className="w-full pl-9 pr-9 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-accentColor/50 transition-colors"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-none">
                <ListFilter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1) }} className="w-full sm:w-auto pl-8 pr-8 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-300 outline-none focus:border-accentColor/50 transition-colors appearance-none cursor-pointer capitalize">
                  <option value="all" className="bg-[#0d1a1a]">全部分类</option>
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0d1a1a]">{CATEGORY_LABELS[c]}</option>)}
                </select>
              </div>

              <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as any); setPage(1) }} className="flex-1 sm:flex-none px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-300 outline-none focus:border-accentColor/50 transition-colors appearance-none cursor-pointer">
                <option value="all" className="bg-[#0d1a1a]">全部状态</option>
                <option value="published" className="bg-[#0d1a1a]">已发布</option>
                <option value="draft" className="bg-[#0d1a1a]">草稿</option>
              </select>

              {hasActiveFilters && (
                <button onClick={resetFilters} className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-gray-400 hover:text-gray-200 border border-white/[0.08] hover:border-white/20 rounded-xl transition-all shrink-0">
                  <RefreshCw size={12} />
                  <span className="hidden sm:inline">重置</span>
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <span className="text-xs text-gray-500 shrink-0">
                {filtered.length}/{mappedProjects.length}
              </span>
            )}
          </div>

          {/* ── Table / Content ── */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />)}
            </div>
          ) : (
            <>
              {/* ── Mobile Card List (< md) ── */}
              <div className="md:hidden space-y-3">
                {paginated.length === 0 ? (
                  <EmptyState onReset={resetFilters} />
                ) : (
                  paginated.map((p, idx) => (
                    <ProjectCard
                      key={p.id} project={p}
                      rowNum={(page - 1) * ITEMS_PER_PAGE + idx + 1}
                      isSelected={selectedIds.includes(p.id)}
                      onToggle={() => toggleSelect(p.id)}
                      onEdit={() => setFormModal({ open: true, mode: "edit", data: p })}
                      onDelete={() => openDelete(p)} 
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
                            type="checkbox"
                            checked={paginated.length > 0 && selectedIds.length === paginated.length}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]"
                          />
                        </th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-2 py-3.5 w-8">#</th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 min-w-[280px]">项目信息</th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-36">分类</th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-32">状态</th>
                        <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-48">链接</th>
                        <th className="text-right text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-5 py-3.5 w-24">操作</th>
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
                        paginated.map((p, idx) => (
                          <ProjectTableRow
                            key={p.id} project={p}
                            rowNum={(page - 1) * ITEMS_PER_PAGE + idx + 1}
                            isSelected={selectedIds.includes(p.id)}
                            onToggle={() => toggleSelect(p.id)}
                            onEdit={() => setFormModal({ open: true, mode: "edit", data: p })}
                            onDelete={() => openDelete(p)}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Table Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-5 py-3.5 border-t border-white/[0.06] bg-white/[0.02]">
                  <p className="text-xs text-gray-500">
                    显示 <span className="text-gray-300 font-medium">{filtered.length === 0 ? 0 : Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)}</span>，共 <span className="text-gray-300 font-medium">{filtered.length}</span> 条
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
      <ProjectFormModal
        isOpen={formModal.open}
        mode={formModal.mode}
        initialData={formModal.data}
        onClose={() => setFormModal({ open: false, mode: "create" })}
        onSave={handleSave}
        externalSaving={saving}
      />

      <ProjectDeleteModal
        isOpen={deleteModal.open}
        projectTitle={deleteModal.project?.title || ""}
        projectId={deleteModal.project?.id || ""}
        onClose={() => setDeleteModal({ open: false, project: null })}
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
                <h3 className="text-lg font-semibold text-white mb-1.5">删除选中的 {selectedIds.length} 个项目？</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  项目记录及关联缩略图将一并删除。<br/>
                  <span className="font-semibold text-gray-300">此操作无法撤销。</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 bg-white/[0.02] border-t border-white/[0.06]">
              <button 
                onClick={() => setBulkDeleteModal(false)} 
                disabled={isDeletingBulk} 
                className="flex-1 py-2.5 text-sm font-medium text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-all disabled:opacity-50"
              >
                取消
              </button>
              <button 
                onClick={handleBulkDelete} 
                disabled={isDeletingBulk} 
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-red-500/90 hover:bg-red-500 rounded-xl transition-all disabled:opacity-50"
              >
                {isDeletingBulk ? <RefreshCw size={16} className="animate-spin" /> : "确认全部删除"}
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
      <FolderKanban size={28} className="opacity-30" />
      <p className="text-sm">没有找到匹配的项目。</p>
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

function ProjectCard({ project, rowNum, onEdit, onDelete, isSelected, onToggle }: { project: any, rowNum: number, onEdit: () => void, onDelete: () => void, isSelected: boolean, onToggle: () => void }) {
  return (
    <div className={cn("rounded-2xl border bg-white/[0.02] p-4 space-y-3 transition-colors", isSelected ? "border-accentColor/40 bg-accentColor/5" : "border-white/[0.07]")}>
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="pt-0.5 shrink-0">
          <input 
            type="checkbox" checked={isSelected} onChange={onToggle}
            className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]" 
          />
        </div>
        <div className="w-14 h-11 rounded-xl overflow-hidden shrink-0 bg-white/[0.04] border border-white/[0.06]">
          {project.thumbnail_url ? (
            <img src={project.thumbnail_url} alt="img" className="w-full h-full object-cover" />
          ) : <FolderKanban className="m-auto h-full text-gray-600" size={14} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-200 line-clamp-2 leading-snug">{project.title}</p>
          <p className="text-[10px] text-gray-600 font-mono mt-0.5 truncate">{project.id}</p>
        </div>
        <span className="text-xs text-gray-600 tabular-nums shrink-0">#{rowNum}</span>
      </div>

      {/* Status Badges */}
      <div className="flex items-center gap-2 flex-wrap pl-7">
        <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-lg border capitalize", CATEGORY_STYLE[project.category] ?? "bg-gray-500/15 text-gray-400 border-gray-500/20")}>
          {CATEGORY_LABELS[project.category] || "未分类"}
        </span>
        {project.is_popular && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-500 border border-amber-500/20">
            <Star size={10} className="fill-amber-500" /> 热门
          </span>
        )}
        {!project.is_published && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/20">
            <EyeOff size={10} /> 草稿
          </span>
        )}
      </div>

      {/* Tech stack & Actions */}
      <div className="flex items-end justify-between pl-7">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[11px] text-gray-500 mr-1">{project.year}</span>
          {project.tech_stack?.slice(0, 2).map((t: string) => (
            <span key={t} className="text-[10px] px-2 py-0.5 bg-white/[0.05] border border-white/[0.07] rounded-md text-gray-400">{t}</span>
          ))}
          {project.tech_stack?.length > 2 && <span className="text-[10px] text-gray-600">+{project.tech_stack.length - 2}</span>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={onEdit} className="p-2 rounded-xl text-gray-500 hover:text-accentColor hover:bg-accentColor/10 border border-transparent hover:border-accentColor/20 transition-all"><Edit2 size={13} /></button>
          <button onClick={onDelete} className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"><Trash2 size={13} /></button>
        </div>
      </div>
    </div>
  )
}

function ProjectTableRow({ project, rowNum, onEdit, onDelete, isSelected, onToggle }: { project: any, rowNum: number, onEdit: () => void, onDelete: () => void, isSelected: boolean, onToggle: () => void }) {
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
          <div className="w-12 h-9 rounded-lg overflow-hidden shrink-0 bg-white/[0.04] border border-white/[0.06]">
            {project.thumbnail_url ? (
              <img src={project.thumbnail_url} alt="img" className="w-full h-full object-cover" />
            ) : <FolderKanban className="m-auto h-full text-gray-600" size={14} />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-200 line-clamp-1 group-hover:text-accentColor transition-colors leading-snug">{project.title}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-gray-500">{project.year}</span>
              {project.tech_stack?.slice(0, 2).map((t: string) => (
                <span key={t} className="text-[9px] px-1.5 py-0.5 bg-white/[0.05] border border-white/[0.07] rounded-md text-gray-400">{t}</span>
              ))}
              {project.tech_stack?.length > 2 && <span className="text-[9px] text-gray-600">+{project.tech_stack.length - 2}</span>}
            </div>
          </div>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-lg border capitalize", CATEGORY_STYLE[project.category] ?? "bg-gray-500/15 text-gray-400 border-gray-500/20")}>
          {CATEGORY_LABELS[project.category] || "未分类"}
        </span>
      </td>

      <td className="px-4 py-3.5">
        <div className="flex flex-col gap-1.5 items-start">
          {project.is_popular ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-500 border border-amber-500/20">
              <Star size={10} className="fill-amber-500" /> 热门
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.05] text-gray-400 border border-white/[0.08]">
              普通
            </span>
          )}
          {!project.is_published && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/20">
              <EyeOff size={10} /> 草稿
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-3.5">
        <div className="flex flex-col gap-1.5">
          {project.github_urls?.length > 0 ? project.github_urls.map((u: any) => (
            <div key={u.id} className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <Github size={11} className="shrink-0" /> 
              <span className="truncate max-w-[120px] hover:text-white cursor-pointer" title={u.url}>{u.label}</span>
            </div>
          )) : <span className="text-[10px] text-gray-600">-</span>}
        </div>
      </td>

      <td className="px-5 py-3.5">
        <div className="flex items-center justify-end gap-1.5">
          <button onClick={onEdit} title="编辑" className="p-2 rounded-xl text-gray-500 hover:text-accentColor hover:bg-accentColor/10 border border-transparent hover:border-accentColor/20 transition-all">
            <Edit2 size={13} />
          </button>
          <button onClick={onDelete} title="删除" className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all">
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  )
}
