"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useTranslations, useLocale } from "next-intl"
import {
  Layers, ExternalLink, Download, Globe, Smartphone,
  Loader2, ArrowRight, Calendar, Zap, Search, X, ArrowUpDown, Apple, Play
} from "lucide-react"
import { cn } from "@/lib/utils"
import TranslateWidget from "@/components/TranslateWidget"

/* ─── helpers ─── */
function formatDate(d: string, locale: string) {
  if (!d) return ""
  // Menyesuaikan format tanggal dengan bahasa yang sedang aktif
  return new Date(d).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    day: "numeric", 
    month: "short", 
    year: "numeric" 
  })
}

function PlatformBadge({ platform }: { platform: string }) {
  const isWeb = platform?.toLowerCase().includes("web")
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-sm backdrop-blur-md",
      isWeb
        ? "bg-blue-50/90 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-700/50"
        : "bg-emerald-50/90 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50"
    )}>
      {isWeb ? <Globe size={10} /> : <Smartphone size={10} />}
      {platform}
    </span>
  )
}

/* ─── skeleton ─── */
function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="h-48 sm:h-52 bg-gray-200 dark:bg-gray-800" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
        <div className="flex gap-2 pt-3">
          <div className="h-9 bg-gray-200 dark:bg-gray-800 rounded-xl flex-1" />
          <div className="h-9 bg-gray-200 dark:bg-gray-800 rounded-xl w-20" />
        </div>
      </div>
    </div>
  )
}

