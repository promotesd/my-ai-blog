"use client"

import { useState, useEffect, type ReactNode } from "react"
import { X, Loader2, Globe, Fingerprint, Activity } from "lucide-react"

export interface VisitorIpLogFormData {
    id?: number
    ip_address: string
    action_type: "welcome_popup_submitted" | "welcome_popup_hidden" | "banner_dismissed" | "guestbook_submitted" | "gallery_guest_registered" | ""
    browser_fingerprint: string
}

const EMPTY_FORM: VisitorIpLogFormData = {
    ip_address: "",
    action_type: "welcome_popup_submitted",
    browser_fingerprint: "",
}

const ACTION_TYPES = [
    "welcome_popup_submitted",
    "welcome_popup_hidden",
    "banner_dismissed",
    "guestbook_submitted",
    "gallery_guest_registered"
]

interface VisitorIpLogFormModalProps {
    isOpen: boolean
    mode: "create" | "edit"
    initialData?: Partial<VisitorIpLogFormData>
    onClose: () => void
    onSave: (data: VisitorIpLogFormData) => void
    externalSaving?: boolean
}

export default function VisitorIpLogFormModal({ isOpen, mode, initialData, onClose, onSave, externalSaving }: VisitorIpLogFormModalProps) {
    const [form, setForm] = useState<VisitorIpLogFormData>(EMPTY_FORM)

    useEffect(() => {
        if (isOpen) {
            setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
        }
    }, [isOpen, initialData])

    function setField<K extends keyof VisitorIpLogFormData>(key: K, value: VisitorIpLogFormData[K]) {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    if (!isOpen) return null

    const isValid = form.ip_address.trim() !== "" && form.action_type !== ""

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl flex flex-col bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
                    <div>
                        <h2 className="text-base font-semibold text-white">
                            {mode === "create" ? "New Visitor Log" : "Edit Visitor Log"}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">Kelola data log IP pengunjung dan fingerprint</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5">

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="IP Address" icon={<Globe size={12} className="text-gray-500" />} required>
                            <TextInput value={form.ip_address} onChange={(v) => setField("ip_address", v)} placeholder="Cth: 192.168.1.1 atau 2001:db8::1" />
                        </FormField>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">Tipe Aksi (Action Type) <span className="text-red-400">*</span></label>
                            <select
                                value={form.action_type} onChange={(e) => setField("action_type", e.target.value as any)}
                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors appearance-none cursor-pointer"
                            >
                                <option value="" disabled className="bg-[#0e1c1c]">Pilih Tipe Aksi</option>
                                {ACTION_TYPES.map(a => <option key={a} value={a} className="bg-[#0e1c1c]">{a}</option>)}
                            </select>
                        </div>
                    </div>

                    <FormField label="Browser Fingerprint (SHA-256)" icon={<Fingerprint size={12} className="text-gray-500" />} hint="Opsional, tapi disarankan untuk tracking unik">
                        <input
                            type="text" value={form.browser_fingerprint} onChange={(e) => setField("browser_fingerprint", e.target.value)}
                            placeholder="Hash fingerprint browser..."
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-accentColor/60 transition-colors font-mono"
                        />
                    </FormField>

                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 leading-relaxed">
                        <strong>Info Unique Key:</strong> Kombinasi antara <code>browser_fingerprint</code> (jika ada) dan <code>action_type</code> bersifat unik. Jika memasukkan data dengan kombinasi yang sama persis, penyimpanan akan gagal.
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] shrink-0 bg-[#0a1515]">
                    <p className="text-xs text-gray-600"><span className="text-red-400">*</span> Wajib diisi</p>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 rounded-xl hover:bg-white/[0.06]">
                            Batal
                        </button>
                        <button
                            onClick={() => onSave(form)}
                            disabled={externalSaving || !isValid}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-accentColor text-white rounded-xl hover:brightness-110 disabled:opacity-50 transition-all"
                        >
                            {externalSaving && <Loader2 size={13} className="animate-spin" />}
                            {mode === "create" ? "Simpan Log" : "Simpan Perubahan"}
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
