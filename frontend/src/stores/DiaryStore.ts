import { create } from "zustand"
import { Diary } from "@/types/diary"
import { supabase } from "@/lib/supabase"

interface DiaryState {
  diaries: Diary[]
  loading: boolean
  fetchDiaries: () => Promise<void>
  getDiaryById: (id: string) => Diary | undefined
}

function rowToDiary(row: any): Diary {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    entry_date: row.entry_date,
    mood: row.mood ?? undefined,
    tags: row.tags ?? [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export const useDiaryStore = create<DiaryState>()((set, get) => ({
  diaries: [],
  loading: false,
  fetchDiaries: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from("diaries")
      .select("*")
      .order("entry_date", { ascending: false })
    if (!error && data) {
      set({ diaries: data.map(rowToDiary), loading: false })
    } else {
      console.error("Failed to fetch diaries:", error)
      set({ loading: false })
    }
  },
  getDiaryById: (id) => get().diaries.find((d) => d.id === id),
}))
