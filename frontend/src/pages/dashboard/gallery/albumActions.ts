import { apiRequest } from "@/services/apiClient"

export async function saveAlbumOnServer(
  row: object,
  mode: "create" | "edit",
  slugToUpdate?: string
) {
  try {
    await apiRequest(`/api/admin/gallery/albums${mode === "edit" && slugToUpdate ? `/${encodeURIComponent(slugToUpdate)}` : ""}`, {
      method: mode === "create" ? "POST" : "PUT",
      body: JSON.stringify(row),
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "保存相册失败" }
  }
}

export async function deleteAlbumOnServer(slug: string) {
  try {
    await apiRequest(`/api/admin/gallery/albums/${encodeURIComponent(slug)}`, { method: "DELETE" })
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "删除相册失败" }
  }
}

export async function bulkDeleteAlbumsOnServer(slugs: string[]) {
  try {
    await apiRequest("/api/admin/gallery/albums", {
      method: "DELETE",
      body: JSON.stringify({ slugs }),
    })
    return { success: true, count: slugs.length }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "批量删除相册失败" }
  }
}
