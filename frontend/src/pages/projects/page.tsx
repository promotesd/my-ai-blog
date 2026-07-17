"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { gsap } from "gsap"
import { ExternalLink, FlaskConical, Search, Wrench } from "lucide-react"
import { SiGithub } from "react-icons/si"
import { useTranslations } from "next-intl"
import { apiRequest } from "@/services/apiClient"
import { useLanguageStore } from "@/stores/LanguageStore"
import type { GitHubRepo } from "@/types/github"

type Category = "all" | "research" | "development"

interface PortfolioProject {
  id: number | string
  title: string
  description?: string
  category?: string
  tags?: string[]
  tech_stack?: string[]
  github_url?: string
  repo_url?: string
  live_url?: string
  updated_at?: string
}

interface ProjectItem {
  id: string
  title: string
  description: string
  category: Exclude<Category, "all">
  tags: string[]
  language?: string | null
  stars?: number
  forks?: number
  updatedAt?: string
  source: "github" | "site"
  sourceUrl?: string
  liveUrl?: string
}

const RESEARCH_KEYWORDS = [
  "slam",
  "lidar",
  "navigation",
  "robot",
  "turtlebot",
  "vio",
  "vins",
  "imu",
  "reinforcement-learning",
]

const ROADMAP_TAGS = [
  "基础理论",
  "特征法 SLAM",
  "地磁导航",
  "LiDAR / Visual-LiDAR",
  "VIO / VINS",
]

function classifyRepo(repo: GitHubRepo): Exclude<Category, "all"> {
  const searchable = `${repo.name} ${repo.description ?? ""} ${(repo.topics ?? []).join(" ")}`.toLowerCase()
  return RESEARCH_KEYWORDS.some((keyword) => searchable.includes(keyword)) ? "research" : "development"
}

function repoTags(repo: GitHubRepo) {
  if (repo.name.toLowerCase() === "slam-lidar-learning-roadmap") return ROADMAP_TAGS

  const tags = [...(repo.topics ?? [])]
  if (repo.name.toLowerCase().includes("turtlebot")) tags.unshift("TurtleBot 4", "ROS 2")
  if (repo.name.toLowerCase().includes("navigation")) tags.unshift("Robot Navigation")
  if (repo.language) tags.push(repo.language)
  return [...new Set(tags)].slice(0, 6)
}

function fromRepo(repo: GitHubRepo): ProjectItem {
  return {
    id: `github-${repo.id}`,
    title: repo.name,
    description: repo.description ?? "",
    category: classifyRepo(repo),
    tags: repoTags(repo),
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    updatedAt: repo.updated_at,
    source: "github",
    sourceUrl: repo.html_url,
    liveUrl: repo.homepage || undefined,
  }
}

function fromPortfolio(project: PortfolioProject): ProjectItem {
  const rawCategory = (project.category ?? "").toLowerCase()
  return {
    id: `site-${project.id}`,
    title: project.title,
    description: project.description ?? "",
    category: rawCategory.includes("research") || rawCategory.includes("研究") ? "research" : "development",
    tags: [...new Set([...(project.tags ?? []), ...(project.tech_stack ?? [])])].slice(0, 6),
    updatedAt: project.updated_at,
    source: "site",
    sourceUrl: project.github_url || project.repo_url,
    liveUrl: project.live_url,
  }
}

