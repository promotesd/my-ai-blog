"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
})

export async function saveMobileGameOnServer(
    row: any,
    mode: "create" | "edit",
    idToUpdate?: number
) {
    if (mode === "create") {
        // ID otomatis dari database (bigserial)
        const { data, error } = await supabaseAdmin.from("mobile_games").insert(row).select()
        if (error) return { success: false, error: error.message }
        if (!data || data.length === 0) return { success: false, error: "Gagal menyimpan game ke database." }
    } else {
        row.updated_at = new Date().toISOString()
        const { data, error } = await supabaseAdmin.from("mobile_games").update(row).eq("id", idToUpdate).select()
        if (error) return { success: false, error: error.message }
        if (!data || data.length === 0) return { success: false, error: "Gagal mengubah data game di database." }
    }

    return { success: true }
}

export async function deleteMobileGameOnServer(id: number, storageBucket?: string, filePath?: string) {
    // Hapus gambar cover jika ada
    if (storageBucket && filePath) {
        await supabaseAdmin.storage.from(storageBucket).remove([filePath])
    }

    const { data, error } = await supabaseAdmin.from("mobile_games").delete().eq("id", id).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Data game gagal dihapus." }

    return { success: true }
}

export async function bulkDeleteMobileGamesOnServer(items: { id: number, storageBucket: string, filePath: string | null }[]) {
    const bucketMap: Record<string, string[]> = {};

    items.forEach(item => {
        if (item.storageBucket && item.filePath) {
            if (!bucketMap[item.storageBucket]) bucketMap[item.storageBucket] = [];
            bucketMap[item.storageBucket].push(item.filePath);
        }
    });

    // Eksekusi hapus file massal di storage
    for (const [bucket, paths] of Object.entries(bucketMap)) {
        if (paths.length > 0) {
            await supabaseAdmin.storage.from(bucket).remove(paths);
        }
    }

    // Hapus baris dari database
    const ids = items.map(i => i.id);
    const { data, error } = await supabaseAdmin.from("mobile_games").delete().in("id", ids).select();

    if (error) return { success: false, error: error.message };

    return { success: true, count: data?.length || 0 };
}
