"use client"

import { useState, useEffect, type ReactNode } from "react"
import { X, Upload, Loader2, Award, Calendar, Hash, Building2, FileText, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

export interface CertificateFormData {
  id: string
  title: string
  description: string
  category: "Magang / Internship" | "Bootcamp" | "Course Online" | "Webinar / Seminar" | "Sertifikasi Resmi" | "Kompetisi / Lomba" | ""
  issuer_name: string
  issuer_logo_url: string
  issue_date: string
  expiry_date: string
  status: "Valid" | "Expired" | "Lifetime"
  pdf_url: string
  thumbnail_url: string
  display_order: number
  is_published: boolean
}

const EMPTY_FORM: CertificateFormData = {
  id: "",
  title: "",
  description: "",
  category: "",
  issuer_name: "",
  issuer_logo_url: "",
  issue_date: new Date().toISOString().split("T")[0],
  expiry_date: "",
  status: "Lifetime",
  pdf_url: "",
  thumbnail_url: "",
  display_order: 0,
  is_published: true,
}

const CATEGORIES = [
  "Magang / Internship", "Bootcamp", "Course Online", 
  "Webinar / Seminar", "Sertifikasi Resmi", "Kompetisi / Lomba"
]

interface CertificatesFormModalProps {
  isOpen: boolean
  mode: "create" | "edit"
  initialData?: Partial<CertificateFormData>
  onClose: () => void
  onSave: (data: CertificateFormData) => void
  externalSaving?: boolean
}

export default function CertificatesFormModal({
  isOpen, mode, initialData, onClose, onSave, externalSaving
}: CertificatesFormModalProps) {
  const [form, setForm] = useState<CertificateFormData>(EMPTY_FORM)
  const [uploadingField, setUploadingField] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
    }
  }, [isOpen, initialData])

  function setField<K extends keyof CertificateFormData>(key: K, value: CertificateFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleFileUpload(file: File, field: "thumbnail_url" | "pdf_url" | "issuer_logo_url") {
    try {
      setUploadingField(field)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      // Pisahkan ke dalam sub-folder yang rapi di Storage Bucket
      const folder = field === "pdf_url" ? "pdfs" : field === "issuer_logo_url" ? "logos" : "thumbnails"
      const filePath = `${folder}/${fileName}`
      const bucket = "certificates"

      const { error } = await supabase.storage.from(bucket).upload(filePath, file)
      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath)
      setField(field, publicUrl)
    } catch (error: any) {
      alert(`Gagal upload: ${error.message}`)
    } finally {
      setUploadingField(null)
    }
  }

  if (!isOpen) return null

  const isValid = form.title.trim() && form.issuer_name.trim() && form.category && form.issue_date

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">
              {mode === "create" ? "New Certificate" : "Edit Certificate"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Kelola dokumen sertifikasi Anda</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-none px-6 py-5 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Certificate ID" hint="Kosong = Auto UUID">
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
            <FormField label="Judul Sertifikat" icon={<Award size={12} className="text-gray-500" />} required>
              <TextInput value={form.title} onChange={(v) => setField("title", v)} placeholder="Misal: AWS Cloud Practitioner..." />
            </FormField>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Kategori <span className="text-red-400">*</span></label>
              <select
                value={form.category} onChange={(e) => setField("category", e.target.value as any)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors cursor-pointer appearance-none"
              >
                <option value="" disabled className="bg-[#0e1c1c]">Pilih Kategori</option>
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0e1c1c]">{c}</option>)}
              </select>
            </div>
          </div>

          <FormField label="Deskripsi Singkat">
            <textarea
              value={form.description} onChange={(e) => setField("description", e.target.value)} rows={3}
              placeholder="Deskripsi terkait pencapaian atau sertifikat ini..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors resize-none placeholder:text-gray-600"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Diterbitkan Oleh (Issuer Name)" icon={<Building2 size={12} className="text-gray-500" />} required>
              <TextInput value={form.issuer_name} onChange={(v) => setField("issuer_name", v)} placeholder="Misal: Dicoding, Coursera..." />
            </FormField>
            
            {/* Logo Issuer Preview & Upload */}
            <FormField label="Logo Issuer (Opsional)" icon={<ImageIcon size={12} className="text-gray-500" />}>
              <div className="space-y-2">
                {form.issuer_logo_url ? (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.04] p-1.5 flex items-center justify-center">
                    <img src={form.issuer_logo_url} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                    <button type="button" onClick={() => setField("issuer_logo_url", "")} className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white hover:bg-red-500 transition-colors backdrop-blur-sm">
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <div className="relative flex items-center">
                    <input
                      type="file" accept="image/*" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], "issuer_logo_url")} disabled={!!uploadingField}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-medium file:bg-accentColor/10 file:text-accentColor hover:file:bg-accentColor/20 file:cursor-pointer disabled:opacity-50"
                    />
                    {uploadingField === "issuer_logo_url" && <Loader2 size={14} className="absolute right-3 animate-spin text-accentColor" />}
                  </div>
                )}
              </div>
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Status <span className="text-red-400">*</span></label>
              <select
                value={form.status} onChange={(e) => {
                  setField("status", e.target.value as any)
                  if (e.target.value === "Lifetime") setField("expiry_date", "")
                }}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors cursor-pointer appearance-none"
              >
                <option value="Lifetime" className="bg-[#0d1a1a]">Lifetime</option>
                <option value="Valid" className="bg-[#0d1a1a]">Valid (Ada Expired)</option>
                <option value="Expired" className="bg-[#0d1a1a]">Expired</option>
              </select>
            </div>
            <FormField label="Issue Date" icon={<Calendar size={12} className="text-gray-500" />} required>
              <input type="date" value={form.issue_date} onChange={(e) => setField("issue_date", e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors" />
            </FormField>
            {form.status !== "Lifetime" && (
              <FormField label="Expiry Date" icon={<Calendar size={12} className="text-gray-500" />} required>
                <input type="date" value={form.expiry_date} onChange={(e) => setField("expiry_date", e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors" />
              </FormField>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Thumbnail Preview & Upload */}
            <FormField label="Preview / Thumbnail Sertifikat" icon={<Upload size={12} className="text-gray-500" />}>
              <div className="space-y-2">
                {form.thumbnail_url ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.02]">
                    <img src={form.thumbnail_url} alt="Preview" className="w-full h-full object-contain" />
                    <button type="button" onClick={() => setField("thumbnail_url", "")} className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-red-500 transition-colors backdrop-blur-sm">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative flex items-center">
                    <input
                      type="file" accept="image/*" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], "thumbnail_url")} disabled={!!uploadingField}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-accentColor/10 file:text-accentColor hover:file:bg-accentColor/20 file:cursor-pointer disabled:opacity-50"
                    />
                    {uploadingField === "thumbnail_url" && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-accentColor" />}
                  </div>
                )}
              </div>
            </FormField>
            
            <div className="flex flex-col gap-4">
              {/* PDF Preview & Upload */}
              <FormField label="File Dokumen (PDF)" icon={<FileText size={12} className="text-gray-500" />}>
                {form.pdf_url ? (
                  <div className="flex items-center justify-between px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText size={14} className="text-blue-400 shrink-0" />
                      <a href={form.pdf_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline truncate">Dokumen PDF Tersimpan</a>
                    </div>
                    <button type="button" onClick={() => setField("pdf_url", "")} className="p-1.5 rounded-lg text-blue-400 hover:text-red-400 hover:bg-red-500/10 shrink-0 transition-colors">
                      <X size={14}/>
                    </button>
                  </div>
                ) : (
                  <div className="relative flex items-center">
                    <input
                      type="file" accept="application/pdf" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], "pdf_url")} disabled={!!uploadingField}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-accentColor/10 file:text-accentColor hover:file:bg-accentColor/20 file:cursor-pointer disabled:opacity-50"
                    />
                    {uploadingField === "pdf_url" && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-accentColor" />}
                  </div>
                )}
              </FormField>

              <FormField label="Display Order" icon={<Hash size={12} className="text-gray-500" />} hint="Urutan Tampilan">
                <input 
                  type="number" min="0" value={form.display_order} 
                  onChange={(e) => setField("display_order", parseInt(e.target.value) || 0)} 
                  className="w-1/3 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors" 
                />
              </FormField>
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
              {mode === "create" ? "Buat Sertifikat" : "Simpan Perubahan"}
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
