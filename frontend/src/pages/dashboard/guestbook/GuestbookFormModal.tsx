"use client"

import { useState, useEffect, type ReactNode } from "react"
import { X, Loader2, User, MapPin, Briefcase, MessageSquare, Image as ImageIcon, Link2, Star, Smile, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

export interface GuestbookFormData {
    id: string
    name: string
    city: string
    profession: string
    message: string
    mood: string
    rating: number
    card_color: string
    avatar_url: string
    contact: string
    referral_source: string
    is_approved: boolean
}

interface GuestbookFormModalProps {
    isOpen: boolean
    initialData: GuestbookFormData | null
    onClose: () => void
    onSave: (id: string, data: Partial<GuestbookFormData>) => void
    externalSaving?: boolean
}

export default function GuestbookFormModal({ isOpen, initialData, onClose, onSave, externalSaving }: GuestbookFormModalProps) {
    const [form, setForm] = useState<Partial<GuestbookFormData>>({})
    const [uploadingField, setUploadingField] = useState<boolean>(false)

    useEffect(() => {
        if (isOpen && initialData) {
            setForm({ ...initialData })
        }
    }, [isOpen, initialData])

    function setField<K extends keyof GuestbookFormData>(key: K, value: GuestbookFormData[K]) {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    async function handleFileUpload(file: File) {
        try {
            setUploadingField(true)
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
            const bucket = "guestbook-avatars" 

            const { error } = await supabase.storage.from(bucket).upload(fileName, file)
            if (error) throw error

            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName)
            setField("avatar_url", publicUrl)
        } catch (error: any) {
            alert(`Gagal upload avatar: ${error.message}`)
        } finally {
            setUploadingField(false)
        }
    }

    if (!isOpen || !initialData) return null
    const isValid = !!form.name?.trim() && !!form.message?.trim()

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
                    <div>
                        <h2 className="text-base font-semibold text-white">Edit Buku Tamu</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Edit dan moderasi entri Guestbook</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors"><X size={16} /></button>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-none px-6 py-5 space-y-6">

                    {/* Moderasi/Approval Banner */}
                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border", form.is_approved ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400")}>
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-200">Status Visibilitas Publik</p>
                                <p className="text-xs text-gray-500 mt-0.5">{form.is_approved ? "Entri ini TAMPIL di beranda publik." : "Entri ini DISEMBUNYIKAN (pending/ditolak)."}</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={form.is_approved || false} onChange={e => setField("is_approved", e.target.checked)} />
                            <div className="w-11 h-6 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accentColor"></div>
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Nama Pengunjung" icon={<User size={12} className="text-gray-500" />} required>
                            <TextInput value={form.name || ""} onChange={(v) => setField("name", v)} />
                        </FormField>
                        <FormField label="Asal Kota" icon={<MapPin size={12} className="text-gray-500" />}>
                            <TextInput value={form.city || ""} onChange={(v) => setField("city", v)} />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Profesi" icon={<Briefcase size={12} className="text-gray-500" />}>
                            <TextInput value={form.profession || ""} onChange={(v) => setField("profession", v)} />
                        </FormField>
                        <FormField label="Kontak / Sosmed" icon={<Link2 size={12} className="text-gray-500" />}>
                            <TextInput value={form.contact || ""} onChange={(v) => setField("contact", v)} />
                        </FormField>
                    </div>

                    <FormField label="Pesan Ulasan" icon={<MessageSquare size={12} className="text-gray-500" />} required>
                        <textarea value={form.message || ""} onChange={(e) => setField("message", e.target.value)} rows={4} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors resize-none placeholder:text-gray-600" />
                    </FormField>

                    <div className="grid grid-cols-3 gap-4">
                        <FormField label="Rating" icon={<Star size={12} className="text-gray-500" />}>
                            <select value={form.rating || 5} onChange={(e) => setField("rating", parseInt(e.target.value))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors appearance-none">
                                {[1, 2, 3, 4, 5].map(v => <option key={v} value={v} className="bg-[#0e1c1c]">{v} Bintang</option>)}
                            </select>
                        </FormField>
                        <FormField label="Mood" icon={<Smile size={12} className="text-gray-500" />}>
                            <TextInput value={form.mood || ""} onChange={(v) => setField("mood", v)} />
                        </FormField>
                        <FormField label="Referensi" icon={<Link2 size={12} className="text-gray-500" />}>
                            <TextInput value={form.referral_source || ""} onChange={(v) => setField("referral_source", v)} disabled />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Warna Kartu (Hex)" icon={<ImageIcon size={12} className="text-gray-500" />}>
                            <div className="flex gap-2">
                                <div className="w-10 h-10 rounded-xl shrink-0 border border-white/10" style={{ backgroundColor: form.card_color }} />
                                <TextInput value={form.card_color || ""} onChange={(v) => setField("card_color", v)} />
                            </div>
                        </FormField>
                        <FormField label="Gambar Avatar" icon={<ImageIcon size={12} className="text-gray-500" />}>
                            <div className="space-y-3">
                                <div className="relative flex items-center">
                                    <input type="file" accept="image/*" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])} disabled={uploadingField} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-gray-200 outline-none focus:border-accentColor/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-accentColor/10 file:text-accentColor hover:file:bg-accentColor/20 file:cursor-pointer disabled:opacity-50" />
                                    {uploadingField && <Loader2 size={14} className="absolute right-3 animate-spin text-accentColor" />}
                                </div>
                                <TextInput value={form.avatar_url || ""} onChange={(v) => setField("avatar_url", v)} placeholder="Atau paste URL..." />
                            </div>
                        </FormField>
                    </div>

                </div>

                <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] shrink-0 bg-[#0a1515]">
                    <p className="text-xs text-gray-600"><span className="text-red-400">*</span> Wajib diisi</p>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 rounded-xl hover:bg-white/[0.06]">Batal</button>
                        <button onClick={() => onSave(initialData.id, form)} disabled={externalSaving || !isValid} className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-accentColor text-white rounded-xl hover:brightness-110 disabled:opacity-50 transition-all">
                            {externalSaving && <Loader2 size={13} className="animate-spin" />}
                            Simpan Perubahan
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
