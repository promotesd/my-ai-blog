"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { portfolioApi } from "@/services/portfolioApi"
import {
  Search, X, Star, ExternalLink, ChevronRight,
  ArrowUpDown, Grid3X3, Filter, Sparkles, CalendarDays,
  Heart, Zap, Layers, Tag, ChevronDown, SlidersHorizontal,
} from "lucide-react"
import {
  SiAndroidstudio, SiIntellijidea, SiNeovim,
  SiFigma, SiCanva, SiFramer,
  SiReact, SiNextdotjs, SiTailwindcss, SiLaravel, SiFlutter,
  SiNodedotjs, SiFastapi, SiBootstrap, SiExpress,
  SiPostgresql, SiMysql, SiMongodb, SiFirebase, SiSupabase, SiRedis,
  SiGit, SiGithub, SiDocker, SiVercel, SiNetlify, SiCloudflare,
  SiGooglechrome, SiBrave, SiPostman, SiObsidian, SiNotion, SiDiscord,
  SiOpenai, SiCodepen, SiStackoverflow, SiExcalidraw, SiWappalyzer, SiUblockorigin,
  SiSpotify, SiYoutube, SiNetflix, SiSteam, SiCrunchyroll, SiBilibili,
  SiSamsung, SiTypescript, SiPython, SiDbeaver, SiRailway, SiPerplexity,
  SiGooglegemini, SiAnthropic, SiGithubcopilot, SiAsus, SiLogitech, SiRazer, SiSony,
} from "react-icons/si"
import { FaCode, FaBriefcase, FaServer, FaDatabase, FaCloud, FaGlobe, FaDesktop, FaWrench, FaFilm, FaRobot, FaMobileAlt, FaHeart, FaStar, FaRegStar, FaCog, FaTerminal, FaSearch } from "react-icons/fa"

import { cn } from "@/lib/utils"
import {
  ALL_TOOL_CATEGORIES, CATEGORY_META, BADGE_META,
  type ToolItem, type ToolCategory, type ToolBadge,
} from "@/data/techStackData"
import TranslateWidget from "@/components/TranslateWidget"

/* ─────────────────────────── ICON MAP ─────────────────────────── */
type IconComp = React.ComponentType<{ className?: string; size?: number }>

const ICON_MAP: Record<string, IconComp> = {
  SiAndroidstudio, SiIntellijidea, SiNeovim,
  SiFigma, SiCanva, 
  SiAdobephotoshop: FaDesktop, SiAdobeillustrator: FaDesktop, SiFramer,
  SiReact, SiNextdotjs, SiTailwindcss, SiLaravel, SiFlutter,
  SiNodedotjs, SiFastapi, SiBootstrap, SiExpress,
  SiPostgresql, SiMysql, SiMongodb, SiFirebase, SiSupabase, SiRedis,
  SiGit, SiGithub, SiDocker, SiVercel, SiNetlify, SiCloudflare,
  SiGooglechrome, SiBrave, SiPostman, SiObsidian, SiNotion, SiDiscord,
  SiOpenai, SiCodepen, SiStackoverflow, SiExcalidraw, SiWappalyzer, SiUblockorigin,
  SiSpotify, SiYoutube, SiNetflix, SiSteam, SiCrunchyroll, SiBilibili,
  SiSamsung, SiTypescript, SiPython, SiDbeaver, SiRailway, SiPerplexity,
  SiGooglegemini, SiAnthropic, SiGithubcopilot, SiAsus, SiLogitech, SiRazer, SiSony,
}

function ToolIcon({ iconKey, iconColor, size = 28, className }: { iconKey: string, iconColor: string, size?: number, className?: string }) {
  const Icon = ICON_MAP[iconKey]
  if (!Icon) {
    return (
      <span className={cn("text-xl font-bold", className)} style={{ color: iconColor }}>
        {iconKey.replace(/^Si|^Fa/, "").slice(0, 2).toUpperCase()}
      </span>
    )
  }
  return (
    <span style={{ color: iconColor }} className="leading-none">
      <Icon size={size} className={className} />
    </span>
  )
}

