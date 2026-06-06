"use client"

import { useCallback, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { createPortal } from "react-dom"
import { X, Upload, ChevronRight, ChevronLeft, Send, Star, Check, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { generateFingerprint } from "@/lib/fingerprint"
import GuestbookCard, { GuestbookEntry } from "./GuestbookCard"
import Image from "next/image"
import imageCompression from "browser-image-compression"

// ─── Constants ────────────────────────────────────────────────────────────────

export const MOODS = [
  { emoji: "😍", label: "Kagum" },
  { emoji: "😄", label: "Senang" },
  { emoji: "🤩", label: "Terinspirasi" },
  { emoji: "🤔", label: "Penasaran" },
  { emoji: "😎", label: "Keren" },
  { emoji: "🥰", label: "Suka" },
  { emoji: "😮", label: "Terkejut" },
]

export const REFERRAL_SOURCES = [
  "Google Search",
  "Instagram",
  "LinkedIn",
  "Twitter / X",
  "Referral / Teman",
  "GitHub",
  "Other",
]

export const COLOR_PRESETS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#f97316",
  "#14b8a6",
  "#84cc16",
  "#0ea5e9",
  "#a855f7",
]

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface FormData {
  name: string
  city: string
  profession: string
  contact: string
  referral_source: string
  mood: string
  rating: number
  message: string
  card_color: string
  avatar_url: string | null
  avatarFile: File | null
  avatarPreview: string | null
}

const INITIAL_FORM: FormData = {
  name: "",
  city: "",
  profession: "",
  contact: "",
  referral_source: "",
  mood: "",
  rating: 0,
  message: "",
  card_color: "#6366f1",
  avatar_url: null,
  avatarFile: null,
  avatarPreview: null,
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: (entry: GuestbookEntry) => void
}

// ─── Interactive Star Rating ───────────────────────────────────────────────────

function StarRatingInput({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const t = useTranslations("guestbookPage")
  const [hover, setHover] = useState(0)
  const ratingLabels = ["", t("rating_1"), t("rating_2"), t("rating_3"), t("rating_4"), t("rating_5")]
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const idx = i + 1
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onChange(idx)}
            onMouseEnter={() => setHover(idx)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={28}
              className={cn(
                "transition-colors",
                idx <= (hover || value)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
              )}
            />
          </button>
        )
      })}
      {value > 0 && (
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
          {ratingLabels[value]}
        </span>
      )}
    </div>
  )
}

// ─── Avatar Upload Area (Dengan Kompresi) ──────────────────────────────────────

function AvatarUpload({
  preview,
  onFile,
  onClear,
}: {
  preview: string | null
  onFile: (file: File) => void
  onClear: () => void
}) {
  const t = useTranslations("guestbookPage")
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [error, setError] = useState("")

  const handleFile = async (file: File) => {
    setError("")
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError(t("avatar_err_format"))
      return
    }
    // Batas upload kita naikkan ke 5MB karena akan otomatis dikompres
    if (file.size > 5 * 1024 * 1024) {
      setError(t("avatar_err_size") || "Ukuran file terlalu besar (Maks 5MB)")
      return
    }

    setIsCompressing(true)
    let processedFile = file

    // Kompresi jika ukuran file lebih dari 100KB (102400 bytes)
    if (file.size > 102400) {
      try {
        const options = {
          maxSizeMB: 0.1, // Target ukuran maks 100KB
          maxWidthOrHeight: 400, // Dimensi kecil karena hanya untuk avatar
          useWebWorker: true,
          initialQuality: 0.8,
        }
        const compressedBlob = await imageCompression(file, options)
        processedFile = new File([compressedBlob], file.name, {
          type: compressedBlob.type,
          lastModified: Date.now(),
        })
      } catch (err) {
        console.error("Gagal kompresi avatar:", err)
        setError("Gagal memproses gambar. Coba lagi.")
        setIsCompressing(false)
        return
      }
    }

    setIsCompressing(false)
    onFile(processedFile)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (isCompressing) return
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  if (preview) {
    return (
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-accentColor ring-offset-2 dark:ring-offset-gray-900">
          <Image src={preview} alt="Avatar preview" fill className="object-cover" sizes="80px" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t("avatar_selected")}</p>
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-red-500 hover:text-red-600 underline text-left"
          >
            {t("avatar_remove")}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        onClick={() => !isCompressing && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!isCompressing) setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center transition-all",
          isCompressing ? "opacity-50 cursor-wait border-gray-300" : "cursor-pointer",
          isDragging && !isCompressing
            ? "border-accentColor bg-accentColor/5"
            : "border-gray-200 dark:border-gray-700 hover:border-accentColor/50 hover:bg-gray-50 dark:hover:bg-gray-800/50"
        )}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800">
            {isCompressing ? (
              <span className="w-5 h-5 border-2 border-accentColor/30 border-t-accentColor rounded-full animate-spin inline-block" />
            ) : (
              <ImageIcon size={20} className="text-gray-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isCompressing ? (
                "Memproses gambar..."
              ) : (
                <>
                  {t("avatar_drag")}{" "}
                  <span className="text-accentColor underline">{t("avatar_click")}</span>
                </>
              )}
            </p>
            {!isCompressing && (
              <p className="text-xs text-gray-400 mt-0.5">{t("avatar_hint")} (Max: 5MB)</p>
            )}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={isCompressing}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = "" // reset agar bisa memilih file yang sama lagi
          }}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ─── Card Preview (Step 3) ─────────────────────────────────────────────────────

