"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

export async function saveTimelineOnServer(
  row: any,
  mode: "create" | "edit",
  idToUpdate?: number
) {
  if (mode === "create") {
    // ID di-generate otomatis oleh database (IDENTITY)
    const { data, error } = await supabaseAdmin.from("timelines").insert(row).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal membuat timeline di database." }
  } else {
    const { data, error } = await supabaseAdmin.from("timelines").update(row).eq("id", idToUpdate).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal mengubah timeline di database." }
  }

  return { success: true }
}

export async function deleteTimelineOnServer(id: number, storageBucket?: string, filePaths?: string[]) {
  // Hapus foto di Storage jika ada
  if (storageBucket && filePaths && filePaths.length > 0) {
    const validPaths = filePaths.filter(Boolean)
    if (validPaths.length > 0) {
      await supabaseAdmin.storage.from(storageBucket).remove(validPaths)
    }
  }
  
  const { data, error } = await supabaseAdmin.from("timelines").delete().eq("id", id).select()
  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) return { success: false, error: "Data timeline gagal dihapus." }
  
  return { success: true }
}

export async function bulkDeleteTimelinesOnServer(items: { id: number, storageBucket: string, filePaths: string[] }[]) {
  const bucketMap: Record<string, string[]> = {};
  
  items.forEach(item => {
    if (item.storageBucket && item.filePaths) {
      if (!bucketMap[item.storageBucket]) bucketMap[item.storageBucket] = [];
      const validPaths = item.filePaths.filter(Boolean)
      bucketMap[item.storageBucket].push(...validPaths);
    }
  });

  // Hapus semua file terkait secara massal dari bucket
  for (const [bucket, paths] of Object.entries(bucketMap)) {
    if (paths.length > 0) {
      await supabaseAdmin.storage.from(bucket).remove(paths);
    }
  }

  // Hapus rows dari database
  const ids = items.map(i => i.id);
  const { data, error } = await supabaseAdmin.from("timelines").delete().in("id", ids).select();
  
  if (error) return { success: false, error: error.message };

  return { success: true, count: data?.length || 0 };
}
