"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

export async function saveWorkExperienceOnServer(
  row: any,
  mode: "create" | "edit",
  idToUpdate?: string
) {
  if (mode === "create") {
    const { data, error } = await supabaseAdmin.from("work_experiences").insert(row).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal membuat riwayat kerja di database." }
  } else {
    // Update audit timestamp
    row.updated_at = new Date().toISOString()
    const { data, error } = await supabaseAdmin.from("work_experiences").update(row).eq("id", idToUpdate).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal mengubah riwayat kerja di database." }
  }

  return { success: true }
}

export async function deleteWorkExperienceOnServer(id: string) {
  const { data, error } = await supabaseAdmin.from("work_experiences").delete().eq("id", id).select()
  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) return { success: false, error: "Data riwayat kerja gagal dihapus." }
  
  return { success: true }
}

export async function bulkDeleteWorkExperiencesOnServer(ids: string[]) {
  const { data, error } = await supabaseAdmin.from("work_experiences").delete().in("id", ids).select();
  
  if (error) return { success: false, error: error.message };

  return { success: true, count: data?.length || 0 };
}
