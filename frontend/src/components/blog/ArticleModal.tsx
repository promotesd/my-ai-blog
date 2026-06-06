"use client"

import { useState, useRef } from "react"
import { X, Upload, Eye, Send, AlertCircle, User, Mail, Phone, FileText, Tag, Image as ImageIcon, UserCircle } from "lucide-react"
import { BlogCategory } from "@/types/blog"
import { useBlogStore } from "@/stores/BlogStore"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"
import { useTranslations } from "next-intl"
import imageCompression from "browser-image-compression"

const RichTextEditor = dynamic(() => import("./RichTextEditor"), { ssr: false })

const CATEGORIES: BlogCategory[] = [
  "Technology",
  "General",
  "Tutorial",
  "Tips & Tricks",
  "News",
  "Programming",
  "Design",
  "Career",
]

interface ArticleModalProps {
  isOpen: boolean
  onClose: () => void
}

function generateId(): string {
  return `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ")
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

type Step = "form" | "preview"

export default function ArticleModal({ isOpen, onClose }: ArticleModalProps) {
  const t = useTranslations("articleModal")
  const { fetchBlogs } = useBlogStore()
  const [step, setStep] = useState<Step>("form")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [success, setSuccess] = useState(false)

  const [authorName, setAuthorName] = useState("")
  const [authorEmail, setAuthorEmail] = useState("")
  const [authorPhone, setAuthorPhone] = useState("")
  const [authorAvatarFile, setAuthorAvatarFile] = useState<File | null>(null)
  const [authorAvatarPreview, setAuthorAvatarPreview] = useState("")
  
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<BlogCategory>("General")
  const [content, setContent] = useState("")
  const [thumbnail, setThumbnail] = useState("")
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState("")
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!authorName.trim()) newErrors.authorName = t("err_authorName")
    if (!authorEmail.trim()) newErrors.authorEmail = t("err_authorEmail")
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail))
      newErrors.authorEmail = t("err_emailFormat")
    if (!title.trim()) newErrors.title = t("err_title")
    if (!content || content === "<p></p>") newErrors.content = t("err_content")
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle Thumbnail Upload & Compress
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsCompressing(true)
    let processedFile = file

    // Kompresi jika lebih dari 250KB (256000 bytes)
    if (file.size > 256000) {
      try {
        const options = {
          maxSizeMB: 0.25, // Target ukuran maks 250KB
          maxWidthOrHeight: 1200, // Dimensi optimal untuk thumbnail web
          useWebWorker: true,
          initialQuality: 0.85,
        }
        const compressedBlob = await imageCompression(file, options)
        processedFile = new File([compressedBlob], file.name, { type: compressedBlob.type, lastModified: Date.now() })
      } catch (error) {
        console.error("Gagal kompresi thumbnail:", error)
      }
    }

    setThumbnailFile(processedFile)
    setThumbnailPreview(URL.createObjectURL(processedFile))
    setThumbnail("") // clear URL input when file is selected
    setIsCompressing(false)
  }

  // Handle Avatar Upload & Compress
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsCompressing(true)
    let processedFile = file

    // Kompresi jika lebih dari 100KB (102400 bytes)
    if (file.size > 102400) {
      try {
        const options = {
          maxSizeMB: 0.1, // Target ukuran maks 100KB
          maxWidthOrHeight: 400, // Dimensi kecil karena hanya untuk avatar
          useWebWorker: true,
          initialQuality: 0.8,
        }
        const compressedBlob = await imageCompression(file, options)
        processedFile = new File([compressedBlob], file.name, { type: compressedBlob.type, lastModified: Date.now() })
      } catch (error) {
        console.error("Gagal kompresi avatar:", error)
      }
    }

    setAuthorAvatarFile(processedFile)
    setAuthorAvatarPreview(URL.createObjectURL(processedFile))
    setIsCompressing(false)
  }

  const handlePreview = () => {
    if (validate()) setStep("preview")
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsSubmitting(true)
    setSubmitError("")

    try {
      // 1. Upload author avatar to Supabase Storage if a file was selected (optional)
      let finalAvatarUrl: string | null = null
      if (authorAvatarFile) {
        const ext = authorAvatarFile.name.split(".").pop()
        const avatarPath = `avatar-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`
        const { error: avatarUploadError } = await supabase.storage
          .from("author-avatars")
          .upload(avatarPath, authorAvatarFile, { cacheControl: "3600", upsert: false })
        if (avatarUploadError) throw new Error(avatarUploadError.message)
        const { data: avatarUrlData } = supabase.storage
          .from("author-avatars")
          .getPublicUrl(avatarPath)
        finalAvatarUrl = avatarUrlData.publicUrl
      }

      // 2. Upload thumbnail to Supabase Storage if a file was selected
      let finalThumbnailUrl =
        thumbnail.trim() ||
        `https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80`

      if (thumbnailFile) {
        const ext = thumbnailFile.name.split(".").pop()
        const filePath = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`
        const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "blog-thumbnails"
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, thumbnailFile, { cacheControl: "3600", upsert: false })
        if (uploadError) throw new Error(uploadError.message)
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath)
        finalThumbnailUrl = urlData.publicUrl
      }

      // 3. Insert blog to Supabase
      const id = generateId()
      const excerpt = content.replace(/<[^>]+>/g, " ").trim().slice(0, 180) + "..."
      const { error: insertError } = await supabase.from("blogs").insert({
        id,
        title: title.trim(),
        excerpt,
        content,
        thumbnail: finalThumbnailUrl,
        category,
        author_name: authorName.trim(),
        author_email: authorEmail.trim(),
        author_phone: authorPhone.trim() || null,
        author_avatar: finalAvatarUrl,
        author_type: "visitor",
        published_at: new Date().toISOString(),
        reading_time: estimateReadingTime(content),
        tags: [],
      })
      if (insertError) throw new Error(insertError.message)

      // 3. Refresh blog list
      await fetchBlogs()

      setIsSubmitting(false)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
        resetForm()
      }, 2000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan, coba lagi."
      setSubmitError(msg)
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setAuthorName("")
    setAuthorEmail("")
    setAuthorPhone("")
    setAuthorAvatarFile(null)
    setAuthorAvatarPreview("")
    setTitle("")
    setCategory("General")
    setContent("")
    setThumbnail("")
    setThumbnailFile(null)
    setThumbnailPreview("")
    setErrors({})
    setSubmitError("")
    setStep("form")
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white dark:bg-[#0f1a1a] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-[#0d1616] shrink-0">
          <div>
            <h2 className="text-lg font-semibold dark:text-white">
              {step === "form" ? t("title_form") : t("title_preview")}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {step === "form" ? t("subtitle_form") : t("subtitle_preview")}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={18} className="dark:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {step === "form" ? (
            <div className="p-6 space-y-6">
              {/* Disclaimer */}
              <div className="flex gap-3 p-3.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-lg text-sm">
                <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-amber-700 dark:text-amber-300 leading-relaxed">
                  <strong>{t("disclaimer_label")}</strong> {t("disclaimer_text")}
                </p>
              </div>

              {/* Author Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <User size={15} /> {t("section_author")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Profile Picture (optional) */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      <span className="flex items-center gap-1.5"><UserCircle size={13} /> {t("label_avatar")} <span className="text-gray-400">{t("label_optional")}</span></span>
                    </label>
                    <div className="flex items-center gap-4">
                      {/* Avatar preview */}
                      <div
                        onClick={() => !isCompressing && avatarInputRef.current?.click()}
                        className={`w-16 h-16 rounded-full flex-shrink-0 overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-600 transition-colors flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${isCompressing ? 'opacity-50 cursor-wait' : 'hover:border-accentColor cursor-pointer'}`}
                      >
                        {authorAvatarPreview ? (
                          <img src={authorAvatarPreview} alt="avatar preview" className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle size={28} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <button
                          type="button"
                          disabled={isCompressing}
                          onClick={() => avatarInputRef.current?.click()}
                          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-accentColor hover:text-accentColor transition-colors dark:text-gray-300 disabled:opacity-50 disabled:cursor-wait"
                        >
                          {isCompressing ? "Memproses..." : authorAvatarPreview ? t("btn_change_photo") : t("btn_upload_photo")}
                        </button>
                        {authorAvatarPreview && !isCompressing && (
                          <button
                            type="button"
                            onClick={() => { setAuthorAvatarFile(null); setAuthorAvatarPreview("") }}
                            className="ml-2 text-xs px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800/50 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            {t("btn_remove")}
                          </button>
                        )}
                        <p className="text-[11px] text-gray-400 mt-1">{t("avatar_hint")}</p>
                      </div>
                    </div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={isCompressing}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      {t("label_full_name")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="John Doe"
                      className={cn(
                        "w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-gray-800 dark:text-white outline-none transition-colors",
                        "focus:border-accentColor dark:focus:border-accentColor",
                        errors.authorName
                          ? "border-red-400"
                          : "border-gray-200 dark:border-gray-600"
                      )}
                    />
                    {errors.authorName && (
                      <p className="text-red-500 text-xs mt-1">{errors.authorName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      {t("label_email")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={authorEmail}
                        onChange={(e) => setAuthorEmail(e.target.value)}
                        placeholder="john@example.com"
                        className={cn(
                          "w-full pl-8 pr-3 py-2 text-sm rounded-lg border bg-white dark:bg-gray-800 dark:text-white outline-none transition-colors",
                          "focus:border-accentColor",
                          errors.authorEmail
                            ? "border-red-400"
                            : "border-gray-200 dark:border-gray-600"
                        )}
                      />
                    </div>
                    {errors.authorEmail && (
                      <p className="text-red-500 text-xs mt-1">{errors.authorEmail}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      {t("label_phone")} <span className="text-gray-400">{t("label_optional")}</span>
                    </label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={authorPhone}
                        onChange={(e) => setAuthorPhone(e.target.value)}
                        placeholder="+62 812 3456 7890"
                        className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white outline-none focus:border-accentColor transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Article Content Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <FileText size={15} /> {t("section_content")}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      {t("label_title")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t("placeholder_title")}
                      className={cn(
                        "w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-gray-800 dark:text-white outline-none transition-colors",
                        "focus:border-accentColor",
                        errors.title
                          ? "border-red-400"
                          : "border-gray-200 dark:border-gray-600"
                      )}
                    />
                    {errors.title && (
                      <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      <span className="flex items-center gap-1.5"><Tag size={13} /> {t("label_category")}</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as BlogCategory)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white outline-none focus:border-accentColor transition-colors"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      <span className="flex items-center gap-1.5"><ImageIcon size={13} /> {t("label_thumbnail")}</span>
                    </label>
                    <div
                      onClick={() => !isCompressing && fileInputRef.current?.click()}
                      className={`w-full border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg p-4 flex flex-col items-center gap-2 transition-colors ${isCompressing ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:border-accentColor'}`}
                    >
                      {thumbnailPreview || thumbnail ? (
                        <img
                          src={thumbnailPreview || thumbnail}
                          alt="thumbnail preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <>
                          <Upload size={22} className="text-gray-400" />
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            {isCompressing ? "Memproses gambar..." : t("thumbnail_hint")}
                            <br />
                            {!isCompressing && <span className="text-gray-400">PNG, JPG, WebP (max 5MB)</span>}
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isCompressing}
                    />
                    <p className="text-xs text-gray-400 mt-1 flex items-center">
                      {t("thumbnail_url_hint")}{" "}
                      <input
                        type="url"
                        value={thumbnail}
                        onChange={(e) => {
                          setThumbnail(e.target.value)
                          setThumbnailFile(null)
                          setThumbnailPreview("")
                        }}
                        placeholder="https://example.com/image.jpg"
                        className="ml-2 px-2 py-1 flex-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white outline-none focus:border-accentColor"
                        onClick={(e) => e.stopPropagation()}
                        disabled={isCompressing}
                      />
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      {t("label_content")} <span className="text-red-500">*</span>
                    </label>
                    <RichTextEditor
                      content={content}
                      onChange={setContent}
                    />
                    {errors.content && (
                      <p className="text-red-500 text-xs mt-1">{errors.content}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Preview */
            <div className="p-6">
              <div className="max-w-2xl mx-auto">
                {thumbnail && (
                  <img
                    src={thumbnail}
                    alt={title}
                    className="w-full h-48 object-cover rounded-xl mb-5"
                  />
                )}
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-0.5 bg-accentColor/10 text-accentColor text-xs font-medium rounded-full">
                    {category}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {estimateReadingTime(content)} {t("min_read")}
                  </span>
                </div>
                <h1 className="text-2xl font-bold dark:text-white mb-3">{title}</h1>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-semibold dark:text-white shrink-0">
                    {authorAvatarPreview ? (
                      <img src={authorAvatarPreview} alt={authorName} className="w-full h-full object-cover" />
                    ) : (
                      authorName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium dark:text-white">{authorName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}</p>
                  </div>
                </div>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col px-6 py-4 border-t border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-[#0d1616] shrink-0 gap-3">
          {submitError && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 px-3 py-2 rounded-lg">
              ⚠️ {submitError}
            </p>
          )}
          <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {step === "preview" && (
              <button
                type="button"
                onClick={() => setStep("form")}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors dark:text-gray-300"
              >
                {t("btn_edit")}
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting || isCompressing}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors dark:text-gray-300 disabled:opacity-50"
            >
              {t("btn_cancel")}
            </button>
            {step === "form" ? (
              <button
                type="button"
                onClick={handlePreview}
                disabled={isCompressing}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-accentColor text-accentColor hover:bg-accentColor/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye size={15} /> {t("btn_preview")}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || success || isCompressing}
                className={`flex items-center gap-2 px-5 py-2 text-sm rounded-lg font-medium transition-all text-white ${
                  success ? "bg-green-500" : "bg-accentColor hover:bg-accentColor/90"
                } ${isSubmitting || isCompressing ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {success ? (
                  t("btn_published")
                ) : isSubmitting ? (
                  <>
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-white/60 border-t-white rounded-full" />
                    {t("btn_publishing")}
                  </>
                ) : (
                  <>
                    <Send size={15} /> {t("btn_publish")}
                  </>
                )}
              </button>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
