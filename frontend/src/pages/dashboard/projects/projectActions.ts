"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

export async function saveProjectOnServer(
  row: any,
  isPopular: boolean,
  githubUrls: { label: string; url: string }[],
  mode: "create" | "edit",
  idToUpdate?: string
) {
  let projectId = idToUpdate

  if (mode === "create") {
    const { data, error } = await supabaseAdmin.from("projects").insert(row).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal membuat project di database." }
    projectId = data[0].id
  } else {
    const { data, error } = await supabaseAdmin.from("projects").update(row).eq("id", idToUpdate).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal mengubah project di database." }
  }

  if (!projectId) return { success: false, error: "ID Project tidak ditemukan." }

  // 1. Sinkronisasi status Popular
  if (isPopular) {
    await supabaseAdmin.from("popular_projects").upsert({ project_id: projectId }, { onConflict: 'project_id' })
  } else {
    await supabaseAdmin.from("popular_projects").delete().eq("project_id", projectId)
  }

  // 2. Sinkronisasi GitHub URLs
  await supabaseAdmin.from("project_github_urls").delete().eq("project_id", projectId)
  if (githubUrls && githubUrls.length > 0) {
    const urlInserts = githubUrls.map((g) => ({ 
      project_id: projectId, 
      label: g.label || 'repo', 
      url: g.url 
    }))
    await supabaseAdmin.from("project_github_urls").insert(urlInserts)
  }

  return { success: true }
}

export async function deleteProjectOnServer(id: string, storageBucket?: string, filePath?: string) {
  if (storageBucket && filePath) {
    await supabaseAdmin.storage.from(storageBucket).remove([filePath])
  }
  
  const { data, error } = await supabaseAdmin.from("projects").delete().eq("id", id).select()
  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) return { success: false, error: "Data project gagal dihapus." }
  
  return { success: true }
}

// FUNGSI BARU: Hapus Banyak Data Sekaligus (Bulk Delete)
export async function bulkDeleteProjectsOnServer(items: { id: string, storageBucket?: string, filePath?: string }[]) {
  const bucketMap: Record<string, string[]> = {};
  
  items.forEach(item => {
    if (item.storageBucket && item.filePath) {
      if (!bucketMap[item.storageBucket]) bucketMap[item.storageBucket] = [];
      bucketMap[item.storageBucket].push(item.filePath);
    }
  });

  // Hapus semua gambar thumbnail
  for (const [bucket, paths] of Object.entries(bucketMap)) {
    if (paths.length > 0) {
      await supabaseAdmin.storage.from(bucket).remove(paths);
    }
  }

  // Hapus rows dari database (Relasi child seperti github_urls dan popular_projects 
  // akan otomatis terhapus jika di DB sudah di set ON DELETE CASCADE)
  const ids = items.map(i => i.id);
  const { data, error } = await supabaseAdmin.from("projects").delete().in("id", ids).select();
  
  if (error) return { success: false, error: error.message };

  return { success: true, count: data?.length || 0 };
}
