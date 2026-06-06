import { create } from "zustand"
import { Blog } from "@/types/blog"
import { supabase } from "@/lib/supabase"

interface BlogState {
  blogs: Blog[]
  loading: boolean
  fetchBlogs: () => Promise<void>
  addBlogLocal: (blog: Blog) => void
  getBlogById: (id: string) => Blog | undefined
}

function rowToBlog(row: any): Blog {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt ?? "",
    content: row.content ?? "",
    thumbnail: row.thumbnail ?? "",
    category: row.category,
    author: {
      name: row.author_name,
      email: row.author_email ?? undefined,
      phone: row.author_phone ?? undefined,
      avatar: row.author_avatar ?? undefined,
      type: row.author_type,
    },
    publishedAt: row.published_at,
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