export default function ProjectsPage() {
  const t = useTranslations("projectsPage")
  const { locale } = useLanguageStore()
  const heroRef = useRef<HTMLDivElement>(null)
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [activeTab, setActiveTab] = useState<Category>("all")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    const context = gsap.context(() => {
      gsap.fromTo(".project-hero", { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65, stagger: 0.08 })
    }, heroRef)
    return () => context.revert()
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.allSettled([
      apiRequest<GitHubRepo[]>("/api/github-repos"),
      apiRequest<PortfolioProject[]>("/api/projects"),
    ]).then(([githubResult, siteResult]) => {
      if (cancelled) return
      const repos = githubResult.status === "fulfilled" ? githubResult.value : []
      const siteProjects = siteResult.status === "fulfilled" ? siteResult.value : []
      const githubProjects = repos
        .filter((repo) => !["promotesd"].includes(repo.name.toLowerCase()))
        .map(fromRepo)
      setProjects([...siteProjects.map(fromPortfolio), ...githubProjects])
      setLoadError(githubResult.status === "rejected" && siteResult.status === "rejected")
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return projects.filter((project) => {
      const categoryMatches = activeTab === "all" || project.category === activeTab
      const textMatches = !keyword || `${project.title} ${project.description} ${project.tags.join(" ")}`.toLowerCase().includes(keyword)
      return categoryMatches && textMatches
    })
  }, [activeTab, projects, query])

  const groups = activeTab === "all"
    ? (["research", "development"] as const)
    : ([activeTab] as const)

  return (
    <main className="min-h-screen bg-gray-50 pt-[4.5rem] dark:bg-[#0d1417]">
      <section ref={heroRef} className="border-b border-gray-200 bg-white px-[5%] py-14 dark:border-gray-800 dark:bg-[#111a1d]">
        <div className="mx-auto max-w-[1100px]">
          <h1 className="project-hero text-4xl font-semibold text-gray-900 dark:text-white md:text-5xl">
            <span className="text-accentColor">{t("hero_title_1")}</span> {t("hero_title_2")}
          </h1>
          <p className="project-hero mt-4 max-w-2xl text-gray-500 dark:text-gray-400">{t("hero_sub")}</p>
        </div>
      </section>

      <section className="sticky top-[4.5rem] z-40 border-b border-gray-200 bg-gray-50/95 px-[5%] backdrop-blur dark:border-gray-800 dark:bg-[#0d1417]/95">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {([
              { id: "all", label: t("tab_all") },
              { id: "research", label: t("tab_research") },
              { id: "development", label: t("tab_development") },
            ] as const).map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded-md px-4 py-2 text-sm font-medium transition ${activeTab === tab.id ? "bg-accentColor text-white" : "border border-gray-200 bg-white text-gray-600 hover:border-accentColor dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <label className="relative block w-full sm:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search_placeholder")} className="w-full rounded-md border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-accentColor dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </label>
        </div>
      </section>

      <div className="mx-auto max-w-[1100px] space-y-12 px-[5%] py-10">
        {loading && <ProjectSkeleton />}
        {!loading && loadError && <EmptyState text={t("load_error")} />}
        {!loading && !loadError && filtered.length === 0 && <EmptyState text={t("empty")} />}

        {!loading && groups.map((category) => {
          const items = filtered.filter((project) => project.category === category)
          if (items.length === 0) return null
          return (
            <section key={category}>
              <div className="mb-5 flex items-start gap-3">
                {category === "research" ? <FlaskConical size={20} className="mt-0.5 text-accentColor" /> : <Wrench size={20} className="mt-0.5 text-accentColor" />}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t(category === "research" ? "section_research_title" : "section_development_title")}</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t(category === "research" ? "section_research_desc" : "section_development_desc")}</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((project) => <ProjectCard key={project.id} project={project} locale={locale} t={t} />)}
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}

function ProjectCard({ project, locale, t }: { project: ProjectItem; locale: "zh" | "en"; t: ReturnType<typeof useTranslations<"projectsPage">> }) {
  const date = project.updatedAt
    ? new Date(project.updatedAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", { year: "numeric", month: "short" })
    : ""

  return (
    <article className="flex min-h-60 flex-col rounded-lg border border-gray-200 bg-white p-5 transition hover:border-accentColor/60 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/60">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {project.source === "github" ? <SiGithub size={16} className="shrink-0 text-gray-400" /> : <Wrench size={16} className="shrink-0 text-gray-400" />}
          <h3 className="truncate font-semibold text-gray-900 dark:text-white">{project.title}</h3>
        </div>
        <span className="shrink-0 rounded bg-accentColor/10 px-2 py-1 text-[10px] font-semibold text-accentColor">{t(project.category === "research" ? "tab_research" : "tab_development")}</span>
      </div>
      <p className="mt-4 line-clamp-3 flex-1 text-sm leading-6 text-gray-500 dark:text-gray-400">{project.description || t("no_description")}</p>
      {project.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => <span key={tag} className="rounded bg-gray-100 px-2 py-1 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-300">{tag}</span>)}
        </div>
      )}
      <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-400 dark:border-gray-800">
        <span>{date}</span>
        <div className="flex items-center gap-3">
          {project.source === "github" && <span>★ {project.stars ?? 0} · Fork {project.forks ?? 0}</span>}
          {project.sourceUrl && <a href={project.sourceUrl} target="_blank" rel="noreferrer" aria-label={t("open_source")} title={t("open_source")} className="text-gray-500 hover:text-accentColor"><ExternalLink size={15} /></a>}
          {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer" aria-label={t("open_live")} title={t("open_live")} className="text-gray-500 hover:text-accentColor"><Wrench size={15} /></a>}
        </div>
      </div>
    </article>
  )
}

function ProjectSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="h-60 animate-pulse rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900" />)}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="py-24 text-center text-sm text-gray-500 dark:text-gray-400">{text}</div>
}
