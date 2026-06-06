"use client"

import { useState } from "react"
import { Bell, Loader2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useNotificationStore, Notification } from "@/stores/NotificationStore"
import { useRouter } from "next/navigation"
import TimeAgo from "react-timeago"

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore()

  const handleNotificationClick = (notification: Notification) => {
    // 1. Mark as read in the store and DB
    if (!notification.is_read) {
      markAsRead(notification.id)
    }

    // 2. Navigate to the target URL
    router.push(notification.target_url)

    // 3. Close the popover
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label="Open notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accentColor opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-accentColor text-white text-[10px] items-center justify-center">
                {unreadCount}
              </span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-md">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="link" size="sm" onClick={markAllAsRead} className="h-auto p-0">
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">
              You have no new notifications.
            </p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "flex items-start gap-3 p-3 border-b border-gray-100 dark:border-gray-800",
                  "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                  !notification.is_read && "bg-accentColor/5 dark:bg-accentColor/10"
                )}
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full mt-1.5 shrink-0",
                    notification.is_read ? "bg-transparent" : "bg-accentColor"
                  )}
                />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{notification.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {notification.content}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                     <TimeAgo date={notification.created_at} />
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-2 text-center border-t border-gray-200 dark:border-gray-700">
          <a href="/dashboard/notifications" className="text-xs text-accentColor hover:underline">
            View all notifications
          </a>
        </div>
      </PopoverContent>
    </Popover>
  )
}
