"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import { X, Upload, Tag as TagIcon, Plus, Clock, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

export type AuthorType = "developer" | "visitor"

export type BlogCategory =
  | "Technology"
  | "Tutorial"
  | "Tips & Tricks"
  | "Programming"
  | "Design"
  | "General"
  | "News"
  | "Career"

export interface BlogFormData {
  id: string
  title: string
  category: BlogCategory | ""
  author_name: string
  author_email: string
  author_phone: string
  author_avatar: string
  author_type: AuthorType
  thumbnail: string
  tags: string[]
  excerpt: string
  reading_time: number
  published_at: string
  content: string
}

const CATEGORIES: BlogCategory[] = [
  "Technology",
  "Tutorial",
  "Tips & Tricks",
  "Programming",
  "Design",
  "General",
  "News",
  "Career",
]

const EMPTY_FORM: BlogFormData = {
  id: "",
  title: "",
  category: "",
  author_name: "",
  author_email: "",
  author_phone: "",
  author_avatar: "",
  author_type: "developer",
  thumbnail: "",
  tags: [],
  excerpt: "",
  reading_time: 1,
  published_at: new Date().toISOString().slice(0, 16),
  content: "",
}

interface BlogFormModalProps {
  isOpen: boolean
  mode: "create" | "edit"
  initialData?: Partial<BlogFormData>
  onClose: () => void
  onSave: (data: BlogFormData) => void
  externalSaving?: boolean
}

