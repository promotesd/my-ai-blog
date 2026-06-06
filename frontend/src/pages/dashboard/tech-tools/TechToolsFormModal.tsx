"use client"

import { useState, useEffect, type ReactNode } from "react"
import { X, Loader2, Wrench, PaintBucket, Layers, Link2, Star, Tag, AlignLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TechToolFormData {
  id?: number
  name: string
  category: string
  iconKey: string
  iconColor: string
  description: string
  usageRating: number
  badge: string
  isFavorite: boolean
  officialUrl: string
  tags: string[]
  detail: string
}

const EMPTY_FORM: TechToolFormData = {
  name: "", category: "Code Editor & IDE", iconKey: "", iconColor: "#ffffff",
  description: "", usageRating: 5, badge: "Daily Use", isFavorite: false,
  officialUrl: "", tags: [], detail: ""
}

const CATEGORIES = [
  "Code Editor & IDE", "Design & UI Tools", "Framework & Library",
  "Database & Storage", "DevOps & Cloud", "Browser & Extensions",
  "Software & Aplikasi Desktop", "Website Tools & Online Services",
  "Streaming & Entertainment", "AI Tools & Productivity", "Hardware & Gadget"
]

interface TechToolsFormModalProps {
  isOpen: boolean
  mode: "create" | "edit"
  initialData?: Partial<TechToolFormData>
  onClose: () => void
  onSave: (data: TechToolFormData) => void
  externalSaving?: boolean
}

export default function TechToolsFormModal({ isOpen, mode, initialData, onClose, onSave, externalSaving }: TechToolsFormModalProps) {
  const [form, setForm] = useState<TechToolFormData>(EMPTY_FORM)
  const [tagInput, setTagInput] = useState("")

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
      setTagInput("")
    }
  }, [isOpen, initialData])

  function setField<K extends keyof TechToolFormData>(key: K, value: TechToolFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
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

  if (!isOpen) return null
  const isValid = form.name.trim() && form.category && form.description.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">{mode === "create" ? "New Tech Tool" : "Edit Tech Tool"}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Kelola teknologi, software, dan perangkat Anda</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-none px-6 py-5 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nama Tool" icon={<Wrench size={12} className="text-gray-500" />} required>
              <TextInput value={form.name} onChange={(v) => setField("name", v)} placeholder="Misal: Visual Studio Code..." />
            </FormField>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Kategori <span className="text-red-400">*</span></label>
              <select value={form.category} onChange={(e) => setField("category", e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors appearance-none">
                <option value="" disabled className="bg-[#0e1c1c]">Pilih Kategori</option>
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0e1c1c]">{c}</option>)}
              </select>
            </div>
          </div>

          <FormField label="Deskripsi Utama" required>
            <textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={3} placeholder="Ceritakan kenapa menggunakan tool ini..." className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors resize-none" />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Icon Key (React Icons)" icon={<Layers size={12} className="text-gray-500" />}>
              <TextInput value={form.iconKey} onChange={(v) => setField("iconKey", v)} placeholder="Misal: SiVscodeAlt" />
            </FormField>
            <FormField label="Icon Color" icon={<PaintBucket size={12} className="text-gray-500" />}>
              <div className="flex items-center gap-3">
                <input type="color" value={form.iconColor} onChange={(e) => setField("iconColor", e.target.value)} className="w-10 h-10 p-0 border-0 rounded-lg cursor-pointer bg-transparent" />
                <TextInput value={form.iconColor} onChange={(v) => setField("iconColor", v)} placeholder="#007ACC" />
              </div>
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Usage Rating (1-5)" icon={<Star size={12} className="text-gray-500" />} required>
              <div className="flex items-center gap-4 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5">
                <input type="range" min="1" max="5" value={form.usageRating} onChange={(e) => setField("usageRating", parseInt(e.target.value))} className="flex-1 accent-accentColor cursor-pointer" />
                <span className="text-sm font-semibold text-accentColor w-4 text-center">{form.usageRating}</span>
              </div>
            </FormField>
            <FormField label="Badge" hint="Label badge kecil">
              <TextInput value={form.badge} onChange={(v) => setField("badge", v)} placeholder="Daily Use, Recommended..." />
            </FormField>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Favorite Status</label>
              <button
                type="button" onClick={() => setField("isFavorite", !form.isFavorite)}
                className={cn("flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all border", form.isFavorite ? "bg-amber-500/20 border-amber-500/40 text-amber-500" : "bg-white/[0.02] border-white/[0.08] text-gray-500")}
              >
                <Star size={16} className={form.isFavorite ? "fill-amber-500" : ""} />
                {form.isFavorite ? "Favorite" : "Biasa"}
              </button>
            </div>
          </div>

          <FormField label="Official URL" icon={<Link2 size={12} className="text-gray-500" />}>
            <TextInput value={form.officialUrl} onChange={(v) => setField("officialUrl", v)} placeholder="https://..." />
          </FormField>

          <FormField label="Tags" icon={<Tag size={12} className="text-gray-500" />} hint="Tekan enter untuk tambah tag">
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
              <input 
                value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} 
                placeholder="Ketik tag lalu tekan Enter..." className="w-full bg-transparent text-sm text-gray-200 placeholder:text-gray-600 outline-none" 
              />
            </div>
          </FormField>

          <FormField label="Detail / Spesifikasi Tambahan (Opsional)" icon={<AlignLeft size={12} className="text-gray-500" />}>
            <textarea value={form.detail || ""} onChange={(e) => setField("detail", e.target.value)} rows={2} placeholder="Misal spek hardware (Intel Core i7...)" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors resize-none" />
          </FormField>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] shrink-0 bg-[#0a1515]">
          <p className="text-xs text-gray-600"><span className="text-red-400">*</span> Wajib diisi</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 rounded-xl hover:bg-white/[0.06]">Batal</button>
            <button onClick={() => onSave(form)} disabled={externalSaving || !isValid} className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-accentColor text-white rounded-xl hover:brightness-110 disabled:opacity-50 transition-all">
              {externalSaving && <Loader2 size={13} className="animate-spin" />}
              {mode === "create" ? "Buat Entry" : "Simpan Perubahan"}
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

function TextInput({ value, onChange, placeholder, disabled }: { value: string, onChange: (v: string) => void, placeholder?: string, disabled?: boolean }) {
  return (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors placeholder:text-gray-600 disabled:opacity-50" />
  )
}
