"use client"

import { useState, useEffect, type ReactNode } from "react"
import { X, Loader2, Disc, AlignLeft, Image as ImageIcon, Music, CheckSquare } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AlbumFormData {
    id?: number
    name: string
    description: string
    cover_url: string
    trackIds: number[] // Relasi track_id yang ada di dalam custom_album_tracks
}

const EMPTY_FORM: AlbumFormData = {
    name: "",
    description: "",
    cover_url: "",
    trackIds: [],
}

interface AlbumFormModalProps {
    isOpen: boolean
    mode: "create" | "edit"
    initialData?: Partial<AlbumFormData>
    allTracks: any[] // Semua lagu dari music_tracks
    onClose: () => void
    onSave: (data: AlbumFormData) => void
    externalSaving?: boolean
}

export default function AlbumFormModal({ isOpen, mode, initialData, allTracks, onClose, onSave, externalSaving }: AlbumFormModalProps) {
    const [form, setForm] = useState<AlbumFormData>(EMPTY_FORM)
    const [searchTrack, setSearchTrack] = useState("")

    useEffect(() => {
        if (isOpen) {
            setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
            setSearchTrack("")
        }
    }, [isOpen, initialData])

    function setField<K extends keyof AlbumFormData>(key: K, value: AlbumFormData[K]) {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    function toggleTrack(trackId: number) {
        setField("trackIds", form.trackIds.includes(trackId)
            ? form.trackIds.filter(id => id !== trackId)
            : [...form.trackIds, trackId]
        )
    }

    if (!isOpen) return null
    const isValid = form.name.trim() !== ""

    const filteredTracks = allTracks.filter(t => 
        (t.title || "").toLowerCase().includes(searchTrack.toLowerCase()) || 
        (t.artist || "").toLowerCase().includes(searchTrack.toLowerCase())
    )

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
                    <div>
                        <h2 className="text-base font-semibold text-white">{mode === "create" ? "New Playlist Album" : "Edit Playlist"}</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Kelola informasi playlist dan daftarkan lagu ke dalamnya</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors"><X size={16} /></button>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-none px-6 py-5 space-y-6">

                    <div className="space-y-4">
                        <FormField label="Nama Playlist" icon={<Disc size={12} className="text-gray-500" />} required>
                            <TextInput value={form.name} onChange={(v) => setField("name", v)} placeholder="Cth: Lofi Vibes" />
                        </FormField>

                        <FormField label="URL Cover Image" icon={<ImageIcon size={12} className="text-gray-500" />} hint="Tautan gambar (Opsional)">
                            <TextInput value={form.cover_url} onChange={(v) => setField("cover_url", v)} placeholder="https://example.com/cover.jpg" />
                        </FormField>

                        <FormField label="Deskripsi" icon={<AlignLeft size={12} className="text-gray-500" />} hint="Deskripsi singkat (Opsional)">
                            <textarea
                                value={form.description} onChange={(e) => setField("description", e.target.value)} rows={2}
                                placeholder="Playlist ini cocok didengarkan saat..."
                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors resize-none placeholder:text-gray-600"
                            />
                        </FormField>
                    </div>

                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] flex flex-col h-[280px]">
                        <FormField label="Pilih Lagu" icon={<Music size={12} className="text-gray-500" />}>
                            <div className="mt-2 mb-3">
                                <input
                                    type="text" value={searchTrack} onChange={(e) => setSearchTrack(e.target.value)}
                                    placeholder="Cari lagu di database..."
                                    className="w-full pl-3 pr-3 py-2 bg-[#0a1515] border border-white/[0.08] rounded-lg text-[13px] text-gray-300 outline-none focus:border-accentColor/50 transition-colors placeholder:text-gray-600"
                                />
                            </div>
                            
                            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-1 space-y-1">
                                {allTracks.length === 0 ? (
                                    <p className="text-xs text-gray-500 italic mt-2 text-center py-4">Belum ada lagu yang tersimpan di database.</p>
                                ) : filteredTracks.length === 0 ? (
                                    <p className="text-xs text-gray-500 italic text-center py-4">Pencarian tidak ditemukan.</p>
                                ) : (
                                    filteredTracks.map((track) => {
                                        const isSelected = form.trackIds.includes(track.id)
                                        return (
                                            <label key={track.id} className={cn("flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors group", isSelected ? "bg-accentColor/10 border-accentColor/30" : "bg-transparent border-transparent hover:bg-white/[0.03]")}>
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="mt-0.5 shrink-0">
                                                        {isSelected ? <CheckSquare size={16} className="text-accentColor" /> : <div className="w-4 h-4 rounded border border-gray-600 group-hover:border-gray-400 transition-colors" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className={cn("text-[13px] font-medium leading-tight truncate", isSelected ? "text-accentColor" : "text-gray-300")}>{track.title}</p>
                                                        <p className="text-[11px] text-gray-500 mt-0.5 truncate">{track.artist}</p>
                                                    </div>
                                                </div>
                                            </label>
                                        )
                                    })
                                )}
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
                            {mode === "create" ? "Buat Playlist" : "Simpan Perubahan"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function FormField({ label, required, hint, icon, children }: { label: string, required?: boolean, hint?: string, icon?: ReactNode, children: ReactNode }) {
    return (
        <div className="flex flex-col h-full">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2 shrink-0">
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
