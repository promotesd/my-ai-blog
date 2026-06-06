"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

export async function saveSkillOnServer(
  row: any,
  mode: "create" | "edit",
  idToUpdate?: string
) {
  if (mode === "create") {
    const { data, error } = await supabaseAdmin.from("skills").insert(row).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal membuat skill di database." }
  } else {
    const { data, error } = await supabaseAdmin.from("skills").update(row).eq("id", idToUpdate).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal mengubah skill di database." }
  }

  return { success: true }
}

export async function deleteSkillOnServer(id: string) {
  const { data, error } = await supabaseAdmin.from("skills").delete().eq("id", id).select()
  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) return { success: false, error: "Data skill gagal dihapus." }
  
  return { success: true }
}

// FUNGSI BARU: Hapus Banyak Data Sekaligus (Bulk Delete)
export async function bulkDeleteSkillsOnServer(ids: string[]) {
  const { data, error } = await supabaseAdmin.from("skills").delete().in("id", ids).select();
  
  if (error) return { success: false, error: error.message };

  return { success: true, count: data?.length || 0 };
}
