"use client"

import { useState, useEffect, type ReactNode } from "react"
import { X, Loader2, Gamepad2, Star, Clock, Image as ImageIcon, Building2, Calendar, LayoutList, AlignLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

export interface MobileGameFormData {
    id?: number
    title: string
    platform: string
    genre: string[]
    status: "playing" | "completed" | "wishlist"
    cover_url: string
    description: string
    developer: string
    release_year: number | ""
    personal_rating: number
    review: string
    hours_played: number
}

const EMPTY_FORM: MobileGameFormData = {
    title: "", platform: "Mobile", genre: [], status: "playing",
    cover_url: "", description: "", developer: "", release_year: new Date().getFullYear(),
    personal_rating: 0, review: "", hours_played: 0
}

const PLATFORMS = ["Mobile", "Nintendo Switch", "PlayStation 5", "PlayStation 4", "Xbox", "Lainnya"]
const STATUSES = [
    { value: "playing", label: "Playing (Sedang Dimainkan)" },
    { value: "completed", label: "Completed (Tamat)" },
    { value: "wishlist", label: "Wishlist (Ingin Dimainkan)" }
]

interface MobileGamesFormModalProps {
    isOpen: boolean
    mode: "create" | "edit"
    initialData?: Partial<MobileGameFormData>
    onClose: () => void
    onSave: (data: MobileGameFormData) => void
    externalSaving?: boolean
}

export default function MobileGamesFormModal({ isOpen, mode, initialData, onClose, onSave, externalSaving }: MobileGamesFormModalProps) {
    const [form, setForm] = useState<MobileGameFormData>(EMPTY_FORM)
    const [genreInput, setGenreInput] = useState("")
    const [uploadingField, setUploadingField] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
            setGenreInput("")
        }
    }, [isOpen, initialData])

    function setField<K extends keyof MobileGameFormData>(key: K, value: MobileGameFormData[K]) {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    function addGenre() {
        const val = genreInput.trim()
        if (val && !form.genre.includes(val)) {
            setField("genre", [...form.genre, val])
            setGenreInput("")
        }
    }

    function removeGenre(val: string) {
        setField("genre", form.genre.filter(g => g !== val))
    }

    async function handleFileUpload(file: File) {
        try {
            setUploadingField("cover_url")
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
            const bucket = "mobile-games" // Asumsi bucket bernama mobile-games

            // Opsional: Buat bucket jika belum ada, atau abaikan jika sudah di-handle di SQL
            const { error } = await supabase.storage.from(bucket).upload(fileName, file)
            if (error) throw error

            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName)
            setField("cover_url", publicUrl)
        } catch (error: any) {
            alert(`Gagal upload: ${error.message}`)
        } finally {
            setUploadingField(null)
        }
    }

    if (!isOpen) return null
    const isValid = form.title.trim() !== "" && form.platform !== ""

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
                    <div>
                        <h2 className="text-base font-semibold text-white">{mode === "create" ? "New Game Entry" : "Edit Game"}</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Kelola library game Anda</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors"><X size={16} /></button>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-none px-6 py-5 space-y-6">

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Judul Game" icon={<Gamepad2 size={12} className="text-gray-500" />} required>
                            <TextInput value={form.title} onChange={(v) => setField("title", v)} placeholder="Cth: Honkai: Star Rail..." />
                        </FormField>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">Status Bermain</label>
                            <select value={form.status} onChange={(e) => setField("status", e.target.value as any)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors appearance-none cursor-pointer">
                                {STATUSES.map(s => <option key={s.value} value={s.value} className="bg-[#0e1c1c]">{s.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <FormField label="Developer / Studio" icon={<Building2 size={12} className="text-gray-500" />}>
                            <TextInput value={form.developer} onChange={(v) => setField("developer", v)} placeholder="Cth: HoYoverse" />
                        </FormField>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">Platform Dasar</label>
                            <select value={form.platform} onChange={(e) => setField("platform", e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors appearance-none cursor-pointer">
                                <option value="" disabled className="bg-[#0e1c1c]">Pilih Platform</option>
                                {PLATFORMS.map(p => <option key={p} value={p} className="bg-[#0e1c1c]">{p}</option>)}
                            </select>
                        </div>
                        <FormField label="Tahun Rilis" icon={<Calendar size={12} className="text-gray-500" />}>
                            <input type="number" value={form.release_year} onChange={(e) => setField("release_year", parseInt(e.target.value) || "")} placeholder="YYYY" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors placeholder:text-gray-600" />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-2 gap-4 items-start">
                        <FormField label="Genre (Tags)" icon={<LayoutList size={12} className="text-gray-500" />} hint="Tekan Enter">
                            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-2.5 space-y-2 focus-within:border-accentColor/60 transition-colors">
                                {form.genre.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {form.genre.map(g => (
                                            <span key={g} className="flex items-center gap-1 text-[11px] px-2 py-1 bg-accentColor/10 text-accentColor rounded-md border border-accentColor/20">
                                                {g} <button type="button" onClick={() => removeGenre(g)} className="hover:text-red-400 ml-0.5"><X size={12} /></button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <input value={genreInput} onChange={(e) => setGenreInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addGenre(); } }} placeholder="Ketik genre (RPG, FPS) lalu Enter..." className="w-full bg-transparent text-sm text-gray-200 placeholder:text-gray-600 outline-none" />
                            </div>
                        </FormField>

                        <div className="space-y-4">
                            <FormField label={`Personal Rating (${form.personal_rating || 0}/5)`} icon={<Star size={12} className="text-gray-500" />}>
                                <div className="flex items-center gap-4 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5">
                                    <input type="range" min="0" max="5" step="1" value={form.personal_rating || 0} onChange={(e) => setField("personal_rating", parseInt(e.target.value))} className="flex-1 accent-amber-500 cursor-pointer" />
                                    <div className="flex text-amber-500 w-16 justify-end">
                                        {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} className={i < (form.personal_rating || 0) ? "fill-amber-500" : "text-gray-600"} />)}
                                    </div>
                                </div>
                            </FormField>

                            <FormField label="Jam Bermain (Hours Played)" icon={<Clock size={12} className="text-gray-500" />}>
                                <div className="flex items-center gap-2">
                                    <input type="number" min="0" value={form.hours_played} onChange={(e) => setField("hours_played", parseInt(e.target.value) || 0)} className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors" />
                                    <span className="text-xs text-gray-500 font-medium px-2">Jam</span>
                                </div>
                            </FormField>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Deskripsi Game Singkat" icon={<AlignLeft size={12} className="text-gray-500" />}>
                            <textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={3} placeholder="Deskripsi umum tentang game ini..." className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors resize-none placeholder:text-gray-600" />
                        </FormField>
                        <FormField label="Review Pribadi" icon={<Star size={12} className="text-gray-500" />}>
                            <textarea value={form.review} onChange={(e) => setField("review", e.target.value)} rows={3} placeholder="Apa pendapat Anda tentang game ini? Kelebihan & kekurangannya..." className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors resize-none placeholder:text-gray-600" />
                        </FormField>
                    </div>

                    {/* UPLOAD COVER */}
                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                        <FormField label="Cover Image / Poster Game" icon={<ImageIcon size={12} className="text-gray-500" />}>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div className="space-y-3">
                                    <div className="relative flex items-center">
                                        <input type="file" accept="image/*" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])} disabled={!!uploadingField} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-gray-200 outline-none focus:border-accentColor/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-accentColor/10 file:text-accentColor hover:file:bg-accentColor/20 file:cursor-pointer disabled:opacity-50" />
                                        {uploadingField === "cover_url" && <Loader2 size={14} className="absolute right-3 animate-spin text-accentColor" />}
                                    </div>
                                    <TextInput value={form.cover_url} onChange={(v) => setField("cover_url", v)} placeholder="Atau paste URL gambar..." />
                                </div>

                                <div className="relative h-24 rounded-xl overflow-hidden border border-white/[0.08] bg-black/40 flex items-center justify-center">
                                    {form.cover_url ? (
                                        <>
                                            <img src={form.cover_url} alt="Cover Preview" className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => setField("cover_url", "")} className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 text-white hover:bg-red-500 transition-colors backdrop-blur-sm"><X size={12} /></button>
                                        </>
                                    ) : (
                                        <span className="text-[10px] text-gray-600">No Image</span>
                                    )}
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
                            {mode === "create" ? "Simpan Game" : "Simpan Perubahan"}
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
