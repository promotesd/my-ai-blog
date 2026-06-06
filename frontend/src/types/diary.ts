export type DiaryMood =
  | "Reflective"
  | "Happy"
  | "Thoughtful"
  | "Melancholic"
  | "Inspired"
  | "Grateful"

export interface Diary {
  id: string
  title: string
  content: string
  entry_date: string // ISO date string (YYYY-MM-DD)
  mood?: DiaryMood
  tags?: string[] // array of tags
  created_at: string // ISO timestamp
  updated_at: string // ISO timestamp
}
