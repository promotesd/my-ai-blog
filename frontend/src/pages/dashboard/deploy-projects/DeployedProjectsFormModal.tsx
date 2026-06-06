"use client"

import { useState, useEffect, type ReactNode } from "react"
import { X, Loader2, Link2, Globe, Smartphone, Play, Apple, FileArchive, LayoutGrid, Tag, Images } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DeployedProjectFormData {
  id: string
  title: string
  slug: string
  summary: string
  description: string
  thumbnail_url: string
  gallery_urls: string[]
  platform: string
  web_url: string
  play_store_url: string
  apk_file_path: string
  external_apk_url: string
  app_store_url: string
  demo_url: string
  update_notes: string
  tags: string[]
}

const EMPTY_FORM: DeployedProjectFormData = {
  id: "", title: "", slug: "", summary: "", description: "", thumbnail_url: "",
  gallery_urls: [], platform: "Web", web_url: "", play_store_url: "",
  apk_file_path: "", external_apk_url: "", app_store_url: "", demo_url: "",
  update_notes: "", tags: []
}

const DEFAULT_URL = "https://i.pinimg.com/736x/31/dc/76/31dc76b88cfba521b6f3836b8f439a03.jpg"

interface DeployedProjectsFormModalProps {
  isOpen: boolean
  mode: "create" | "edit"
  initialData?: Partial<DeployedProjectFormData>
  onClose: () => void
  onSave: (data: DeployedProjectFormData) => void
  externalSaving?: boolean
}

