import { env } from "@/config/env"

export const API_BASE_URL = env.apiBaseUrl

type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`
  const token = localStorage.getItem("portfolio-admin-token")
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    ...init,
  })

  const body = await response.json().catch(() => null) as ApiEnvelope<T> | T | null
  if (!response.ok) {
    const message = body && typeof body === "object" && "message" in body
      ? String(body.message)
      : `请求失败：${response.status} ${response.statusText}`
    throw new Error(message)
  }

  if (body && typeof body === "object" && "code" in body && "data" in body) {
    if (body.code >= 400) throw new Error(body.message)
    return body.data
  }
  return body as T
}
