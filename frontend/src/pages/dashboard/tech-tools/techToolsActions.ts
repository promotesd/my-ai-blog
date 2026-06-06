"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

export async function saveTechToolOnServer(
  row: any,
  mode: "create" | "edit",
  idToUpdate?: number
) {
  if (mode === "create") {
    // ID otomatis di-generate (IDENTITY), jadi tidak perlu dikirim
    const { data, error } = await supabaseAdmin.from("tech_tools").insert(row).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal membuat tools di database." }
  } else {
    const { data, error } = await supabaseAdmin.from("tech_tools").update(row).eq("id", idToUpdate).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal mengubah tools di database." }
  }

  return { success: true }
}

export async function deleteTechToolOnServer(id: number) {
  const { data, error } = await supabaseAdmin.from("tech_tools").delete().eq("id", id).select()
  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) return { success: false, error: "Data tools gagal dihapus." }
  
  return { success: true }
}

export async function bulkDeleteTechToolsOnServer(ids: number[]) {
  const { data, error } = await supabaseAdmin.from("tech_tools").delete().in("id", ids).select();
  
  if (error) return { success: false, error: error.message };

  return { success: true, count: data?.length || 0 };
}
