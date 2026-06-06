"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

const STORAGE_BUCKET = "gallery-photos"

function getPathsFromPhoto(item: any) {
  const paths: string[] = []
  const pathIdentifier = `/public/${STORAGE_BUCKET}/`
  
  if (item.image_url && item.image_url.includes(pathIdentifier)) {
    paths.push(item.image_url.substring(item.image_url.indexOf(pathIdentifier) + pathIdentifier.length))
  }
  if (item.thumbnail_url && item.thumbnail_url.includes(pathIdentifier) && item.thumbnail_url !== item.image_url) {
    paths.push(item.thumbnail_url.substring(item.thumbnail_url.indexOf(pathIdentifier) + pathIdentifier.length))
  }
  return paths
}

export async function saveGuestOnServer(
  row: any,
  mode: "create" | "edit",
  idToUpdate?: number
) {
  const payload = { ...row }
  
  // We only allow naming and avatar updates for now from forms
  // The system handles photo_count / album_count
  const dataToSave = {
    name: payload.name,
    avatar_url: payload.avatar_url || null,
  }

  if (mode === "create") {
    const { data, error } = await supabaseAdmin.from("gallery_guests").insert(dataToSave).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal menyimpan tamu ke database." }
  } else {
    const { data, error } = await supabaseAdmin.from("gallery_guests").update(dataToSave).eq("id", idToUpdate).select()
    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: false, error: "Gagal mengubah data tamu." }
  }

  return { success: true }
}

export async function deleteGuestOnServer(guestId: number) {
  // 1. Fetch all photos owned by this guest
  const { data: photos, error: fetchError } = await supabaseAdmin
    .from("gallery_photos")
    .select("id, image_url, thumbnail_url")
    .eq("guest_id", guestId)

  if (fetchError) {
    return { success: false, error: `Gagal mengambil foto tamu: ${fetchError.message}` }
  }

  // 2. Delete photos from storage
  if (photos && photos.length > 0) {
    let allPaths: string[] = []
    photos.forEach(p => {
      allPaths = allPaths.concat(getPathsFromPhoto(p))
    })
    
    // Remote from storage
    if (allPaths.length > 0) {
      await supabaseAdmin.storage.from(STORAGE_BUCKET).remove(allPaths)
    }

    // 3. Delete photos from DB
    const photoIds = photos.map(p => p.id)
    const { error: deletePhotosError } = await supabaseAdmin
      .from("gallery_photos")
      .delete()
      .in("id", photoIds)
      
    if (deletePhotosError) {
      return { success: false, error: `Gagal menghapus data foto: ${deletePhotosError.message}` }
    }
  }

  // 4. Delete albums owned by this guest (photos are already gone / unlinked by foreign keys, but we delete explicitly)
  const { error: deleteAlbumsError } = await supabaseAdmin
    .from("gallery_albums")
    .delete()
    .eq("guest_id", guestId)

  if (deleteAlbumsError) {
    return { success: false, error: `Gagal menghapus data album tamu: ${deleteAlbumsError.message}` }
  }

  // 5. Delete the guest
  const { data, error } = await supabaseAdmin.from("gallery_guests").delete().eq("id", guestId).select()
  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) return { success: false, error: "Data tamu gagal dihapus." }
  
  return { success: true }
}

export async function bulkDeleteGuestsOnServer(guestIds: number[]) {
  if (guestIds.length === 0) return { success: false, error: "Tidak ada tamu yang dipilih." }

  // 1. Fetch all photos owned by these guests
  const { data: photos, error: fetchError } = await supabaseAdmin
    .from("gallery_photos")
    .select("id, image_url, thumbnail_url")
    .in("guest_id", guestIds)

  if (fetchError) {
    return { success: false, error: `Gagal mengambil foto tamu: ${fetchError.message}` }
  }

  // 2. Delete photos from storage
  if (photos && photos.length > 0) {
    let allPaths: string[] = []
    photos.forEach(p => {
      allPaths = allPaths.concat(getPathsFromPhoto(p))
    })
    
    if (allPaths.length > 0) {
      await supabaseAdmin.storage.from(STORAGE_BUCKET).remove(allPaths)
    }

    // 3. Delete photos from DB
    const photoIds = photos.map(p => p.id)
    await supabaseAdmin
      .from("gallery_photos")
      .delete()
      .in("id", photoIds)
  }

  // 4. Delete albums owned by these guests
  await supabaseAdmin
    .from("gallery_albums")
    .delete()
    .in("guest_id", guestIds)

  // 5. Delete the guests
  const { data, error } = await supabaseAdmin
    .from("gallery_guests")
    .delete()
    .in("id", guestIds)
    .select()

  if (error) return { success: false, error: error.message }

  return { success: true, count: data?.length ?? guestIds.length }
}
