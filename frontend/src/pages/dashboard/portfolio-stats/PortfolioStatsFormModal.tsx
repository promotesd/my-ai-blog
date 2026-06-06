"use client"

import { useState, useEffect, type ReactNode } from "react"
import { X, Loader2, Briefcase } from "lucide-react"

export interface PortfolioStatFormData {
  id: string
  years_experience: number
}

const EMPTY_FORM: PortfolioStatFormData = {
  id: "",
  years_experience: 0,
}

interface PortfolioStatsFormModalProps {
  isOpen: boolean
  mode: "create" | "edit"
  initialData?: Partial<PortfolioStatFormData>
  onClose: () => void
  onSave: (data: PortfolioStatFormData) => void
  externalSaving?: boolean
}

export default function PortfolioStatsFormModal({
  isOpen, mode, initialData, onClose, onSave, externalSaving
}: PortfolioStatsFormModalProps) {
  const [form, setForm] = useState<PortfolioStatFormData>(EMPTY_FORM)

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
    }
  }, [isOpen, initialData])

  function setField<K extends keyof PortfolioStatFormData>(key: K, value: PortfolioStatFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  if (!isOpen) return null

  const isValid = form.years_experience >= 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md flex flex-col bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">
              {mode === "create" ? "New Stats Entry" : "Edit Stats Entry"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Kelola angka statistik portofolio</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <FormField label="Entry ID" hint="Kosong = Auto UUID">
            <input 
              type="text" value={form.id} onChange={(e) => setField("id", e.target.value)} 
              placeholder="Custom ID / Kosongkan" 
              disabled={mode === "edit"}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors placeholder:text-gray-600 disabled:opacity-50" 
            />
          </FormField>

          <FormField label="Years of Experience" icon={<Briefcase size={12} className="text-gray-500"/>} required>
            <input 
              type="number" min={0} value={form.years_experience} 
              onChange={(e) => setField("years_experience", parseInt(e.target.value) || 0)} 
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors" 
            />
          </FormField>
          
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 leading-relaxed">
            <strong>Catatan:</strong> Field lain seperti <code>total_contributions</code> dan <code>hidden_projects_count</code> kini dihitung secara otomatis oleh sistem (GitHub API & Database).
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
              Simpan Data
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
