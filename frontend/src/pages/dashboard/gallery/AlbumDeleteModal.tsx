"use client"

import { X, AlertTriangle, Loader2, Folder } from "lucide-react"
import { useState } from "react"

interface AlbumDeleteModalProps {
  isOpen: boolean
  albumName: string
  photoCount?: number
  onClose: () => void
  onConfirm: () => Promise<void>
}

export default function AlbumDeleteModal({ isOpen, albumName, photoCount = 0, onClose, onConfirm }: AlbumDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  if (!isOpen) return null

  async function handleConfirm() {
    setIsDeleting(true)
    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={!isDeleting ? onClose : undefined} />
      
      <div className="relative w-full max-w-md bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center space-y-4 mt-2">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/20">
            <AlertTriangle size={26} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-1.5">Hapus Album Ini?</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Apakah Anda yakin ingin menghapus album{" "}
              <span className="text-gray-200 font-medium">"{albumName}"</span>?
            </p>
            {photoCount > 0 && (
              <div className="mt-3 flex items-start gap-2 text-left bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
                <Folder size={14} className="text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-300 leading-relaxed">
                  <span className="font-semibold">{photoCount} foto</span> di album ini akan tetap ada, namun tidak lagi terhubung ke album manapun.
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3 px-6 py-4 bg-white/[0.02] border-t border-white/[0.06]">
          <button onClick={onClose} disabled={isDeleting} className="flex-1 py-2.5 text-sm font-medium text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-all disabled:opacity-50">
            Batal
          </button>
          <button onClick={handleConfirm} disabled={isDeleting} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-red-500/90 hover:bg-red-500 rounded-xl transition-all disabled:opacity-50">
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : "Ya, Hapus Album"}
          </button>
        </div>
      </div>
    </div>
  )
}
