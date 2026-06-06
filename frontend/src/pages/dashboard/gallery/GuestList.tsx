"use client"

import React from "react"
import { Edit2, Trash2, User, ImageIcon, Folder, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { GalleryGuest } from "@/types/gallery"

interface GuestListProps {
  guests: GalleryGuest[]
  loading: boolean
  searchGuest: string
  selectedIds: number[]
  onToggle: (id: number) => void
  onToggleAll: (ids: number[]) => void
  onEdit: (guest: GalleryGuest) => void
  onDelete: (guest: GalleryGuest) => void
}

function formatDateShort(dateString?: string) {
  if (!dateString) return ""
  return new Date(dateString).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
}

export default function GuestList({
  guests,
  loading,
  searchGuest,
  selectedIds,
  onToggle,
  onToggleAll,
  onEdit,
  onDelete
}: GuestListProps) {
  const filtered = guests.filter(g => {
    const q = searchGuest.toLowerCase()
    return !q || g.name.toLowerCase().includes(q)
  })

  const filteredIds = filtered.map(g => g.id)
  const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.includes(id))
  const someSelected = filteredIds.some(id => selectedIds.includes(id)) && !allSelected

  function handleToggleAll() {
    if (allSelected) {
      onToggleAll(selectedIds.filter(id => !filteredIds.includes(id)))
    } else {
      const merged = Array.from(new Set([...selectedIds, ...filteredIds]))
      onToggleAll(merged)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
        ))}
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-gray-500">
        <User size={28} className="opacity-30" />
        <p className="text-sm">{searchGuest ? "Tidak ada nama tamu yang cocok." : "Belum ada tamu yang terdaftar."}</p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((guest, idx) => {
          const isSelected = selectedIds.includes(guest.id)
          return (
            <div key={guest.id} className={cn(
              "rounded-2xl border p-4 space-y-3 transition-colors",
              isSelected ? "border-accentColor/40 bg-accentColor/5" : "border-white/[0.07] bg-white/[0.02]"
            )}>
              <div className="flex items-start gap-3">
                <div className="pt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(guest.id)}
                    className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]"
                  />
                </div>
                <div className="w-14 h-14 rounded-full overflow-hidden border border-white/[0.08] shrink-0 bg-black/40">
                  {guest.avatarUrl
                    ? <img src={guest.avatarUrl} alt={guest.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><User size={20} className="text-gray-600" /></div>
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-200 leading-snug truncate">{guest.name}</p>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">ID: {guest.id}</p>
                </div>
                <span className="text-xs text-gray-600 tabular-nums shrink-0">#{idx + 1}</span>
              </div>

              <div className="flex flex-wrap gap-1.5 pl-7">
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <ImageIcon size={9} /> {guest.photoCount} foto
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Folder size={9} /> {guest.albumCount} album
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-gray-400">
                  <Calendar size={9} /> {formatDateShort(guest.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-white/[0.06]">
                <button onClick={() => onEdit(guest)} className="p-2 rounded-xl text-gray-500 hover:text-accentColor hover:bg-accentColor/10 border border-transparent hover:border-accentColor/20 transition-all">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => onDelete(guest)} className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-2xl border border-white/[0.07] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-white/[0.04] border-b border-white/[0.06]">
                <th className="px-4 py-3.5 w-12 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected }}
                    onChange={handleToggleAll}
                    className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]"
                  />
                </th>
                <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-2 py-3.5 w-8">#</th>
                <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 min-w-[200px]">Nama Tamu</th>
                <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-24">Foto</th>
                <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-24">Album</th>
                <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-32">Terdaftar</th>
                <th className="text-right text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-5 py-3.5 w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((guest, idx) => {
                const isSelected = selectedIds.includes(guest.id)
                return (
                  <tr key={guest.id} className={cn("group transition-colors", isSelected ? "bg-accentColor/5" : "hover:bg-white/[0.025]")}>
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggle(guest.id)}
                        className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]"
                      />
                    </td>
                    <td className="px-2 py-3.5">
                      <span className="text-xs text-gray-600 tabular-nums">{idx + 1}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/[0.08] bg-black/40">
                          {guest.avatarUrl
                            ? <img src={guest.avatarUrl} alt={guest.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><User size={14} className="text-gray-600" /></div>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-gray-200 truncate">{guest.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5 truncate">ID: {guest.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border",
                        guest.photoCount > 0
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-white/[0.04] text-gray-500 border-white/[0.08]"
                      )}>
                        <ImageIcon size={9} /> {guest.photoCount}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border",
                        guest.albumCount > 0
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-white/[0.04] text-gray-500 border-white/[0.08]"
                      )}>
                        <Folder size={9} /> {guest.albumCount}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-[11px] text-gray-500">{formatDateShort(guest.createdAt)}</span>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => onEdit(guest)} title="Edit Guest" className="p-2 rounded-xl text-gray-500 hover:text-accentColor hover:bg-accentColor/10 border border-transparent hover:border-accentColor/20 transition-all">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => onDelete(guest)} title="Hapus Guest" className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3.5 border-t border-white/[0.06] bg-white/[0.02]">
          <p className="text-xs text-gray-500">
            Menampilkan <span className="text-gray-300 font-medium">{filtered.length}</span>{" "}
            {searchGuest ? `dari ${guests.length} ` : ""}tamu
            {selectedIds.length > 0 && (
              <span className="ml-2 text-accentColor font-medium">· {selectedIds.length} dipilih</span>
            )}
          </p>
        </div>
      </div>
    </>
  )
}
