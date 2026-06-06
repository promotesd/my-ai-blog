"use client"

import { useState, useEffect, type ReactNode } from "react"
import { X, Loader2, Folder, Link2, Calendar, Tag } from "lucide-react"

export interface AlbumFormData {
  name: string
  description: string
  slug: string
  cover_url: string
  category: string
  period: string
}

const EMPTY_FORM: AlbumFormData = {
  name: "",
  description: "",
  slug: "",
  cover_url: "",
  category: "Personal",
  period: new Date().getFullYear().toString(),
}

const CATEGORIES = ["Travel & Wisata", "Coding & Workspace", "Personal", "Event", "Lainnya"]

interface AlbumFormModalProps {
  isOpen: boolean
  mode: "create" | "edit"
  initialData?: Partial<AlbumFormData>
  onClose: () => void
  onSave: (data: AlbumFormData) => void
  externalSaving?: boolean
}

export default function AlbumFormModal({ isOpen, mode, initialData, onClose, onSave, externalSaving }: AlbumFormModalProps) {
  const [form, setForm] = useState<AlbumFormData>(EMPTY_FORM)

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
    }
  }, [isOpen, initialData])

  function setField<K extends keyof AlbumFormData>(key: K, value: AlbumFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleNameChange(val: string) {
    setField("name", val)
    setField("slug", val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''))
  }

  if (!isOpen) return null
  const isValid = form.name.trim() && form.slug.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">{mode === "create" ? "New Album" : "Edit Album"}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Kelola album foto</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-none px-6 py-5 space-y-6">
          <FormField label="Nama Album" required>
            <TextInput value={form.name} onChange={handleNameChange} placeholder="Cth: Liburan ke Bromo" />
          </FormField>

          <FormField label="Slug" hint="Otomatis dari nama album, digunakan untuk URL">
            <TextInput value={form.slug} onChange={(v) => setField("slug", v)} placeholder="liburan-ke-bromo" />
          </FormField>

          <FormField label="Deskripsi Album">
            <textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={3} placeholder="Deskripsi singkat tentang album ini..." className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors resize-none" />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Kategori" icon={<Tag size={12} />}>
              <select value={form.category} onChange={(e) => setField("category", e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors appearance-none">
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0e1c1c]">{c}</option>)}
              </select>
            </FormField>
            <FormField label="Periode (Tahun)" icon={<Calendar size={12} />}>
              <TextInput value={form.period} onChange={(v) => setField("period", v)} placeholder="Cth: 2024" />
            </FormField>
          </div>

          <FormField label="URL Gambar Sampul" icon={<Link2 size={12} />} hint="URL gambar untuk sampul album">
            <TextInput value={form.cover_url} onChange={(v) => setField("cover_url", v)} placeholder="https://..." />
          </FormField>

          {form.cover_url && (
            <div className="mt-4 aspect-video w-full max-w-sm rounded-xl overflow-hidden border border-white/[0.08] bg-black/40 mx-auto relative">
              <img src={form.cover_url} alt="Preview" className="w-full h-full object-contain" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] shrink-0 bg-[#0a1515]">
          <p className="text-xs text-gray-600"><span className="text-red-400">*</span> Wajib diisi</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 rounded-xl hover:bg-white/[0.06]">Batal</button>
            <button onClick={() => onSave(form)} disabled={externalSaving || !isValid} className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-accentColor text-white rounded-xl hover:brightness-110 disabled:opacity-50 transition-all">
              {externalSaving && <Loader2 size={13} className="animate-spin" />}
              {mode === "create" ? "Simpan Album" : "Simpan Perubahan"}
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
