"use client"

import React, { useState, useEffect } from "react"
import { X, Save, RefreshCw, User, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface GuestFormData {
  id?: number
  name: string
  avatar_url: string
}

interface GuestFormModalProps {
  isOpen: boolean
  mode: "create" | "edit"
  initialData?: any
  onClose: () => void
  onSave: (data: GuestFormData) => Promise<void>
  externalSaving?: boolean
}

export default function GuestFormModal({ isOpen, mode, initialData, onClose, onSave, externalSaving = false }: GuestFormModalProps) {
  const [formData, setFormData] = useState<GuestFormData>({
    name: "",
    avatar_url: "",
  })
  
  const [saving, setSaving] = useState(false)
  const isSaving = saving || externalSaving

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setFormData({
          id: initialData.id,
          name: initialData.name || "",
          avatar_url: initialData.avatarUrl || initialData.avatar_url || "",
        })
      } else {
        setFormData({
          name: "",
          avatar_url: "",
        })
      }
    }
  }, [isOpen, mode, initialData])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(formData)
    } finally {
      if (!externalSaving) setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={() => !isSaving && onClose()} />
      <div className="relative w-full max-w-md bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accentColor/10 flex items-center justify-center border border-accentColor/20">
              <User size={14} className="text-accentColor" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white leading-tight">
                {mode === "create" ? "Tambah Tamu Baru" : "Edit Profil Tamu"}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {mode === "create" ? "Daftarkan tamu baru ke gallery." : `Ubah profil tamu (ID: ${formData.id}).`}
              </p>
            </div>
          </div>
          <button onClick={onClose} disabled={isSaving} className="p-2 -mr-2 text-gray-500 hover:text-white hover:bg-white/[0.05] rounded-xl transition-all disabled:opacity-50">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-none">
          <form id="guest-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300 ml-1">Nama Tamu <span className="text-red-400">*</span></label>
              <input
                required
                type="text"
                placeholder="Misal: John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-gray-600 outline-none focus:border-accentColor/50 focus:bg-white/[0.05] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300 ml-1">URL Avatar (Opsional)</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  className="flex-1 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-gray-600 outline-none focus:border-accentColor/50 focus:bg-white/[0.05] transition-all"
                />
              </div>
              {formData.avatar_url && (
                <div className="mt-2 w-16 h-16 rounded-full overflow-hidden border border-white/[0.08] bg-black/40 flex items-center justify-center mx-auto">
                  <img src={formData.avatar_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] bg-white/[0.02] shrink-0 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} disabled={isSaving} className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-all disabled:opacity-50">
            Batal
          </button>
          <button type="submit" form="guest-form" disabled={isSaving || !formData.name} className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-accentColor rounded-xl hover:brightness-[0.85] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {isSaving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  )
}
