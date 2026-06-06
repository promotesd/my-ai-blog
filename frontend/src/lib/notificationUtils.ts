import { SupabaseClient } from "@supabase/supabase-js"

export interface NotificationPayload {
  type: string       // e.g. 'guestbook_entry', 'gallery_guest_register', ...
  title: string      // Short title shown in badge
  content: string    // Detail text shown in card
  target_url: string // URL to navigate to + auto-search query
}

/**
 * Insert a notification row into the `notifications` table.
 * Call this from API routes whenever a guest/user submits new data.
 * Failures are non-fatal (logged only).
 */
export async function insertNotification(
  supabaseAdmin: SupabaseClient,
  payload: NotificationPayload
) {
  const { error } = await supabaseAdmin.from("notifications").insert({
    type: payload.type,
    title: payload.title,
    content: payload.content,
    target_url: payload.target_url,
    is_read: false,
  })
  if (error) {
    console.warn("[insertNotification] Failed to insert notification:", error.message)
  }
}
