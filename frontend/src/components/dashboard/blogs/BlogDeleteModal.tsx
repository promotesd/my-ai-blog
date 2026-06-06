"use client"

import { useState } from "react"
import { Trash2, Loader2, AlertTriangle, X } from "lucide-react"

interface BlogDeleteModalProps {
  isOpen: boolean
  blogTitle: string
  blogId: string
  onClose: () => void
  onConfirm: () => Promise<void>
}

export default function BlogDeleteModal({
  isOpen,
  blogTitle,
  blogId,
  onClose,
  onConfirm,
}: BlogDeleteModalProps) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-[#0e1c1c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-gray-300 transition-colors"
        >
          <X size={14} />
        </button>

        {/* Content */}
        <div className="p-6 space-y-5 text-center">
          {/* Icon */}
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto">
            <Trash2 size={22} className="text-red-400" />
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-white">Delete Blog Post</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Yakin ingin menghapus
              <br />
              <span className="text-gray-200 font-medium">&quot;{blogTitle}&quot;</span>?
            </p>
            <p className="text-[11px] text-gray-600 font-mono bg-white/[0.03] rounded-lg px-3 py-1.5 inline-block">
              ID: {blogId}
            </p>
          </div>

          {/* Warning */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-left">
            <AlertTriangle size={13} className="text-red-400 shrink-0" />
            <p className="text-xs text-red-400/80">
              Aksi ini tidak dapat dibatalkan. Data akan dihapus permanen dari Supabase.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2.5 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-400 border border-white/[0.08] rounded-xl hover:border-white/20 hover:text-gray-200 transition-all"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              {loading ? "Menghapus..." : "Hapus Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
