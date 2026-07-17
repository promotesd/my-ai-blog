import type { BlogCategory } from "@/types/blog"

export type BlogCategoryFilter = BlogCategory | "All"

const ZH_LABELS: Record<BlogCategoryFilter, string> = {
  All: "全部",
  Technology: "技术",
  General: "综合",
  Tutorial: "教程",
  "Tips & Tricks": "技巧",
  News: "动态",
  Programming: "编程",
  Design: "设计",
  Career: "职业发展",
}

export function getBlogCategoryLabel(category: BlogCategoryFilter, locale: string) {
  return locale === "zh" ? ZH_LABELS[category] : category
}
