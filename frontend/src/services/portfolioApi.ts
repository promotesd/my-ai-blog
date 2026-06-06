import { apiRequest } from "@/services/apiClient"

export type PortfolioResource =
  | "blogs"
  | "projects"
  | "skills"
  | "certificates"
  | "timelines"
  | "work-experiences"
  | "coding-journey"
  | "tech-tools"
  | "deployed-projects"
  | "diaries"
  | "portfolio-stats"

export const portfolioApi = {
  list<T>(resource: PortfolioResource) {
    return apiRequest<T[]>(`/api/${resource}`)
  },
  detail<T>(resource: PortfolioResource, slug: string) {
    return apiRequest<T>(`/api/${resource}/${encodeURIComponent(slug)}`)
  },
  adminList<T>(resource: PortfolioResource) {
    return apiRequest<T[]>(`/api/admin/${resource}`)
  },
  save<T>(resource: PortfolioResource, payload: Record<string, unknown>, id?: number) {
    return apiRequest<T>(id ? `/api/admin/${resource}/${id}` : `/api/admin/${resource}`, {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    })
  },
  remove(resource: PortfolioResource, id: number) {
    return apiRequest<void>(`/api/admin/${resource}/${id}`, { method: "DELETE" })
  },
  removeBatch(resource: PortfolioResource, ids: number[]) {
    return apiRequest<void>(`/api/admin/${resource}`, { method: "DELETE", body: JSON.stringify({ ids }) })
  },
}

export const guestbookApi = {
  list<T>() {
    return apiRequest<T[]>("/api/guestbook")
  },
  create<T>(payload: Record<string, unknown>) {
    return apiRequest<T>("/api/guestbook", { method: "POST", body: JSON.stringify(payload) })
  },
}
