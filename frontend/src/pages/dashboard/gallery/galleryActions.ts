"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

export async function saveGalleryPhotoOnServer(
  row: any,
  mode: "create" | "edit",
  idToUpdate?: number
) {
  // Hapus properti yang di-generate otomatis oleh DB agar tidak error
  const payload = { ...row }
  delete payload.id
  delete payload.year

  if (mode === "create") {
    const { data, error } = await supabaseAdmin.from("gallery_photos").insert(payload).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal menyimpan foto ke database." }
  } else {
    payload.updated_at = new Date().toISOString()
    const { data, error } = await supabaseAdmin.from("gallery_photos").update(payload).eq("id", idToUpdate).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal mengubah data foto." }
  }

  // Setelah foto disimpan, cek & buat album jika belum ada
  if (payload.album && payload.album_slug) {
    try {
      // Cek apakah album sudah ada
      const { data: existingAlbum, error: checkError } = await supabaseAdmin
        .from("gallery_albums")
        .select("slug")
        .eq("slug", payload.album_slug)
        .maybeSingle()

      if (checkError) {
        console.error("Gagal memeriksa album:", checkError.message)
        // Lanjutkan saja, anggap album tidak ada
      }
      
      // Jika album belum ada, buat baru
      if (!existingAlbum) {
        const newAlbum = {
          slug: payload.album_slug,
          name: payload.album,
          description: `Album untuk koleksi foto ${payload.album}.`,
          category: payload.category || "Personal",
          cover_url: payload.thumbnail_url || payload.image_url,
          period: payload.date ? new Date(payload.date).getFullYear().toString() : new Date().getFullYear().toString(),
          photo_count: 1, // Akan di-update oleh trigger/function di DB
          owner_type: payload.owner_type || "personal",
          guest_id: payload.guest_id || null,
        }
        
        const { error: insertAlbumError } = await supabaseAdmin
          .from("gallery_albums")
          .insert(newAlbum)
        
        if (insertAlbumError) {
          console.error("Gagal membuat album baru:", insertAlbumError.message)
          // Tidak mengembalikan error ke client, hanya log di server
        }
      }

    } catch (err: any) {
      console.error("Terjadi kesalahan saat proses album:", err.message)
    }
  }

  return { success: true }
}

export async function deleteGalleryPhotoOnServer(id: number, storageBucket: string, filePaths: string[]) {
  const validPaths = filePaths.filter(Boolean)
  if (validPaths.length > 0) {
    await supabaseAdmin.storage.from(storageBucket).remove(validPaths)
  }
  
  const { data, error } = await supabaseAdmin.from("gallery_photos").delete().eq("id", id).select()
  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) return { success: false, error: "Data foto gagal dihapus." }
  
  return { success: true }
}

export async function bulkDeleteGalleryPhotosOnServer(items: { id: number, storageBucket: string, filePaths: string[] }[]) {
  const bucketMap: Record<string, string[]> = {};
  
  items.forEach(item => {
    if (item.storageBucket && item.filePaths) {
      if (!bucketMap[item.storageBucket]) bucketMap[item.storageBucket] = [];
      const validPaths = item.filePaths.filter(Boolean)
      bucketMap[item.storageBucket].push(...validPaths);
    }
  });

  for (const [bucket, paths] of Object.entries(bucketMap)) {
    if (paths.length > 0) {
      await supabaseAdmin.storage.from(bucket).remove(paths);
    }
  }

  const ids = items.map(i => i.id);
  const { data, error } = await supabaseAdmin.from("gallery_photos").delete().in("id", ids).select();
  
  if (error) return { success: false, error: error.message };

  return { success: true, count: data?.length || 0 };
}
