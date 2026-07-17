import { apiRequest } from "@/services/apiClient"

export async function saveGuestOnServer(
  row: object,
  mode: "create" | "edit",
  idToUpdate?: number
) {
  try {
    await apiRequest(`/api/admin/gallery/guests${mode === "edit" && idToUpdate ? `/${idToUpdate}` : ""}`, {
      method: mode === "create" ? "POST" : "PUT",
      body: JSON.stringify(row),
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "保存访客失败" }
  }
}

export async function deleteGuestOnServer(guestId: number) {
  try {
    await apiRequest(`/api/admin/gallery/guests/${guestId}`, { method: "DELETE" })
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "删除访客失败" }
  }
}

export async function bulkDeleteGuestsOnServer(guestIds: number[]) {
  try {
    await apiRequest("/api/admin/gallery/guests", {
      method: "DELETE",
      body: JSON.stringify({ ids: guestIds }),
    })
    return { success: true, count: guestIds.length }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "批量删除访客失败" }
  }
}
