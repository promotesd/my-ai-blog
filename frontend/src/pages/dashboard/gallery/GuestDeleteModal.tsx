"use client"

import React, { useState } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"

interface GuestDeleteModalProps {
  isOpen: boolean
  guestName: string
  photoCount: number
  albumCount: number
  onClose: () => void
  onConfirm: () => Promise<void>
}

export default function GuestDeleteModal({ isOpen, guestName, photoCount, albumCount, onClose, onConfirm }: GuestDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={() => !isDeleting && onClose()} />
      <div className="relative w-full max-w-md bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="p-6 text-center space-y-4 mt-2">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/20">
            <AlertCircle size={26} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-1.5">
              Hapus Tamu {guestName}?
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-3">
              Apakah Anda yakin ingin menghapus tamu ini permanen? 
            </p>
            {(photoCount > 0 || albumCount > 0) && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl mt-3 text-left">
                <p className="text-xs text-red-400 font-medium">⚠️ Peringatan Kritis:</p>
                <p className="text-xs text-gray-300 mt-1">
                  Tamu ini memiliki <b className="text-white">{photoCount} foto</b> dan <b className="text-white">{albumCount} album</b>. 
                  Menghapus tamu ini <b>akan ikut menghapus semua foto dan albumnya secara permanen</b> dari database dan storage.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 bg-white/[0.02] border-t border-white/[0.06]">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 text-sm font-medium text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-all disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-red-500/90 hover:bg-red-500 rounded-xl transition-all disabled:opacity-50"
          >
            {isDeleting ? <RefreshCw size={16} className="animate-spin" /> : "Ya, Hapus Tamu"}
          </button>
        </div>
      </div>
    </div>
  )
}
