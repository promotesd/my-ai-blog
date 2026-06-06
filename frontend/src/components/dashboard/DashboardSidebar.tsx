"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Terminal, BookOpen, LayoutGrid, ShieldAlert, LogOut, FolderKanban, BarChart, Wrench, Rocket, Milestone, Briefcase, Image, Music, Gamepad2, MessageSquare, BookMarked } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "./SidebarContext"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/dashboard/blogs", label: "Blogs", icon: BookOpen },
  { href: "/dashboard/diary", label: "Diary", icon: BookMarked },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/deploy-projects", label: "Deployed Projects", icon: Rocket },
  { href: "/dashboard/certificates", label: "Certificates", icon: ShieldAlert },
  { href: "/dashboard/timelines", label: "Timelines", icon: LayoutGrid },
  { href: "/dashboard/tech-tools", label: "Tech Tools", icon: Terminal },
  { href: "/dashboard/skills", label: "Skills", icon: Wrench },
  { href: "/dashboard/portfolio-stats", label: "Portfolio Stats", icon: BarChart },
  { href: "/dashboard/coding-journey", label: "Coding Journey", icon: Milestone },
  { href: "/dashboard/work-experiences", label: "Work Experiences", icon: Briefcase },
  { href: "/dashboard/gallery", label: "Gallery", icon: Image },
  { href: "/dashboard/music", label: "Music", icon: Music },
  { href: "/dashboard/games", label: "Games Library", icon: Gamepad2 },
  { href: "/dashboard/books", label: "Books Library", icon: BookOpen },
  { href: "/dashboard/guestbook", label: "Guestbook", icon: MessageSquare },
  { href: "/dashboard/visitor-ip-logs", label: "Visitor IP Logs", icon: ShieldAlert },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isOpen, close } = useSidebar()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/xhub")
    router.refresh()
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
            <p className="text-sm font-bold text-white leading-tight truncate">Dev Dashboard</p>
            <p className="text-[10px] text-gray-500 leading-tight">Supabase Manager</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto scrollbar-none">
        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-2.5 mb-3">
          Content
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
          <span>Logout</span>
        </button>

        {/* Warning — sudah diprotect dengan middleware */}
        <div className="rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15 px-3 py-3 flex items-start gap-2">
          <ShieldAlert size={12} className="text-emerald-500/70 mt-0.5 shrink-0" />
          <p className="text-[10px] text-emerald-500/50 leading-relaxed">
            Protected by middleware auth.
          </p>
        </div>
      </div>
    </aside>
  )
}
