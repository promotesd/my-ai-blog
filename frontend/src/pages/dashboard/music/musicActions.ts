"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
})

export async function saveMusicTrackOnServer(
    row: any,
    albumIds: number[],
    mode: "create" | "edit",
    idToUpdate?: number
) {
    let trackId = idToUpdate;

    if (mode === "create") {
        const { data, error } = await supabaseAdmin.from("music_tracks").insert(row).select()
        if (error) return { success: false, error: error.message }
        if (!data || data.length === 0) return { success: false, error: "Gagal menyimpan lagu ke database." }
        trackId = data[0].id
    } else {
        const { data, error } = await supabaseAdmin.from("music_tracks").update(row).eq("id", idToUpdate).select()
        if (error) return { success: false, error: error.message }
        if (!data || data.length === 0) return { success: false, error: "Gagal mengubah lagu di database." }
    }

    if (!trackId) return { success: false, error: "ID Track tidak ditemukan." }

    // Sinkronisasi Relasi Album (Hapus yang lama, masukkan yang baru)
    await supabaseAdmin.from("custom_album_tracks").delete().eq("track_id", trackId)

    if (albumIds && albumIds.length > 0) {
        const albumInserts = albumIds.map(album_id => ({
            album_id,
            track_id: trackId,
            // posisi default 0, bisa diatur manual nanti jika ada fitur reorder
            position: 0
        }))
        await supabaseAdmin.from("custom_album_tracks").insert(albumInserts)
    }

    return { success: true }
}

export async function deleteMusicTrackOnServer(id: number) {
    const { data, error } = await supabaseAdmin.from("music_tracks").delete().eq("id", id).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Data lagu gagal dihapus." }

    return { success: true }
}

export async function bulkDeleteMusicTracksOnServer(ids: number[]) {
    const { data, error } = await supabaseAdmin.from("music_tracks").delete().in("id", ids).select();

    if (error) return { success: false, error: error.message };

    return { success: true, count: data?.length || 0 };
}

// ─── Custom Albums (Playlists) Actions ────────────────────────────────────────

export async function saveCustomAlbumOnServer(
    row: any,
    trackIds: number[],
    mode: "create" | "edit",
    idToUpdate?: number
) {
    let albumId = idToUpdate;

    if (mode === "create") {
        const { data, error } = await supabaseAdmin.from("custom_albums").insert(row).select()
        if (error) return { success: false, error: error.message }
        if (!data || data.length === 0) return { success: false, error: "Gagal menyimpan album ke database." }
        albumId = data[0].id
    } else {
        const { data, error } = await supabaseAdmin.from("custom_albums").update(row).eq("id", idToUpdate).select()
        if (error) return { success: false, error: error.message }
        if (!data || data.length === 0) return { success: false, error: "Gagal mengubah album di database." }
    }

    if (!albumId) return { success: false, error: "ID Album tidak ditemukan." }

    // Sinkronisasi Relasi Tracks dalam Album ini
    await supabaseAdmin.from("custom_album_tracks").delete().eq("album_id", albumId)

    if (trackIds && trackIds.length > 0) {
        const trackInserts = trackIds.map((track_id, index) => ({
            album_id: albumId,
            track_id,
            position: index // Simpan urutan track
        }))
        await supabaseAdmin.from("custom_album_tracks").insert(trackInserts)
    }

    return { success: true }
}

export async function deleteCustomAlbumOnServer(id: number) {
    const { data, error } = await supabaseAdmin.from("custom_albums").delete().eq("id", id).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Data album gagal dihapus." }

    return { success: true }
}

export async function bulkDeleteCustomAlbumsOnServer(ids: number[]) {
    const { data, error } = await supabaseAdmin.from("custom_albums").delete().in("id", ids).select();

    if (error) return { success: false, error: error.message };

    return { success: true, count: data?.length || 0 };
}
