import { apiRequest, API_BASE_URL } from "@/services/apiClient"

export type ResumeStatus = {
  uploaded: boolean
  url: string
  filename: string
  updatedAt: number
}

export function getResumeStatus() {
  return apiRequest<ResumeStatus>("/api/resume/status")
}

export async function uploadResume(file: File) {
  const token = localStorage.getItem("portfolio-admin-token")
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(`${API_BASE_URL}/api/upload/resume`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`上传失败：${response.status}`)
  }

  const body = await response.json()
  if (body && typeof body === "object" && "code" in body && body.code >= 400) {
    throw new Error(body.message || "上传失败")
  }
  return body.data as { url: string; filename: string }
}
