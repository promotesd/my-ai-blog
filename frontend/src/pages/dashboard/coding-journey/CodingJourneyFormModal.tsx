"use client"

import { useState, useEffect, type ReactNode } from "react"
import { X, Loader2, Calendar, Hash, Type, AlignLeft, PaintBucket, Layers } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CodingJourneyFormData {
  id: string
  year: string
  title: string
  description: string
  icon_key: string
  color: string
  display_order: number
  is_published: boolean
}

const EMPTY_FORM: CodingJourneyFormData = {
  id: "",
  year: new Date().getFullYear().toString(),
  title: "",
  description: "",
  icon_key: "Code2",
  color: "from-blue-500 to-cyan-500",
  display_order: 0,
  is_published: true,
}

// Preset Tailwind Gradients berdasarkan seed data
const GRADIENT_COLORS = [
  { label: "Blue to Cyan", value: "from-blue-500 to-cyan-500" },
  { label: "Cyan to Teal", value: "from-cyan-500 to-teal-500" },
  { label: "Teal to Green", value: "from-teal-500 to-green-500" },
  { label: "Green to Emerald", value: "from-green-500 to-emerald-500" },
  { label: "Emerald to Accent", value: "from-emerald-500 to-accentColor" },
  { label: "Yellow to Orange", value: "from-yellow-500 to-orange-500" },
  { label: "Orange to Red", value: "from-orange-500 to-red-500" },
  { label: "Red to Pink", value: "from-red-500 to-pink-500" },
  { label: "Purple to Indigo", value: "from-purple-500 to-indigo-500" },
]

interface CodingJourneyFormModalProps {
  isOpen: boolean
  mode: "create" | "edit"
  initialData?: Partial<CodingJourneyFormData>
  onClose: () => void
  onSave: (data: CodingJourneyFormData) => void
  externalSaving?: boolean
}

export default function CodingJourneyFormModal({ isOpen, mode, initialData, onClose, onSave, externalSaving }: CodingJourneyFormModalProps) {
  const [form, setForm] = useState<CodingJourneyFormData>(EMPTY_FORM)

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
    }
  }, [isOpen, initialData])

  function setField<K extends keyof CodingJourneyFormData>(key: K, value: CodingJourneyFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  if (!isOpen) return null
  const isValid = form.title.trim() && form.year.trim() && form.description.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">{mode === "create" ? "New Milestone" : "Edit Milestone"}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Kelola catatan perjalanan coding Anda</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-none px-6 py-5 space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <FormField label="ID Milestone" hint="Kosong = Auto UUID">
              <TextInput value={form.id} onChange={(v) => setField("id", v)} placeholder="Custom ID / Kosongkan" disabled={mode === "edit"} />
            </FormField>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Publish Status</label>
              <button
                type="button"
                onClick={() => setField("is_published", !form.is_published)}
                className={cn(
                  "w-full py-2.5 rounded-xl text-sm font-semibold transition-all border",
                  form.is_published ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "bg-white/[0.02] border-white/[0.08] text-gray-500"
                )}
              >
                {form.is_published ? "Published" : "Hidden (Draft)"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Tahun" icon={<Calendar size={12} className="text-gray-500" />} required>
              <TextInput value={form.year} onChange={(v) => setField("year", v)} placeholder="2022" />
            </FormField>
            <div className="col-span-2">
              <FormField label="Judul Milestone" icon={<Type size={12} className="text-gray-500" />} required>
                <TextInput value={form.title} onChange={(v) => setField("title", v)} placeholder="Cth: Lulus SMK & Mulai Coding" />
              </FormField>
            </div>
          </div>

          <FormField label="Deskripsi" icon={<AlignLeft size={12} className="text-gray-500" />} required>
            <textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={4} placeholder="Ceritakan detail perjalanan Anda pada momen ini..." className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors resize-none" />
          </FormField>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Icon Key" icon={<Layers size={12} className="text-gray-500" />} hint="Lucide / React-Icons">
              <TextInput value={form.icon_key} onChange={(v) => setField("icon_key", v)} placeholder="Cth: Rocket, SiCplusplus" />
            </FormField>
            
            <FormField label="Warna Gradient" icon={<PaintBucket size={12} className="text-gray-500" />}>
              <select value={form.color} onChange={(e) => setField("color", e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors appearance-none cursor-pointer">
                {GRADIENT_COLORS.map(c => <option key={c.value} value={c.value} className="bg-[#0e1c1c]">{c.label}</option>)}
                {/* Fallback jika warna tidak ada di preset */}
                {!GRADIENT_COLORS.find(c => c.value === form.color) && <option value={form.color} className="bg-[#0e1c1c]">Custom: {form.color}</option>}
              </select>
            </FormField>

            <FormField label="Display Order" icon={<Hash size={12} className="text-gray-500" />} hint="Harus unik!">
              <input 
                type="number" min="0" value={form.display_order} 
                onChange={(e) => setField("display_order", parseInt(e.target.value) || 0)} 
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors" 
              />
            </FormField>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 leading-relaxed">
            <strong>Penting:</strong> Kolom <code>display_order</code> bersifat UNIQUE. Jika Anda memasukkan angka yang sudah ada, proses penyimpanan akan gagal (ditolak oleh database).
          </div>

        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] shrink-0 bg-[#0a1515]">
          <p className="text-xs text-gray-600"><span className="text-red-400">*</span> Wajib diisi</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 rounded-xl hover:bg-white/[0.06]">Batal</button>
            <button onClick={() => onSave(form)} disabled={externalSaving || !isValid} className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-accentColor text-white rounded-xl hover:brightness-110 disabled:opacity-50 transition-all">
              {externalSaving && <Loader2 size={13} className="animate-spin" />}
              {mode === "create" ? "Buat Milestone" : "Simpan Perubahan"}
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
