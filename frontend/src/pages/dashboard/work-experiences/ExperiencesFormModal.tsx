"use client"

import { useState, useEffect, type ReactNode } from "react"
import { X, Loader2, Calendar, Hash, Building2, MapPin, Briefcase, FileText, Code2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface WorkExperienceFormData {
  id: string
  company: string
  position: string
  employment_type: string
  start_date: string
  end_date: string | null
  is_current: boolean
  location: string
  work_mode: string
  description: string
  tech_stack: string[]
  display_order: number
  is_published: boolean
}

const EMPTY_FORM: WorkExperienceFormData = {
  id: "",
  company: "",
  position: "",
  employment_type: "Full-time",
  start_date: new Date().toISOString().split("T")[0],
  end_date: "",
  is_current: false,
  location: "",
  work_mode: "On-site",
  description: "",
  tech_stack: [],
  display_order: 0,
  is_published: true,
}

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Internship", "Contract", "Freelance"]
const WORK_MODES = ["On-site", "Remote", "Hybrid", ""]

interface ExperiencesFormModalProps {
  isOpen: boolean
  mode: "create" | "edit"
  initialData?: Partial<WorkExperienceFormData>
  onClose: () => void
  onSave: (data: WorkExperienceFormData) => void
  externalSaving?: boolean
}

export default function ExperiencesFormModal({ isOpen, mode, initialData, onClose, onSave, externalSaving }: ExperiencesFormModalProps) {
  const [form, setForm] = useState<WorkExperienceFormData>(EMPTY_FORM)
  const [techInput, setTechInput] = useState("")

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
      setTechInput("")
    }
  }, [isOpen, initialData])

  function setField<K extends keyof WorkExperienceFormData>(key: K, value: WorkExperienceFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function addTech() {
    const val = techInput.trim()
    if (val && !form.tech_stack.includes(val)) {
      setField("tech_stack", [...form.tech_stack, val])
      setTechInput("")
    }
  }

  function removeTech(val: string) {
    setField("tech_stack", form.tech_stack.filter(t => t !== val))
  }

  if (!isOpen) return null
  const isValid = form.company.trim() && form.position.trim() && form.start_date

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">{mode === "create" ? "New Work Experience" : "Edit Experience"}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Kelola riwayat karir dan pengalaman kerja Anda</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-none px-6 py-5 space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <FormField label="ID Experience" hint="Kosong = Auto UUID">
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
            <FormField label="Perusahaan / Instansi" icon={<Building2 size={12} className="text-gray-500" />} required>
              <TextInput value={form.company} onChange={(v) => setField("company", v)} placeholder="Cth: PT. BISI International, Tbk" />
            </FormField>
            <FormField label="Posisi / Jabatan" icon={<Briefcase size={12} className="text-gray-500" />} required>
              <TextInput value={form.position} onChange={(v) => setField("position", v)} placeholder="Cth: Mobile Developer" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Tipe Pekerjaan <span className="text-red-400">*</span></label>
              <select value={form.employment_type} onChange={(e) => setField("employment_type", e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors appearance-none">
                {EMPLOYMENT_TYPES.map(t => <option key={t} value={t} className="bg-[#0e1c1c]">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Sistem Kerja (Work Mode)</label>
              <select value={form.work_mode} onChange={(e) => setField("work_mode", e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors appearance-none">
                {WORK_MODES.map(t => <option key={t} value={t} className="bg-[#0e1c1c]">{t === "" ? "None/Unknown" : t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="col-span-5">
              <FormField label="Tanggal Mulai" icon={<Calendar size={12} className="text-gray-500" />} required>
                <input type="date" value={form.start_date} onChange={(e) => setField("start_date", e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors" />
              </FormField>
            </div>
            <div className="col-span-2 flex items-end pb-3">
              <label className="flex items-center justify-center gap-2 cursor-pointer group w-full">
                <input 
                  type="checkbox" checked={form.is_current} 
                  onChange={(e) => {
                    setField("is_current", e.target.checked)
                    if (e.target.checked) setField("end_date", "")
                  }} 
                  className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]" 
                />
                <span className="text-xs font-medium text-gray-400 group-hover:text-gray-300">Present</span>
              </label>
            </div>
            <div className="col-span-5">
              <FormField label="Tanggal Selesai" icon={<Calendar size={12} className="text-gray-500" />} hint="Abaikan jika 'Present'">
                <input 
                  type="date" value={form.end_date || ""} onChange={(e) => setField("end_date", e.target.value)} 
                  disabled={form.is_current}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors disabled:opacity-30" 
                />
              </FormField>
            </div>
          </div>

          <FormField label="Lokasi Kota/Provinsi" icon={<MapPin size={12} className="text-gray-500" />}>
            <TextInput value={form.location} onChange={(v) => setField("location", v)} placeholder="Cth: Kediri, East Java, Indonesia" />
          </FormField>

          <FormField label="Deskripsi Pekerjaan" icon={<FileText size={12} className="text-gray-500" />} required>
            <textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={4} placeholder="Ceritakan apa saja yang Anda kerjakan dan tanggung jawab Anda..." className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors resize-none" />
          </FormField>

          <div className="grid grid-cols-2 gap-4 items-start">
            <FormField label="Keahlian & Teknologi (Tech Stack)" icon={<Code2 size={12} className="text-gray-500" />} hint="Tekan enter untuk tambah">
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-2.5 space-y-2 focus-within:border-accentColor/60 transition-colors">
                {form.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.tech_stack.map(t => (
                      <span key={t} className="flex items-center gap-1 text-[11px] px-2 py-1 bg-accentColor/10 text-accentColor rounded-md border border-accentColor/20">
                        {t} <button type="button" onClick={() => removeTech(t)} className="hover:text-red-400 ml-0.5"><X size={12}/></button>
                      </span>
                    ))}
                  </div>
                )}
                <input value={techInput} onChange={(e) => setTechInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTech(); } }} placeholder="Ketik teknologi lalu Enter..." className="w-full bg-transparent text-sm text-gray-200 placeholder:text-gray-600 outline-none" />
              </div>
            </FormField>

            <FormField label="Display Order" icon={<Hash size={12} className="text-gray-500" />} hint="Urutan Tampilan (Harus unik!)">
              <input 
                type="number" min="0" value={form.display_order} 
                onChange={(e) => setField("display_order", parseInt(e.target.value) || 0)} 
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors" 
              />
            </FormField>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 leading-relaxed">
            <strong>Penting:</strong> Kolom <code>display_order</code> bersifat UNIQUE di database. Jika Anda memasukkan angka yang sudah terpakai, data akan gagal disimpan.
          </div>

        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] shrink-0 bg-[#0a1515]">
          <p className="text-xs text-gray-600"><span className="text-red-400">*</span> Wajib diisi</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 rounded-xl hover:bg-white/[0.06]">Batal</button>
            <button onClick={() => onSave(form)} disabled={externalSaving || !isValid} className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-accentColor text-white rounded-xl hover:brightness-110 disabled:opacity-50 transition-all">
              {externalSaving && <Loader2 size={13} className="animate-spin" />}
              {mode === "create" ? "Buat Riwayat" : "Simpan Perubahan"}
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