function PreviewCard({ form }: { form: FormData }) {
  const t = useTranslations("guestbookPage")
  const fakeEntry: GuestbookEntry = {
    id: "preview",
    name: form.name || t("preview_name_ph"),
    city: form.city || t("preview_city_ph"),
    profession: form.profession || t("preview_profession_ph"),
    message: form.message || t("preview_message_ph"),
    mood: form.mood || "Senang",
    rating: form.rating || 5,
    card_color: form.card_color,
    avatar_url: form.avatarPreview,
    referral_source: form.referral_source || "Google Search",
    contact: form.contact || null,
    is_approved: true,
    created_at: new Date().toISOString(),
  }
  return (
    <div className="max-w-sm mx-auto">
      <GuestbookCard entry={fakeEntry} />
    </div>
  )
}

// ─── Main Modal ────────────────────────────────────────────────────────────────

export default function GuestbookFormModal({ isOpen, onClose, onSuccess }: Props) {
  const t = useTranslations("guestbookPage")
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const update = (key: keyof FormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: "" }))
  }

  const handleAvatarFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    setForm((prev) => ({ ...prev, avatarFile: file, avatarPreview: url }))
  }, [])

  const clearAvatar = useCallback(() => {
    if (form.avatarPreview) URL.revokeObjectURL(form.avatarPreview)
    setForm((prev) => ({ ...prev, avatarFile: null, avatarPreview: null }))
  }, [form.avatarPreview])

  const validateStep1 = () => {
    const e: typeof errors = {}
    if (!form.name.trim()) e.name = t("err_name")
    if (!form.city.trim()) e.city = t("err_city")
    if (!form.profession.trim()) e.profession = t("err_profession")
    if (!form.referral_source) e.referral_source = t("err_referral")
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = () => {
    const e: typeof errors = {}
    if (!form.mood) e.mood = t("err_mood")
    if (!form.rating) e.rating = t("err_rating")
    if (!form.message.trim()) e.message = t("err_message")
    if (form.message.trim().length < 10) e.message = t("err_message_min")
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep((s) => Math.min(s + 1, 3))
  }

  const handleBack = () => setStep((s) => Math.max(s - 1, 1))

  const handleClose = () => {
    setStep(1)
    setForm(INITIAL_FORM)
    setErrors({})
    setSubmitError("")
    onClose()
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError("")

    try {
      const fingerprint = await generateFingerprint()

      // Cek server-side (fingerprint + IP fallback) — mencegah bypass meskipun localStorage dihapus
      const visitorRes = await fetch(
        `/api/visitor-check?type=guestbook_submitted&fp=${fingerprint}`
      ).catch(() => null)
      if (visitorRes?.ok) {
        const visitorData = await visitorRes.json().catch(() => null)
        if (visitorData?.checked) {
          localStorage.setItem("guestbook_submitted", "true")
          throw new Error(t("err_already_submitted"))
        }
      }

      // Check fingerprint langsung di tabel guestbook (layer kedua)
      const { data: existing } = await supabase
        .from("guestbook")
        .select("id")
        .eq("browser_fingerprint", fingerprint)
        .single()

      if (existing) {
        localStorage.setItem("guestbook_submitted", "true")
        throw new Error(t("err_already_submitted"))
      }

      // Upload avatar if provided
      let avatarUrl: string | null = null
      if (form.avatarFile) {
        const ext = form.avatarFile.name.split(".").pop()
        const fileName = `avatars/${fingerprint.slice(0, 16)}-${Date.now()}.${ext}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("guestbook-avatars")
          .upload(fileName, form.avatarFile, {
            upsert: false,
            cacheControl: "31536000",
            contentType: form.avatarFile.type,
          })

        if (uploadError) {
          throw new Error(`${t("err_upload")} ${uploadError.message}`)
        }

        if (uploadData) {
          const { data: urlData } = supabase.storage
            .from("guestbook-avatars")
            .getPublicUrl(uploadData.path)
          avatarUrl = urlData.publicUrl
        }
      }

      // Insert entry via server-side API (bypass RLS dengan service role key)
      const insertRes = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          browser_fingerprint: fingerprint,
          name: form.name.trim(),
          city: form.city.trim(),
          profession: form.profession.trim(),
          message: form.message.trim(),
          mood: form.mood,
          rating: form.rating,
          card_color: form.card_color,
          avatar_url: avatarUrl,
          referral_source: form.referral_source,
          contact: form.contact.trim() || null,
        }),
      })

      const insertJson = await insertRes.json()
      if (!insertRes.ok) throw new Error(insertJson.error ?? t("err_generic"))
      const newEntry = insertJson.data

      // Save flag to localStorage
      localStorage.setItem("guestbook_submitted", "true")

      // Catat fingerprint server-side agar tidak bisa bypass dengan hapus localStorage
      // Fingerprint sudah tersedia dari langkah validasi sebelumnya
      fetch("/api/visitor-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "guestbook_submitted", fingerprint }),
      }).catch(() => {})

      handleClose()
      onSuccess(newEntry as GuestbookEntry)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSubmitError(err.message)
      } else {
        setSubmitError(t("err_generic"))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const STEPS = [t("step_identity"), t("step_message"), t("step_preview")]
  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9990]"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-[9991] flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[95dvh] sm:max-h-[90dvh]">

          {/* Progress Bar */}
          <div className="h-1 bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full bg-accentColor transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white text-base">
                {t("form_title")}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {STEPS.map((label, i) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                        i + 1 < step
                          ? "bg-accentColor text-white"
                          : i + 1 === step
                          ? "bg-accentColor/20 text-accentColor border border-accentColor"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                      )}
                    >
                      {i + 1 < step ? <Check size={10} /> : i + 1}
                    </div>
                    <span
                      className={cn(
                        "text-xs",
                        i + 1 === step
                          ? "text-accentColor font-medium"
                          : "text-gray-400 dark:text-gray-500"
                      )}
                    >
                      {label}
                    </span>
                    {i < STEPS.length - 1 && (
                      <div
                        className={cn(
                          "w-4 h-px transition-colors",
                          i + 1 < step ? "bg-accentColor" : "bg-gray-200 dark:bg-gray-700"
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={t("btn_close")}
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto px-5 py-5">

            {/* ─ STEP 1: Identitas ──────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                    {t("label_avatar")} <span className="text-gray-400 font-normal">{t("label_optional")}</span>
                  </label>
                  <AvatarUpload
                    preview={form.avatarPreview}
                    onFile={handleAvatarFile}
                    onClear={clearAvatar}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                    {t("label_contact")} <span className="text-gray-400 font-normal">{t("label_optional")}</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.contact}
                      onChange={(e) => update("contact", e.target.value)}
                      placeholder={t("contact_placeholder")}
                      maxLength={60}
                      className="w-full px-3.5 py-2.5 rounded-xl border text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 outline-none transition-all border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-accentColor/30 focus:border-accentColor"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {t("contact_hint")}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                    {t("label_name")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder={t("name_placeholder")}
                    maxLength={100}
                    className={cn(
                      "w-full px-3.5 py-2.5 rounded-xl border text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 outline-none transition-all",
                      "focus:ring-2 focus:ring-accentColor/30 focus:border-accentColor",
                      errors.name ? "border-red-400" : "border-gray-200 dark:border-gray-700"
                    )}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                    {t("label_city")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    placeholder={t("city_placeholder")}
                    maxLength={100}
                    className={cn(
                      "w-full px-3.5 py-2.5 rounded-xl border text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 outline-none transition-all",
                      "focus:ring-2 focus:ring-accentColor/30 focus:border-accentColor",
                      errors.city ? "border-red-400" : "border-gray-200 dark:border-gray-700"
                    )}
                  />
                  {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                    {t("label_profession")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.profession}
                    onChange={(e) => update("profession", e.target.value)}
                    placeholder={t("profession_placeholder")}
                    maxLength={100}
                    className={cn(
                      "w-full px-3.5 py-2.5 rounded-xl border text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 outline-none transition-all",
                      "focus:ring-2 focus:ring-accentColor/30 focus:border-accentColor",
                      errors.profession ? "border-red-400" : "border-gray-200 dark:border-gray-700"
                    )}
                  />
                  {errors.profession && (
                    <p className="text-xs text-red-500 mt-1">{errors.profession}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                    {t("label_referral")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.referral_source}
                    onChange={(e) => update("referral_source", e.target.value)}
                    className={cn(
                      "w-full px-3.5 py-2.5 rounded-xl border text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none transition-all cursor-pointer",
                      "focus:ring-2 focus:ring-accentColor/30 focus:border-accentColor",
                      errors.referral_source ? "border-red-400" : "border-gray-200 dark:border-gray-700"
                    )}
                  >
                    <option value="">{t("referral_select")}</option>
                    {REFERRAL_SOURCES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.referral_source && (
                    <p className="text-xs text-red-500 mt-1">{errors.referral_source}</p>
                  )}
                </div>
              </div>
            )}

            {/* ─ STEP 2: Pesan & Ekspresi ───────────────────────────── */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                    {t("label_mood")} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {MOODS.map((m) => (
                      <button
                        key={m.label}
                        type="button"
                        onClick={() => update("mood", m.label)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all",
                          form.mood === m.label
                            ? "border-accentColor bg-accentColor/10 text-accentColor"
                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-accentColor/50"
                        )}
                      >
                        <span className="text-base">{m.emoji}</span>
                        <span>{t(`mood_${m.label.toLowerCase()}`)}</span>
                      </button>
                    ))}
                  </div>
                  {errors.mood && <p className="text-xs text-red-500 mt-1.5">{errors.mood}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                    {t("label_rating")} <span className="text-red-500">*</span>
                  </label>
                  <StarRatingInput value={form.rating} onChange={(v) => update("rating", v)} />
                  {errors.rating && <p className="text-xs text-red-500 mt-1.5">{errors.rating}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                    {t("label_message")} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    placeholder={t("message_placeholder")}
                    rows={4}
                    maxLength={500}
                    className={cn(
                      "w-full px-3.5 py-2.5 rounded-xl border text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 outline-none transition-all resize-none",
                      "focus:ring-2 focus:ring-accentColor/30 focus:border-accentColor",
                      errors.message ? "border-red-400" : "border-gray-200 dark:border-gray-700"
                    )}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.message ? (
                      <p className="text-xs text-red-500">{errors.message}</p>
                    ) : (
                      <span />
                    )}
                    <span className="text-xs text-gray-400">{form.message.length}/500</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                    {t("label_color")}
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => update("card_color", c)}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all",
                          form.card_color === c
                            ? "ring-2 ring-offset-2 ring-gray-800 dark:ring-white scale-110"
                            : "hover:scale-105"
                        )}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-700"
                      style={{ backgroundColor: form.card_color }}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {t("color_selected")} {form.card_color}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ─ STEP 3: Preview ────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1">
                    {t("preview_title")}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("preview_desc")}
                  </p>
                </div>

                <PreviewCard form={form} />

                {submitError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <span className="text-red-500 text-sm">{submitError}</span>
                  </div>
                )}

                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center">
                  <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                    {t("preview_disclaimer")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-gray-800 gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                <ChevronLeft size={15} />
                {t("btn_back")}
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium bg-accentColor text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 active:scale-95 transition-all shadow-sm"
              >
                {t("btn_next")}
                <ChevronRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={cn(
                  "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-accentColor text-white transition-all shadow-sm active:scale-95",
                  isSubmitting
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:bg-emerald-700 dark:hover:bg-emerald-600"
                )}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    {t("btn_submitting")}
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    {t("btn_submit")}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
