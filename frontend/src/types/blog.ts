export type BlogCategory =
  | "Technology"
  | "General"
  | "Tutorial"
  | "Tips & Tricks"
  | "News"
  | "Programming"
  | "Design"
  | "Career"

export type AuthorType = "developer" | "visitor"

export interface BlogAuthor {
  name: string
  email?: string
  phone?: string
  avatar?: string // optional profile picture URL
  type: AuthorType
}

export interface Blog {
  id: string
  title: string
  excerpt: string
  content: string // HTML string from rich text editor
  thumbnail: string
  category: BlogCategory
  author: BlogAuthor
  publishedAt: string // ISO date string
  readingTime: number // minutes
  tags?: string[]
}