/* ─── project card ─── */
function ProjectCard({ project, index }: { project: any; index: number }) {
  const t = useTranslations("deployProjects")
  const locale = useLocale()
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  
  // State untuk menyimpan hasil terjemahan dari TranslateWidget
  const [translated, setTranslated] = useState<Record<string, string> | null>(null)
  
  const isWeb = project.platform?.toLowerCase().includes("web")

  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.05 }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  let apkUrl = project.external_apk_url
  if (!apkUrl && project.apk_file_path) {
    apkUrl = ""
  }
  
  const hasDownload = !isWeb && apkUrl

  // Mendefinisikan field mana saja dari project ini yang bisa diterjemahkan.
  // Gunakan useMemo agar object tidak dirender ulang setiap kali state berubah.
  const translateFields = useMemo(() => {
    return {
      title: project.title,
      summary: project.summary,
    }
  }, [project.title, project.summary])

  // Tentukan teks mana yang akan ditampilkan: hasil terjemahan atau teks asli
  const displayTitle = translated?.title || project.title
  const displaySummary = translated?.summary || project.summary

  return (
    <div
      ref={ref}
      className={cn(
        "group flex flex-col rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161D1F] overflow-hidden transition-all duration-500",
        "hover:-translate-y-1.5 hover:shadow-2xl hover:border-accentColor/30",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <Link href={`/deploy-projects/${project.slug}`} className="relative block w-full h-48 sm:h-52 bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
        {project.thumbnail_url ? (
          <Image
            src={project.thumbnail_url}
            alt={displayTitle}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Layers size={40} className="text-gray-300 dark:text-gray-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="absolute top-3 left-3">
          <PlatformBadge platform={project.platform} />
        </div>
        
        {new Date().getTime() - new Date(project.published_at).getTime() < 7 * 24 * 60 * 60 * 1000 && (
          <div className="absolute top-3 right-3 bg-accentColor text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <Zap size={9} /> {t("card_new")}
          </div>
        )}
      </Link>

      <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/deploy-projects/${project.slug}`} className="flex-1">
            <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white leading-tight hover:text-accentColor transition-colors line-clamp-2">
              {displayTitle}
            </h3>
          </Link>

          {/* Menambahkan TranslateWidget di sini */}
          <TranslateWidget
            fields={translateFields}
            onTranslated={(out) => setTranslated(out)}
            onReverted={() => setTranslated(null)}
          />
        </div>

        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 flex-1">
          {displaySummary}
        </p>

        {project.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.tags.slice(0, 3).map((tag: string) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                {tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-400">
                +{project.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 mt-1">
          <Calendar size={10} />
          <span>{t("card_update")}: {formatDate(project.updated_at || project.published_at, locale)}</span>
        </div>

        <div className="flex items-center gap-2 pt-2 mt-auto border-t border-gray-100 dark:border-gray-800/60">
          <div className="flex items-center flex-wrap gap-2">
            {project.demo_url && (
              <a
                href={project.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all"
              >
                {/* YouTube SVG icon */}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="-ml-0.5">
                  <path d="M23.498 6.186a2.994 2.994 0 0 0-2.11-2.116C19.228 3.5 12 3.5 12 3.5s-7.228 0-9.388.57A2.994 2.994 0 0 0 .502 6.186C0 8.353 0 12 0 12s0 3.647.502 5.814a2.994 2.994 0 0 0 2.11 2.116C4.772 20.5 12 20.5 12 20.5s7.228 0 9.388-.57a2.994 2.994 0 0 0 2.11-2.116C24 15.647 24 12 24 12s0-3.647-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                {t("card_btn_demo")}
              </a>
            )}
            {isWeb && project.web_url && (
              <a href={project.web_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all">
                  <Globe size={13} /> {t("card_btn_web")}
              </a>
            )}
            {project.play_store_url && project.platform.toLowerCase().includes("android") && (
              <a href={project.play_store_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-[#f9bb04] hover:bg-[#e0a803] text-black transition-all">
                  <Play size={13} /> {t("card_btn_playstore")}
              </a>
            )}
            {project.app_store_url && project.platform.toLowerCase().includes("ios") && (
              <a href={project.app_store_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all">
                  <Apple size={13} /> {t("card_btn_appstore")}
              </a>
            )}
            {apkUrl && !isWeb && (
              <a href={apkUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-all">
                  <Download size={13} /> {t("card_btn_apk")}
              </a>
            )}
          </div>

          <Link
            href={`/deploy-projects/${project.slug}`}
            className="inline-flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2.5 rounded-xl border transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 ml-auto shrink-0"
          >
            {t("card_btn_detail")} <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ─── stat pill ─── */
function StatPill({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#161D1F] border border-gray-200 dark:border-gray-800 shadow-sm">
      <span className="text-accentColor bg-accentColor/10 p-2 rounded-xl">{icon}</span>
      <div>
        <p className="text-lg font-extrabold text-gray-900 dark:text-white leading-none">{value}</p>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium uppercase tracking-wider">{label}</p>
      </div>
    </div>
  )
}

/* ─── filter tabs ─── */
type FilterType = "All" | "Web" | "Mobile"

function FilterTabs({ active, onChange }: { active: FilterType; onChange: (v: FilterType) => void }) {
  const t = useTranslations("deployProjects")
  const tabs: FilterType[] = ["All", "Web", "Mobile"]
  
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-800">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
            active === tab
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          )}
        >
          {tab === "All" ? `🌐 ${t("filter_all")}` : tab === "Web" ? `💻 ${t("filter_web")}` : `📱 ${t("filter_mobile")}`}
        </button>
      ))}
    </div>
  )
}

/* ─── main page ─── */
export default function DeployProjectsPage() {
  const t = useTranslations("deployProjects")
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const [filter, setFilter] = useState<FilterType>("All")
  const [search, setSearch] = useState("")
  // Menggunakan value yang universal untuk state agar sorting konsisten meski pindah bahasa
  const [sortMode, setSortMode] = useState("newest") 

  useEffect(() => {
    setProjects([])
    setIsLoading(false)
  }, [])

  const filteredProjects = useMemo(() => {
    const result = projects.filter((p) => {
      const searchLower = search.toLowerCase()
      const matchSearch = 
        p.title.toLowerCase().includes(searchLower) ||
        p.summary.toLowerCase().includes(searchLower) ||
        (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(searchLower)))
      
      const matchPlatform = 
        filter === "All" ? true :
        filter === "Web" ? p.platform?.toLowerCase().includes("web") :
        filter === "Mobile" ? !p.platform?.toLowerCase().includes("web") : true

      return matchSearch && matchPlatform
    })

    result.sort((a, b) => {
      if (sortMode === "newest") return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      if (sortMode === "oldest") return new Date(a.published_at).getTime() - new Date(b.published_at).getTime()
      if (sortMode === "az") return a.title.localeCompare(b.title)
      if (sortMode === "za") return b.title.localeCompare(a.title)
      return 0
    })

    return result
  }, [projects, filter, search, sortMode])

  const stats = {
    total: projects.length,
    web: projects.filter((p) => p.platform?.toLowerCase().includes("web")).length,
    mobile: projects.filter((p) => !p.platform?.toLowerCase().includes("web")).length,
  }

  return (
    <div className="min-h-screen bg-baseBackground pb-24">
      <section className="relative flex flex-col justify-center items-center text-center px-5 py-16 sm:py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-accentColor/15 dark:bg-accentColor/8 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-500/15 dark:bg-blue-500/8 rounded-full blur-3xl" />
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-6">
          <Link href="/" className="hover:text-accentColor transition-colors">{t("hero_breadcrumb_home")}</Link>
          <span>•</span>
          <span className="text-accentColor font-medium">{t("hero_breadcrumb_deploy")}</span>
        </div>

        <div className="inline-flex mt-10 md:mt-0 items-center gap-2 px-4 py-1.5 rounded-full bg-accentColor/10 border border-accentColor/30 text-accentColor text-xs sm:text-sm font-semibold mb-5">
          <Zap size={13} /> {t("hero_badge")}
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900 dark:text-white max-w-3xl">
          {t("hero_title_prefix")}{" "}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #0EBD7A 0%, #06d6a0 50%, #48cae4 100%)" }}>
            {t("hero_title_highlight")}
          </span>
        </h1>

        <p className="text-gray-500 dark:text-gray-400 mt-4 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
          {t("hero_desc")}
        </p>

        {!isLoading && (
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <StatPill icon={<Layers size={20} />} value={stats.total} label={t("stat_total")} />
            <StatPill icon={<Globe size={20} />} value={stats.web} label={t("stat_web")} />
            <StatPill icon={<Smartphone size={20} />} value={stats.mobile} label={t("stat_mobile")} />
          </div>
        )}
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        {!isLoading && projects.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <FilterTabs active={filter} onChange={setFilter} />
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("search_placeholder")}
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161D1F] text-sm focus:outline-none focus:ring-2 focus:ring-accentColor/30 focus:border-accentColor transition-all dark:text-white placeholder-gray-400"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="relative shrink-0 hidden sm:block">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <ArrowUpDown size={14} />
                </div>
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value)}
                  className="pl-9 pr-8 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161D1F] text-sm focus:outline-none focus:ring-2 focus:ring-accentColor/30 focus:border-accentColor transition-all dark:text-white cursor-pointer appearance-none"
                >
                  <option value="newest">{t("sort_newest")}</option>
                  <option value="oldest">{t("sort_oldest")}</option>
                  <option value="az">{t("sort_az")}</option>
                  <option value="za">{t("sort_za")}</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {!isLoading && projects.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("showing")} <span className="font-semibold text-accentColor">{filteredProjects.length}</span> {t("from")} <span className="font-semibold">{projects.length}</span> {t("projects")}
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24">
            <Layers size={56} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">{t("empty_title")}</h2>
            <p className="text-gray-500 text-sm">{t("empty_desc")}</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-24 bg-gray-50 dark:bg-gray-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
            <Search size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">{t("empty_search_desc")}</p>
            <button onClick={() => { setFilter("All"); setSearch(""); setSortMode("newest"); }} className="mt-4 text-sm font-semibold text-accentColor hover:underline">
              {t("btn_reset")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredProjects.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
