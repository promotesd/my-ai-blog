"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useTranslations, useLocale } from "next-intl"
import { createClient } from "@supabase/supabase-js"
import { ChevronLeft, Globe, Download, Smartphone, Calendar, Info, ExternalLink, Apple, Play } from "lucide-react"
import TranslateWidget from "@/components/TranslateWidget" // Pastikan path ini benar

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

// ─── Shimmer Skeleton ────────────────────────────────────────────────────────

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-gray-200 dark:bg-gray-800 rounded-lg ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent" />
    </div>
  )
}

function ProjectDetailSkeleton() {
  return (
    <div className="min-h-screen bg-baseBackground pb-24 pt-24 px-4 sm:px-6">
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
      <div className="max-w-5xl mx-auto">
        {/* Back link */}
        <Shimmer className="h-5 w-24 mb-8" />

        {/* Title block */}
        <div className="mb-8 space-y-3">
          <Shimmer className="h-9 w-3/4 rounded-xl" />
          <div className="flex gap-3">
            <Shimmer className="h-5 w-36" />
            <Shimmer className="h-5 w-20" />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Gallery */}
          <div className="lg:col-span-2 space-y-4">
            <Shimmer className="w-full aspect-video rounded-2xl" />
            <div className="flex gap-3">
              {[...Array(4)].map((_, i) => (
                <Shimmer key={i} className="w-24 h-16 rounded-lg flex-shrink-0" />
              ))}
            </div>
          </div>

          {/* Right: Cards */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#161D1F] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-3">
              <Shimmer className="h-5 w-32 mb-4" />
              <Shimmer className="h-12 w-full rounded-xl" />
              <Shimmer className="h-12 w-full rounded-xl" />
            </div>
            <div className="bg-white dark:bg-[#161D1F] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-3">
              <Shimmer className="h-5 w-24 mb-4" />
              <div className="flex flex-wrap gap-2">
                {[...Array(5)].map((_, i) => (
                  <Shimmer key={i} className="h-7 w-16 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-12 max-w-3xl space-y-3">
          <Shimmer className="h-7 w-48 rounded-xl mb-4" />
          <Shimmer className="h-4 w-full" />
          <Shimmer className="h-4 w-5/6" />
          <Shimmer className="h-4 w-4/6" />
          <Shimmer className="h-4 w-full" />
          <Shimmer className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { slug } = useParams()
  const t = useTranslations("deployProjectDetail") // Kunci terjemahan baru
  const locale = useLocale()
  
  const [project, setProject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeImage, setActiveImage] = useState<string>("")
  
  // State untuk Translate Widget
  const [translated, setTranslated] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    async function fetchDetail() {
      const { data } = await supabase
        .from("deployed_projects")
        .select("*")
        .eq("slug", slug)
        .single()

      if (data) {
        setProject(data)
        setActiveImage(data.thumbnail_url)
      }
      setIsLoading(false)
    }
    fetchDetail()
  }, [slug])

  const handleDownloadApk = async () => {
    if (project.external_apk_url) {
      window.open(project.external_apk_url, "_blank")
    } else if (project.apk_file_path) {
      const { data } = supabase.storage.from("project-files").getPublicUrl(project.apk_file_path)
      window.open(data.publicUrl, "_blank")
    }
  }

  // Menyiapkan field yang akan diterjemahkan
  const translateFields = useMemo(() => {
    if (!project) return {}
    const fields: Record<string, string> = {
      title: project.title,
      description: project.description,
    }
    if (project.update_notes) {
      fields.update_notes = project.update_notes
    }
    return fields
  }, [project])

  if (isLoading) return <ProjectDetailSkeleton />

  if (!project) {
    return (
      <div className="min-h-screen bg-baseBackground flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold dark:text-white mb-2">{t("error_not_found_title")}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          {t("error_not_found_desc")}
        </p>
        <Link
          href="/deploy-projects"
          className="text-accentColor hover:underline text-sm font-medium"
        >
          ← {t("btn_back_list")}
        </Link>
      </div>
    )
  }

  const allImages = [project.thumbnail_url, ...(project.gallery_urls ?? [])]
  const hasMultipleImages = allImages.length > 1

  // Variabel untuk menampilkan hasil asli atau terjemahan
  const displayTitle = translated?.title || project.title
  const displayDescription = translated?.description || project.description
  const displayUpdateNotes = translated?.update_notes || project.update_notes

  // Platform logic
  const platform = (project.platform || "").toLowerCase()
  const isAndroid = platform.includes("android")
  const isIOS = platform.includes("ios")

  return (
    <>
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="min-h-screen bg-baseBackground pb-24 pt-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">

          {/* ── Back Navigation & Translate Button ── */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 mt-4">
            <Link
              href="/deploy-projects"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-accentColor transition-colors"
            >
              <ChevronLeft size={16} />
              {t("btn_back")}
            </Link>

            <TranslateWidget
              fields={translateFields}
              onTranslated={(out) => setTranslated(out)}
              onReverted={() => setTranslated(null)}
            />
          </div>

          {/* ── Header ── */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
              {displayTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {t("updated_at")}: {new Date(project.updated_at || project.published_at).toLocaleDateString(locale === "id" ? "id-ID" : locale === "de" ? "de-DE" : "en-US", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md text-xs font-medium">
                {platform.includes("web")
                  ? <Globe size={12} />
                  : <Smartphone size={12} />}
                {project.platform}
              </span>
            </div>
          </div>

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">

            {/* Left: Gallery */}
            <div className="lg:col-span-2 space-y-3">
              {/* Main image */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#161D1F] border border-gray-200 dark:border-gray-800">
                <Image
                  src={activeImage}
                  alt={displayTitle}
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              {/* Thumbnail strip */}
              {hasMultipleImages && (
                <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
                  {allImages.map((url: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(url)}
                      className={`relative flex-shrink-0 w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden border-2 transition-all
                        ${activeImage === url
                          ? "border-accentColor opacity-100 scale-100"
                          : "border-transparent opacity-50 hover:opacity-80"
                        }`}
                    >
                      <Image src={url} alt={`preview-${i}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Actions & Tags */}
            <div className="flex flex-col gap-5">

              {/* Try App card */}
              <div className="bg-white dark:bg-[#161D1F] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 sm:p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm sm:text-base">
                  {t("try_app_title")}
                </h3>
                <div className="flex flex-col gap-2.5">
                  {project.demo_url && (
                    <a
                      href={project.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 active:scale-95 transition-all"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M23.498 6.186a2.994 2.994 0 0 0-2.11-2.116C19.228 3.5 12 3.5 12 3.5s-7.228 0-9.388.57A2.994 2.994 0 0 0 .502 6.186C0 8.353 0 12 0 12s0 3.647.502 5.814a2.994 2.994 0 0 0 2.11 2.116C4.772 20.5 12 20.5 12 20.5s7.228 0 9.388-.57a2.994 2.994 0 0 0 2.11-2.116C24 15.647 24 12 24 12s0-3.647-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                      {t("btn_demo")}
                    </a>
                  )}
                  {project.web_url && (
                    <a
                      href={project.web_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-accentColor text-white text-sm font-medium rounded-xl hover:brightness-90 active:scale-95 transition-all"
                    >
                      <Globe size={16} />
                      {t("btn_web")}
                    </a>
                  )}
                  {project.play_store_url && isAndroid && (
                    <a
                      href={project.play_store_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-[#f9bb04] hover:bg-[#e0a803] text-black text-sm font-medium rounded-xl active:scale-95 transition-all"
                    >
                      <Play size={16} />
                      {t("btn_playstore")}
                    </a>
                  )}
                  {project.app_store_url && isIOS && (
                    <a
                      href={project.app_store_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
                    >
                      <Apple size={16} />
                      {t("btn_appstore")}
                    </a>
                  )}
                  {(project.apk_file_path || project.external_apk_url) && (
                    <button
                      onClick={handleDownloadApk}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 active:scale-95 transition-all"
                    >
                      <Download size={16} />
                      {t("btn_apk")}
                    </button>
                  )}
                  {!project.demo_url && !project.web_url && !isAndroid && !isIOS && !project.apk_file_path && !project.external_apk_url && (
                    <div className="text-center text-xs text-gray-500 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                      {t("preview_unavailable")}
                    </div>
                  )}
                </div>
              </div>

              {/* Tech stack card */}
              <div className="bg-white dark:bg-[#161D1F] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 sm:p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm sm:text-base">
                  Tech Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Description & Changelog ── */}
          <div className="mt-12 max-w-3xl">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t("section_description")}
            </h2>
            <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert text-gray-600 dark:text-gray-300 leading-relaxed">
              <p className="whitespace-pre-wrap">{displayDescription}</p>
            </div>

            {displayUpdateNotes && (
              <div className="mt-8 p-5 sm:p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                <h3 className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-400 mb-4 text-sm sm:text-base">
                  <Info size={16} />
                  {t("section_changelog")}
                </h3>
                <div className="prose prose-sm max-w-none text-blue-900/80 dark:text-blue-200/80 leading-relaxed">
                  <p className="whitespace-pre-wrap">{displayUpdateNotes}</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}