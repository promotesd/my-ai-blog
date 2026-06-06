"use client"

import { useState, useEffect, type ReactNode } from "react"
import { X, Loader2, Code2, PaintBucket, Activity, Hash, Layers, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SkillFormData {
  id: string
  name: string
  category: "frontend" | "backend" | "ai_ml" | "mobile" | "devops" | "database" | "cloud" | ""
  icon_key: string
  icon_color: string
  level: number
  display_order: number
  is_published: boolean
}

const EMPTY_FORM: SkillFormData = {
  id: "",
  name: "",
  category: "",
  icon_key: "",
  icon_color: "#ffffff",
  level: 50,
  display_order: 0,
  is_published: true,
}

const CATEGORIES = ["frontend", "backend", "ai_ml", "mobile", "devops", "database", "cloud"]

interface SkillsFormModalProps {
  isOpen: boolean
  mode: "create" | "edit"
  initialData?: Partial<SkillFormData>
  onClose: () => void
  onSave: (data: SkillFormData) => void
  externalSaving?: boolean
}

export default function SkillsFormModal({
  isOpen, mode, initialData, onClose, onSave, externalSaving
}: SkillsFormModalProps) {
  const [form, setForm] = useState<SkillFormData>(EMPTY_FORM)

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
    }
  }, [isOpen, initialData])

  function setField<K extends keyof SkillFormData>(key: K, value: SkillFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  if (!isOpen) return null

  const isValid = form.name.trim() !== "" && form.category !== ""

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">
              {mode === "create" ? "New Skill" : "Edit Skill"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Kelola data keahlian dan teknologi</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-none px-6 py-5 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Skill ID" hint="Kosong = Auto UUID">
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

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Skill Name" icon={<Code2 size={12} className="text-gray-500" />} required>
              <TextInput value={form.name} onChange={(v) => setField("name", v)} placeholder="Misal: React, Node.js..." />
            </FormField>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Kategori <span className="text-red-400">*</span></label>
              <select
                value={form.category} onChange={(e) => setField("category", e.target.value as any)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors cursor-pointer appearance-none capitalize"
              >
                <option value="" disabled className="bg-[#0e1c1c]">Pilih Kategori</option>
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0e1c1c] capitalize">{c.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Icon Key (React Icons)" icon={<Layers size={12} className="text-gray-500" />}>
              <TextInput value={form.icon_key} onChange={(v) => setField("icon_key", v)} placeholder="Misal: SiReact" />
            </FormField>
            <FormField label="Icon Color" icon={<PaintBucket size={12} className="text-gray-500" />}>
              <div className="flex items-center gap-3">
                <input 
                  type="color" value={form.icon_color} onChange={(e) => setField("icon_color", e.target.value)} 
                  className="w-10 h-10 p-0 border-0 rounded-lg cursor-pointer bg-transparent"
                />
                <TextInput value={form.icon_color} onChange={(v) => setField("icon_color", v)} placeholder="#ffffff" />
              </div>
            </FormField>
          </div>

          <FormField label="Proficiency Level (0 - 100)" icon={<Activity size={12} className="text-gray-500" />}>
            <div className="flex items-center gap-4 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2">
              <input
                type="range" min="0" max="100" value={form.level} 
                onChange={(e) => setField("level", parseInt(e.target.value))}
                className="flex-1 accent-accentColor cursor-pointer"
              />
              <span className="text-sm font-semibold text-accentColor w-8 text-right">{form.level}%</span>
            </div>
          </FormField>

          <FormField label="Display Order" icon={<Hash size={12} className="text-gray-500" />} hint="Urutan tampilan dalam kategori">
            <input 
              type="number" min="0" value={form.display_order} 
              onChange={(e) => setField("display_order", parseInt(e.target.value) || 0)} 
              className="w-1/3 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors" 
            />
          </FormField>

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
              {mode === "create" ? "Buat Skill" : "Simpan Perubahan"}
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
