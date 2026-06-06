"use client"

import { useState, useEffect, type ReactNode } from "react"
import { X, Loader2, Image as ImageIcon, MapPin, Calendar, Camera, Tag, Folder, Link2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

export interface GalleryFormData {
  id?: number
  title: string
  description: string
  location: string
  date: string
  category: string
  album: string
  album_slug: string
  device: string
  image_url: string
  thumbnail_url: string
  width: number
  height: number
  is_featured: boolean
  tags: string[]
  owner_type: "personal" | "guest"
  is_approved: boolean
  uploader_name: string
}

const EMPTY_FORM: GalleryFormData = {
  title: "", description: "", location: "", date: new Date().toISOString().split("T")[0],
  category: "Travel & Wisata", album: "", album_slug: "", device: "Unknown Device",
  image_url: "", thumbnail_url: "", width: 800, height: 600,
  is_featured: false, tags: [], owner_type: "personal", is_approved: true, uploader_name: ""
}

const CATEGORIES = ["Travel & Wisata", "Coding & Workspace", "Personal", "Event", "Lainnya"]

interface GalleryFormModalProps {
  isOpen: boolean
  mode: "create" | "edit"
  initialData?: Partial<GalleryFormData>
  onClose: () => void
  onSave: (data: GalleryFormData) => void
  externalSaving?: boolean
}

export default function GalleryFormModal({ isOpen, mode, initialData, onClose, onSave, externalSaving }: GalleryFormModalProps) {
  const [form, setForm] = useState<GalleryFormData>(EMPTY_FORM)
  const [tagInput, setTagInput] = useState("")
  const [uploadingField, setUploadingField] = useState<string | null>(null)
  const [existingAlbums, setExistingAlbums] = useState<{ name: string, slug: string }[]>([])
  const [isNewAlbum, setIsNewAlbum] = useState(true)

  useEffect(() => {
    async function fetchAlbums() {
      if (isOpen) {
        try {
          const { data, error } = await supabase
            .from("gallery_photos")
            .select("album, album_slug")
            .eq("owner_type", "personal")
            .not("album", "is", null)
            .not("album_slug", "is", null)

          if (error) throw error

          const uniqueAlbums = Array.from(new Map(data.map(item => [item.album_slug, { name: item.album, slug: item.album_slug }])).values())
          setExistingAlbums(uniqueAlbums)
          
          if (mode === "create" && uniqueAlbums.length > 0) {
            setIsNewAlbum(false)
          } else {
            setIsNewAlbum(true)
          }

        } catch (err) {
          console.error("Gagal fetch album:", err)
        }
      }
    }

    fetchAlbums()
  }, [isOpen, mode])

  useEffect(() => {
    if (isOpen) {
      const isEditWithAlbum = mode === "edit" && initialData?.album
      setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
      setTagInput("")
      setIsNewAlbum(mode === "create" ? (existingAlbums.length === 0) : !isEditWithAlbum)
    }
  }, [isOpen, initialData, mode, existingAlbums.length])

  function setField<K extends keyof GalleryFormData>(key: K, value: GalleryFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleAlbumChange(val: string) {
    setField("album", val)
    if (isNewAlbum) {
      setField("album_slug", val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''))
    }
  }

  function handleSelectAlbum(slug: string) {
    const selected = existingAlbums.find(a => a.slug === slug)
    if (selected) {
      setField("album", selected.name)
      setField("album_slug", selected.slug)
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

  async function handleFileUpload(file: File) {
    try {
      setUploadingField("image_url")
      
      // Baca resolusi gambar
      const imgObj = new Image()
      imgObj.src = URL.createObjectURL(file)
      imgObj.onload = () => {
        setField("width", imgObj.width)
        setField("height", imgObj.height)
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const bucket = form.owner_type === "guest" ? "gallery-photos" : "gallery-photos" // Gunakan bucket yang sama

      const { error } = await supabase.storage.from(bucket).upload(fileName, file)
      if (error) throw error
      
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName)
      
      // Set image utama & thumbnail (bisa diganti manual nanti)
      setField("image_url", publicUrl)
      if (!form.thumbnail_url) setField("thumbnail_url", publicUrl)

    } catch (error: any) {
      alert(`Gagal upload: ${error.message}`)
    } finally {
      setUploadingField(null)
    }
  }

  if (!isOpen) return null
  const isValid = form.title.trim() && form.category && form.date && form.image_url

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">{mode === "create" ? "New Photo Entry" : "Edit Photo"}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Kelola foto portofolio & galeri tamu</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-none px-6 py-5 space-y-6">
          
          {/* SECTION: TIPE & STATUS */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Tipe Pemilik</label>
              <select value={form.owner_type} onChange={(e) => setField("owner_type", e.target.value as any)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors appearance-none">
                <option value="personal" className="bg-[#0e1c1c]">Personal (Saya)</option>
                <option value="guest" className="bg-[#0e1c1c]">Guest (Tamu)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Status Approval</label>
              <button type="button" onClick={() => setField("is_approved", !form.is_approved)} className={cn("w-full py-2.5 rounded-xl text-sm font-semibold transition-all border", form.is_approved ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400")}>
                {form.is_approved ? "Approved (Tampil)" : "Pending / Hidden"}
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Featured / Unggulan</label>
              <button type="button" onClick={() => setField("is_featured", !form.is_featured)} className={cn("w-full py-2.5 rounded-xl text-sm font-semibold transition-all border", form.is_featured ? "bg-amber-500/20 border-amber-500/40 text-amber-500" : "bg-white/[0.02] border-white/[0.08] text-gray-500")}>
                {form.is_featured ? "Featured" : "Normal"}
              </button>
            </div>
          </div>

          {/* SECTION: INFORMASI DASAR */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Judul Foto" required>
              <TextInput value={form.title} onChange={(v) => setField("title", v)} placeholder="Cth: Sunset di Pantai Kuta" />
            </FormField>
            {form.owner_type === "guest" ? (
              <FormField label="Nama Uploader (Tamu)">
                <TextInput value={form.uploader_name || ""} onChange={(v) => setField("uploader_name", v)} placeholder="Nama tamu..." />
              </FormField>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Kategori <span className="text-red-400">*</span></label>
                <select value={form.category} onChange={(e) => setField("category", e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors appearance-none">
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0e1c1c]">{c}</option>)}
                </select>
              </div>
            )}
          </div>

          <FormField label="Deskripsi / Cerita Foto">
            <textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={3} placeholder="Cerita di balik foto ini..." className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors resize-none" />
          </FormField>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Tanggal Pengambilan" icon={<Calendar size={12}/>} required>
              <input type="date" value={form.date} onChange={(e) => setField("date", e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors" />
            </FormField>
            <FormField label="Lokasi" icon={<MapPin size={12}/>}>
              <TextInput value={form.location} onChange={(v) => setField("location", v)} placeholder="Cth: Bali, Indonesia" />
            </FormField>
            <FormField label="Perangkat (Device)" icon={<Camera size={12}/>}>
              <TextInput value={form.device} onChange={(v) => setField("device", v)} placeholder="Cth: iPhone 13, Canon EOS M50" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input type="checkbox" id="new-album-check" checked={isNewAlbum} onChange={() => setIsNewAlbum(!isNewAlbum)} className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]" />
                <label htmlFor="new-album-check" className="text-xs font-medium text-gray-300 cursor-pointer">Create new album</label>
              </div>

              {isNewAlbum ? (
                <FormField label="Album Name" icon={<Folder size={12} />}>
                  <TextInput value={form.album} onChange={handleAlbumChange} placeholder="Cth: Bali Trip 2024" />
                </FormField>
              ) : (
                <FormField label="Pilih Album" icon={<Folder size={12} />}>
                  <select value={form.album_slug} onChange={(e) => handleSelectAlbum(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors appearance-none">
                    <option value="" disabled className="bg-[#0e1c1c]">-- Pilih dari album yang ada --</option>
                    {existingAlbums.map(a => <option key={a.slug} value={a.slug} className="bg-[#0e1c1c]">{a.name}</option>)}
                  </select>
                </FormField>
              )}
            </div>
            <FormField label="Album Slug" hint="Otomatis dari nama album">
              <TextInput value={form.album_slug} onChange={(v) => setField("album_slug", v)} placeholder="bali-trip-2024" disabled={!isNewAlbum} />
            </FormField>
          </div>

          <FormField label="Tags" icon={<Tag size={12} />} hint="Tekan Enter">
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

          {/* SECTION: MEDIA UPLOAD */}
          <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-4">
            <h3 className="text-xs font-semibold text-accentColor uppercase tracking-wider flex items-center gap-2"><ImageIcon size={14}/> Media & Image</h3>
            
            <div className="grid grid-cols-2 gap-4 items-end">
              <FormField label="Upload Foto Utama" required>
                <div className="relative flex items-center">
                  <input type="file" accept="image/*" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])} disabled={!!uploadingField} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-gray-200 outline-none focus:border-accentColor/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-accentColor/10 file:text-accentColor hover:file:bg-accentColor/20 file:cursor-pointer disabled:opacity-50" />
                  {uploadingField === "image_url" && <Loader2 size={14} className="absolute right-3 animate-spin text-accentColor" />}
                </div>
              </FormField>

              {form.image_url && (
                <div className="flex gap-2">
                  <div className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2">
                    <span className="text-[10px] text-gray-500 block">Lebar (px)</span>
                    <span className="text-sm font-mono text-gray-300">{form.width}</span>
                  </div>
                  <div className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2">
                    <span className="text-[10px] text-gray-500 block">Tinggi (px)</span>
                    <span className="text-sm font-mono text-gray-300">{form.height}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="URL Gambar Utama" icon={<Link2 size={12}/>}>
                <TextInput value={form.image_url} onChange={(v) => setField("image_url", v)} placeholder="Otomatis terisi setelah upload..." />
              </FormField>
              <FormField label="URL Thumbnail" hint="Biarkan sama jika tidak ada thumbnail khusus">
                <TextInput value={form.thumbnail_url} onChange={(v) => setField("thumbnail_url", v)} placeholder="https://..." />
              </FormField>
            </div>

            {form.image_url && (
              <div className="mt-4 aspect-video w-full max-w-sm rounded-xl overflow-hidden border border-white/[0.08] bg-black/40 mx-auto relative">
                <img src={form.image_url} alt="Preview" className="w-full h-full object-contain" />
              </div>
            )}
          </div>

        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] shrink-0 bg-[#0a1515]">
          <p className="text-xs text-gray-600"><span className="text-red-400">*</span> Wajib diisi</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 rounded-xl hover:bg-white/[0.06]">Batal</button>
            <button onClick={() => onSave(form)} disabled={externalSaving || !isValid} className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-accentColor text-white rounded-xl hover:brightness-110 disabled:opacity-50 transition-all">
              {externalSaving && <Loader2 size={13} className="animate-spin" />}
              {mode === "create" ? "Simpan Foto" : "Simpan Perubahan"}
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