export default function DeployedProjectsFormModal({ isOpen, mode, initialData, onClose, onSave, externalSaving }: DeployedProjectsFormModalProps) {
  const [form, setForm] = useState<DeployedProjectFormData>(EMPTY_FORM)
  const [tagInput, setTagInput] = useState("")
  const [galleryUrlInput, setGalleryUrlInput] = useState("")

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
      setTagInput("")
      setGalleryUrlInput("")
    }
  }, [isOpen, initialData])

  function setField<K extends keyof DeployedProjectFormData>(key: K, value: DeployedProjectFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Auto Slug Generator
  function handleTitleChange(val: string) {
    setField("title", val)
    if (mode === "create") {
      const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      setField("slug", autoSlug)
    }
  }

  function addTag() {
    const val = tagInput.trim()
    if (val && !form.tags.includes(val)) {
      setField("tags", [...form.tags, val])
      setTagInput("")
    }
  }

  function removeTag(val: string) {
    setField("tags", form.tags.filter(t => t !== val))
  }
  
  function addGalleryUrl() {
    const val = galleryUrlInput.trim();
    if (val && !form.gallery_urls.includes(val)) {
      setField("gallery_urls", [...form.gallery_urls, val]);
      setGalleryUrlInput("");
    }
  }

  if (!isOpen) return null
  const isValid = form.title.trim() && form.slug.trim() && form.summary.trim() && form.description.trim() && form.thumbnail_url.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">{mode === "create" ? "New Deployed Project" : "Edit Deployed Project"}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Kelola aplikasi dan project rilis Anda</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-none px-6 py-5 space-y-6">
          
          {/* SECTION: BASIC INFO */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Title" required>
              <TextInput value={form.title} onChange={handleTitleChange} placeholder="Nama Aplikasi / Project" />
            </FormField>
            <FormField label="URL Slug" hint="Unik, format-kebab-case" required>
              <TextInput value={form.slug} onChange={(v: string) => setField("slug", v)} placeholder="nama-aplikasi" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Platform (Manual Input)" required>
              <TextInput value={form.platform} onChange={v => setField("platform", v)} placeholder="Contoh: Web, Android, iOS, AI Model, dst." />
            </FormField>
            <FormField label="Tags" icon={<Tag size={12} className="text-gray-500" />} hint="Tekan Enter">
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-2.5 space-y-2 focus-within:border-accentColor/60 transition-colors">
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.tags.map(t => (
                      <span key={t} className="flex items-center gap-1 text-[11px] px-2 py-1 bg-accentColor/10 text-accentColor rounded-md border border-accentColor/20">
                        {t} <button type="button" onClick={() => removeTag(t)} className="hover:text-red-400 ml-0.5"><X size={12}/></button>
                      </span>
                    ))}
                  </div>
                )}
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="Ketik tag lalu Enter..." className="w-full bg-transparent text-sm text-gray-200 placeholder:text-gray-600 outline-none" />
              </div>
            </FormField>
          </div>

          <FormField label="Summary (Singkat)" required>
            <textarea value={form.summary} onChange={(e) => setField("summary", e.target.value)} rows={2} placeholder="Deskripsi pendek 1-2 kalimat..." className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors resize-none" />
          </FormField>

          <FormField label="Description (Lengkap)" required>
            <textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={5} placeholder="Penjelasan lengkap tentang fitur, teknologi, dan tantangan project..." className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors resize-none" />
          </FormField>

          <FormField label="Update Notes" hint="Catatan versi terbaru (Opsional)">
            <textarea value={form.update_notes || ""} onChange={(e) => setField("update_notes", e.target.value)} rows={2} placeholder="v1.2.0 - Menambahkan fitur dark mode..." className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors resize-none" />
          </FormField>

          {/* SECTION: MEDIA */}
          <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-5">
            <h3 className="text-xs font-semibold text-accentColor uppercase tracking-wider flex items-center gap-2"><Images size={14}/> Media & URLs</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Thumbnail URL" required>
                <TextInput value={form.thumbnail_url} onChange={(v) => setField("thumbnail_url", v)} placeholder="https://..." />
                {form.thumbnail_url && (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/[0.08] bg-black/40 mt-2">
                    <img src={form.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setField("thumbnail_url", "")} className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-red-500 transition-colors"><X size={14} /></button>
                  </div>
                )}
              </FormField>

              <FormField label="APK File URL">
                <TextInput value={form.apk_file_path} onChange={(v) => setField("apk_file_path", v)} placeholder="https://..." />
                 {form.apk_file_path && (
                  <div className="mt-2 flex items-center justify-between px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileArchive size={14} className="text-emerald-400 shrink-0" />
                      <a href={form.apk_file_path} target="_blank" rel="noreferrer" className="text-sm font-medium text-emerald-400 hover:underline truncate">Test APK Link</a>
                    </div>
                    <button type="button" onClick={() => setField("apk_file_path", "")} className="p-1.5 rounded-lg text-emerald-400 hover:text-red-400 hover:bg-red-500/10 shrink-0"><X size={14}/></button>
                  </div>
                )}
              </FormField>
            </div>

            <FormField label="Gallery Image URLs" hint="Tekan Enter untuk menambah URL">
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-2.5 space-y-3 focus-within:border-accentColor/60 transition-colors">
                {form.gallery_urls.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {form.gallery_urls.map((url, idx) => (
                      <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-white/[0.08] bg-black/40">
                        <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setField("gallery_urls", form.gallery_urls.filter((_, i) => i !== idx))} className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white hover:bg-red-500 transition-colors"><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <input 
                  value={galleryUrlInput} 
                  onChange={(e) => setGalleryUrlInput(e.target.value)} 
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addGalleryUrl(); } }} 
                  placeholder="Paste URL gambar lalu Enter..." 
                  className="w-full bg-transparent text-sm text-gray-200 placeholder:text-gray-600 outline-none"
                />
              </div>
            </FormField>
          </div>

          {/* SECTION: URLs DENGAN CHECKBOX DEFAULT */}
          <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-4">
            <h3 className="text-xs font-semibold text-accentColor uppercase tracking-wider flex items-center gap-2"><Link2 size={14}/> Action URLs & Links</h3>
            <div className="grid grid-cols-2 gap-4">
              <UrlFieldWithDefault label="Web URL" value={form.web_url || ""} onChange={(v) => setField("web_url", v)} icon={<Globe size={12}/>} />
              <UrlFieldWithDefault label="Demo / Preview URL" value={form.demo_url || ""} onChange={(v) => setField("demo_url", v)} icon={<Play size={12}/>} />
              <UrlFieldWithDefault label="Play Store URL" value={form.play_store_url || ""} onChange={(v) => setField("play_store_url", v)} icon={<Smartphone size={12}/>} />
              <UrlFieldWithDefault label="App Store URL" value={form.app_store_url || ""} onChange={(v) => setField("app_store_url", v)} icon={<Apple size={12}/>} />
              <div className="col-span-2">
                <UrlFieldWithDefault label="External APK URL" value={form.external_apk_url || ""} onChange={(v) => setField("external_apk_url", v)} icon={<Link2 size={12}/>} hint="Jika file APK di-host di tempat lain" />
              </div>
            </div>
          </div>

        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] shrink-0 bg-[#0a1515]">
          <p className="text-xs text-gray-600"><span className="text-red-400">*</span> Wajib diisi</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 rounded-xl hover:bg-white/[0.06]">Batal</button>
            <button onClick={() => onSave(form)} disabled={externalSaving || !isValid} className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-accentColor text-white rounded-xl hover:brightness-110 disabled:opacity-50 transition-all">
              {externalSaving && <Loader2 size={13} className="animate-spin" />}
              {mode === "create" ? "Simpan Project Baru" : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Komponen Input URL Khusus dengan fitur Checkbox "Gunakan Default"
interface UrlFieldWithDefaultProps {
  label: string
  value: string
  onChange: (value: string) => void
  icon: ReactNode
  hint?: string
}
function UrlFieldWithDefault({ label, value, onChange, icon, hint }: UrlFieldWithDefaultProps) {
  const isDefault = value === DEFAULT_URL
  
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
          {icon} {label} {hint && <span className="text-gray-600 font-normal text-[10px]">— {hint}</span>}
        </label>
        <label className="flex items-center gap-1.5 text-[10px] font-medium text-gray-300 cursor-pointer hover:text-accentColor transition-colors">
          <input 
            type="checkbox" checked={isDefault}
            onChange={(e) => onChange(e.target.checked ? DEFAULT_URL : "")}
            className="w-3 h-3 rounded accent-accentColor cursor-pointer bg-white/[0.05] border-white/[0.1]" 
          />
          Default
        </label>
      </div>
      <input 
        type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://..." 
        className={cn(
          "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors placeholder:text-gray-600",
          isDefault && "text-accentColor/80 bg-accentColor/5"
        )} 
      />
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

function TextInput({ value, onChange, placeholder, disabled }: { value: string, onChange: (v: string) => void, placeholder?: string, disabled?: boolean }) {
  return (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors placeholder:text-gray-600 disabled:opacity-50" />
  )
}
