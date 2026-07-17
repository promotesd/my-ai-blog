"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

export async function saveDiaryOnServer(row: any, mode: "create" | "edit", idToUpdate?: string) {
  if (mode === "create") {
    const { data, error } = await supabaseAdmin.from("diaries").insert(row).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "无法在数据库中创建日记。" }
    return { success: true, data }
  } else {
    const { data, error } = await supabaseAdmin.from("diaries").update(row).eq("id", idToUpdate).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "无法在数据库中更新日记。" }
    return { success: true, data }
  }
}

export async function deleteDiaryOnServer(id: string) {
  const { data, error } = await supabaseAdmin.from("diaries").delete().eq("id", id).select()
  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) return { success: false, error: "无法从数据库中删除日记。" }
  
  return { success: true }
}

export async function bulkDeleteDiariesOnServer(ids: string[]) {
  const { data, error } = await supabaseAdmin.from("diaries").delete().in("id", ids).select()
  
  if (error) return { success: false, error: error.message }

  return { success: true, count: data?.length || 0 }
}