export default function BlogFormModal({
  isOpen,
  mode,
  initialData,
  onClose,
  onSave,
  externalSaving,
}: BlogFormModalProps) {
  const [form, setForm] = useState<BlogFormData>(EMPTY_FORM)
  const [tagInput, setTagInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState<string | null>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
      setTagInput("")
    }
  }, [isOpen, initialData])

  function setField<K extends keyof BlogFormData>(key: K, value: BlogFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function addTag() {
    const t = tagInput.trim()
    if (t && !form.tags.includes(t)) {
      setField("tags", [...form.tags, t])
    }
    setTagInput("")
  }

  function removeTag(tag: string) {
    setField("tags", form.tags.filter((t) => t !== tag))
  }

  async function handleFileUpload(file: File, field: "thumbnail" | "author_avatar") {
    try {
      setUploadingField(field)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${field}s/${fileName}` // akan menjadi 'thumbnails/...' atau 'author_avatars/...'
      const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "blog-thumbnails"

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      setField(field, publicUrl)
    } catch (error: any) {
      console.error("Upload error:", error)
      alert(`Gagal mengupload file: ${error.message}`)
    } finally {
      setUploadingField(null)
    }
  }

  function handleSave() {
    if (externalSaving !== undefined) {
      // Externally managed async save
      onSave(form)
    } else {
      setSaving(true)
      setTimeout(() => {
        onSave(form)
        setSaving(false)
      }, 600)
    }
  }

  // ─── Rich Text Formatting Helper ─────────────────────────────────────────────
  function applyFormat(startTag: string, endTag: string) {
    if (!contentRef.current) return
    const el = contentRef.current
    const start = el.selectionStart
    const end = el.selectionEnd
    const text = form.content
    const selectedText = text.substring(start, end)

    const newText = text.substring(0, start) + startTag + selectedText + endTag + text.substring(end)
    setField("content", newText)

    // Mengembalikan fokus dan posisi kursor ke dalam tag setelah state ter-update
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + startTag.length, start + startTag.length + selectedText.length)
    }, 0)
  }

  function handleToolbarClick(action: string) {
    switch (action) {
      case "H1": applyFormat("<h1>", "</h1>"); break;
      case "H2": applyFormat("<h2>", "</h2>"); break;
      case "H3": applyFormat("<h3>", "</h3>"); break;
      case "B": applyFormat("<strong>", "</strong>"); break;
      case "I": applyFormat("<em>", "</em>"); break;
      case "U": applyFormat("<u>", "</u>"); break;
      case "S": applyFormat("<s>", "</s>"); break;
      case "Code": applyFormat("<code>", "</code>"); break;
      case "Quote": applyFormat("<blockquote>", "</blockquote>"); break;
      case "• List": applyFormat("<ul>\n  <li>", "</li>\n</ul>"); break;
      case "1. List": applyFormat("<ol>\n  <li>", "</li>\n</ol>"); break;
      case "Link": {
        const url = window.prompt("Masukkan URL tautan:")
        if (url) applyFormat(`<a href="${url}" target="_blank" rel="noopener noreferrer">`, "</a>")
        break;
      }
      case "Image": {
        const src = window.prompt("Masukkan URL gambar:")
        if (src) applyFormat(`<img src="${src}" alt="image" className="rounded-xl w-full my-4" />`, "")
        break;
      }
    }
  }

  const isSaving = externalSaving ?? saving

  if (!isOpen) return null

  const isValid = form.title.trim() && form.category && form.author_name.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">
              {mode === "create" ? "New Blog Post" : "Edit Blog Post"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {mode === "create"
                ? "Tambah entri baru ke tabel blogs"
                : `Editing: ${form.id}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto scrollbar-none px-6 py-5 space-y-5">
          {/* ID + Author Type */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="ID" hint="auto jika kosong">
              <TextInput
                value={form.id}
                onChange={(v) => setField("id", v)}
                placeholder="Isi ID khusus atau biarkan kosong (Auto UUID)"
              />
            </FormField>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Author Type
              </label>
              <div className="flex gap-2">
                {(["developer", "visitor"] as AuthorType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setField("author_type", type)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all border",
                      form.author_type === type
                        ? type === "developer"
                          ? "bg-accentColor/20 border-accentColor/40 text-accentColor"
                          : "bg-blue-500/20 border-blue-500/40 text-blue-400"
                        : "border-white/[0.08] text-gray-500 hover:border-white/20 hover:text-gray-300 bg-white/[0.02]"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Title */}
          <FormField label="Title" required>
            <TextInput
              value={form.title}
              onChange={(v) => setField("title", v)}
              placeholder="Judul blog post"
            />
          </FormField>

          {/* Category + Reading Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => setField("category", e.target.value as BlogCategory)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors appearance-none cursor-pointer"
              >
                <option value="" disabled className="bg-[#0e1c1c]">
                  Pilih kategori
                </option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-[#0e1c1c]">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <FormField
              label="Reading Time (menit)"
              icon={<Clock size={12} className="text-gray-500" />}
            >
              <input
                type="number"
                min={1}
                max={120}
                value={form.reading_time}
                onChange={(e) =>
                  setField("reading_time", parseInt(e.target.value) || 1)
                }
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors"
              />
            </FormField>
          </div>

          {/* Author Section */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
              Informasi Author
            </p>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Author Name" required>
                <TextInput
                  value={form.author_name}
                  onChange={(v) => setField("author_name", v)}
                  placeholder="Nama lengkap"
                />
              </FormField>
              <FormField label="Author Email">
                <TextInput
                  value={form.author_email}
                  onChange={(v) => setField("author_email", v)}
                  placeholder="email@example.com"
                />
              </FormField>
              <FormField label="Author Phone">
                <TextInput
                  value={form.author_phone}
                  onChange={(v) => setField("author_phone", v)}
                  placeholder="+62..."
                />
              </FormField>
              <FormField label="Author Avatar" hint="Upload gambar">
                <FileInput
                  value={form.author_avatar}
                  onChange={(v) => setField("author_avatar", v)}
                  onUpload={(file) => handleFileUpload(file, "author_avatar")}
                  uploading={uploadingField === "author_avatar"}
                />
              </FormField>
            </div>
          </div>

          {/* Thumbnail + Published At */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Thumbnail"
              icon={<Upload size={12} className="text-gray-500" />}
            >
              <FileInput
                value={form.thumbnail}
                onChange={(v) => setField("thumbnail", v)}
                onUpload={(file) => handleFileUpload(file, "thumbnail")}
                uploading={uploadingField === "thumbnail"}
              />
            </FormField>
            <FormField label="Published At">
              <input
                type="datetime-local"
                value={form.published_at}
                onChange={(e) => setField("published_at", e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors"
              />
            </FormField>
          </div>

          {/* Tags */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
              <TagIcon size={11} />
              Tags
            </label>
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 space-y-2 focus-within:border-accentColor/60 transition-colors">
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 bg-accentColor/15 text-accentColor rounded-lg"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-400 transition-colors ml-0.5 leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  placeholder="Tambah tag dan tekan Enter..."
                  className="flex-1 bg-transparent text-sm text-gray-200 placeholder:text-gray-600 outline-none"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="p-1.5 rounded-lg bg-accentColor/20 text-accentColor hover:bg-accentColor/30 transition-colors shrink-0"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Excerpt */}
          <FormField
            label="Excerpt"
            hint="otomatis dari 180 karakter pertama konten"
          >
            <textarea
              value={form.excerpt}
              onChange={(e) => setField("excerpt", e.target.value)}
              rows={3}
              placeholder="Deskripsi singkat blog post..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors resize-none placeholder:text-gray-600"
            />
          </FormField>

          {/* Content */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Content (HTML)
            </label>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden focus-within:border-accentColor/60 transition-colors">
              {/* Toolbar placeholder */}
              <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.06] flex-wrap">
                {[
                  "H1", "H2", "H3", "B", "I", "U", "S",
                  "Code", "Quote", "• List", "1. List", "Link", "Image",
                ].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleToolbarClick(t)}
                    className="px-2 py-1 text-[11px] font-mono rounded-md bg-white/[0.04] text-gray-500 hover:bg-accentColor/15 hover:text-accentColor transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
              <textarea
                ref={contentRef}
                value={form.content}
                onChange={(e) => setField("content", e.target.value)}
                rows={9}
                placeholder="<h2>Judul Section</h2>&#10;<p>Konten artikel sebagai HTML...</p>"
                className="w-full bg-transparent px-4 py-3 text-sm text-gray-300 outline-none resize-none font-mono placeholder:text-gray-600 leading-relaxed"
              />
            </div>
            <p className="text-[10px] text-gray-600 mt-1.5">
              Gunakan toolbar di atas untuk memasukkan format HTML dengan cepat.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] shrink-0 bg-[#0a1515]">
          <p className="text-xs text-gray-600">
            <span className="text-red-400">*</span> Field wajib diisi
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200 rounded-xl hover:bg-white/[0.06] transition-all"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !isValid}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-accentColor text-white rounded-xl hover:brightness-[0.85] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSaving && <Loader2 size={13} className="animate-spin" />}
              {isSaving
                ? "Menyimpan..."
                : mode === "create"
                ? "Buat Post"
                : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ----- Helper sub-components -----

function FormField({
  label,
  required,
  hint,
  icon,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
        {icon}
        {label}
        {required && <span className="text-red-400">*</span>}
        {hint && (
          <span className="text-gray-600 font-normal text-[10px]">— {hint}</span>
        )}
      </label>
      {children}
    </div>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors placeholder:text-gray-600"
    />
  )
}

function FileInput({
  value,
  onChange,
  onUpload,
  uploading,
  accept = "image/*"
}: {
  value: string
  onChange: (v: string) => void
  onUpload: (file: File) => void
  uploading?: boolean
  accept?: string
}) {
  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative w-full h-28 rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.02]">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-red-500/80 transition-colors backdrop-blur-sm"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="relative flex items-center">
          <input
            type="file"
            accept={accept}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onUpload(e.target.files[0])
              }
            }}
            disabled={uploading}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-accentColor/10 file:text-accentColor hover:file:bg-accentColor/20 file:cursor-pointer disabled:opacity-50"
          />
          {uploading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 size={16} className="animate-spin text-accentColor" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
