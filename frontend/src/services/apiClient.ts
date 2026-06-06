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

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }

  const body = await response.json() as ApiEnvelope<T> | T
  if (body && typeof body === "object" && "code" in body && "data" in body) {
    if (body.code >= 400) throw new Error(body.message)
    return body.data
  }
  return body as T
}
