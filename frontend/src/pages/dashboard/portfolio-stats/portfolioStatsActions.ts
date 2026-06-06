"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

export async function savePortfolioStatOnServer(
  row: any,
  mode: "create" | "edit",
  idToUpdate?: string
) {
  if (mode === "create") {
    // Pastikan tidak ada data ganda karena ini tabel singleton
    const { count } = await supabaseAdmin.from("portfolio_stats").select("*", { count: "exact", head: true })
    if (count && count >= 1) return { success: false, error: "Hanya diperbolehkan 1 data stat (Singleton). Silakan edit data yang ada." }

    const { data, error } = await supabaseAdmin.from("portfolio_stats").insert(row).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal membuat data stat." }
  } else {
    const { data, error } = await supabaseAdmin.from("portfolio_stats").update(row).eq("id", idToUpdate).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal mengubah data stat." }
  }

  return { success: true }
}

export async function deletePortfolioStatOnServer(id: string) {
  const { data, error } = await supabaseAdmin.from("portfolio_stats").delete().eq("id", id).select()
  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) return { success: false, error: "Data stat gagal dihapus." }
  
  return { success: true }
}
