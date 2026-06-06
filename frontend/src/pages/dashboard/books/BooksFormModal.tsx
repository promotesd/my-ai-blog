"use client"

import { useState, useEffect, type ReactNode } from "react"
import { X, Loader2, BookOpen, Star, Hash, Building2, Calendar, LayoutList, AlignLeft, Tags } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BookFormData {
    id?: number
    title: string
    author: string
    isbn: string
    open_library_key: string
    status: "reading" | "finished" | "wishlist" | "favorite"
    personal_rating: number
    review: string
    genre: string[]
    year: number | ""
    pages: number | ""
}

const EMPTY_FORM: BookFormData = {
    title: "", author: "", isbn: "", open_library_key: "", status: "wishlist",
    personal_rating: 0, review: "", genre: [], year: "", pages: ""
}

const STATUSES = [
    { value: "wishlist", label: "Wishlist (Ingin Dibaca)" },
    { value: "reading", label: "Reading (Sedang Dibaca)" },
    { value: "finished", label: "Finished (Selesai Dibaca)" },
    { value: "favorite", label: "Favorite (Buku Pilihan Utama)" }
]

interface BooksFormModalProps {
    isOpen: boolean
    mode: "create" | "edit"
    initialData?: Partial<BookFormData>
    onClose: () => void
    onSave: (data: BookFormData) => void
    externalSaving?: boolean
}

export default function BooksFormModal({ isOpen, mode, initialData, onClose, onSave, externalSaving }: BooksFormModalProps) {
    const [form, setForm] = useState<BookFormData>(EMPTY_FORM)
    const [genreInput, setGenreInput] = useState("")

    useEffect(() => {
        if (isOpen) {
            setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
            setGenreInput("")
        }
    }, [isOpen, initialData])

    function setField<K extends keyof BookFormData>(key: K, value: BookFormData[K]) {
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

    if (!isOpen) return null
    const isValid = form.title.trim() !== "" && form.author.trim() !== ""

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
                    <div>
                        <h2 className="text-base font-semibold text-white">{mode === "create" ? "New Book Entry" : "Edit Book"}</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Catat buku yang Anda baca atau dalam antrean</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors"><X size={16} /></button>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-none px-6 py-5 space-y-6">

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Judul Buku" icon={<BookOpen size={12} className="text-gray-500" />} required>
                            <TextInput value={form.title} onChange={(v) => setField("title", v)} placeholder="Cth: Atomic Habits" />
                        </FormField>
                        <FormField label="Penulis / Pengarang" icon={<Building2 size={12} className="text-gray-500" />} required>
                            <TextInput value={form.author} onChange={(v) => setField("author", v)} placeholder="Cth: James Clear" />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">Status Pembacaan</label>
                            <select value={form.status} onChange={(e) => setField("status", e.target.value as any)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors appearance-none cursor-pointer">
                                {STATUSES.map(s => <option key={s.value} value={s.value} className="bg-[#0e1c1c]">{s.label}</option>)}
                            </select>
                        </div>
                        <FormField label="Tahun Terbit" icon={<Calendar size={12} className="text-gray-500" />}>
                            <input type="number" value={form.year} onChange={(e) => setField("year", parseInt(e.target.value) || "")} placeholder="YYYY" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors placeholder:text-gray-600" />
                        </FormField>
                        <FormField label="Jumlah Halaman" icon={<LayoutList size={12} className="text-gray-500" />}>
                            <input type="number" value={form.pages} onChange={(e) => setField("pages", parseInt(e.target.value) || "")} placeholder="Cth: 320" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors placeholder:text-gray-600" />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-2 gap-4 items-start">
                        <FormField label="Genre (Tags)" icon={<Tags size={12} className="text-gray-500" />} hint="Tekan Enter">
                            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-2.5 space-y-2 focus-within:border-accentColor/60 transition-colors min-h-[58px]">
                                {form.genre.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {form.genre.map(g => (
                                            <span key={g} className="flex items-center gap-1 text-[11px] px-2 py-1 bg-accentColor/10 text-accentColor rounded-md border border-accentColor/20">
                                                {g} <button type="button" onClick={() => removeGenre(g)} className="hover:text-red-400 ml-0.5"><X size={12} /></button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <input value={genreInput} onChange={(e) => setGenreInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addGenre(); } }} placeholder="Ketik kategori (Self-Help, Novel) lalu Enter..." className="w-full bg-transparent text-sm text-gray-200 placeholder:text-gray-600 outline-none" />
                            </div>
                        </FormField>

                        <div className="space-y-4">
                            <FormField label={`Personal Rating (${form.personal_rating || 0}/5)`} icon={<Star size={12} className="text-gray-500" />}>
                                <div className="flex items-center gap-4 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3">
                                    <input type="range" min="0" max="5" step="1" value={form.personal_rating || 0} onChange={(e) => setField("personal_rating", parseInt(e.target.value))} className="flex-1 accent-amber-500 cursor-pointer" />
                                    <div className="flex text-amber-500 w-16 justify-end">
                                        {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} className={i < (form.personal_rating || 0) ? "fill-amber-500" : "text-gray-600"} />)}
                                    </div>
                                </div>
                            </FormField>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Review Singkat" icon={<AlignLeft size={12} className="text-gray-500" />}>
                            <textarea value={form.review} onChange={(e) => setField("review", e.target.value)} rows={3} placeholder="Apa inti / summary dari buku ini secara personal?" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors resize-none placeholder:text-gray-600" />
                        </FormField>

                        <div className="space-y-4">
                            <FormField label="Open Library Key (Opsional)" icon={<BookOpen size={12} className="text-gray-500" />} hint="Untuk tarik cover (/works/OL...)">
                                <TextInput value={form.open_library_key} onChange={(v) => setField("open_library_key", v)} placeholder="Cth: /works/OL45804W" />
                            </FormField>
                            <FormField label="ISBN (Opsional)" icon={<Hash size={12} className="text-gray-500" />}>
                                <TextInput value={form.isbn} onChange={(v) => setField("isbn", v)} placeholder="Cth: 9780593418292" />
                            </FormField>
                        </div>
                    </div>

                </div>

                <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] shrink-0 bg-[#0a1515]">
                    <p className="text-xs text-gray-600"><span className="text-red-400">*</span> Wajib diisi</p>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 rounded-xl hover:bg-white/[0.06]">Batal</button>
                        <button onClick={() => onSave(form)} disabled={externalSaving || !isValid} className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-accentColor text-white rounded-xl hover:brightness-110 disabled:opacity-50 transition-all">
                            {externalSaving && <Loader2 size={13} className="animate-spin" />}
                            {mode === "create" ? "Simpan Data Buku" : "Simpan Perubahan"}
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
        <input type="text" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors placeholder:text-gray-600 disabled:opacity-50" />
    )
}
