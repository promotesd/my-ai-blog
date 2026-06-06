import { supabase } from "@/lib/supabase"
import { 
  BookOpen, FolderKanban, MessageSquare, ShieldAlert, Rocket, Users, 
  Briefcase, Wrench, Terminal, Image, Music, Gamepad2, Book, BarChart, History, Milestone,
  TrendingUp, Activity, LayoutDashboard
} from "lucide-react"
import Link from "next/link"
import StatCard from "@/components/dashboard/StatCard"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { VisitorTrendChart, ContentDistributionChart } from "@/components/dashboard/ChartsWrapper"
import { useEffect, useState } from "react"

export const revalidate = 60 // Revalidate data every 60 seconds

async function getDashboardData() {
  const tables = [
    "blogs", "projects", "deployed_projects", "certificates", 
    "work_experiences", "skills", "tech_tools", "timelines", 
    "gallery", "guestbook", "coding_journey", "music", "games"
  ]

  // 1. Fetch counts for all tables
  const countQueries = tables.map(table => 
    supabase.from(table).select("id", { count: "exact", head: true })
  )
  
  // 2. Fetch unique visitors
  const visitorCountQuery = supabase.rpc("count_distinct_visitors")
  
  // 3. Fetch visitor trends (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const visitorTrendsQuery = supabase
    .from('visitor_ip_logs')
    .select('created_at')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  // 4. Fetch recent guestbook activity
  const recentGuestbookQuery = supabase
    .from('guestbook')
    .select('id, name, message, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const [countResults, visitorTotal, trendsResult, guestbookResult] = await Promise.all([
    Promise.all(countQueries),
    visitorCountQuery,
    visitorTrendsQuery,
    recentGuestbookQuery
  ])

  // Process counts
  const stats: Record<string, { count: number; error: any }> = {}
  tables.forEach((table, i) => {
    stats[table] = { count: countResults[i].count || 0, error: countResults[i].error }
  })
  stats["visitors"] = { count: visitorTotal.data || 0, error: visitorTotal.error }

  // Process trends for chart
  const trendsByDay: Record<string, number> = {}
  // Initialize last 7 days with 0
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    trendsByDay[dateStr] = 0
  }

  if (trendsResult.data) {
    trendsResult.data.forEach((log: any) => {
      const dateStr = new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      if (trendsByDay[dateStr] !== undefined) {
        trendsByDay[dateStr]++
      }
    })
  }

  const visitorChartData = Object.entries(trendsByDay).map(([date, count]) => ({
    date,
    count
  }))

  // Process content distribution
  const contentDistribution = [
    { name: 'Blogs', count: stats['blogs'].count, color: '#10B981' },
    { name: 'Projects', count: stats['projects'].count, color: '#3B82F6' },
    { name: 'Gallery', count: stats['gallery'].count, color: '#8B5CF6' },
    { name: 'Skills', count: stats['skills'].count, color: '#F59E0B' },
  ]

  return {
    stats,
    visitorChartData,
    contentDistribution,
    recentActivities: (guestbookResult.data || []).map((g: any) => ({ ...g, type: 'guestbook' }))
  }
}

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>

