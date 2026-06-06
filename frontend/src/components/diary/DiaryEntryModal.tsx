"use client"

import { useDiaryStore } from "@/stores/DiaryStore"
import { X, Calendar, Tag } from "lucide-react"
import { useTranslations } from "next-intl"
import { formatDate } from "@/lib/utils"

interface DiaryEntryModalProps {
  entryId: string
  onClose: () => void
}

const getMoodIcon = (mood?: string) => {
  const moodIcons: Record<string, string> = {
    Reflective: "🤔",
    Happy: "😊",
    Thoughtful: "💭",
    Melancholic: "😢",
    Inspired: "✨",
    Grateful: "🙏",
  }
  return mood ? moodIcons[mood] : "📝"
}

export default function DiaryEntryModal({ entryId, onClose }: DiaryEntryModalProps) {
  const t = useTranslations("diaryPage")
  const { diaries } = useDiaryStore()
  const entry = diaries.find((d) => d.id === entryId)

  if (!entry) return null

  const getMoodLabel = (mood: string) => {
    const key = `mood_${mood.toLowerCase()}` as any
    return t(key)
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Ditambahkan bg-white dark:bg-gray-900 di sini */}
        <div className="sticky top-0 z-[999] bg-white dark:bg-gray-900 bg-gradient-to-r from-accentColor/10 to-accentColor/5 dark:from-accentColor/20 dark:to-accentColor/10 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{getMoodIcon(entry.mood)}</span>
              {entry.mood && (
                <span className="text-sm font-medium text-accentColor">
                  {getMoodLabel(entry.mood)}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{entry.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Meta Information */}
          <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar size={16} />
              <span>{formatDate(entry.entry_date)}</span>
            </div>
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full bg-accentColor/10 text-accentColor"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Entry Content */}
          <div
            className="prose prose-sm md:prose-base max-w-none dark:prose-invert
              prose-headings:font-bold prose-headings:dark:text-white
              prose-p:text-gray-700 prose-p:dark:text-gray-300 prose-p:leading-relaxed
              prose-a:text-accentColor prose-a:no-underline hover:prose-a:underline
              prose-blockquote:border-l-accentColor prose-blockquote:bg-accentColor/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
              prose-code:text-accentColor prose-code:bg-accentColor/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700
              prose-img:rounded-xl prose-img:shadow-md
              prose-strong:dark:text-white
              prose-ul:list-disc prose-ol:list-decimal
              prose-li:text-gray-700 prose-li:dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: entry.content }}
          />

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{t("entry_date")}: {formatDate(entry.entry_date)}</span>
            <span>
              Last updated: {new Date(entry.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}