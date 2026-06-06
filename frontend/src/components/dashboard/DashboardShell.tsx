"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { SidebarProvider, useSidebar } from "./SidebarContext"
import DashboardSidebar from "./DashboardSidebar"
import DashboardNotificationBell, { type DbNotification } from "./DashboardNotificationBell"
import ManageNotificationModal from "./ManageNotificationModal"

function ShellInner({ children }: { children: React.ReactNode }) {
  const { isOpen, close } = useSidebar()
  const [manageModalOpen, setManageModalOpen] = useState(false)
  
  const [notifications, setNotifications] = useState<DbNotification[]>([])
  const [loading, setLoading] = useState(true)

  // ── Fetch initial notifications ──────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (!error && data) {
      setNotifications(data as DbNotification[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // ── Supabase Realtime subscription ───────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("notifications-realtime-shell")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload: { new: DbNotification }) => {
          setNotifications((prev) => [payload.new as DbNotification, ...prev])
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        (payload: { new: DbNotification }) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === payload.new.id ? (payload.new as DbNotification) : n))
          )
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications" },
        () => {
          // Could be more specific, but for now a simple refresh is ok
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchNotifications])


  return (
    <div className="dark flex h-screen bg-[#070e0e] text-gray-100">
      <ManageNotificationModal 
        isOpen={manageModalOpen} 
        onClose={() => setManageModalOpen(false)}
        notifications={notifications}
        onRefresh={fetchNotifications}
      />

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={close}
        />
      )}

      <DashboardSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* ── Global Top Bar with Notification Bell ── */}
        <div className="shrink-0 flex items-center justify-end px-4 md:px-6 py-2.5 border-b border-white/[0.05] bg-[#070e0e]/80 backdrop-blur-sm relative z-20">
          <DashboardNotificationBell 
            onManageClick={() => setManageModalOpen(true)}
            notifications={notifications}
            loading={loading}
            onRefresh={fetchNotifications}
          />
        </div>

        <main className="flex-1 overflow-y-auto min-w-0 scrollbar-none">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ShellInner>{children}</ShellInner>
    </SidebarProvider>
  )
}
