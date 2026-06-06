"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Service Role Key mengizinkan backend Next.js untuk bypass RLS dengan aman
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

export async function saveBlogOnServer(row: any, mode: "create" | "edit", idToUpdate?: string) {
  if (mode === "create") {
    const { data, error } = await supabaseAdmin.from("blogs").insert(row).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal membuat blog di database." }
    return { success: true, data }
  } else {
    const { data, error } = await supabaseAdmin.from("blogs").update(row).eq("id", idToUpdate).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal mengubah blog di database." }
    return { success: true, data }
  }
}

export async function deleteBlogOnServer(id: string, storageBucket?: string, filePath?: string) {
  if (storageBucket && filePath) {
    await supabaseAdmin.storage.from(storageBucket).remove([filePath])
  }
  
  const { data, error } = await supabaseAdmin.from("blogs").delete().eq("id", id).select()
  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) return { success: false, error: "Data gagal dihapus di database." }
  
  return { success: true }
}

// FUNGSI BARU: Hapus Banyak Data Sekaligus (Bulk Delete)
export async function bulkDeleteBlogsOnServer(items: { id: string, storageBucket?: string, filePath?: string }[]) {
  // 1. Kumpulkan semua gambar yang harus dihapus (dikelompokkan per bucket)
  const bucketMap: Record<string, string[]> = {};
  items.forEach(item => {
    if (item.storageBucket && item.filePath) {
      if (!bucketMap[item.storageBucket]) bucketMap[item.storageBucket] = [];
      bucketMap[item.storageBucket].push(item.filePath);
    }
  });

  // Hapus semua gambar dari Supabase Storage
  for (const [bucket, paths] of Object.entries(bucketMap)) {
    if (paths.length > 0) {
      await supabaseAdmin.storage.from(bucket).remove(paths);
    }
  }

  // 2. Hapus semua baris data dari Database
  const ids = items.map(i => i.id);
  const { data, error } = await supabaseAdmin.from("blogs").delete().in("id", ids).select();
  
  if (error) return { success: false, error: error.message };

  return { success: true, count: data?.length || 0 };
}
