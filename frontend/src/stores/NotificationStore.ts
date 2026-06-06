import { create } from "zustand"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner" // Assuming 'sonner' for toasts is available

// Match the type from the NotificationBell and database
export type Notification = {
  id: number
  created_at: string
  title: string
  content: string
  target_url: string
  is_read: boolean
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  fetchNotifications: () => Promise<void>
  addNotification: (notification: Notification) => void
  markAsRead: (notificationId: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  clearNotifications: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: true,

  fetchNotifications: async () => {
    try {
      set({ loading: true })
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) {
        throw error
      }

      const unread = data.filter((n) => !n.is_read).length
      set({ notifications: data, unreadCount: unread, loading: false })
    } catch (error: any) {
      console.error("Error fetching notifications:", error)
      toast.error("Failed to load notifications.")
      set({ loading: false })
    }
  },

  addNotification: (newNotification) => {
    // Prevent duplicates from real-time events
    if (get().notifications.some((n) => n.id === newNotification.id)) {
      return
    }
    
    // Add to the top of the list
    const updatedNotifications = [newNotification, ...get().notifications]
    const unread = get().unreadCount + 1

    set({
      notifications: updatedNotifications,
      unreadCount: unread,
    })
    
    toast.info(`🔔 ${newNotification.title}`, {
        description: newNotification.content,
    });
  },

  markAsRead: async (notificationId) => {
    const originalNotifications = get().notifications
    const updatedNotifications = originalNotifications.map((n) =>
      n.id === notificationId ? { ...n, is_read: true } : n
    )
    const unread = get().unreadCount - 1

    set({ notifications: updatedNotifications, unreadCount: unread < 0 ? 0 : unread })

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
      if (error) throw error
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
      toast.error("Failed to update notification.")
      set({ notifications: originalNotifications, unreadCount: get().unreadCount + 1 }) // Revert on failure
    }
  },

  markAllAsRead: async () => {
    const originalNotifications = get().notifications
    set({
      notifications: originalNotifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    })

    try {
        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq('is_read', false); // Only update unread ones

        if (error) throw error;
    } catch (error) {
        console.error("Failed to mark all notifications as read:", error);
        toast.error("Failed to update notifications.");
        set({ notifications: originalNotifications, unreadCount: originalNotifications.filter(n => !n.is_read).length }); // Revert
    }
  },
  
  clearNotifications: () => set({ notifications: [], unreadCount: 0, loading: false }),
}))
