"use client"

import { useState } from "react"
import { Blog } from "@/types/blog"
import { Clock, Calendar, Tag } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import TranslateWidget from "@/components/TranslateWidget"
import { useLocale } from "next-intl"
import { getBlogCategoryLabel } from "@/lib/blogCategory"

interface BlogPageCardProps {
  blog: Blog
  view?: "grid" | "list"
}

const ID_MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
]
function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return `${d.getDate()} ${ID_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

export default function BlogPageCard({ blog, view = "grid" }: BlogPageCardProps) {
  const locale = useLocale()
  const author = blog.author ?? { name: "小嘟嘟", type: "developer" as const }
  const authorName = author.name || "小嘟嘟"
  const isDeveloper = author.type === "developer"
  const [translated, setTranslated] = useState<{ title: string; excerpt: string } | null>(null)

  const displayTitle   = translated?.title   ?? blog.title
  const displayExcerpt = translated?.excerpt ?? blog.excerpt

  if (view === "list") {
    return (
      <div className="group block">
        <div className="flex gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 hover:border-accentColor/40 hover:shadow-md transition-all duration-300">
          {/* Thumbnail */}
          <Link href={`/blogs/${blog.id}`} className="shrink-0 w-28 h-20 rounded-lg overflow-hidden">
            <img
              src={blog.thumbnail}
              alt={blog.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs px-2 py-0.5 bg-accentColor/10 text-accentColor rounded-full font-medium">
                {getBlogCategoryLabel(blog.category, locale)}
              </span>
              {isDeveloper && (
                <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium">
                  Author
                </span>
              )}
            </div>
            <Link href={`/blogs/${blog.id}`}>
              <h3 className="text-sm font-semibold dark:text-white line-clamp-2 group-hover:text-accentColor transition-colors">
                {displayTitle}
              </h3>
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
              {displayExcerpt}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar size={11} /> {formatDate(blog.publishedAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={11} /> {blog.readingTime} min read
              </span>
              <TranslateWidget
                fields={{ title: blog.title, excerpt: blog.excerpt }}
                onTranslated={(out) => setTranslated({ title: out.title, excerpt: out.excerpt })}
                onReverted={() => setTranslated(null)}
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group block h-full">
      <article className="h-full flex flex-col rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 hover:border-accentColor/30 hover:shadow-lg dark:hover:shadow-accentColor/5 transition-all duration-300 overflow-hidden">
        {/* Thumbnail */}
        <Link href={`/blogs/${blog.id}`} className="block">
          <div className="relative w-full h-44 overflow-hidden shrink-0">
            <img
              src={blog.thumbnail}
              alt={blog.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <span className="absolute top-3 left-3 text-xs px-2.5 py-1 bg-black/50 backdrop-blur-sm text-white rounded-full font-medium flex items-center gap-1">
              <Tag size={10} /> {getBlogCategoryLabel(blog.category, locale)}
            </span>
          </div>
        </Link>

        {/* Body */}
        <div className="flex flex-col flex-1 p-4">
          <Link href={`/blogs/${blog.id}`}>
            <h3 className="text-sm font-semibold dark:text-white line-clamp-2 mb-2 group-hover:text-accentColor transition-colors leading-snug">
              {displayTitle}
            </h3>
          </Link>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed flex-1">
            {displayExcerpt}
          </p>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
            {/* Author */}
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden",
                  !author.avatar && (isDeveloper
                    ? "bg-accentColor text-white"
                    : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200")
                )}
              >
                {author.avatar ? (
                  <img src={author.avatar} alt={authorName} className="w-full h-full object-cover" />
                ) : (
                  authorName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium dark:text-gray-200 truncate max-w-[90px]">
                    {authorName}
                  </p>
                  {isDeveloper && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-accentColor/15 text-accentColor rounded font-semibold shrink-0">
                      DEV
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                  {formatDate(blog.publishedAt)}
                </p>
              </div>
            </div>
            {/* Reading time + Translate */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                <Clock size={11} />
                {blog.readingTime} min
              </div>
              <TranslateWidget
                fields={{ title: blog.title, excerpt: blog.excerpt }}
                onTranslated={(out) => setTranslated({ title: out.title, excerpt: out.excerpt })}
                onReverted={() => setTranslated(null)}
                size="sm"
              />
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
