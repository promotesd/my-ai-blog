"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

export async function saveAlbumOnServer(
  row: any,
  mode: "create" | "edit",
  slugToUpdate?: string
) {
  const payload = { ...row }
  if (mode === "create") {
    delete payload.id
    const { data, error } = await supabaseAdmin.from("gallery_albums").insert(payload).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal menyimpan album ke database." }
  } else {
    payload.updated_at = new Date().toISOString()
    const { data, error } = await supabaseAdmin.from("gallery_albums").update(payload).eq("slug", slugToUpdate).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal mengubah data album." }
  }

  return { success: true }
}

export async function deleteAlbumOnServer(slug: string) {
  // First, update all photos in this album to have null album fields
  const { error: updatePhotosError } = await supabaseAdmin
    .from("gallery_photos")
    .update({ album: null, album_slug: null })
    .eq("album_slug", slug)

  if (updatePhotosError) {
    return { success: false, error: `Gagal melepaskan foto dari album: ${updatePhotosError.message}` }
  }

  // Then, delete the album
  const { data, error } = await supabaseAdmin.from("gallery_albums").delete().eq("slug", slug).select()
  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) return { success: false, error: "Data album gagal dihapus." }
  
  return { success: true }
}

export async function bulkDeleteAlbumsOnServer(slugs: string[]) {
  if (slugs.length === 0) return { success: false, error: "Tidak ada album yang dipilih." }

  // Unlink all photos from these albums
  if (slugs.length > 0) {
    const { error: updatePhotosError } = await supabaseAdmin
      .from("gallery_photos")
      .update({ album: null, album_slug: null })
      .in("album_slug", slugs)

    if (updatePhotosError) {
      return { success: false, error: `Gagal melepaskan foto dari album: ${updatePhotosError.message}` }
    }
  }

  // Delete all selected albums
  const { data, error } = await supabaseAdmin
    .from("gallery_albums")
    .delete()
    .in("slug", slugs)
    .select()

  if (error) return { success: false, error: error.message }

  return { success: true, count: data?.length ?? slugs.length }
}
