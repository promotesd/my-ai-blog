import { apiRequest } from "@/services/apiClient"

export async function saveGalleryPhotoOnServer(
  row: object,
  mode: "create" | "edit",
  idToUpdate?: number
) {
  try {
    await apiRequest(`/api/admin/gallery/photos${mode === "edit" && idToUpdate ? `/${idToUpdate}` : ""}`, {
      method: mode === "create" ? "POST" : "PUT",
      body: JSON.stringify(row),
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "保存照片失败" }
  }
}

export async function deleteGalleryPhotoOnServer(id: number, _storageBucket: string, _filePaths: string[]) {
  try {
    await apiRequest(`/api/admin/gallery/photos/${id}`, { method: "DELETE" })
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "删除照片失败" }
  }
}

export async function bulkDeleteGalleryPhotosOnServer(items: { id: number }[]) {
  try {
    await apiRequest("/api/admin/gallery/photos", {
      method: "DELETE",
      body: JSON.stringify({ ids: items.map((item) => item.id) }),
    })
    return { success: true, count: items.length }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "批量删除照片失败" }
  }
}
