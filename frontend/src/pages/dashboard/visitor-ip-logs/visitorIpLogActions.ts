"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
})

export async function saveVisitorLogOnServer(
    row: any,
    mode: "create" | "edit",
    idToUpdate?: number
) {
    if (mode === "create") {
        // ID otomatis dari database (BIGSERIAL)
        const { data, error } = await supabaseAdmin.from("visitor_ip_log").insert(row).select()
        if (error) return { success: false, error: error.message }
        if (!data || data.length === 0) return { success: false, error: "Gagal membuat log di database." }
    } else {
        const { data, error } = await supabaseAdmin.from("visitor_ip_log").update(row).eq("id", idToUpdate).select()
        if (error) return { success: false, error: error.message }
        if (!data || data.length === 0) return { success: false, error: "Gagal mengubah log di database." }
    }

    return { success: true }
}

export async function deleteVisitorLogOnServer(id: number) {
    const { data, error } = await supabaseAdmin.from("visitor_ip_log").delete().eq("id", id).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Data log gagal dihapus." }

    return { success: true }
}

export async function bulkDeleteVisitorLogsOnServer(ids: number[]) {
    const { data, error } = await supabaseAdmin.from("visitor_ip_log").delete().in("id", ids).select();

    if (error) return { success: false, error: error.message };

    return { success: true, count: data?.length || 0 };
}
