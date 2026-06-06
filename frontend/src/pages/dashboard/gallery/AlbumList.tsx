"use client"

import React from "react"
import { Edit2, Trash2, Folder, Image as ImageIcon, Tag, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface Album {
  name: string
  slug: string
  description?: string
  cover_url?: string
  category?: string
  period?: string
  created_at?: string
  photo_count?: number
}

interface AlbumListProps {
  albums: Album[]
  photos: any[]
  loading: boolean
  searchAlbum: string
  selectedIds: string[]
  onToggle: (slug: string) => void
  onToggleAll: (slugs: string[]) => void
  onEdit: (album: Album) => void
  onDelete: (album: Album) => void
}

function getPhotoCountForAlbum(slug: string, photos: any[]) {
  return photos.filter(p => p.album_slug === slug).length
}

function formatDateShort(dateString?: string) {
  if (!dateString) return ""
  return new Date(dateString).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
}

export default function AlbumList({ albums, photos, loading, searchAlbum, selectedIds, onToggle, onToggleAll, onEdit, onDelete }: AlbumListProps) {
  const filtered = albums.filter(a => {
    const q = searchAlbum.toLowerCase()
    return !q || a.name.toLowerCase().includes(q) || (a.category || "").toLowerCase().includes(q) || (a.slug || "").toLowerCase().includes(q)
  })

  const filteredIds = filtered.map(a => a.slug)
  const allSelected = filteredIds.length > 0 && filteredIds.every(slug => selectedIds.includes(slug))
  const someSelected = filteredIds.some(slug => selectedIds.includes(slug)) && !allSelected

  function handleToggleAll() {
    if (allSelected) {
      // Deselect all filtered
      onToggleAll(selectedIds.filter(slug => !filteredIds.includes(slug)))
    } else {
      // Select all filtered (merge with existing)
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
        <Folder size={28} className="opacity-30" />
        <p className="text-sm">{searchAlbum ? "Tidak ada album yang cocok." : "Belum ada album. Buat album pertama!"}</p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((album, idx) => {
          const count = getPhotoCountForAlbum(album.slug, photos)
          const isSelected = selectedIds.includes(album.slug)
          return (
            <div key={album.slug} className={cn(
              "rounded-2xl border p-4 space-y-3 transition-colors",
              isSelected ? "border-accentColor/40 bg-accentColor/5" : "border-white/[0.07] bg-white/[0.02]"
            )}>
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div className="pt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(album.slug)}
                    className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]"
                  />
                </div>
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/[0.08] shrink-0 bg-black/40">
                  {album.cover_url
                    ? <img src={album.cover_url} alt={album.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Folder size={18} className="text-gray-600" /></div>
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-200 leading-snug">{album.name}</p>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">/{album.slug}</p>
                  {album.description && (
                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{album.description}</p>
                  )}
                </div>
                <span className="text-xs text-gray-600 tabular-nums shrink-0">#{idx + 1}</span>
              </div>

              <div className="flex flex-wrap gap-1.5 pl-7">
                {album.category && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-accentColor/10 border border-accentColor/20 text-accentColor">
                    <Tag size={9} /> {album.category}
                  </span>
                )}
                {album.period && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-gray-400">
                    <Calendar size={9} /> {album.period}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <ImageIcon size={9} /> {count} foto
                </span>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-white/[0.06]">
                <button onClick={() => onEdit(album)} className="p-2 rounded-xl text-gray-500 hover:text-accentColor hover:bg-accentColor/10 border border-transparent hover:border-accentColor/20 transition-all">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => onDelete(album)} className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all">
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
          <table className="w-full min-w-[800px]">
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
                <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 min-w-[260px]">Album</th>
                <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-36">Kategori</th>
                <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-24">Periode</th>
                <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-24">Foto</th>
                <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-3.5 w-32">Dibuat</th>
                <th className="text-right text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-5 py-3.5 w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((album, idx) => {
                const count = getPhotoCountForAlbum(album.slug, photos)
                const isSelected = selectedIds.includes(album.slug)
                return (
                  <tr key={album.slug} className={cn("group transition-colors", isSelected ? "bg-accentColor/5" : "hover:bg-white/[0.025]")}>
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggle(album.slug)}
                        className="w-4 h-4 rounded cursor-pointer accent-accentColor bg-white/[0.05] border-white/[0.1]"
                      />
                    </td>
                    <td className="px-2 py-3.5">
                      <span className="text-xs text-gray-600 tabular-nums">{idx + 1}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-9 rounded-lg overflow-hidden shrink-0 border border-white/[0.08] bg-black/40">
                          {album.cover_url
                            ? <img src={album.cover_url} alt={album.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Folder size={13} className="text-gray-600" /></div>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-gray-200 line-clamp-1">{album.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5 truncate">/{album.slug}</p>
                          {album.description && (
                            <p className="text-[10px] text-gray-600 mt-0.5 line-clamp-1">{album.description}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {album.category ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-accentColor/10 text-accentColor border border-accentColor/20">
                          <Tag size={9} /> {album.category}
                        </span>
                      ) : <span className="text-xs text-gray-600">—</span>}
                    </td>

                    <td className="px-4 py-3.5">
                      {album.period ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                          <Calendar size={10} className="text-gray-500" /> {album.period}
                        </span>
                      ) : <span className="text-xs text-gray-600">—</span>}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border",
                        count > 0
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-white/[0.04] text-gray-500 border-white/[0.08]"
                      )}>
                        <ImageIcon size={9} /> {count}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-[11px] text-gray-500">{formatDateShort(album.created_at)}</span>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => onEdit(album)} title="Edit Album" className="p-2 rounded-xl text-gray-500 hover:text-accentColor hover:bg-accentColor/10 border border-transparent hover:border-accentColor/20 transition-all">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => onDelete(album)} title="Hapus Album" className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all">
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
            {searchAlbum ? `dari ${albums.length} ` : ""}album
            {selectedIds.length > 0 && (
              <span className="ml-2 text-accentColor font-medium">· {selectedIds.length} dipilih</span>
            )}
          </p>
        </div>
      </div>
    </>
  )
}
