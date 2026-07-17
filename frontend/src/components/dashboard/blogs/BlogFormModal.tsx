"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import { X, Upload, Tag as TagIcon, Plus, Clock, Loader2, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { PROFILE } from "@/config/profile"

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
  author_name: PROFILE.displayName,
  author_email: PROFILE.email,
  author_phone: "",
  author_avatar: PROFILE.avatarUrl,
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
  const markdownInputRef = useRef<HTMLInputElement>(null)

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
      const token = localStorage.getItem("portfolio-admin-token")
      const formData = new FormData()
      formData.append("file", file)
      formData.append("category", "blogs")
      const response = await fetch("/api/upload/files", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      })
      const body = await response.json()
      if (!response.ok || body.code >= 400) {
        throw new Error(body.message || "上传失败")
      }
      setField(field, body.data.url)
    } catch (error: any) {
      console.error("Upload error:", error)
      alert(`上传失败：${error.message}`)
    } finally {
      setUploadingField(null)
    }
  }

  function handleSave() {
    const payload = withDefaultAuthor(form)
    if (externalSaving !== undefined) {
      onSave(payload)
    } else {
      setSaving(true)
      setTimeout(() => {
        onSave(payload)
        setSaving(false)
      }, 600)
    }
  }

  function withDefaultAuthor(data: BlogFormData): BlogFormData {
    return {
      ...data,
      author_name: PROFILE.displayName,
      author_email: PROFILE.email,
      author_avatar: PROFILE.avatarUrl,
      author_phone: "",
      author_type: "developer",
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
      case "H1": applyFormat("# ", ""); break;
      case "H2": applyFormat("## ", ""); break;
      case "H3": applyFormat("### ", ""); break;
      case "B": applyFormat("**", "**"); break;
      case "I": applyFormat("_", "_"); break;
      case "U": applyFormat("<u>", "</u>"); break;
      case "S": applyFormat("~~", "~~"); break;
      case "Code": applyFormat("`", "`"); break;
      case "Quote": applyFormat("> ", ""); break;
      case "• List": applyFormat("- ", ""); break;
      case "1. List": applyFormat("1. ", ""); break;
      case "Link": {
        const url = window.prompt("输入链接 URL:")
        if (url) applyFormat("[", `](${url})`)
        break;
      }
      case "Image": {
        const src = window.prompt("输入图片 URL:")
        if (src) applyFormat("![image](", `${src})`)
        break;
      }
    }
  }

  async function handleMarkdownUpload(file?: File) {
    if (!file) return
    const isMarkdown =
      file.name.endsWith(".md") ||
      file.name.endsWith(".markdown") ||
      ["text/markdown", "text/plain", ""].includes(file.type)
    if (!isMarkdown) {
      alert("请上传 .md 或 .markdown 文件")
      return
    }
    const content = await file.text()
    setField("content", content)
    if (!form.title.trim()) {
      setField("title", file.name.replace(/\.(md|markdown)$/i, ""))
    }
    if (!form.excerpt.trim()) {
      setField("excerpt", content.replace(/[#*_>`().!-]/g, "").replaceAll("[", "").replaceAll("]", "").trim().slice(0, 180))
    }
  }

  const isSaving = externalSaving ?? saving

  if (!isOpen) return null

  const isValid = form.title.trim() && form.category

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
              {mode === "create" ? "写新文章" : "编辑文章"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {mode === "create"
                ? "作者信息会自动使用小嘟嘟，只需要填写文章内容。"
                : `正在编辑：${form.id}`}
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
          {/* ID */}
          <div className="grid grid-cols-1 gap-4">
            <FormField label="ID" hint="留空自动生成">
              <TextInput
                value={form.id}
                onChange={(v) => setField("id", v)}
                placeholder="可填写自定义 ID，或留空自动生成"
              />
            </FormField>
          </div>

          {/* Title */}
          <FormField label="标题" required>
            <TextInput
              value={form.title}
              onChange={(v) => setField("title", v)}
              placeholder="文章标题"
            />
          </FormField>

          {/* Category + Reading Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                分类 <span className="text-red-400">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => setField("category", e.target.value as BlogCategory)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors appearance-none cursor-pointer"
              >
                <option value="" disabled className="bg-[#0e1c1c]">
                  选择分类
                </option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-[#0e1c1c]">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <FormField
              label="阅读时间（分钟）"
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

          {/* Thumbnail + Published At */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="封面图"
              icon={<Upload size={12} className="text-gray-500" />}
            >
              <FileInput
                value={form.thumbnail}
                onChange={(v) => setField("thumbnail", v)}
                onUpload={(file) => handleFileUpload(file, "thumbnail")}
                uploading={uploadingField === "thumbnail"}
              />
            </FormField>
            <FormField label="发布时间">
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
              标签
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
                  placeholder="输入标签后按 Enter..."
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
            label="摘要"
            hint="留空时可从正文自动生成"
          >
            <textarea
              value={form.excerpt}
              onChange={(e) => setField("excerpt", e.target.value)}
              rows={3}
              placeholder="文章简短摘要..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors resize-none placeholder:text-gray-600"
            />
          </FormField>

          {/* Content */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              内容（Markdown / HTML）
            </label>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden focus-within:border-accentColor/60 transition-colors">
              <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.06] flex-wrap">
                <input
                  ref={markdownInputRef}
                  type="file"
                  accept=".md,.markdown,text/markdown,text/plain"
                  className="hidden"
                  onChange={(e) => {
                    handleMarkdownUpload(e.target.files?.[0])
                    e.target.value = ""
                  }}
                />
                <button
                  type="button"
                  onClick={() => markdownInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md bg-accentColor/15 text-accentColor hover:bg-accentColor/25 transition-colors"
                >
                  <FileText size={12} />
                  上传 MD
                </button>
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
                placeholder={"## 标题\n\n在这里写 Markdown，或者上传 .md 文件。"}
                className="w-full bg-transparent px-4 py-3 text-sm text-gray-300 outline-none resize-none font-mono placeholder:text-gray-600 leading-relaxed"
              />
            </div>
            <p className="text-[10px] text-gray-600 mt-1.5">
              作者信息会自动使用小嘟嘟；这里只需要写文章内容。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] shrink-0 bg-[#0a1515]">
          <p className="text-xs text-gray-600">
            <span className="text-red-400">*</span> 必填项
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200 rounded-xl hover:bg-white/[0.06] transition-all"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !isValid}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-accentColor text-white rounded-xl hover:brightness-[0.85] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSaving && <Loader2 size={13} className="animate-spin" />}
              {isSaving
                ? "保存中..."
                : mode === "create"
                ? "发布文章"
                : "保存修改"}
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
