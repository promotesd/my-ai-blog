"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

export async function saveCertificateOnServer(
  row: any,
  mode: "create" | "edit",
  idToUpdate?: string
) {
  if (mode === "create") {
    const { data, error } = await supabaseAdmin.from("certificates").insert(row).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal membuat sertifikat di database." }
  } else {
    const { data, error } = await supabaseAdmin.from("certificates").update(row).eq("id", idToUpdate).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal mengubah sertifikat di database." }
  }

  return { success: true }
}

export async function deleteCertificateOnServer(id: string, storageBucket?: string, filePaths?: string[]) {
  // Hapus file di Storage jika ada (Thumbnail, PDF, Logo)
  if (storageBucket && filePaths && filePaths.length > 0) {
    const validPaths = filePaths.filter(Boolean)
    if (validPaths.length > 0) {
      await supabaseAdmin.storage.from(storageBucket).remove(validPaths)
    }
  }
  
  const { data, error } = await supabaseAdmin.from("certificates").delete().eq("id", id).select()
  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) return { success: false, error: "Data sertifikat gagal dihapus." }
  
  return { success: true }
}

// FUNGSI BARU: Hapus Banyak Data Sekaligus (Bulk Delete)
export async function bulkDeleteCertificatesOnServer(items: { id: string, storageBucket: string, filePaths: string[] }[]) {
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
  const { data, error } = await supabaseAdmin.from("certificates").delete().in("id", ids).select();
  
  if (error) return { success: false, error: error.message };

  return { success: true, count: data?.length || 0 };
}