/* ─────────────────────────── CATEGORY ICON MAP ─────────────────────────── */
const CAT_ICON: Record<string, React.ReactNode> = {
  "Code Editor & IDE": <FaTerminal size={18} />,
  "Design & UI Tools": <FaCog size={18} />,
  "Framework & Library": <SiReact size={18} />,
  "Database & Storage": <FaDatabase size={18} />,
  "DevOps & Cloud": <FaCloud size={18} />,
  "Browser & Extensions": <FaGlobe size={18} />,
  "Software & Aplikasi Desktop": <FaDesktop size={18} />,
  "Website Tools & Online Services": <FaWrench size={18} />,
  "Streaming & Entertainment": <FaFilm size={18} />,
  "AI Tools & Productivity": <FaRobot size={18} />,
  "Hardware & Gadget": <FaMobileAlt size={18} />,
}

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  "Code Editor & IDE": "代码编辑器与 IDE",
  "Design & UI Tools": "设计与 UI 工具",
  "Framework & Library": "框架与库",
  "Database & Storage": "数据库与存储",
  "DevOps & Cloud": "DevOps 与云服务",
  "Browser & Extensions": "浏览器与扩展",
  "Software & Aplikasi Desktop": "桌面软件",
  "Website Tools & Online Services": "网站与在线服务",
  "Streaming & Entertainment": "影音娱乐",
  "AI Tools & Productivity": "AI 与效率工具",
  "Hardware & Gadget": "硬件设备",
}

const CATEGORY_DESCRIPTIONS: Record<ToolCategory, string> = {
  "Code Editor & IDE": "日常写代码使用的编辑器和开发环境",
  "Design & UI Tools": "用于界面、视觉和内容设计的工具",
  "Framework & Library": "前端、后端和应用开发框架",
  "Database & Storage": "数据库、缓存和数据存储方案",
  "DevOps & Cloud": "部署、容器、云服务和自动化工具",
  "Browser & Extensions": "浏览器和开发调试扩展",
  "Software & Aplikasi Desktop": "桌面端效率工具",
  "Website Tools & Online Services": "在线服务和网站工具",
  "Streaming & Entertainment": "影音、游戏和娱乐相关平台",
  "AI Tools & Productivity": "AI 与学习效率工具",
  "Hardware & Gadget": "学习和开发使用的硬件设备",
}

const BADGE_LABELS: Record<ToolBadge, string> = {
  Favorite: "常用",
  "Daily Use": "每天使用",
  Recommended: "推荐",
  "Pernah Dicoba": "试用过",
}

function getCategoryLabel(category: ToolCategory) {
  return CATEGORY_LABELS[category] || category
}

function getCategoryDescription(category: ToolCategory) {
  return CATEGORY_DESCRIPTIONS[category] || CATEGORY_META[category]?.description || ""
}

function getBadgeLabel(badge: ToolBadge) {
  return BADGE_LABELS[badge] || badge
}

/* ─────────────────────────── HOOKS ─────────────────────────── */
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function useCounter(target: number, start: boolean, duration = 1400) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!start) return
    let s: number
    const step = (ts: number) => {
      if (!s) s = ts
      const p = Math.min((ts - s) / duration, 1)
      setV(Math.floor(p * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return v
}

/* ─────────────────────────── COMPONENTS ─────────────────────────── */
function StarRating({ value }: { value: number }) {
  const t = useTranslations("tech")
  const labels = ["", t("rate_tried") || "Pernah Dicoba", t("rate_rare") || "Jarang", t("rate_sometimes") || "Kadang-kadang", t("rate_often") || "Sering", t("rate_daily") || "Setiap Hari"]
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        i < value ? <FaStar key={i} size={10} className="text-yellow-400" /> : <FaRegStar key={i} size={10} className="text-gray-300 dark:text-gray-600" />
      ))}
      <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">{labels[value]}</span>
    </div>
  )
}

function BadgeChip({ badge }: { badge: ToolBadge }) {
  const meta = BADGE_META[badge] || { bg: "bg-gray-100", color: "text-gray-800", border: "border-gray-200", emoji: "📌" }
  const t = useTranslations("tech")
  const translatedBadge = t(`badge_${badge.toLowerCase().replace(/\s+/g, "_")}`) || getBadgeLabel(badge)

  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border", meta.color, meta.bg, meta.border)}>
      {meta.emoji} {translatedBadge}
    </span>
  )
}

