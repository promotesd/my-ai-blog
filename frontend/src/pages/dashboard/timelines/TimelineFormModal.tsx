"use client"

import { useState, useEffect, type ReactNode } from "react"
import { X, Upload, Loader2, Calendar, Hash, Building2, Layers, AlignLeft, PaintBucket, ImageIcon, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

export interface TimelinePhoto {
  src: string
  alt: string
  caption: string
}

export interface TimelineFormData {
  id?: number
  category: string
  type: string
  title: string
  subtitle: string
  location: string
  locationDetail: string
  period_start: string
  period_end: string
  status: string
  description: string
  gpa: string
  extracurricular: string[]
  responsibilities: string[]
  projects: string[]
  awardLevel: string
  highlights: string[]
  skills: string[]
  techStack: string[]
  photos: TimelinePhoto[]
  quote: string
  quote_author: string
  color: string
  icon: string
}

const EMPTY_FORM: TimelineFormData = {
  category: "Pendidikan", type: "", title: "", subtitle: "", location: "", locationDetail: "",
  period_start: "", period_end: "", status: "Selesai", description: "", gpa: "",
  extracurricular: [], responsibilities: [], projects: [], awardLevel: "",
  highlights: [], skills: [], techStack: [], photos: [],
  quote: "", quote_author: "", color: "blue", icon: "FaSchool"
}

const CATEGORIES = ["Pendidikan", "Kursus & Bootcamp", "Karir & Magang", "Pencapaian & Award", "Organisasi & Komunitas"]
const COLORS = ["blue", "orange", "green", "yellow", "purple", "red", "cyan"]

interface TimelineFormModalProps {
  isOpen: boolean
  mode: "create" | "edit"
  initialData?: Partial<TimelineFormData>
  onClose: () => void
  onSave: (data: TimelineFormData) => void
  externalSaving?: boolean
}

export default function TimelineFormModal({ isOpen, mode, initialData, onClose, onSave, externalSaving }: TimelineFormModalProps) {
  const [form, setForm] = useState<TimelineFormData>(EMPTY_FORM)
  const [uploading, setUploading] = useState(false)

  // Array inputs states
  const [inputs, setInputs] = useState({
    highlights: "", skills: "", techStack: "", extracurricular: "", responsibilities: "", projects: ""
  })

  useEffect(() => {
    if (isOpen) {
      const data = initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM

      // Ensure array fields are not null, as they can be from the DB
      data.extracurricular = data.extracurricular || []
      data.responsibilities = data.responsibilities || []
      data.projects = data.projects || []
      data.highlights = data.highlights || []
      data.skills = data.skills || []
      data.techStack = data.techStack || []
      data.photos = data.photos || []

      setForm(data)
      setInputs({ highlights: "", skills: "", techStack: "", extracurricular: "", responsibilities: "", projects: "" })
    }
  }, [isOpen, initialData])

  function setField<K extends keyof TimelineFormData>(key: K, value: TimelineFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleArrayAdd(field: keyof typeof inputs) {
    const val = inputs[field].trim()
    if (val && !(form[field as keyof TimelineFormData] as string[]).includes(val)) {
      setField(field as keyof TimelineFormData, [...(form[field as keyof TimelineFormData] as string[]), val] as any)
      setInputs(p => ({ ...p, [field]: "" }))
    }
  }

  function handleArrayRemove(field: keyof typeof inputs, val: string) {
    setField(field as keyof TimelineFormData, (form[field as keyof TimelineFormData] as string[]).filter(v => v !== val) as any)
  }

  async function handlePhotoUpload(file: File) {
    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${fileName}`
      const bucket = "timeline"

      const { error } = await supabase.storage.from(bucket).upload(filePath, file)
      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath)
      
      // Tambahkan ke array photos
      setField("photos", [...form.photos, { src: publicUrl, alt: "Foto Timeline", caption: "" }])
    } catch (error: any) {
      alert(`Gagal upload: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  function removePhoto(index: number) {
    setField("photos", form.photos.filter((_, i) => i !== index))
  }

  if (!isOpen) return null
  const isValid = form.title.trim() && form.category && form.period_start && form.description.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl max-h-[88vh] flex flex-col bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">{mode === "create" ? "New Timeline Entry" : "Edit Timeline"}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Kelola riwayat perjalanan hidup/karir Anda</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-none px-6 py-5 space-y-6">
          
          {/* SECTION 1: Basic Info */}
          <div className="space-y-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.01]">
            <h3 className="text-xs font-semibold text-accentColor uppercase tracking-wider">Informasi Dasar</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Kategori <span className="text-red-400">*</span></label>
                <select value={form.category} onChange={(e) => setField("category", e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors">
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0d1a1a]">{c}</option>)}
                </select>
              </div>
              <FormField label="Tipe (Cth: Kuliah, Bootcamp, Part-time)" required>
                <TextInput value={form.type} onChange={(v) => setField("type", v)} placeholder="Tipe kegiatan..." />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Judul (Title)" required>
                <TextInput value={form.title} onChange={(v) => setField("title", v)} placeholder="Nama instansi / kegiatan..." />
              </FormField>
              <FormField label="Sub-judul (Subtitle)">
                <TextInput value={form.subtitle} onChange={(v) => setField("subtitle", v)} placeholder="Jurusan / Peran..." />
              </FormField>
            </div>

            <FormField label="Deskripsi Kegiatan" required>
              <textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={3} placeholder="Ceritakan pengalaman Anda..." className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors resize-none" />
            </FormField>
          </div>

          {/* SECTION 2: Waktu & Lokasi */}
          <div className="space-y-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.01]">
            <h3 className="text-xs font-semibold text-accentColor uppercase tracking-wider">Waktu & Lokasi</h3>
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Tahun/Bulan Mulai" required icon={<Calendar size={12} className="text-gray-500"/>}>
                <TextInput value={form.period_start} onChange={(v) => setField("period_start", v)} placeholder="2020 / Jan 2020" />
              </FormField>
              <FormField label="Tahun/Bulan Selesai" required>
                <TextInput value={form.period_end} onChange={(v) => setField("period_end", v)} placeholder="2024 / Sekarang" />
              </FormField>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Status</label>
                <select value={form.status} onChange={(e) => setField("status", e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors">
                  <option value="Selesai" className="bg-[#0d1a1a]">Selesai</option>
                  <option value="Sedang Berlangsung" className="bg-[#0d1a1a]">Sedang Berlangsung</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Lokasi Utama" icon={<Building2 size={12} className="text-gray-500"/>}>
                <TextInput value={form.location} onChange={(v) => setField("location", v)} placeholder="Kota, Provinsi..." />
              </FormField>
              <FormField label="Detail Lokasi">
                <TextInput value={form.locationDetail} onChange={(v) => setField("locationDetail", v)} placeholder="Remote / On-site..." />
              </FormField>
            </div>
          </div>

          {/* SECTION 3: Array Data */}
          <div className="space-y-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.01]">
            <h3 className="text-xs font-semibold text-accentColor uppercase tracking-wider">Poin Penting & Keahlian</h3>
            
            <ArrayInput field="highlights" label="Highlights / Poin Utama" form={form} inputs={inputs} setInputs={setInputs} onAdd={handleArrayAdd} onRemove={handleArrayRemove} />
            <ArrayInput field="skills" label="Soft / General Skills" form={form} inputs={inputs} setInputs={setInputs} onAdd={handleArrayAdd} onRemove={handleArrayRemove} />
            <ArrayInput field="techStack" label="Tech Stack" form={form} inputs={inputs} setInputs={setInputs} onAdd={handleArrayAdd} onRemove={handleArrayRemove} />
            
            {(form.category === "Karir & Magang" || form.category === "Organisasi & Komunitas") && (
              <ArrayInput field="responsibilities" label="Tanggung Jawab (Responsibilities)" form={form} inputs={inputs} setInputs={setInputs} onAdd={handleArrayAdd} onRemove={handleArrayRemove} />
            )}
            {form.category === "Pendidikan" && (
              <ArrayInput field="extracurricular" label="Ekstrakurikuler" form={form} inputs={inputs} setInputs={setInputs} onAdd={handleArrayAdd} onRemove={handleArrayRemove} />
            )}
          </div>

          {/* SECTION 4: Media & Visuals */}
          <div className="space-y-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.01]">
            <h3 className="text-xs font-semibold text-accentColor uppercase tracking-wider">Media & Tampilan</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Warna Tema" icon={<PaintBucket size={12} className="text-gray-500"/>}>
                <select value={form.color} onChange={(e) => setField("color", e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors capitalize">
                  {COLORS.map(c => <option key={c} value={c} className="bg-[#0d1a1a] capitalize">{c}</option>)}
                </select>
              </FormField>
              <FormField label="Icon Key (React Icons)">
                <TextInput value={form.icon} onChange={(v) => setField("icon", v)} placeholder="Cth: FaSchool, FaBriefcase..." />
              </FormField>
            </div>

            <FormField label="Foto & Dokumentasi" icon={<ImageIcon size={12} className="text-gray-500"/>}>
              <div className="space-y-3">
                {form.photos.map((photo, idx) => (
                  <div key={idx} className="flex gap-3 items-start p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl">
                    <div className="w-20 h-16 shrink-0 rounded-lg overflow-hidden bg-black/20">
                      <img src={photo.src} alt="preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <input type="text" value={photo.caption} onChange={(e) => {
                        const newPhotos = [...form.photos]; newPhotos[idx].caption = e.target.value; setField("photos", newPhotos)
                      }} placeholder="Caption / Deskripsi foto..." className="w-full bg-transparent border-b border-white/[0.1] pb-1 text-xs text-gray-300 outline-none focus:border-accentColor" />
                    </div>
                    <button type="button" onClick={() => removePhoto(idx)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"><X size={14}/></button>
                  </div>
                ))}
                
                <div className="relative flex items-center">
                  <input
                    type="file" accept="image/*" onChange={(e) => e.target.files && handlePhotoUpload(e.target.files[0])} disabled={uploading}
                    className="w-full bg-white/[0.02] border border-dashed border-white/[0.2] rounded-xl px-3 py-3 text-sm text-gray-400 outline-none hover:bg-white/[0.04] transition-colors file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-accentColor/10 file:text-accentColor hover:file:bg-accentColor/20 file:cursor-pointer disabled:opacity-50"
                  />
                  {uploading && <Loader2 size={16} className="absolute right-4 animate-spin text-accentColor" />}
                </div>
              </div>
            </FormField>
          </div>

        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] shrink-0 bg-[#0a1515]">
          <p className="text-xs text-gray-600"><span className="text-red-400">*</span> Wajib diisi</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 rounded-xl hover:bg-white/[0.06]">Batal</button>
            <button onClick={() => onSave(form)} disabled={externalSaving || !isValid} className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-accentColor text-white rounded-xl hover:brightness-110 disabled:opacity-50 transition-all">
              {externalSaving && <Loader2 size={13} className="animate-spin" />}
              {mode === "create" ? "Buat Timeline" : "Simpan Perubahan"}
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

function ArrayInput({ field, label, form, inputs, setInputs, onAdd, onRemove }: any) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-2">{label}</label>
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-2.5 space-y-2 focus-within:border-accentColor/60 transition-colors">
        {form[field].length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {form[field].map((item: string) => (
              <span key={item} className="flex items-center gap-1 text-[11px] px-2 py-1 bg-accentColor/10 text-accentColor rounded-md border border-accentColor/20">
                {item} <button type="button" onClick={() => onRemove(field, item)} className="hover:text-red-400 ml-0.5"><X size={12}/></button>
              </span>
            ))}
          </div>
        )}
        <input 
          value={inputs[field]} 
          onChange={(e) => setInputs((p: any) => ({ ...p, [field]: e.target.value }))} 
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(field); } }} 
          placeholder="Ketik lalu tekan Enter..." 
          className="w-full bg-transparent text-sm text-gray-200 placeholder:text-gray-600 outline-none" 
        />
      </div>
    </div>
  )
}
