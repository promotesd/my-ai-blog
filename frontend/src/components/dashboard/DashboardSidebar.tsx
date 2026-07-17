"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Terminal, BookOpen, LayoutGrid, ShieldAlert, LogOut, FolderKanban, Image, MessageSquare, BookMarked, FileText, History } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "./SidebarContext"

const NAV_ITEMS = [
  { href: "/dashboard", label: "概览", icon: LayoutGrid, exact: true },
  { href: "/dashboard/blogs", label: "博客", icon: BookOpen },
  { href: "/dashboard/diary", label: "日记", icon: BookMarked },
  { href: "/dashboard/projects", label: "项目", icon: FolderKanban },
  { href: "/dashboard/timelines", label: "时间线", icon: History },
  { href: "/dashboard/resume", label: "简历", icon: FileText },
  { href: "/dashboard/gallery", label: "图库", icon: Image },
  { href: "/dashboard/guestbook", label: "留言簿", icon: MessageSquare },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isOpen, close } = useSidebar()

  async function handleLogout() {
    localStorage.removeItem("portfolio-admin-token")
    router.push("/xhub")
  }

  return (
    <aside
      className={cn(
        "w-[220px] h-screen flex flex-col bg-[#0d1a1a] border-r border-white/[0.06] shrink-0",
        // Mobile: fixed drawer
        "fixed top-0 left-0 z-50 transition-transform duration-300 ease-in-out",
        // Desktop: always visible as part of layout
        "md:relative md:translate-x-0 md:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accentColor/20 border border-accentColor/30 flex items-center justify-center shrink-0">
            <Terminal size={15} className="text-accentColor" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-tight truncate">小嘟嘟后台</p>
            <p className="text-[10px] text-gray-500 leading-tight">内容管理</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto scrollbar-none">
        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-2.5 mb-3">
          内容
        </p>
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={close}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "bg-accentColor/15 text-accentColor"
                  : "text-gray-400 hover:bg-white/[0.05] hover:text-gray-200"
              )}
            >
              <Icon size={15} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {active && (
                <span className="w-1.5 h-1.5 rounded-full bg-accentColor" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-5 space-y-2">
        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut size={15} className="shrink-0" />
          <span>退出登录</span>
        </button>

        {/* Warning — sudah diprotect dengan middleware */}
        <div className="rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15 px-3 py-3 flex items-start gap-2">
          <ShieldAlert size={12} className="text-emerald-500/70 mt-0.5 shrink-0" />
          <p className="text-[10px] text-emerald-500/50 leading-relaxed">
            后台接口已启用登录保护。
          </p>
        </div>
      </div>
    </aside>
  )
}
