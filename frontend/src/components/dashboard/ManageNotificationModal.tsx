"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Bell, X, Trash2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { 
  format, isToday, isYesterday, subDays, 
  isAfter, startOfDay, differenceInHours 
} from "date-fns"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { type DbNotification, TYPE_CONFIG } from "./DashboardNotificationBell"

interface ManageNotificationModalProps {
  isOpen: boolean
  onClose: () => void
  notifications: DbNotification[]
  onRefresh: () => void
}

export default function ManageNotificationModal({ 
  isOpen, 
  onClose, 
  notifications,
  onRefresh 
}: ManageNotificationModalProps) {
  const router = useRouter()
  const [isClearing, setIsClearing] = useState(false)
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  const groupedNotifications = useMemo(() => {
    const now = new Date()
    const today = startOfDay(now)
    const yesterday = startOfDay(subDays(now, 1))
    const threeDaysAgo = startOfDay(subDays(now, 3))
    const oneWeekAgo = startOfDay(subDays(now, 7))
    const oneMonthAgo = startOfDay(subDays(now, 30))

    const groups: Record<string, DbNotification[]> = {
      "Terbaru": [],
      "Hari Ini": [],
      "Kemarin": [],
      "3 Hari Lalu": [],
      "1 Minggu Lalu": [],
      "1 Bulan Lalu": [],
      "Lebih dari 1 Bulan": []
    }

    notifications.forEach(n => {
      const date = new Date(n.created_at)
      const diffHours = differenceInHours(now, date)

      if (diffHours < 1) {
        groups["Terbaru"].push(n)
      } else if (isToday(date)) {
        groups["Hari Ini"].push(n)
      } else if (isYesterday(date)) {
        groups["Kemarin"].push(n)
      } else if (isAfter(date, threeDaysAgo)) {
        groups["3 Hari Lalu"].push(n)
      } else if (isAfter(date, oneWeekAgo)) {
        groups["1 Minggu Lalu"].push(n)
      } else if (isAfter(date, oneMonthAgo)) {
        groups["1 Bulan Lalu"].push(n)
      } else {
        groups["Lebih dari 1 Bulan"].push(n)
      }
    })

    // Filter out empty groups
    return Object.entries(groups).filter(([_, items]) => items.length > 0)
  }, [notifications])

  async function handleNotificationClick(notif: DbNotification) {
    onClose()
    if (!notif.is_read) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notif.id)
      onRefresh()
    }
    router.push(notif.target_url)
  }

  async function handleClearAll() {
    setIsClearing(true)
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000") // Dummy to ensure all matching are deleted

      if (!error) {
        onRefresh()
        setShowConfirmClear(false)
      }
    } finally {
      setIsClearing(false)
    }
  }

  if (!isOpen) return null

  const cfg = (type: string) => TYPE_CONFIG[type] ?? {
    icon: <Bell size={14} />,
    color: "text-gray-400",
    bg: "bg-white/[0.04] border-white/[0.08]",
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#070e0e] border border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accentColor/10 border border-accentColor/20 flex items-center justify-center">
              <Bell className="text-accentColor" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-none">Manage Notifications</h2>
              <p className="text-xs text-gray-500 mt-1.5">View and manage all your activity alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button 
                onClick={() => setShowConfirmClear(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 rounded-xl transition-all"
              >
                <Trash2 size={14} />
                <span>Clear All</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-none">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center">
                <Bell size={32} className="text-gray-700" />
              </div>
              <div>
                <p className="text-gray-400 font-medium text-lg">No Notifications Yet</p>
                <p className="text-gray-600 text-sm mt-1 max-w-xs mx-auto">We'll alert you when there's new guest activity or system updates.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedNotifications.map(([group, items]) => (
                <div key={group} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-accentColor bg-accentColor/10 px-2 py-0.5 rounded-md">
                      {group}
                    </span>
                    <div className="h-px flex-1 bg-white/[0.05]" />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {items.map(notif => {
                      const c = cfg(notif.type)
                      return (
                        <button
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={cn(
                            "w-full text-left p-4 rounded-2xl border transition-all duration-200 group flex items-start gap-4",
                            notif.is_read 
                              ? "bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.08]"
                              : "bg-white/[0.03] border-accentColor/20 hover:bg-white/[0.05] hover:border-accentColor/40 shadow-lg shadow-accentColor/5"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 mt-0.5 transition-transform group-hover:scale-110 duration-200", 
                            c.bg, c.color
                          )}>
                            {c.icon}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className={cn(
                                "text-[13px] font-semibold leading-tight line-clamp-1",
                                notif.is_read ? "text-gray-400" : "text-white"
                              )}>
                                {notif.title}
                              </h4>
                              {!notif.is_read && (
                                <span className="w-2 h-2 rounded-full bg-accentColor shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)] shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                              {notif.content}
                            </p>
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                                <Clock size={11} />
                                <span>{format(new Date(notif.created_at), "HH:mm • dd MMM yyyy")}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-accentColor font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                <span>View Details</span>
                                <CheckCircle2 size={11} />
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] bg-white/[0.01] flex items-center justify-between">
          <p className="text-[10px] text-gray-600 font-medium uppercase tracking-tight">
            Showing {notifications.length} notifications total
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/[0.03] border border-white/[0.06]">
              <div className="w-1.5 h-1.5 rounded-full bg-accentColor shadow-[0_0_4px_rgba(var(--accent-rgb),0.8)]" />
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Unread</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/[0.03] border border-white/[0.06]">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Read</span>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {showConfirmClear && (
          <div className="absolute inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-[#0d1a1a] border border-white/[0.1] rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <AlertCircle className="text-red-400" size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Clear All Notifications?</h3>
                  <p className="text-sm text-gray-400 mt-2">This will permanently delete all notifications from your dashboard. This action cannot be undone.</p>
                </div>
                <div className="flex items-center gap-3 w-full mt-2">
                  <button 
                    disabled={isClearing}
                    onClick={() => setShowConfirmClear(false)}
                    className="flex-1 py-3 text-sm font-semibold text-gray-400 bg-white/[0.05] hover:bg-white/[0.1] rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={isClearing}
                    onClick={handleClearAll}
                    className="flex-1 py-3 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {isClearing ? <Clock className="animate-spin" size={16} /> : "Yes, Clear All"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
