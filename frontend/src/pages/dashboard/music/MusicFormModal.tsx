"use client"

import { useState, useEffect, type ReactNode } from "react"
import { X, Loader2, Music, Mic2, Disc, AlignLeft, Headphones } from "lucide-react"
import { cn } from "@/lib/utils"

export interface MusicTrackFormData {
    id?: number
    title: string
    artist: string
    spotify_track_id: string
    notes: string
    albumIds: number[] // Relasi ke custom_albums
}

const EMPTY_FORM: MusicTrackFormData = {
    title: "",
    artist: "",
    spotify_track_id: "",
    notes: "",
    albumIds: [],
}

interface MusicFormModalProps {
    isOpen: boolean
    mode: "create" | "edit"
    initialData?: Partial<MusicTrackFormData>
    albums: any[] // Daftar album dari tabel custom_albums
    onClose: () => void
    onSave: (data: MusicTrackFormData) => void
    externalSaving?: boolean
}

export default function MusicFormModal({ isOpen, mode, initialData, albums, onClose, onSave, externalSaving }: MusicFormModalProps) {
    const [form, setForm] = useState<MusicTrackFormData>(EMPTY_FORM)

    useEffect(() => {
        if (isOpen) {
            setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
        }
    }, [isOpen, initialData])

    function setField<K extends keyof MusicTrackFormData>(key: K, value: MusicTrackFormData[K]) {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    function toggleAlbum(albumId: number) {
        setField("albumIds", form.albumIds.includes(albumId)
            ? form.albumIds.filter(id => id !== albumId)
            : [...form.albumIds, albumId]
        )
    }

    if (!isOpen) return null
    const isValid = form.title.trim() !== "" && form.artist.trim() !== ""

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
                    <div>
                        <h2 className="text-base font-semibold text-white">{mode === "create" ? "New Music Track" : "Edit Track"}</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Kelola daftar lagu dan relasi playlist</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors"><X size={16} /></button>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-none px-6 py-5 space-y-6">

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Judul Lagu" icon={<Music size={12} className="text-gray-500" />} required>
                            <TextInput value={form.title} onChange={(v) => setField("title", v)} placeholder="Cth: Resonance" />
                        </FormField>
                        <FormField label="Artis / Penyanyi" icon={<Mic2 size={12} className="text-gray-500" />} required>
                            <TextInput value={form.artist} onChange={(v) => setField("artist", v)} placeholder="Cth: HOME" />
                        </FormField>
                    </div>

                    <FormField label="Spotify Track ID" icon={<Disc size={12} className="text-gray-500" />} hint="Opsional (Untuk Player Spotify)">
                        <TextInput value={form.spotify_track_id} onChange={(v) => setField("spotify_track_id", v)} placeholder="Cth: 3cfOd4CMv2snFaKAnMdnvK" />
                    </FormField>

                    <FormField label="Catatan (Notes)" icon={<AlignLeft size={12} className="text-gray-500" />}>
                        <textarea
                            value={form.notes} onChange={(e) => setField("notes", e.target.value)} rows={3}
                            placeholder="Cerita singkat atau memori tentang lagu ini..."
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors resize-none placeholder:text-gray-600"
                        />
                    </FormField>

                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                        <FormField label="Masukkan ke Album / Playlist" icon={<Headphones size={12} className="text-gray-500" />}>
                            {albums.length === 0 ? (
                                <p className="text-xs text-gray-500 italic mt-2">Belum ada album yang dibuat di database.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                                    {albums.map((album) => (
                                        <label key={album.id} className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors", form.albumIds.includes(album.id) ? "bg-accentColor/10 border-accentColor/30" : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]")}>
                                            <input
                                                type="checkbox" checked={form.albumIds.includes(album.id)}
                                                onChange={() => toggleAlbum(album.id)}
                                                className="w-4 h-4 rounded accent-accentColor bg-white/[0.05] border-white/[0.1] cursor-pointer"
                                            />
                                            <span className="text-sm font-medium text-gray-300">{album.name}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </FormField>
                    </div>

                </div>

                <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] shrink-0 bg-[#0a1515]">
                    <p className="text-xs text-gray-600"><span className="text-red-400">*</span> Wajib diisi</p>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 rounded-xl hover:bg-white/[0.06]">Batal</button>
                        <button onClick={() => onSave(form)} disabled={externalSaving || !isValid} className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-accentColor text-white rounded-xl hover:brightness-110 disabled:opacity-50 transition-all">
                            {externalSaving && <Loader2 size={13} className="animate-spin" />}
                            {mode === "create" ? "Simpan Lagu" : "Simpan Perubahan"}
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
