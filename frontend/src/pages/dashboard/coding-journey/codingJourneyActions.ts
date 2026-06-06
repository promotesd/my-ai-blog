"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

export async function saveCodingJourneyOnServer(
  row: any,
  mode: "create" | "edit",
  idToUpdate?: string
) {
  if (mode === "create") {
    const { data, error } = await supabaseAdmin.from("coding_journey").insert(row).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal membuat milestone di database." }
  } else {
    // Pastikan updated_at terupdate
    row.updated_at = new Date().toISOString()
    const { data, error } = await supabaseAdmin.from("coding_journey").update(row).eq("id", idToUpdate).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal mengubah milestone di database." }
  }

  return { success: true }
}

export async function deleteCodingJourneyOnServer(id: string) {
  const { data, error } = await supabaseAdmin.from("coding_journey").delete().eq("id", id).select()
  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) return { success: false, error: "Data milestone gagal dihapus." }
  
  return { success: true }
}

// Hapus Banyak Data Sekaligus (Bulk Delete)
export async function bulkDeleteCodingJourneyOnServer(ids: string[]) {
  const { data, error } = await supabaseAdmin.from("coding_journey").delete().in("id", ids).select();
  
  if (error) return { success: false, error: error.message };

  return { success: true, count: data?.length || 0 };
}
