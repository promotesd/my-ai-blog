"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
})

export async function updateGuestbookOnServer(
    id: string,
    row: any
) {
    row.updated_at = new Date().toISOString()
    const { data, error } = await supabaseAdmin.from("guestbook").update(row).eq("id", id).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal mengubah data buku tamu di database." }

    return { success: true }
}

export async function toggleGuestbookApproval(id: string, isApproved: boolean) {
    const { data, error } = await supabaseAdmin.from("guestbook").update({ is_approved: isApproved, updated_at: new Date().toISOString() }).eq("id", id).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal mengubah status approval buku tamu." }

    return { success: true }
}

export async function deleteGuestbookOnServer(id: string, storageBucket?: string, filePath?: string) {
    // Hapus gambar avatar jika ada di storage guestbook-avatars
    if (storageBucket && filePath) {
        await supabaseAdmin.storage.from(storageBucket).remove([filePath])
    }

    const { data, error } = await supabaseAdmin.from("guestbook").delete().eq("id", id).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Data buku tamu gagal dihapus." }

    return { success: true }
}

export async function bulkDeleteGuestbookOnServer(items: { id: string, storageBucket: string, filePath: string | null }[]) {
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
    const { data, error } = await supabaseAdmin.from("guestbook").delete().in("id", ids).select();

    if (error) return { success: false, error: error.message };

    return { success: true, count: data?.length || 0 };
}
