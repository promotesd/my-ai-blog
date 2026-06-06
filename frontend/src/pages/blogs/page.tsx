"use client"

import { useState, useMemo, useEffect } from "react"
import { useBlogStore } from "@/stores/BlogStore"
import { BlogCategory } from "@/types/blog"
import BlogPageCard from "@/components/blog/BlogPageCard"
import BlogPageCardSkeleton from "@/components/blog/BlogPageCardSkeleton"
import ArticleModal from "@/components/blog/ArticleModal"
import { Search, PenSquare, LayoutGrid, List, Rss, ChevronLeft, ChevronRight, AlertTriangle, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

const CATEGORIES: (BlogCategory | "All")[] = [
  "All",
  "Technology",
  "Tutorial",
  "Tips & Tricks",
  "Programming",
  "Design",
  "General",
  "News",
  "Career",
]

const ITEMS_PER_PAGE = 9

export default function BlogsPage() {
  const t = useTranslations("blogsPage")
  const { blogs, fetchBlogs } = useBlogStore()
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<BlogCategory | "All">("All")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [page, setPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    fetchBlogs().then(() => setMounted(true))
  }, [])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, activeCategory])

  const filtered = useMemo(() => {
    return blogs.filter((blog) => {
      const matchCategory =
        activeCategory === "All" || blog.category === activeCategory
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        blog.title.toLowerCase().includes(q) ||
        blog.excerpt.toLowerCase().includes(q) ||
        blog.author.name.toLowerCase().includes(q) ||
        blog.category.toLowerCase().includes(q)
      return matchCategory && matchSearch
    })
  }, [blogs, search, activeCategory])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  if (!mounted) {
    return (
      <div className="min-h-screen bg-baseBackground">
        {/* Hero — same shell, stats replaced with skeletons */}
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-white to-accentColor/5 dark:from-[#0a1515] dark:via-[#0d1919] dark:to-[#0a1515] pt-28 pb-16 px-[5%]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accentColor/5 dark:bg-accentColor/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accentColor/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
          <div className="relative max-w-[1100px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Rss size={18} className="text-accentColor" />
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
                {/* Stat placeholders */}
                <div className="flex items-center gap-4 mt-4">
                  <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700 shimmer" />
                  <span className="w-1 h-1 bg-gray-400 rounded-full" />
                  <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700 shimmer" />
                </div>
              </div>
              <button
                disabled
                className="flex items-center gap-2 px-5 py-2.5 bg-accentColor/50 text-white rounded-xl font-medium shrink-0 self-start md:self-auto cursor-not-allowed"
              >
                <PenSquare size={16} />
                {t("write_article")}
              </button>
            </div>
            {/* Search placeholder */}
            <div className="mt-8 relative">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
              <div className="w-full h-[46px] rounded-xl border border-gray-200 dark:border-gray-700/60 bg-gray-100 dark:bg-gray-800/50 shimmer" />
            </div>
          </div>
        </section>

        {/* Content skeleton */}
        <section className="px-[5%] py-10 max-w-[1100px] mx-auto">
          {/* Filter tabs placeholder */}
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.slice(0, 6).map((cat) => (
              <div key={cat} className="h-8 w-16 rounded-lg bg-gray-200 dark:bg-gray-700 shimmer" />
            ))}
          </div>

          {/* Grid skeleton — 6 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <BlogPageCardSkeleton key={i} view="grid" />
            ))}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-baseBackground">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-white to-accentColor/5 dark:from-[#0a1515] dark:via-[#0d1919] dark:to-[#0a1515] pt-28 pb-16 px-[5%]">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accentColor/5 dark:bg-accentColor/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accentColor/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-[1100px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Rss size={18} className="text-accentColor" />
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
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                <span>{blogs.length} {t("articles_count")}</span>
                <span className="w-1 h-1 bg-gray-400 rounded-full" />
                <span>{blogs.filter((b) => b.author.type === "visitor").length} {t("community_count")}</span>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-accentColor text-white rounded-xl font-medium hover:brightness-[0.85] transition-all hover:shadow-lg hover:shadow-accentColor/20 shrink-0 self-start md:self-auto"
            >
              <PenSquare size={16} />
              {t("write_article")}
            </button>
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
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="px-[5%] py-10 max-w-[1100px] mx-auto">
        {/* Community Warning Banner */}
        <div className="mb-6 rounded-2xl border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 px-5 py-4 flex gap-3.5 items-start">
          <div className="shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-2 flex-wrap">
              {t("banner_title")}
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-700/60 text-amber-800 dark:text-amber-200">
                <ShieldCheck className="w-3 h-3" />
                {t("banner_disclaimer")}
              </span>
            </p>
            <p className="text-xs text-amber-700/90 dark:text-amber-400/90 leading-relaxed">
              {t("banner_p1")} <span className="font-semibold">{t("banner_p1_bold")}</span>{t("banner_p2")} <span className="font-semibold">{t("banner_p2_bold")}</span> {t("banner_p3")}<span className="font-semibold">Agung Kurniawan</span>{t("banner_p4")}
            </p>
          </div>
        </div>

        {/* Filters + View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                  activeCategory === cat
                    ? "bg-accentColor text-white shadow-sm"
                    : "bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 text-gray-600 dark:text-gray-400 hover:border-accentColor dark:hover:border-accentColor hover:text-accentColor"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-lg p-1 shrink-0">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                view === "grid"
                  ? "bg-accentColor text-white"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              )}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                view === "list"
                  ? "bg-accentColor text-white"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              )}
            >
              <List size={15} />
            </button>
          </div>
        </div>

        {/* Results count */}
        {search || activeCategory !== "All" ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {filtered.length} {t("results_found")}
            {search && (
              <span>
                {" "}{t("results_for")} &quot;<strong className="text-gray-700 dark:text-gray-300">{search}</strong>&quot;
              </span>
            )}
            {activeCategory !== "All" && (
              <span>
                {" "}{t("results_in_category")}{" "}
                <strong className="text-accentColor">{activeCategory}</strong>
              </span>
            )}
          </p>
        ) : null}

        {/* Grid / List */}
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-lg font-semibold dark:text-white mb-2">{t("no_articles_title")}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("no_articles_desc")}
            </p>
            <button
              onClick={() => { setSearch(""); setActiveCategory("All") }}
              className="mt-4 px-4 py-2 text-sm text-accentColor border border-accentColor rounded-lg hover:bg-accentColor/10 transition-colors"
            >
              {t("reset_filter")}
            </button>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginated.map((blog) => (
              <BlogPageCard key={blog.id} blog={blog} view="grid" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {paginated.map((blog) => (
              <BlogPageCard key={blog.id} blog={blog} view="list" />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-accentColor disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} className="dark:text-gray-300" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "w-9 h-9 rounded-lg text-sm font-medium transition-all",
                  page === p
                    ? "bg-accentColor text-white"
                    : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-accentColor"
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-accentColor disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} className="dark:text-gray-300" />
            </button>
          </div>
        )}
      </section>

      {/* Article Modal */}
      <ArticleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
