"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

export async function saveDeployedProjectOnServer(
  row: any,
  mode: "create" | "edit",
  idToUpdate?: string
) {
  if (mode === "create") {
    const { data, error } = await supabaseAdmin.from("deployed_projects").insert(row).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal membuat data project." }
  } else {
    // Pastikan updated_at terupdate
    row.updated_at = new Date().toISOString()
    const { data, error } = await supabaseAdmin.from("deployed_projects").update(row).eq("id", idToUpdate).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal mengubah data project." }
  }

  return { success: true }
}

export async function deleteDeployedProjectOnServer(id: string, storageBucket: string, filePaths: string[]) {
  // Hapus semua file dari Storage (Thumbnail, Gallery, APK)
  const validPaths = filePaths.filter(Boolean)
  if (validPaths.length > 0) {
    await supabaseAdmin.storage.from(storageBucket).remove(validPaths)
  }
  
  const { data, error } = await supabaseAdmin.from("deployed_projects").delete().eq("id", id).select()
  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) return { success: false, error: "Data project gagal dihapus." }
  
  return { success: true }
}

export async function bulkDeleteDeployedProjectsOnServer(items: { id: string, storageBucket: string, filePaths: string[] }[]) {
  const bucketMap: Record<string, string[]> = {};
  
  items.forEach(item => {
    if (item.storageBucket && item.filePaths) {
      if (!bucketMap[item.storageBucket]) bucketMap[item.storageBucket] = [];
      const validPaths = item.filePaths.filter(Boolean)
      bucketMap[item.storageBucket].push(...validPaths);
    }
  });

  // Eksekusi hapus massal file di storage
  for (const [bucket, paths] of Object.entries(bucketMap)) {
    if (paths.length > 0) {
      await supabaseAdmin.storage.from(bucket).remove(paths);
    }
  }

  // Hapus rows dari database
  const ids = items.map(i => i.id);
  const { data, error } = await supabaseAdmin.from("deployed_projects").delete().in("id", ids).select();
  
  if (error) return { success: false, error: error.message };

  return { success: true, count: data?.length || 0 };
}
