"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
})

export async function saveBookOnServer(
    row: any,
    mode: "create" | "edit",
    idToUpdate?: number
) {
    if (mode === "create") {
        const { data, error } = await supabaseAdmin.from("books").insert(row).select()
        if (error) return { success: false, error: error.message }
        if (!data || data.length === 0) return { success: false, error: "Gagal menyimpan buku ke database." }
    } else {
        row.updated_at = new Date().toISOString()
        const { data, error } = await supabaseAdmin.from("books").update(row).eq("id", idToUpdate).select()
        if (error) return { success: false, error: error.message }
        if (!data || data.length === 0) return { success: false, error: "Gagal mengubah data buku di database." }
    }

    return { success: true }
}

export async function deleteBookOnServer(id: number) {
    const { data, error } = await supabaseAdmin.from("books").delete().eq("id", id).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Data buku gagal dihapus." }

    return { success: true }
}

export async function bulkDeleteBooksOnServer(ids: number[]) {
    const { data, error } = await supabaseAdmin.from("books").delete().in("id", ids).select();

    if (error) return { success: false, error: error.message };

    return { success: true, count: data?.length || 0 };
}