const EMPTY_DASHBOARD_DATA: DashboardData = {
  stats: {},
  visitorChartData: [],
  contentDistribution: [],
  recentActivities: [],
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(EMPTY_DASHBOARD_DATA)

  useEffect(() => {
    void getDashboardData().then(setData)
  }, [])

  const { stats, visitorChartData, contentDistribution, recentActivities } = data

  const TOP_METRICS = [
    { title: "Total Visitors", key: "visitors", icon: Users, href: "/dashboard/visitor-ip-logs", color: "text-blue-400", bg: "bg-blue-400/10" },
    { title: "Active Projects", key: "projects", icon: FolderKanban, href: "/dashboard/projects", color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { title: "Guestbook", key: "guestbook", icon: MessageSquare, href: "/dashboard/guestbook", color: "text-purple-400", bg: "bg-purple-400/10" },
    { title: "Blog Posts", key: "blogs", icon: BookOpen, href: "/dashboard/blogs", color: "text-amber-400", bg: "bg-amber-400/10" },
  ]

  const MANAGEMENT_GROUPS = [
    {
      title: "Experience & Resume",
      items: [
        { title: "Work Exp", key: "work_experiences", icon: Briefcase, href: "/dashboard/work-experiences" },
        { title: "Timelines", key: "timelines", icon: History, href: "/dashboard/timelines" },
        { title: "Skills", key: "skills", icon: Wrench, href: "/dashboard/skills" },
        { title: "Tech Tools", key: "tech_tools", icon: Terminal, href: "/dashboard/tech-tools" },
        { title: "Journey", key: "coding_journey", icon: Milestone, href: "/dashboard/coding-journey" },
      ]
    },
    {
      title: "Media & Apps",
      items: [
        { title: "Deployed", key: "deployed_projects", icon: Rocket, href: "/dashboard/deploy-projects" },
        { title: "Gallery", key: "gallery", icon: Image, href: "/dashboard/gallery" },
        { title: "Music", key: "music", icon: Music, href: "/dashboard/music" },
        { title: "Games", key: "games", icon: Gamepad2, href: "/dashboard/games" },
        { title: "Certificates", key: "certificates", icon: ShieldAlert, href: "/dashboard/certificates" },
      ]
    }
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-full flex flex-col space-y-8 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="text-accentColor" size={20} />
            <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
          </div>
          <p className="text-sm text-gray-400">Welcome back! Here's what's happening with your portfolio.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-full bg-accentColor/10 border border-accentColor/20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accentColor animate-pulse" />
            <span className="text-[11px] font-medium text-accentColor uppercase tracking-wider">System Live</span>
          </div>
        </div>
      </div>
      
      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TOP_METRICS.map((metric) => (
          <StatCard 
            key={metric.key}
            title={metric.title}
            value={stats[metric.key]?.count ?? 0}
            icon={metric.icon}
            href={metric.href}
            className="hover:scale-[1.02] transition-transform duration-300"
          />
        ))}
      </div>

      {/* Main Grid: Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visitor Chart - 8/12 */}
        <div className="lg:col-span-8 h-[400px]">
          <VisitorTrendChart data={visitorChartData} />
        </div>

        {/* Content Breakdown - 4/12 */}
        <div className="lg:col-span-4 h-[400px]">
          <ContentDistributionChart data={contentDistribution} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Activity - 5/12 */}
        <div className="lg:col-span-5 flex flex-col min-h-[450px]">
          <RecentActivity activities={recentActivities} />
        </div>

        {/* Quick Management - 7/12 */}
        <div className="lg:col-span-7 space-y-6">
          {MANAGEMENT_GROUPS.map((group, idx) => (
            <div key={idx} className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Activity size={14} className="text-accentColor" />
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">
                  {group.title}
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                {group.items.map(stat => (
                  <Link 
                    key={stat.key} 
                    href={stat.href}
                    className="group bg-[#0d1a1a] border border-white/[0.04] p-3 rounded-xl hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-200"
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center group-hover:bg-accentColor/10 transition-colors">
                        <stat.icon className="text-gray-500 group-hover:text-accentColor transition-colors" size={16} />
                      </div>
                      <span className="text-[10px] font-medium text-gray-400 group-hover:text-white transition-colors">{stat.title}</span>
                      <span className="text-xs font-bold text-white">{stats[stat.key]?.count ?? 0}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Portfolio Stats Singleton specific link */}
          <div className="pt-2">
            <Link 
              href="/dashboard/portfolio-stats"
              className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-accentColor/20 to-transparent border border-accentColor/30 hover:brightness-110 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accentColor/20 flex items-center justify-center">
                  <BarChart className="text-accentColor" size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Global Portfolio Config</p>
                  <p className="text-[10px] text-gray-400">Manage years of experience and core metadata</p>
                </div>
              </div>
              <ChevronRight className="text-accentColor group-hover:translate-x-1 transition-transform" size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChevronRight({ className, size }: { className?: string, size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} height={size || 24} 
      viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" strokeWidth="2" 
      strokeLinecap="round" strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  )
}