/* ─────────────────────────── SKELETON ─────────────────────────── */
function TechStackSkeleton() {
  return (
    <div className="space-y-16 w-full animate-pulse">
      <div className="h-14 bg-gray-200 dark:bg-gray-800 rounded-xl w-full" />
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800" />
          <div className="space-y-2">
            <div className="w-32 h-5 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="w-48 h-3 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-[240px] rounded-2xl bg-gray-200 dark:bg-gray-800 border border-gray-100 dark:border-gray-800/50" />
          ))}
        </div>
      </section>
    </div>
  )
}

/* ─────────────────────────── TOOL CARD ─────────────────────────── */
function ToolCard({ tool, delay = 0 }: { tool: ToolItem; delay?: number }) {
  const { ref, inView } = useInView(0.05)
  const t = useTranslations("tech")
  const [translated, setTranslated] = useState<Record<string, string> | null>(null)
  const [isDescExpanded, setIsDescExpanded] = useState(false)

  const translateFields = useMemo(() => {
    const fields: Record<string, string> = { description: tool.description }
    if (tool.detail) fields.detail = tool.detail
    return fields
  }, [tool])

  const description = translated?.description || tool.description
  const detail = translated?.detail || tool.detail

  return (
    <div
      ref={ref}
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-white dark:bg-gray-900 overflow-hidden transition-all duration-500",
        "hover:-translate-y-1 hover:shadow-xl",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 0 1px ${tool.iconColor}40, 0 20px 40px -12px ${tool.iconColor}30` }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "" }}
    >
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${tool.iconColor}cc, ${tool.iconColor}44)` }} />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" style={{ background: `radial-gradient(circle at 50% 0%, ${tool.iconColor}08 0%, transparent 70%)` }} />

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${tool.iconColor}15`, border: `1px solid ${tool.iconColor}30` }}>
            <ToolIcon iconKey={tool.iconKey} iconColor={tool.iconColor} size={24} />
          </div>
          <div className="flex flex-col items-end gap-2">
            {tool.isFavorite && <FaHeart size={13} className="text-rose-400 shrink-0" />}
          </div>
        </div>

        <div className="space-y-1.5">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{tool.name}</h3>
          <BadgeChip badge={tool.badge} />
        </div>

        <div className="flex-1 flex flex-col items-start gap-1">
          <p className={cn(
            "text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed transition-all",
            !isDescExpanded && "line-clamp-2 sm:line-clamp-none"
          )}>
            {description}
          </p>
          <button
            onClick={() => setIsDescExpanded(!isDescExpanded)}
            className="sm:hidden text-[10px] text-accentColor font-medium py-1"
          >
            {isDescExpanded ? "收起" : "展开"}
          </button>
        </div>

        {detail && <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg">{detail}</p>}

        <TranslateWidget className="w-fit" fields={translateFields} onTranslated={setTranslated} onReverted={() => setTranslated(null)} />

        <StarRating value={tool.usageRating} />

        <div className="flex flex-wrap gap-1">
          {tool.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">{tag}</span>
          ))}
        </div>

        <a
          href={tool.officialUrl} target="_blank" rel="noopener noreferrer"
          className="mt-auto inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all duration-200 hover:text-white group/btn"
          style={{ borderColor: `${tool.iconColor}50`, color: tool.iconColor }}
          onMouseEnter={(e) => { const el = e.currentTarget; el.style.background = tool.iconColor; el.style.borderColor = tool.iconColor; el.style.color = "#fff"; }}
          onMouseLeave={(e) => { const el = e.currentTarget; el.style.background = ""; el.style.borderColor = `${tool.iconColor}50`; el.style.color = tool.iconColor; }}
        >
          <ExternalLink size={10} /> {t("btn_visit") || "访问"}
        </a>
      </div>
    </div>
  )
}

function FeaturedCard({ tool, index }: { tool: ToolItem; index: number }) {
  const { ref, inView } = useInView(0.1)
  const t = useTranslations("tech")
  const [translated, setTranslated] = useState<Record<string, string> | null>(null)

  const translateFields = useMemo(() => ({ description: tool.description }), [tool])
  const description = translated?.description || tool.description

  return (
    <div
      ref={ref}
      className={cn(
        "group relative rounded-2xl border bg-white dark:bg-gray-900 overflow-hidden transition-all duration-700",
        "hover:-translate-y-2 hover:shadow-2xl",
        inView ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )}
      style={{ transitionDelay: inView ? `${index * 80}ms` : "0ms" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${tool.iconColor}60, 0 25px 50px -12px ${tool.iconColor}40` }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "" }}
    >
      <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300" style={{ background: `radial-gradient(circle at top left, ${tool.iconColor}, transparent 70%)` }} />
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-50 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/60">
          ⭐ {t("top_pick") || "Top Pick"}
        </span>
      </div>

      <div className="p-6 space-y-4 relative">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${tool.iconColor}15`, border: `1.5px solid ${tool.iconColor}30` }}>
          <ToolIcon iconKey={tool.iconKey} iconColor={tool.iconColor} size={32} />
        </div>
        <div>
          <h3 className="font-extrabold text-base text-gray-900 dark:text-white">{tool.name}</h3>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
            {CATEGORY_META[tool.category]?.emoji || "🔹"} {getCategoryLabel(tool.category)}
          </p>
        </div>
        <BadgeChip badge={tool.badge} />
        <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3 md:line-clamp-none">{description}</p>
        <TranslateWidget className="w-fit" fields={translateFields} onTranslated={setTranslated} onReverted={() => setTranslated(null)} />
        <StarRating value={tool.usageRating} />
        <a href={tool.officialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl text-white transition-all duration-200 hover:opacity-90 hover:scale-105" style={{ background: tool.iconColor }}>
          <ExternalLink size={11} /> {t("btn_visit_web") || "访问网站"}
        </a>
      </div>
    </div>
  )
}

function CategorySection({ category, items }: { category: ToolCategory; items: ToolItem[] }) {
  const [expanded, setExpanded] = useState(false)
  const { ref, inView } = useInView(0.05)
  const t = useTranslations("tech")
  const LIMIT = 8
  const visible = expanded ? items : items.slice(0, LIMIT)
  const meta = CATEGORY_META[category] || { emoji: "🔹", description: "" }

  return (
    <section id={`cat-${category.replace(/\s+/g, "-").toLowerCase()}`} className="space-y-5">
      <div ref={ref} className={cn("flex items-center justify-between transition-all duration-500", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
            {CAT_ICON[category] || <FaWrench size={18} />}
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {meta.emoji} {getCategoryLabel(category)}
              <span className="text-xs font-normal text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{items.length}</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{getCategoryDescription(category)}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {visible.map((tool, i) => <ToolCard key={tool.id} tool={tool} delay={i * 50} />)}
      </div>
      {items.length > LIMIT && (
        <div className="flex justify-center pt-2">
          <button onClick={() => setExpanded((v) => !v)} className="inline-flex items-center gap-2 text-sm font-medium text-accentColor hover:underline transition-all">
            {expanded ? (<>{t("hide") || "收起"} <ChevronRight size={14} className="rotate-90" /></>) : (<>{t("view_all") || "查看全部"} ({items.length - LIMIT} {t("others") || "个其他工具"}) <ChevronRight size={14} className="-rotate-90" /></>)}
          </button>
        </div>
      )}
    </section>
  )
}

function StatCard({ icon, value, label, start, isLoading }: { icon: React.ReactNode; value: number; label: string; start: boolean; isLoading: boolean }) {
  const count = useCounter(value, start)
  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none min-w-[120px]">
      <div className="w-9 h-9 rounded-xl bg-accentColor/10 dark:bg-accentColor/20 flex items-center justify-center text-accentColor">{icon}</div>
      <span className="text-2xl font-extrabold text-gray-900 dark:text-white tabular-nums">
        {isLoading ? (
          <div className="w-10 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ) : (
          count
        )}
      </span>
      <span className="text-[11px] text-gray-500 dark:text-white/70 text-center">{label}</span>
    </div>
  )
}

function HeroSection({ stats, isLoading, onScrollDown }: { stats: { total: number, favorites: number, dailyUse: number, categories: number }, isLoading: boolean, onScrollDown: () => void }) {
  const [mounted, setMounted] = useState(false)
  const { ref: statsRef, inView: statsInView } = useInView(0.3)
  const t = useTranslations("tech")

  useEffect(() => { const time = setTimeout(() => setMounted(true), 100); return () => clearTimeout(time) }, [])

  return (
    <section className="relative min-h-[65vh] flex flex-col justify-center items-center text-center overflow-hidden px-6 py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-accentColor/20 dark:bg-accentColor/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl" />
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-8">
        <Link href="/" className="hover:text-accentColor transition-colors">{t("breadcrumb_home") || "首页"}</Link><span>•</span>
        <span className="text-accentColor font-medium">{t("breadcrumb_tech") || "技术栈"}</span>
      </div>
      <div className={cn("space-y-4 max-w-3xl transition-all duration-700", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accentColor/10 border border-accentColor/30 text-accentColor text-sm font-medium">
          <Layers size={14} /> {t("hero_badge") || "工具、软件与平台"}
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
          <span className="text-gray-900 dark:text-white">{t("hero_title_prefix") || "我的"}</span>
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #0EBD7A 0%, #06d6a0 40%, #48cae4 100%)" }}>
            {t("hero_title_highlight") || "技术栈"}
          </span>
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          {t("hero_desc") || "这里记录我后续会使用和整理的开发工具、软件与平台。"}
        </p>
      </div>
      <div ref={statsRef} className="flex flex-wrap justify-center gap-3 mt-12">
        <StatCard icon={<Grid3X3 size={18} />} value={stats.total} label={t("stat_total") || "工具总数"} start={statsInView} isLoading={isLoading} />
        <StatCard icon={<FaHeart size={16} />} value={stats.favorites} label={t("stat_favorites") || "常用"} start={statsInView} isLoading={isLoading} />
        <StatCard icon={<Zap size={18} />} value={stats.dailyUse} label={t("stat_daily") || "每天使用"} start={statsInView} isLoading={isLoading} />
        <StatCard icon={<Tag size={18} />} value={stats.categories} label={t("stat_categories") || "分类"} start={statsInView} isLoading={isLoading} />
      </div>
      <button onClick={onScrollDown} className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-accentColor transition-colors">
        <span className="text-[10px] uppercase tracking-widest">{t("scroll") || "向下浏览"}</span>
        <span className="w-5 h-8 border-2 border-current rounded-full flex items-start justify-center pt-1"><span className="w-1 h-1.5 bg-current rounded-full animate-bounce" /></span>
      </button>
    </section>
  )
}

function TagCloud({ tags, onTagClick, activeTag }: { tags: { tag: string, count: number }[], onTagClick: (tag: string) => void, activeTag: string | null }) {
  const { ref, inView } = useInView(0.1)
  const max = tags[0]?.count ?? 1
  const t = useTranslations("tech")
  const TAG_COLORS = [
    "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60",
    "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60",
    "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60",
    "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/60",
    "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60",
    "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60",
    "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800/60",
    "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60",
  ]

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-2">
        <Tag size={18} className="text-accentColor" />
        <h2 className="font-bold text-gray-900 dark:text-white">{t("tag_cloud_title") || "标签云"}</h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">{t("tag_cloud_desc") || "点击标签筛选工具"}</span>
      </div>
      <div ref={ref} className="flex flex-wrap gap-2 justify-center py-4">
        {tags.map(({ tag, count }, i) => {
          const sizeScale = 0.75 + (count / max) * 0.5
          const colorClass = TAG_COLORS[i % TAG_COLORS.length]
          return (
            <button
              key={tag} onClick={() => onTagClick(tag)}
              className={cn("inline-flex items-center gap-1 px-3 py-1 rounded-full border font-medium transition-all duration-200 hover:scale-110 hover:shadow-md", activeTag === tag ? "ring-2 ring-accentColor ring-offset-1 scale-110" : "", colorClass, inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}
              style={{ fontSize: `${sizeScale * 12}px`, transitionDelay: inView ? `${i * 20}ms` : "0ms" }}
            >
              {tag} <span className="text-[9px] opacity-60">({count})</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

/* ─────────────────────────── FILTER TOOLBAR (COMPACT STICKY) ─────────────────────────── */
type SortMode = "A–Z" | "Z–A" | "Most Used" | "Favorite First"
type BadgeFilter = "All" | ToolBadge

const SORT_OPTIONS: SortMode[] = ["A–Z", "Z–A", "Most Used", "Favorite First"]
const BADGE_FILTERS: BadgeFilter[] = ["All", "Favorite", "Daily Use", "Recommended", "Pernah Dicoba"]

interface FilterToolbarProps {
  search: string
  setSearch: (v: string) => void
  activeCategory: ToolCategory | "All" | "Favorites"
  setActiveCategory: (v: ToolCategory | "All" | "Favorites") => void
  activeBadge: BadgeFilter
  setActiveBadge: (v: BadgeFilter) => void
  sortMode: SortMode
  setSortMode: (v: SortMode) => void
  activeTag: string | null
  setActiveTag: (v: string | null) => void
  filtered: ToolItem[]
  totalTools: number
  clearFilters: () => void
  isFiltering: boolean | string | null
  t: ReturnType<typeof useTranslations>
}

function FilterToolbar({
  search, setSearch,
  activeCategory, setActiveCategory,
  activeBadge, setActiveBadge,
  sortMode, setSortMode,
  activeTag, setActiveTag,
  filtered, totalTools,
  clearFilters, isFiltering, t,
}: FilterToolbarProps) {
  const [showCategoryPanel, setShowCategoryPanel] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showBadgeMenu, setShowBadgeMenu] = useState(false)

  const sortRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const categoryPanelRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortMenu(false)
      if (badgeRef.current && !badgeRef.current.contains(e.target as Node)) setShowBadgeMenu(false)
      if (categoryPanelRef.current && !categoryPanelRef.current.contains(e.target as Node)) setShowCategoryPanel(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const getSortModeTranslation = (mode: SortMode) => {
    if (mode === "Most Used") return t("sort_most_used") || "最常用"
    if (mode === "Favorite First") return t("sort_favorite_first") || "常用优先"
    return mode
  }

  const activeCategoryLabel =
    activeCategory === "All"
      ? t("cat_all") || "全部"
      : activeCategory === "Favorites"
      ? t("cat_favorites") || "常用"
      : (CATEGORY_META[activeCategory as ToolCategory]?.emoji || "🔹") + " " + getCategoryLabel(activeCategory as ToolCategory)

  const hasActiveFilters = search || activeCategory !== "All" || activeBadge !== "All" || activeTag

  return (
    <div className="sticky top-[4.5rem] z-40 bg-baseBackground/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
      {/* ── SINGLE COMPACT ROW ── */}
      <div className="flex items-center gap-2 px-0 py-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search_placeholder") || "搜索工具..."}
            className="w-full pl-8 pr-8 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accentColor/40 focus:border-accentColor transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Category Toggle Button */}
        <div ref={categoryPanelRef} className="relative shrink-0">
          <button
            onClick={() => setShowCategoryPanel((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all whitespace-nowrap",
              activeCategory !== "All"
                ? "bg-accentColor text-white border-accentColor"
                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-accentColor/50"
            )}
          >
            <Grid3X3 size={12} />
            <span className="hidden sm:inline max-w-[120px] truncate">{activeCategoryLabel}</span>
            <ChevronDown size={11} className={cn("transition-transform duration-200", showCategoryPanel && "rotate-180")} />
          </button>

          {/* Category dropdown panel */}
          {showCategoryPanel && (
            <div className="absolute left-0 top-full mt-1 w-64 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-hidden">
              <div className="p-2 max-h-[60vh] overflow-y-auto overscroll-contain">
                <button
                  onClick={() => { setActiveCategory("All"); setShowCategoryPanel(false) }}
                  className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left", activeCategory === "All" ? "bg-accentColor text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800")}
                >
                  🌐 {t("cat_all") || "全部"}
                  <span className={cn("ml-auto text-[10px] px-1.5 py-0.5 rounded-full", activeCategory === "All" ? "bg-white/20" : "bg-gray-100 dark:bg-gray-800 text-gray-500")}>{totalTools}</span>
                </button>
                <button
                  onClick={() => { setActiveCategory("Favorites"); setShowCategoryPanel(false) }}
                  className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left mt-1", activeCategory === "Favorites" ? "bg-rose-500 text-white" : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10")}
                >
                  ⭐ {t("cat_favorites") || "常用"}
                </button>
                <div className="h-px bg-gray-100 dark:bg-gray-800 my-2" />
                {ALL_TOOL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setActiveCategory(cat as ToolCategory); setShowCategoryPanel(false) }}
                    className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left", activeCategory === cat ? "bg-accentColor text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800")}
                  >
                    {CATEGORY_META[cat as ToolCategory]?.emoji || "🔹"} {getCategoryLabel(cat as ToolCategory)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Badge Filter */}
        <div ref={badgeRef} className="relative shrink-0">
          <button
            onClick={() => setShowBadgeMenu((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all",
              activeBadge !== "All" ? "bg-accentColor text-white border-accentColor" : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-accentColor/50"
            )}
          >
            <Filter size={12} />
            <span className="hidden sm:inline">{activeBadge === "All" ? t("cat_all") || "全部" : getBadgeLabel(activeBadge)}</span>
          </button>
          {showBadgeMenu && (
            <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl z-50 overflow-hidden">
              {BADGE_FILTERS.map((b) => (
                <button
                  key={b}
                  onClick={() => { setActiveBadge(b); setShowBadgeMenu(false) }}
                  className={cn("w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-800", activeBadge === b ? "text-accentColor font-semibold" : "text-gray-700 dark:text-gray-300")}
                >
                  {b === "All" ? `🔘 ${t("cat_all") || "全部"}` : `${BADGE_META[b as ToolBadge]?.emoji || ""} ${getBadgeLabel(b as ToolBadge)}`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort */}
        <div ref={sortRef} className="relative shrink-0 hidden sm:block">
          <button
            onClick={() => setShowSortMenu((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-accentColor/50 transition-all"
          >
            <ArrowUpDown size={12} />
            <span className="hidden lg:inline">{getSortModeTranslation(sortMode)}</span>
          </button>
          {showSortMenu && (
            <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl z-50 overflow-hidden">
              {SORT_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setSortMode(s); setShowSortMenu(false) }}
                  className={cn("w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-800", sortMode === s ? "text-accentColor font-semibold" : "text-gray-700 dark:text-gray-300")}
                >
                  {getSortModeTranslation(s)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clear filters — only show when filtering */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-medium text-red-500 border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
          >
            <X size={11} />
            <span className="hidden sm:inline">{t("reset") || "重置"}</span>
          </button>
        )}
      </div>

      {/* ── RESULT COUNT + ACTIVE FILTERS (minimal, single line) ── */}
      {(hasActiveFilters || activeTag) && (
        <div className="flex items-center gap-2 pb-2 flex-wrap">
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-accentColor">{filtered.length}</span>
            {" "}{t("from") || "共"}{" "}
            <span className="font-semibold">{totalTools}</span>{" "}
            {t("tools") || "个工具"}
          </p>
          {activeTag && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-accentColor/10 text-accentColor border border-accentColor/30">
              <Tag size={9} /> {activeTag}
              <button onClick={() => setActiveTag(null)} className="ml-0.5 hover:opacity-70"><X size={9} /></button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────── MAIN PAGE COMPONENT ─────────────────────────── */
export default function TechStackPage() {
  const t = useTranslations("tech")
  const [toolsData, setToolsData] = useState<ToolItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "All" | "Favorites">("All")
  const [activeBadge, setActiveBadge] = useState<BadgeFilter>("All")
  const [sortMode, setSortMode] = useState<SortMode>("A–Z")
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const contentRef = useRef<HTMLDivElement>(null)

  /* FETCH */
  useEffect(() => {
    async function fetchTools() {
      try {
        const data = await portfolioApi.list<ToolItem & { id: number }>("tech-tools")
        setToolsData(data as ToolItem[])
      } catch (error) {
        console.error("获取技术栈数据失败:", error)
      }
      setIsLoading(false)
    }
    fetchTools()
  }, [])

  const dynamicStats = useMemo(() => {
    const categoriesSet = new Set(toolsData.map(t => t.category))
    return {
      total: toolsData.length,
      favorites: toolsData.filter(t => t.isFavorite).length,
      dailyUse: toolsData.filter(t => t.badge === "Daily Use").length,
      categories: categoriesSet.size,
    }
  }, [toolsData])

  const dynamicTags = useMemo(() => {
    const tagMap = new Map<string, number>()
    toolsData.forEach(tool => {
      (tool.tags || []).forEach(tag => tagMap.set(tag, (tagMap.get(tag) || 0) + 1))
    })
    return Array.from(tagMap.entries()).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count)
  }, [toolsData])

  const handleScrollDown = useCallback(() => contentRef.current?.scrollIntoView({ behavior: "smooth" }), [])

  const filtered = useMemo(() => {
    let items = [...toolsData]
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(tool =>
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        (tool.tags || []).some(tag => tag.toLowerCase().includes(q)) ||
        tool.category.toLowerCase().includes(q)
      )
    }
    if (activeCategory === "Favorites") {
      items = items.filter(tool => tool.isFavorite)
    } else if (activeCategory !== "All") {
      items = items.filter(tool => tool.category === activeCategory)
    }
    if (activeBadge !== "All") items = items.filter(tool => tool.badge === activeBadge)
    if (activeTag) items = items.filter(tool => (tool.tags || []).includes(activeTag))

    switch (sortMode) {
      case "A–Z": items.sort((a, b) => a.name.localeCompare(b.name)); break
      case "Z–A": items.sort((a, b) => b.name.localeCompare(a.name)); break
      case "Most Used": items.sort((a, b) => b.usageRating - a.usageRating); break
      case "Favorite First": items.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0)); break
    }
    return items
  }, [toolsData, search, activeCategory, activeBadge, sortMode, activeTag])

  const grouped = useMemo(() => {
    if (activeCategory !== "All") return null
    const map = new Map<ToolCategory, ToolItem[]>()
    filtered.forEach((item) => {
      const arr = map.get(item.category as ToolCategory) ?? []
      arr.push(item)
      map.set(item.category as ToolCategory, arr)
    })
    return map
  }, [filtered, activeCategory])

  const isFiltering = search || activeCategory !== "All" || activeBadge !== "All" || activeTag

  const handleTagClick = useCallback((tag: string) => {
    setActiveTag((prev) => (prev === tag ? null : tag))
    setActiveCategory("All")
  }, [])

  const clearFilters = () => {
    setSearch("")
    setActiveCategory("All")
    setActiveBadge("All")
    setActiveTag(null)
    setSortMode("A–Z")
  }

  return (
    <div className="min-h-screen bg-baseBackground">
      <HeroSection stats={dynamicStats} isLoading={isLoading} onScrollDown={handleScrollDown} />

      <div ref={contentRef} className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 pt-8">
        {isLoading ? (
          <TechStackSkeleton />
        ) : toolsData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Layers size={60} className="text-gray-300 dark:text-gray-700 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">暂无技术栈条目</h2>
            <p className="text-gray-500">后续整理技能和工具时会在这里补充。</p>
          </div>
        ) : (
          <>
            <FilterToolbar
              search={search} setSearch={setSearch}
              activeCategory={activeCategory} setActiveCategory={setActiveCategory}
              activeBadge={activeBadge} setActiveBadge={setActiveBadge}
              sortMode={sortMode} setSortMode={setSortMode}
              activeTag={activeTag} setActiveTag={setActiveTag}
              filtered={filtered} totalTools={toolsData.length}
              clearFilters={clearFilters} isFiltering={isFiltering}
              t={t}
            />

            {/* ── CONTENT AREA — given top padding so cards are not hidden behind toolbar ── */}
            <div className="mt-8">
              {isFiltering ? (
                filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <FaSearch size={36} className="text-gray-300 dark:text-gray-700" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{t("empty_state") || "没有符合筛选条件的工具。"}</p>
                    <button onClick={clearFilters} className="text-sm text-accentColor hover:underline">{t("reset_filter") || "重置筛选"}</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filtered.map((tool, i) => <ToolCard key={tool.id} tool={tool} delay={i * 30} />)}
                  </div>
                )
              ) : (
                <div className="space-y-16">
                  {ALL_TOOL_CATEGORIES.map((cat) => {
                    const items = grouped?.get(cat as ToolCategory) ?? []
                    if (!items.length) return null
                    return <CategorySection key={cat} category={cat as ToolCategory} items={items} />
                  })}
                </div>
              )}
            </div>

            <div className="mt-20 pt-12 border-t border-gray-200 dark:border-gray-800">
              <TagCloud tags={dynamicTags} onTagClick={handleTagClick} activeTag={activeTag} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
