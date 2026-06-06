"use client"

import { useState, useEffect, type ReactNode } from "react"
import { X, Upload, Plus, Loader2, Star, Layers, Code, Globe, Calendar, Link2 } from "lucide-react"
import { FaGithub as Github } from "react-icons/fa"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

export interface GithubUrlData {
  label: string
  url: string
}

export interface ProjectFormData {
  id: string
  title: string
  description: string
  thumbnail_url: string
  platform_apps: string[]
  tech_stack: string[]
  live_url: string
  github_api: string
  category: "personal" | "academic" | "freelance" | "company" | ""
  year: number
  is_published: boolean
  display_order: number
  is_popular: boolean
  github_urls: GithubUrlData[]
}

const EMPTY_FORM: ProjectFormData = {
  id: "",
  title: "",
  description: "",
  thumbnail_url: "",
  platform_apps: [],
  tech_stack: [],
  live_url: "",
  github_api: "",
  category: "",
  year: new Date().getFullYear(),
  is_published: true,
  display_order: 0,
  is_popular: false,
  github_urls: [],
}

const CATEGORIES = ["personal", "academic", "freelance", "company"]

interface ProjectFormModalProps {
  isOpen: boolean
  mode: "create" | "edit"
  initialData?: Partial<ProjectFormData>
  onClose: () => void
  onSave: (data: ProjectFormData) => void
  externalSaving?: boolean
}

