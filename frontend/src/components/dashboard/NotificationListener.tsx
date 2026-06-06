"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useNotificationStore, Notification } from "@/stores/NotificationStore"

export default function NotificationListener() {
  const { fetchNotifications, addNotification } = useNotificationStore()

  useEffect(() => {
    // 1. Fetch initial notifications on mount
    fetchNotifications()

    // 2. Set up Supabase real-time subscription
    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          if (payload.new) {
            addNotification(payload.new as Notification)
          }
        }
      )
      .subscribe()

    // 3. Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchNotifications, addNotification])

  return null // This component does not render anything
}
