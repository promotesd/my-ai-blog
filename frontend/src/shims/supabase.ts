type SupabaseError = { message: string } | null
type QueryResult<T = any> = { data: T[]; error: SupabaseError; count: number | null }
type SingleResult<T = any> = { data: T | null; error: SupabaseError; count: number | null }

const RESOURCE_MAP: Record<string, string> = {
  blogs: "blogs",
  projects: "projects",
  skills: "skills",
  certificates: "certificates",
  timelines: "timelines",
  work_experiences: "work-experiences",
  coding_journey: "coding-journey",
  tech_tools: "tech-tools",
  deployed_projects: "deployed-projects",
  diaries: "diaries",
  portfolio_stats: "portfolio-stats",
  guestbook: "guestbook",
  gallery_photos: "gallery/photos",
  gallery_albums: "gallery/albums",
  gallery_guests: "gallery/guests",
}

type Operation = "select" | "insert" | "update" | "delete"

class SupabaseQueryBuilder<T = any> implements PromiseLike<QueryResult<T>> {
  private operation: Operation = "select"
  private payload: unknown = null
  private filters: Array<[string, unknown]> = []
  private table: string

  constructor(table: string) {
    this.table = table
  }

  select(..._args: unknown[]) { return this }
  insert(payload: unknown) { this.operation = "insert"; this.payload = payload; return this }
  update(payload: unknown) { this.operation = "update"; this.payload = payload; return this }
  upsert(..._args: unknown[]) { return this }
  delete(..._args: unknown[]) { this.operation = "delete"; return this }
  eq(column: string, value: unknown) { this.filters.push([column, value]); return this }
  neq(..._args: unknown[]) { return this }
  gt(..._args: unknown[]) { return this }
  gte(..._args: unknown[]) { return this }
  lt(..._args: unknown[]) { return this }
  lte(..._args: unknown[]) { return this }
  in(column: string, values: unknown[]) { this.filters.push([column, values]); return this }
  is(..._args: unknown[]) { return this }
  contains(..._args: unknown[]) { return this }
  not(..._args: unknown[]) { return this }
  or(..._args: unknown[]) { return this }
  ilike(..._args: unknown[]) { return this }
  order(..._args: unknown[]) { return this }
  limit(..._args: unknown[]) { return this }
  range(..._args: unknown[]) { return this }

  async single(): Promise<SingleResult<T>> {
    const result = await this.execute()
    return { ...result, data: result.data[0] ?? null }
  }

  async maybeSingle(): Promise<SingleResult<T>> {
    return this.single()
  }

  then<TResult1 = QueryResult<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }

  private async execute(): Promise<QueryResult<T>> {
    const resource = RESOURCE_MAP[this.table]
    if (!resource) return { data: [], error: null, count: null }
    try {
      const idFilter = this.filters.find(([column]) => column === "id")?.[1]
      const ids = Array.isArray(idFilter) ? idFilter : null
      let path = `/api/${resource}`
      let init: RequestInit | undefined
      if (this.operation !== "select") {
        path = `/api/admin/${resource}${idFilter != null && !ids ? `/${idFilter}` : ""}`
        init = {
          method: this.operation === "insert" ? "POST" : this.operation === "update" ? "PUT" : "DELETE",
          body: JSON.stringify(ids ? { ids } : this.payload),
        }
      }
      const token = localStorage.getItem("portfolio-admin-token")
      const response = await fetch(path, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...init,
      })
      const body = await response.json()
      if (!response.ok || body.code >= 400) throw new Error(body.message || "API request failed")
      const raw = Array.isArray(body.data) ? body.data : body.data ? [body.data] : []
      const filtered = raw.filter((row: Record<string, unknown>) =>
        this.filters.every(([column, expected]) =>
          Array.isArray(expected) ? expected.includes(row[column]) : row[column] === expected
        )
      )
      return { data: filtered as T[], error: null, count: filtered.length }
    } catch (error) {
      return { data: [], error: { message: error instanceof Error ? error.message : "API request failed" }, count: 0 }
    }
  }
}

const storageBucket = (bucket = "") => ({
  upload: async (path = "", file?: unknown, ..._args: unknown[]) => {
    if (!(file instanceof File)) return { data: { path: String(path) }, error: null as SupabaseError }
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("category", bucket.startsWith("gallery") ? "gallery" : "general")
      const token = localStorage.getItem("portfolio-admin-token")
      const response = await fetch(bucket.startsWith("guestbook") ? "/api/upload/guestbook" : "/api/upload/files", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      const body = await response.json()
      if (!response.ok || body.code >= 400) throw new Error(body.message || "Upload failed")
      return { data: { path: body.data.url }, error: null as SupabaseError }
    } catch (error) {
      return { data: { path: String(path) }, error: { message: error instanceof Error ? error.message : "Upload failed" } }
    }
  },
  remove: async (..._args: unknown[]) => ({ data: null, error: null }),
  getPublicUrl: (path: string) => ({ data: { publicUrl: path } }),
})

export interface SupabaseClient {
  from: <T = any>(_table: string) => SupabaseQueryBuilder<T>
  storage: { from: (_bucket: string) => ReturnType<typeof storageBucket> }
  rpc: <T = any>(_name: string, _args?: Record<string, unknown>) => Promise<{ data: T | null; error: SupabaseError }>
  auth: {
    getUser: () => Promise<{ data: { user: null }; error: null }>
    signInWithPassword: () => Promise<{ data: null; error: null }>
    signOut: () => Promise<{ error: null }>
  }
  channel: (_name: string) => {
    on: (..._args: unknown[]) => ReturnType<SupabaseClient["channel"]>
    subscribe: () => ReturnType<SupabaseClient["channel"]>
  }
  removeChannel: (_channel: unknown) => void
}

export function createClient(..._args: unknown[]): SupabaseClient {
  const client: SupabaseClient = {
    from: (table) => new SupabaseQueryBuilder(table),
    rpc: async () => ({ data: null, error: null }),
    storage: { from: (bucket) => storageBucket(bucket) },
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async (..._args: unknown[]) => ({ data: null, error: null }),
      signOut: async (..._args: unknown[]) => ({ error: null }),
    },
    channel: () => {
      const channel = {
        on: () => channel,
        subscribe: () => channel,
      }
      return channel
    },
    removeChannel: () => undefined,
  }

  return client
}

export const createBrowserClient = createClient
export const createServerClient = createClient
