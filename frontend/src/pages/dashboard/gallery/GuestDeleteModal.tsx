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
              删除访客 {guestName}？
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-3">
              确定要永久删除这位访客吗？
            </p>
            {(photoCount > 0 || albumCount > 0) && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl mt-3 text-left">
                <p className="text-xs text-red-400 font-medium">重要提醒：</p>
                <p className="text-xs text-gray-300 mt-1">
                  该访客拥有 <b className="text-white">{photoCount} 张照片</b>和 <b className="text-white">{albumCount} 个相册</b>。
                  删除该访客时，将同时从数据库和文件存储中<b>永久删除其全部照片和相册</b>。
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
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-red-500/90 hover:bg-red-500 rounded-xl transition-all disabled:opacity-50"
          >
            {isDeleting ? <RefreshCw size={16} className="animate-spin" /> : "确认删除访客"}
          </button>
        </div>
      </div>
    </div>
  )
}
