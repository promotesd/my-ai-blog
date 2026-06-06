"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Bell, X, CheckCheck, MessageSquare, Users, Image, Folder, Clock, Settings2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

export interface DbNotification {
  id: string
  type: string
  title: string
  content: string
  target_url: string
  is_read: boolean
  created_at: string
}

export const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  guestbook_entry:       { icon: <MessageSquare size={14} />, color: "text-purple-400",  bg: "bg-purple-500/10 border-purple-500/20" },
  gallery_guest_register:{ icon: <Users size={14} />,         color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20" },
  gallery_guest_album:   { icon: <Folder size={14} />,        color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  gallery_guest_photo:   { icon: <Image size={14} />,         color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20" },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "baru saja"
  if (mins < 60) return `${mins} mnt lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  return `${Math.floor(hours / 24)} hari lalu`
}

interface Props {
  onManageClick: () => void
  notifications: DbNotification[]
  onRefresh: () => void
  loading: boolean
}

export default function DashboardNotificationBell({ onManageClick, notifications, onRefresh, loading }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  // ── Close on outside click ────────────────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  // ── Mark all as read ─────────────────────────────────────────────────────────
  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (!unreadIds.length) return

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds)
    onRefresh()
  }

  // ── Mark single as read + navigate ───────────────────────────────────────────
  async function handleNotifClick(notif: DbNotification) {
    setOpen(false)

    if (!notif.is_read) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notif.id)
      onRefresh()
    }

    router.push(notif.target_url)
  }

  // ── Clear all read ────────────────────────────────────────────────────────────
  async function clearAllRead() {
    const readIds = notifications.filter((n) => n.is_read).map((n) => n.id)
    if (!readIds.length) return

    await supabase
      .from("notifications")
      .delete()
      .in("id", readIds)
    onRefresh()
  }

  const cfg = (type: string) => TYPE_CONFIG[type] ?? {
    icon: <Bell size={14} />,
    color: "text-gray-400",
    bg: "bg-white/[0.04] border-white/[0.08]",
  }

  return (
    <div className="relative" ref={popoverRef}>
      {/* ── Bell Button ── */}
      <button
        onClick={() => { setOpen((v) => !v); if (!open) markAllRead() }}
        className={cn(
          "relative p-2.5 rounded-xl border transition-all duration-200",
          open
            ? "bg-white/[0.08] border-white/[0.14] text-white"
            : "bg-white/[0.03] border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.12]"
        )}
        title="Notifikasi"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold shadow-lg shadow-red-500/40 animate-in zoom-in-75 duration-200">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown Popover ── */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[380px] max-h-[520px] flex flex-col bg-[#0d1c1c] border border-white/[0.09] rounded-2xl shadow-2xl shadow-black/60 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.07]">
            <div className="flex items-center gap-2">
              <Bell size={13} className="text-accentColor" />
              <p className="text-sm font-semibold text-white">Notifikasi</p>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/25 px-1.5 py-0.5 rounded-full">
                  {unreadCount} baru
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notifications.some((n) => n.is_read) && (
                <button
                  onClick={clearAllRead}
                  className="text-[10px] text-gray-500 hover:text-gray-300 px-2 py-1 rounded-lg hover:bg-white/[0.05] transition-colors"
                  title="Hapus semua yang sudah dibaca"
                >
                  Bersihkan
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] text-accentColor hover:brightness-125 px-2 py-1 rounded-lg hover:bg-accentColor/10 transition-colors flex items-center gap-1"
                  title="Tandai semua sudah dibaca"
                >
                  <CheckCheck size={11} /> Baca semua
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto scrollbar-none">
            {loading ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse border border-white/[0.05]" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                  <Bell size={18} className="text-gray-600" />
                </div>
                <p className="text-sm text-gray-500">Belum ada notifikasi</p>
                <p className="text-xs text-gray-600">Notifikasi akan muncul saat ada input baru dari tamu</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {notifications.map((notif: DbNotification) => {
                  const c = cfg(notif.type)
                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={cn(
                        "w-full text-left rounded-xl p-3 flex items-start gap-3 transition-all duration-150 group",
                        notif.is_read
                          ? "hover:bg-white/[0.04]"
                          : "bg-white/[0.04] hover:bg-white/[0.07]"
                      )}
                    >
                      {/* Type Icon */}
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 mt-0.5", c.bg, c.color)}>
                        {c.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-xs font-semibold leading-tight line-clamp-1", notif.is_read ? "text-gray-400" : "text-white")}>
                            {notif.title}
                          </p>
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-accentColor shrink-0 mt-0.5" />
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 leading-snug line-clamp-2 mt-0.5">
                          {notif.content}
                        </p>
                        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-600">
                          <Clock size={9} />
                          <span>{timeAgo(notif.created_at)}</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-white/[0.07] flex items-center justify-between bg-white/[0.01]">
            <p className="text-[10px] text-gray-600">
              {notifications.length} total notifikasi
            </p>
            <button 
              onClick={() => { onManageClick(); setOpen(false) }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium text-accentColor hover:text-white bg-accentColor/5 hover:bg-accentColor border border-accentColor/10 rounded-lg transition-all"
            >
              <Settings2 size={11} /> Manage
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