export default function ProjectFormModal({
  isOpen, mode, initialData, onClose, onSave, externalSaving
}: ProjectFormModalProps) {
  const [form, setForm] = useState<ProjectFormData>(EMPTY_FORM)
  const [techInput, setTechInput] = useState("")
  const [platformInput, setPlatformInput] = useState("")
  const [ghLabelInput, setGhLabelInput] = useState("")
  const [ghUrlInput, setGhUrlInput] = useState("")
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
      setTechInput("")
      setPlatformInput("")
      setGhLabelInput("")
      setGhUrlInput("")
    }
  }, [isOpen, initialData])

  function setField<K extends keyof ProjectFormData>(key: K, value: ProjectFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Helper arrays
  function addArrayItem(field: "tech_stack" | "platform_apps", val: string, setInput: (v: string) => void) {
    const v = val.trim()
    if (v && !form[field].includes(v)) {
      setField(field, [...form[field], v])
    }
    setInput("")
  }

  function removeArrayItem(field: "tech_stack" | "platform_apps", val: string) {
    setField(field, form[field].filter((item) => item !== val))
  }

  // Helper Github URLs
  function addGithubUrl() {
    const l = ghLabelInput.trim() || "web"
    const u = ghUrlInput.trim()
    if (u) {
      setField("github_urls", [...form.github_urls, { label: l, url: u }])
      setGhLabelInput("")
      setGhUrlInput("")
    }
  }
  function removeGithubUrl(index: number) {
    setField("github_urls", form.github_urls.filter((_, i) => i !== index))
  }

  async function handleFileUpload(file: File) {
    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${fileName}`
      const bucket = "project-thumbnails"

      const { error } = await supabase.storage.from(bucket).upload(filePath, file)
      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath)
      setField("thumbnail_url", publicUrl)
    } catch (error: any) {
      alert(`Gagal upload: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen) return null

  const isValid = form.title.trim() && form.description.trim() && form.category

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">
              {mode === "create" ? "New Project" : "Edit Project"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Kelola entri portofolio Anda</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-none px-6 py-5 space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Project ID" hint="Kosong = Auto UUID">
              <TextInput value={form.id} onChange={(v) => setField("id", v)} placeholder="Custom ID / Kosongkan" />
            </FormField>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-400 mb-2">Publish Status</label>
                <button
                  type="button"
                  onClick={() => setField("is_published", !form.is_published)}
                  className={cn(
                    "w-full py-2.5 rounded-xl text-sm font-semibold transition-all border",
                    form.is_published ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "bg-white/[0.02] border-white/[0.08] text-gray-500"
                  )}
                >
                  {form.is_published ? "Published" : "Draft"}
                </button>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-400 mb-2">Populer (Home)</label>
                <button
                  type="button"
                  onClick={() => setField("is_popular", !form.is_popular)}
                  className={cn(
                    "flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all border",
                    form.is_popular ? "bg-amber-500/20 border-amber-500/40 text-amber-500" : "bg-white/[0.02] border-white/[0.08] text-gray-500"
                  )}
                >
                  <Star size={16} className={form.is_popular ? "fill-amber-500" : ""} />
                  {form.is_popular ? "Populer" : "Standard"}
                </button>
              </div>
            </div>
          </div>

          <FormField label="Project Title" required>
            <TextInput value={form.title} onChange={(v) => setField("title", v)} placeholder="Nama project..." />
          </FormField>

          <FormField label="Description" required>
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={3}
              placeholder="Deskripsi singkat project..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors resize-none"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Kategori <span className="text-red-400">*</span></label>
              <select
                value={form.category} onChange={(e) => setField("category", e.target.value as any)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors cursor-pointer appearance-none capitalize"
              >
                <option value="" disabled className="bg-[#0e1c1c]">Pilih Kategori</option>
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0e1c1c] capitalize">{c}</option>)}
              </select>
            </div>
            <FormField label="Tahun Dibuat" icon={<Calendar size={12} className="text-gray-500"/>}>
              <input type="number" value={form.year} onChange={(e) => setField("year", parseInt(e.target.value) || new Date().getFullYear())} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Tech Stack" icon={<Code size={12} className="text-gray-500"/>} hint="Tekan enter">
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-2.5 space-y-2 focus-within:border-accentColor/60">
                {form.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.tech_stack.map(t => (
                      <span key={t} className="flex items-center gap-1 text-[11px] px-2 py-1 bg-accentColor/15 text-accentColor rounded-md">
                        {t} <button type="button" onClick={() => removeArrayItem("tech_stack", t)} className="hover:text-red-400 ml-0.5">×</button>
                      </span>
                    ))}
                  </div>
                )}
                <input value={techInput} onChange={(e) => setTechInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addArrayItem("tech_stack", techInput, setTechInput); } }} placeholder="Laravel, React..." className="w-full bg-transparent text-sm text-gray-200 placeholder:text-gray-600 outline-none" />
              </div>
            </FormField>

            <FormField label="Platform Apps" icon={<Layers size={12} className="text-gray-500"/>} hint="Tekan enter">
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-2.5 space-y-2 focus-within:border-accentColor/60">
                {form.platform_apps.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.platform_apps.map(p => (
                      <span key={p} className="flex items-center gap-1 text-[11px] px-2 py-1 bg-blue-500/15 text-blue-400 rounded-md">
                        {p} <button type="button" onClick={() => removeArrayItem("platform_apps", p)} className="hover:text-red-400 ml-0.5">×</button>
                      </span>
                    ))}
                  </div>
                )}
                <input value={platformInput} onChange={(e) => setPlatformInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addArrayItem("platform_apps", platformInput, setPlatformInput); } }} placeholder="Web App, Mobile App..." className="w-full bg-transparent text-sm text-gray-200 placeholder:text-gray-600 outline-none" />
              </div>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <FormField label="Live URL" icon={<Globe size={12} className="text-gray-500"/>}>
               <TextInput value={form.live_url || ""} onChange={(v) => setField("live_url", v)} placeholder="https://..." />
             </FormField>
             <FormField label="Github API URL" icon={<Link2 size={12} className="text-gray-500"/>} hint="Untuk live stars">
               <TextInput value={form.github_api || ""} onChange={(v) => setField("github_api", v)} placeholder="https://api.github.com/..." />
             </FormField>
          </div>

          <FormField label="Thumbnail" icon={<Upload size={12} className="text-gray-500" />}>
            <div className="space-y-2">
              {form.thumbnail_url ? (
                <div className="relative w-full h-36 rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.02]">
                  <img src={form.thumbnail_url} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setField("thumbnail_url", "")} className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-red-500/80 transition-colors backdrop-blur-sm">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="relative flex items-center">
                  <input
                    type="file" accept="image/*"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                    disabled={uploading}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-accentColor/10 file:text-accentColor hover:file:bg-accentColor/20 file:cursor-pointer disabled:opacity-50"
                  />
                  {uploading && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-accentColor" />}
                </div>
              )}
            </div>
          </FormField>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
              <Github size={11} /> GitHub Repositories
            </label>
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 space-y-3 focus-within:border-accentColor/60 transition-colors">
              {form.github_urls.length > 0 && (
                <div className="flex flex-col gap-2">
                  {form.github_urls.map((g, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2 bg-white/[0.03] rounded-lg text-xs border border-white/[0.06]">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="font-semibold text-gray-300 capitalize">{g.label}:</span>
                        <span className="truncate text-gray-400">{g.url}</span>
                      </div>
                      <button type="button" onClick={() => removeGithubUrl(idx)} className="text-gray-500 hover:text-red-400 ml-2">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <input value={ghLabelInput} onChange={(e) => setGhLabelInput(e.target.value)} placeholder="Label (web, mobile)" className="w-1/3 bg-white/[0.02] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-accentColor/50" />
                <input value={ghUrlInput} onChange={(e) => setGhUrlInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addGithubUrl(); } }} placeholder="https://github.com/..." className="flex-1 bg-white/[0.02] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-accentColor/50" />
                <button type="button" onClick={addGithubUrl} className="p-2 rounded-lg bg-accentColor/20 text-accentColor hover:bg-accentColor/30 transition-colors shrink-0">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] shrink-0 bg-[#0a1515]">
          <p className="text-xs text-gray-600"><span className="text-red-400">*</span> Wajib diisi</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 rounded-xl hover:bg-white/[0.06]">
              Batal
            </button>
            <button
              onClick={() => onSave(form)}
              disabled={externalSaving || !isValid}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-accentColor text-white rounded-xl hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {externalSaving && <Loader2 size={13} className="animate-spin" />}
              {mode === "create" ? "Buat Project" : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FormField({ label, required, hint, icon, children }: { label: string, required?: boolean, hint?: string, icon?: ReactNode, children: ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
        {icon} {label} {required && <span className="text-red-400">*</span>}
        {hint && <span className="text-gray-600 font-normal text-[10px]">— {hint}</span>}
      </label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder }: { value: string, onChange: (v: string) => void, placeholder?: string }) {
  return (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors placeholder:text-gray-600" />
  )
}
