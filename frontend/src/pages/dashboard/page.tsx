import { useEffect, useState, type ComponentType } from "react"
import Link from "next/link"
import { BookMarked, BookOpen, FileText, FolderKanban, History, Image, LayoutDashboard, MessageSquare, Plus, RefreshCw } from "lucide-react"
import { apiRequest } from "@/services/apiClient"

interface ModuleCard {
  key: string
  title: string
  description: string
  href: string
  api: string
  icon: ComponentType<{ size?: number; className?: string }>
}

const MODULES: ModuleCard[] = [
  { key: "blogs", title: "博客", description: "撰写和发布文章", href: "/dashboard/blogs", api: "/api/blogs", icon: BookOpen },
  { key: "diaries", title: "日记", description: "记录日常和研究过程", href: "/dashboard/diary", api: "/api/diaries", icon: BookMarked },
  { key: "projects", title: "项目", description: "维护课程、研究和工程项目", href: "/dashboard/projects", api: "/api/projects", icon: FolderKanban },
  { key: "gallery", title: "图库", description: "管理照片、相册和访客上传", href: "/dashboard/gallery", api: "/api/gallery/photos", icon: Image },
  { key: "guestbook", title: "留言簿", description: "查看和管理访客留言", href: "/dashboard/guestbook", api: "/api/guestbook", icon: MessageSquare },
  { key: "timelines", title: "时间线", description: "维护教育和成长经历", href: "/dashboard/timelines", api: "/api/timelines", icon: History },
]

const QUICK_LINKS = [
  { title: "上传或更新简历", href: "/dashboard/resume", icon: FileText },
  { title: "撰写新博客", href: "/dashboard/blogs", icon: BookOpen },
  { title: "记录新日记", href: "/dashboard/diary", icon: BookMarked },
]

export default function DashboardPage() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  async function loadCounts() {
    setLoading(true)
    const results = await Promise.allSettled(MODULES.map((module) => apiRequest<unknown[]>(module.api)))
    setCounts(Object.fromEntries(MODULES.map((module, index) => [
      module.key,
      results[index].status === "fulfilled" ? results[index].value.length : 0,
    ])))
    setLoading(false)
  }

  useEffect(() => { void loadCounts() }, [])

  return (
    <div className="mx-auto min-h-full max-w-[1400px] space-y-8 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="text-accentColor" size={20} />
            <h1 className="text-2xl font-bold text-white">后台概览</h1>
          </div>
          <p className="mt-1 text-sm text-gray-400">欢迎回来，小嘟嘟。这里集中管理网站的公开内容。</p>
        </div>
        <button onClick={() => void loadCounts()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-gray-300 hover:bg-white/[0.08] disabled:opacity-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> 刷新数据
        </button>
      </header>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300">内容管理</h2>
          <span className="text-xs text-emerald-400">Spring Boot API 已连接</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {MODULES.map((module) => {
            const Icon = module.icon
            return (
              <Link key={module.key} href={module.href} className="group rounded-lg border border-white/[0.07] bg-[#0d1a1a] p-5 transition-colors hover:border-accentColor/40 hover:bg-white/[0.05]">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accentColor/10 text-accentColor"><Icon size={18} /></span>
                  <span className="text-2xl font-bold text-white">{loading ? "-" : counts[module.key] ?? 0}</span>
                </div>
                <h3 className="mt-4 font-semibold text-white group-hover:text-accentColor">{module.title}</h3>
                <p className="mt-1 text-xs leading-5 text-gray-500">{module.description}</p>
              </Link>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold text-gray-300">快捷入口</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {QUICK_LINKS.map(({ title, href, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-sm text-gray-300 hover:border-accentColor/30 hover:text-white">
              <span className="flex items-center gap-2"><Icon size={15} className="text-accentColor" />{title}</span>
              <Plus size={14} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
