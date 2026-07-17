import { create } from "zustand"
import { Blog, BlogCategory, AuthorType } from "@/types/blog"
import { supabase } from "@/lib/supabase"

interface BlogState {
  blogs: Blog[]
  loading: boolean
  fetchBlogs: () => Promise<void>
  addBlogLocal: (blog: Blog) => void
  getBlogById: (id: string) => Blog | undefined
}

const DEFAULT_THUMBNAIL = "/profile/avatar.png"
const BLOG_CATEGORIES: BlogCategory[] = [
  "Technology",
  "General",
  "Tutorial",
  "Tips & Tricks",
  "News",
  "Programming",
  "Design",
  "Career",
]

function asCategory(value: unknown): BlogCategory {
  return BLOG_CATEGORIES.includes(value as BlogCategory) ? value as BlogCategory : "Technology"
}

function asAuthorType(value: unknown): AuthorType {
  return value === "visitor" ? "visitor" : "developer"
}

function rowToBlog(row: any): Blog {
  const author = typeof row.author === "object" && row.author !== null ? row.author : null
  const authorName = row.author_name ?? author?.name ?? (typeof row.author === "string" ? row.author : "小嘟嘟")
  const publishedAt = row.published_at ?? row.publishedAt ?? row.created_at ?? row.updated_at ?? new Date().toISOString()

  return {
    id: String(row.slug ?? row.id),
    title: row.title ?? "Untitled",
    excerpt: row.excerpt ?? row.description ?? "",
    content: row.content ?? row.content_md ?? row.description ?? "",
    thumbnail: row.thumbnail ?? row.cover_url ?? row.cover ?? DEFAULT_THUMBNAIL,
    category: asCategory(row.category),
    author: {
      name: String(authorName || "小嘟嘟"),
      email: row.author_email ?? author?.email ?? undefined,
      phone: row.author_phone ?? author?.phone ?? undefined,
      avatar: row.author_avatar ?? author?.avatar ?? undefined,
      type: asAuthorType(row.author_type ?? author?.type),
    },
    publishedAt,
    readingTime: row.reading_time ?? 1,
    tags: row.tags ?? [],
  }
}

export const useBlogStore = create<BlogState>()((set, get) => ({
  blogs: [],
  loading: false,
  fetchBlogs: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .order("published_at", { ascending: false })
    if (!error && data) {
      set({ blogs: data.map(rowToBlog), loading: false })
    } else {
      console.error("Failed to fetch blogs:", error)
      set({ loading: false })
    }
  },
  addBlogLocal: (blog) =>
    set((state) => ({ blogs: [blog, ...state.blogs] })),
  getBlogById: (id) => get().blogs.find((b) => b.id === id),
}))
