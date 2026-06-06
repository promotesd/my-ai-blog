"use client"

import { useState, useMemo, useEffect } from "react"
import { useDiaryStore } from "@/stores/DiaryStore"
import { DiaryMood } from "@/types/diary"
import { Search, BookMarked, ChevronDown, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { formatDate } from "@/lib/utils"
import DiaryEntryModal from "@/components/diary/DiaryEntryModal"

const MOODS: DiaryMood[] = ["Reflective", "Happy", "Thoughtful", "Melancholic", "Inspired", "Grateful"]
const ITEMS_PER_PAGE = 10

export default function DiaryPage() {
  const t = useTranslations("diaryPage")
  const { diaries, fetchDiaries } = useDiaryStore()
  const [search, setSearch] = useState("")
  const [selectedMood, setSelectedMood] = useState<DiaryMood | "All">("All")
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const [selectedYear, setSelectedYear] = useState<string>("All")
  const [selectedMonth, setSelectedMonth] = useState<string>("All")
  const [page, setPage] = useState(1)
  const [mounted, setMounted] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null)

  // Style for select options
  const selectOptionStyle = `
    option {
      background-color: white;
      color: #1f2937;
      padding: 4px 8px;
    }
    option:checked {
      background-color: var(--accent-color, #3b82f6);
      color: white;
    }
    @media (prefers-color-scheme: dark) {
      option {
        background-color: #1f2937;
        color: #f3f4f6;
      }
      option:checked {
        background-color: var(--accent-color, #3b82f6);
        color: white;
      }
    }
  `

  useEffect(() => {
    fetchDiaries().then(() => setMounted(true))
  }, [])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, selectedMood, sortOrder, selectedYear, selectedMonth])

  // Extract available years and months
  const availableYears = useMemo(() => {
    const years = new Set(diaries.map(d => new Date(d.entry_date).getFullYear().toString()))
    return Array.from(years).sort((a, b) => b.localeCompare(a))
  }, [diaries])

  const availableMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(2000, i, 1)
      return {
        value: (i + 1).toString().padStart(2, '0'),
        label: date.toLocaleString('default', { month: 'long' })
      }
    })
  }, [])

  const filtered = useMemo(() => {
    let result = [...diaries]
    
    // Filter by mood
    if (selectedMood !== "All") {
      result = result.filter((diary) => diary.mood === selectedMood)
    }

    // Filter by year
    if (selectedYear !== "All") {
      result = result.filter((diary) => new Date(diary.entry_date).getFullYear().toString() === selectedYear)
    }

    // Filter by month
    if (selectedMonth !== "All") {
      result = result.filter((diary) => {
        const month = (new Date(diary.entry_date).getMonth() + 1).toString().padStart(2, '0')
        return month === selectedMonth
      })
    }

    // Search filter
    const q = search.toLowerCase()
    if (q) {
      result = result.filter(
        (diary) =>
          diary.title.toLowerCase().includes(q) ||
          diary.content.toLowerCase().includes(q) ||
          diary.entry_date.includes(q) ||
          diary.tags?.some((tag) => tag.toLowerCase().includes(q))
      )
    }

    // Sort
    if (sortOrder === "oldest") {
      result.sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime())
    }

    return result
  }, [diaries, search, selectedMood, sortOrder])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const getMoodIcon = (mood?: DiaryMood) => {
    const moodIcons: Record<DiaryMood, string> = {
      Reflective: "🤔",
      Happy: "😊",
      Thoughtful: "💭",
      Melancholic: "😢",
      Inspired: "✨",
      Grateful: "🙏",
    }
    return mood ? moodIcons[mood] : "📝"
  }

  const getMoodLabel = (mood: DiaryMood) => {
    const key = `mood_${mood.toLowerCase()}` as any
    return t(key)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-baseBackground">
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-white to-accentColor/5 dark:from-[#0a1515] dark:via-[#0d1919] dark:to-[#0a1515] pt-28 pb-16 px-[5%]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accentColor/5 dark:bg-accentColor/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accentColor/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
          <div className="relative max-w-[1100px] mx-auto">
            <div className="flex items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BookMarked size={18} className="text-accentColor" />
                  <span className="text-accentColor text-sm font-medium">{t("label")}</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold dark:text-white leading-tight">
                  {t("title1")}{" "}
                  <span className="text-accentColor">{t("title_accent")}</span>
                  <br />{t("title2")}
                </h1>
                <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
                  {t("description")}
                </p>
              </div>
            </div>
            <div className="mt-8 relative">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
              <div className="w-full h-[46px] rounded-xl border border-gray-200 dark:border-gray-700/60 bg-gray-100 dark:bg-gray-800/50 animate-pulse" />
            </div>
          </div>
        </section>

        <section className="px-[5%] py-10 max-w-[1100px] mx-auto">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 animate-pulse"
              />
            ))}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-baseBackground">
      <style dangerouslySetInnerHTML={{ __html: selectOptionStyle }} />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-white to-accentColor/5 dark:from-[#0a1515] dark:via-[#0d1919] dark:to-[#0a1515] pt-28 pb-16 px-[5%]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accentColor/5 dark:bg-accentColor/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accentColor/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-[1100px] mx-auto">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookMarked size={18} className="text-accentColor" />
                <span className="text-accentColor text-sm font-medium uppercase tracking-wide">{t("label")}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold dark:text-white leading-tight">
                {t("title1")}{" "}
                <span className="text-accentColor">{t("title_accent")}</span>
                <br />{t("title2")}
              </h1>
              <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
                {t("description")}
              </p>
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                <span>{filtered.length} {t("entries_count")}</span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mt-8 relative">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search_placeholder")}
              className="w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-800/50 dark:text-white outline-none focus:border-accentColor shadow-sm transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="px-[5%] py-10">
        <div className="relative max-w-[1100px] mx-auto">
          {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8 items-center">
          <div className="flex-1 flex flex-wrap gap-2 items-center">
            {/* Mood Filter */}
            <div className="relative flex items-center bg-white dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-lg hover:border-accentColor dark:hover:border-accentColor transition-colors focus-within:border-accentColor focus-within:ring-1 focus-within:ring-accentColor/50">
              <select
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value as DiaryMood | "All")}
                className="w-full appearance-none bg-transparent py-2 px-3 text-sm font-medium outline-none cursor-pointer text-gray-900 dark:text-white"
              >
                <option value="All">{t("filter_mood") || "All Moods"}</option>
                {MOODS.map((mood) => (
                  <option key={mood} value={mood}>
                    {getMoodIcon(mood)} {getMoodLabel(mood)}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 pointer-events-none text-gray-600 dark:text-gray-300" />
            </div>

            {/* Year Filter */}
            <div className="relative flex items-center bg-white dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-lg hover:border-accentColor dark:hover:border-accentColor transition-colors focus-within:border-accentColor focus-within:ring-1 focus-within:ring-accentColor/50">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full appearance-none bg-transparent py-2 px-3 text-sm font-medium outline-none cursor-pointer text-gray-900 dark:text-white"
              >
                <option value="All">All Years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 pointer-events-none text-gray-600 dark:text-gray-300" />
            </div>

            {/* Month Filter */}
            <div className="relative flex items-center bg-white dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-lg hover:border-accentColor dark:hover:border-accentColor transition-colors focus-within:border-accentColor focus-within:ring-1 focus-within:ring-accentColor/50">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full appearance-none bg-transparent py-2 px-3 text-sm font-medium outline-none cursor-pointer text-gray-900 dark:text-white"
              >
                <option value="All">All Months</option>
                {availableMonths.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 pointer-events-none text-gray-600 dark:text-gray-300" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Filter */}
            <div className="relative flex items-center bg-white dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-lg hover:border-accentColor dark:hover:border-accentColor transition-colors focus-within:border-accentColor focus-within:ring-1 focus-within:ring-accentColor/50">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
                className="w-full appearance-none bg-transparent py-2 px-3 text-sm font-medium outline-none cursor-pointer text-gray-900 dark:text-white"
              >
                <option value="newest">{t("sort_newest")}</option>
                <option value="oldest">{t("sort_oldest")}</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 pointer-events-none text-gray-600 dark:text-gray-300" />
            </div>
          </div>
        </div>

        {/* Entries list */}
        {paginated.length === 0 ? (
          <div className="text-center py-16">
            <BookMarked size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">{t("no_entries_title")}</h3>
            <p className="text-gray-500 dark:text-gray-500">{t("no_entries_desc")}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginated.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry.id)}
                  className="group cursor-pointer p-5 flex flex-col h-full rounded-xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-800/40 hover:border-accentColor dark:hover:border-accentColor transition-all hover:shadow-md hover:shadow-accentColor/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">{getMoodIcon(entry.mood)}</span>
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {formatDate(entry.entry_date)}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-accentColor transition-colors line-clamp-2 mb-2">
                        {entry.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed mb-4 flex-grow">
                        {entry.content.replace(/<[^>]*>/g, "")}
                      </p>
                      
                      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700/50">
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {entry.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-xs font-medium px-2.5 py-1 rounded-md bg-accentColor/10 text-accentColor"
                              >
                                #{tag}
                              </span>
                            ))}
                            {entry.tags.length > 3 && (
                              <span className="text-xs px-2.5 py-1 font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md">
                                +{entry.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      page === i + 1
                        ? "bg-accentColor text-white shadow-lg shadow-accentColor/20"
                        : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        </div>
      </section>

      {/* Entry Modal */}
      {selectedEntry && (
        <DiaryEntryModal
          entryId={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  )
}
