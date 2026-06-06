"use client"

import { useState, useEffect, type ReactNode } from "react"
import { X, Loader2, Type, Calendar, Smile, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"
import { useTranslations } from "next-intl"

const RichTextEditor = dynamic(() => import("@/components/blog/RichTextEditor"), { ssr: false })

export type DiaryMood = "Reflective" | "Happy" | "Thoughtful" | "Melancholic" | "Inspired" | "Grateful"

export interface DiaryFormData {
  id: string
  title: string
  content: string
  entry_date: string
  mood: DiaryMood | ""
  tags: string[]
}

const MOODS: DiaryMood[] = ["Reflective", "Happy", "Thoughtful", "Melancholic", "Inspired", "Grateful"]

const MOOD_ICONS: Record<DiaryMood, string> = {
  Reflective: "🤔",
  Happy: "😊",
  Thoughtful: "💭",
  Melancholic: "😢",
  Inspired: "✨",
  Grateful: "🙏",
}

const EMPTY_FORM: DiaryFormData = {
  id: "",
  title: "",
  content: "",
  entry_date: new Date().toISOString().split('T')[0],
  mood: "",
  tags: [],
}

interface DiaryFormModalProps {
  isOpen: boolean
  mode: "create" | "edit"
  initialData?: Partial<DiaryFormData>
  onClose: () => void
  onSave: (data: DiaryFormData) => void
  externalSaving?: boolean
}

export default function DiaryFormModal({ isOpen, mode, initialData, onClose, onSave, externalSaving }: DiaryFormModalProps) {
  const t = useTranslations("diaryDashboard")
  const [form, setForm] = useState<DiaryFormData>(EMPTY_FORM)
  const [tagInput, setTagInput] = useState("")

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
      setTagInput("")
    }
  }, [isOpen, initialData])

  function setField<K extends keyof DiaryFormData>(key: K, value: DiaryFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function addTag() {
    const val = tagInput.trim()
    if (val && !form.tags.includes(val)) {
      setField("tags", [...form.tags, val])
      setTagInput("")
    }
  }

  function removeTag(tag: string) {
    setField("tags", form.tags.filter((t) => t !== tag))
  }

  if (!isOpen) return null
  const isValid = form.title.trim() && form.content && form.entry_date

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">
              {mode === "create" ? t("form_title_new") || "New Diary Entry" : t("form_title_edit") || "Edit Diary Entry"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Catat perjalanan, pikiran, dan cerita hari ini</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-none px-6 py-5 space-y-6">
          <FormField label={t("form_title") || "Judul Catatan"} icon={<Type size={12} className="text-gray-500" />} required>
            <TextInput value={form.title} onChange={(v) => setField("title", v)} placeholder={t("form_title_placeholder") || "Masukkan judul..."} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t("form_date") || "Tanggal"} icon={<Calendar size={12} className="text-gray-500" />} required>
              <input
                type="date" value={form.entry_date} onChange={(e) => setField("entry_date", e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors"
              />
            </FormField>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
                <Smile size={12} className="text-gray-500" /> {t("form_mood") || "Mood"}
              </label>
              <select
                value={form.mood} onChange={(e) => setField("mood", e.target.value as DiaryMood | "")}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#0e1c1c]">{t("form_mood_select") || "Pilih mood..."}</option>
                {MOODS.map((m) => (
                  <option key={m} value={m} className="bg-[#0e1c1c]">
                    {MOOD_ICONS[m]} {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <FormField label={t("form_tags") || "Tags"} icon={<Tag size={12} className="text-gray-500" />} hint="Tekan Enter">
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-2.5 space-y-2 focus-within:border-accentColor/60 transition-colors">
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.tags.map(t => (
                    <span key={t} className="flex items-center gap-1 text-[11px] px-2 py-1 bg-accentColor/10 text-accentColor rounded-md border border-accentColor/20">
                      #{t} <button type="button" onClick={() => removeTag(t)} className="hover:text-red-400 ml-0.5"><X size={12}/></button>
                    </span>
                  ))}
                </div>
              )}
              <input 
                value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} 
                placeholder={t("form_tags_placeholder") || "Ketik tag lalu Enter..."} className="w-full bg-transparent text-sm text-gray-200 placeholder:text-gray-600 outline-none" 
              />
            </div>
          </FormField>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
              <Type size={12} className="text-gray-500" /> {t("form_content") || "Content"} <span className="text-red-400">*</span>
            </label>
            <div className="border border-white/[0.08] rounded-xl overflow-hidden focus-within:border-accentColor/60 transition-colors">
              {/* Kita asumsikan RichTextEditor ini komponen kustom yang backgroundnya transparan */}
              <div className="bg-white/[0.02]">
                <RichTextEditor
                  content={form.content}
                  onChange={(html: string) => setField("content", html)}
                  placeholder={t("form_content_placeholder") || "Tulis cerita Anda hari ini..."}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] shrink-0 bg-[#0a1515]">
          <p className="text-xs text-gray-600"><span className="text-red-400">*</span> Wajib diisi</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 rounded-xl hover:bg-white/[0.06]">
              {t("btn_cancel") || "Batal"}
            </button>
            <button
              onClick={() => onSave(form)}
              disabled={externalSaving || !isValid}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-accentColor text-white rounded-xl hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {externalSaving && <Loader2 size={13} className="animate-spin" />}
              {mode === "create" ? "Simpan Entry" : "Simpan Perubahan"}
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