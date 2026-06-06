"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useTranslations } from "next-intl"
import { portfolioApi } from "@/services/portfolioApi"
import {
  GraduationCap, Briefcase, BookOpen, Trophy, Users,
  MapPin, CheckCircle2, Star, Quote as QuoteIcon,
  ChevronDown, ArrowUpDown, CalendarDays, Award,
  Building2, Layers, ExternalLink, X, ZoomIn,
} from "lucide-react"
import {
  FaSchool, FaLaptopCode, FaUniversity, FaCode, FaBrain,
  FaBriefcase, FaBuilding, FaTrophy, FaMedal, FaStar, FaUsers,
  FaHandshake,
} from "react-icons/fa"
import { SiFlutter } from "react-icons/si"
import { cn } from "@/lib/utils"
import {
  ALL_CATEGORIES,
  categoryMeta,
  colorMap,
  computeStats,
  type TimelineItem,
  type TimelineCategory,
  type TimelineColor,
} from "@/data/timelineData" // Pastikan export timelineData statis sudah dihapus/tidak digunakan
import "yet-another-react-lightbox/styles.css"
import TranslateWidget from "@/components/TranslateWidget"

const Lightbox = dynamic(() => import("yet-another-react-lightbox"), { ssr: false })

/* ─────────────────────────── HELPER I18N ─────────────────────────── */
function getCategoryTranslation(cat: TimelineCategory, t: any) {
  switch (cat) {
    case "Semua": return t("cat_all")
    case "Pendidikan": return t("cat_education")
    case "Karir & Magang": return t("cat_career")
    case "Kursus & Bootcamp": return t("cat_course")
    case "Pencapaian & Award": return t("cat_award")
    case "Organisasi & Komunitas": return t("cat_org")
    default: return cat
  }
}

/* ─────────────────────────── ICON REGISTRY ─────────────────────────── */
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FaSchool, FaLaptopCode, FaUniversity, FaCode, FaBrain,
  FaBriefcase, FaBuilding, FaTrophy, FaMedal, FaStar,
  FaUsers, FaHandshake, SiFlutter,
}

function TimelineIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] ?? FaCode
  return <Icon className={className} />
}

/* ─────────────────────────── TYPING HOOK ─────────────────────────── */
function useTyping(texts: string[], speed = 60, pause = 1800) {
  const [display, setDisplay] = useState("")
  const [textIndex, setTextIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!texts || texts.length === 0) return
    const current = texts[textIndex]
    let timeout: ReturnType<typeof setTimeout>

    if (!deleting && charIndex < current.length) {
      timeout = setTimeout(() => setCharIndex((c) => c + 1), speed)
    } else if (!deleting && charIndex === current.length) {
      timeout = setTimeout(() => setDeleting(true), pause)
    } else if (deleting && charIndex > 0) {
      timeout = setTimeout(() => setCharIndex((c) => c - 1), speed / 2)
    } else {
      setDeleting(false)
      setTextIndex((i) => (i + 1) % texts.length)
    }

    setDisplay(current.slice(0, charIndex))
    return () => clearTimeout(timeout)
  }, [charIndex, deleting, textIndex, texts, speed, pause])

  return display
}

/* ─────────────────────────── COUNTER HOOK ─────────────────────────── */
function useCounter(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start || target === 0) return
    let startTs: number
    const step = (ts: number) => {
      if (!startTs) startTs = ts
      const progress = Math.min((ts - startTs) / duration, 1)
      setCount(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return count
}

/* ─────────────────────────── INTERSECTION HOOK ─────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

/* ─────────────────────────── STAT CARD ─────────────────────────── */
interface StatCardProps {
  icon: React.ReactNode
  value: number
  suffix: string
  label: string
  start: boolean
}

function StatCard({ icon, value, suffix, label, start }: StatCardProps) {
  const count = useCounter(value, 1600, start)
  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-200/60 dark:bg-white/5 backdrop-blur-sm border border-gray-300/60 dark:border-white/10 min-w-[130px]">
      <div className="w-10 h-10 rounded-xl bg-accentColor/20 flex items-center justify-center text-accentColor">
        {icon}
      </div>
      <span className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
        {count}{suffix}
      </span>
      <span className="text-xs text-gray-600 dark:text-white/70 text-center leading-tight">{label}</span>
    </div>
  )
}

/* ─────────────────────────── SKILL BADGE ─────────────────────────── */
function SkillBadge({ label, color }: { label: string; color: TimelineColor }) {
  const c = colorMap[color]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full",
        c.badge, c.badgeDark
      )}
    >
      {label}
    </span>
  )
}

/* ─────────────────────────── PHOTO GRID ─────────────────────────── */
function PhotoGrid({
  photos,
  onOpen,
}: {
  photos: TimelineItem["photos"]
  onOpen: (idx: number) => void
}) {
  const t = useTranslations("timeline")

  if (!photos.length) return null
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {photos.map((p, i) => (
        <button
          key={i}
          onClick={() => onOpen(i)}
          className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-accentColor/60 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accentColor"
          aria-label={`${t("view_photo")} ${p.alt}`}
        >
          <img
            src={p.src}
            alt={p.alt}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
            <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" size={16} />
          </div>
        </button>
      ))}
    </div>
  )
}

/* ─────────────────────────── TIMELINE CARD ─────────────────────────── */
/* ─────────────────────────── TIMELINE CARD ─────────────────────────── */
function TimelineCard({ item, side }: { item: TimelineItem; side: "left" | "right" }) {
  const { ref, inView } = useInView(0.1)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  
  // State untuk menyimpan hasil translate
  const [translated, setTranslated] = useState<Record<string, string> | null>(null)

  const t = useTranslations("timeline")
  const c = colorMap[item.color] || colorMap["blue"] 

  const slides = item.photos?.map((p) => ({ src: p.src, description: p.caption })) || []

  const periodLabel =
    item.period_start === item.period_end
      ? item.period_start
      : `${item.period_start} – ${item.period_end}`

  // 1. Siapkan fields yang mau ditranslate (Flat Record<string, string>)
  const translateFields = useMemo(() => {
    const fields: Record<string, string> = {
      title: item.title,
      description: item.description,
    }
    if (item.subtitle) fields.subtitle = item.subtitle
    if (item.quote) fields.quote = item.quote
    
    item.highlights?.forEach((h, i) => { fields[`hl_${i}`] = h })
    item.responsibilities?.forEach((r, i) => { fields[`resp_${i}`] = r })
    item.projects?.forEach((p, i) => { fields[`proj_${i}`] = p })
    
    return fields
  }, [item])

  // 2. Siapkan variabel display (gunakan translated jika ada, jika tidak fallback ke item asli)
  const title = translated?.title || item.title
  const subtitle = translated?.subtitle || item.subtitle
  const description = translated?.description || item.description
  const quote = translated?.quote || item.quote
  const highlights = item.highlights?.map((h, i) => translated?.[`hl_${i}`] || h) || []
  const responsibilities = item.responsibilities?.map((r, i) => translated?.[`resp_${i}`] || r) || []
  const projects = item.projects?.map((p, i) => translated?.[`proj_${i}`] || p) || []

  return (
    <div
      id={`timeline-${item.id}`}
      ref={ref}
      className={cn(
        "transition-all duration-700",
        inView
          ? "opacity-100 translate-x-0"
          : side === "left"
          ? "opacity-0 -translate-x-16"
          : "opacity-0 translate-x-16"
      )}
    >
      <div
        className={cn(
          "group relative rounded-2xl border shadow-lg hover:shadow-xl transition-all duration-300",
          "hover:-translate-y-1 hover:shadow-2xl",
          "bg-white dark:bg-gray-900",
          c.border, c.borderDark,
          `hover:${c.glow}`
        )}
      >
        <div className={cn("h-1 rounded-t-2xl w-full", c.iconBg, c.iconBgDark)} />

        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm",
                  c.iconBg, c.iconBgDark
                )}
              >
                <TimelineIcon name={item.icon} className="text-base" />
              </div>
              <div>
                <p className={cn("text-[11px] font-semibold uppercase tracking-wider mb-0.5", c.text, c.textDark)}>
                  {item.type}
                </p>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug">
                  {title} {/* <--- Ditranslate */}
                </h3>
                {subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p> /* <--- Ditranslate */
                )}
              </div>
            </div>
            
            {/* 3. Tempatkan Widget Translate di samping badge status */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                  item.status === "Sedang Berlangsung"
                    ? "bg-accentColor/15 text-accentColor"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                )}
              >
                {item.status === "Sedang Berlangsung" ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-accentColor animate-pulse" />
                ) : (
                  <CheckCircle2 size={10} />
                )}
                {item.status === "Sedang Berlangsung" ? t("status_ongoing") || item.status : item.status}
              </span>
              
              {/* TOMBOL TRANSLATE DI SINI */}
              <TranslateWidget
                fields={translateFields}
                onTranslated={(out) => setTranslated(out)}
                onReverted={() => setTranslated(null)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <CalendarDays size={11} className={cn(c.text, c.textDark)} />
              {periodLabel}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={11} className={cn(c.text, c.textDark)} />
              {item.location}
              {item.locationDetail && <span className="text-gray-400">· {item.locationDetail}</span>}
            </span>
            {item.gpa && (
              <span className="flex items-center gap-1">
                <Award size={11} className={cn(c.text, c.textDark)} />
                {t("label_gpa")} {item.gpa}
              </span>
            )}
            {item.awardLevel && (
              <span className={cn("flex items-center gap-1 font-semibold", c.text, c.textDark)}>
                <Trophy size={11} />
                {item.awardLevel}
              </span>
            )}
          </div>

          <div>
            <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full", c.badge, c.badgeDark)}>
              {categoryMeta[item.category]?.emoji} {getCategoryTranslation(item.category, t)}
            </span>
          </div>

          <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed">
            {description} {/* <--- Ditranslate */}
          </p>

          {item.photos && item.photos.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                {t("label_documentation")}
              </p>
              <PhotoGrid photos={item.photos} onOpen={(i) => setLightboxIdx(i)} />
            </div>
          )}

          {highlights.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                {t("label_highlights")}
              </p>
              <ul className="space-y-1.5">
                {highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-gray-700 dark:text-gray-300">
                    <Star size={12} className={cn("mt-0.5 shrink-0 fill-current", c.text, c.textDark)} />
                    <span>{h}</span> {/* <--- Ditranslate */}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {responsibilities.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                {t("label_responsibilities")}
              </p>
              <ul className="space-y-1.5">
                {responsibilities.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-gray-700 dark:text-gray-300">
                    <CheckCircle2 size={12} className={cn("mt-0.5 shrink-0", c.text, c.textDark)} />
                    <span>{r}</span> {/* <--- Ditranslate */}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {projects.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                {t("label_projects")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {projects.map((p, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  >
                    <Layers size={10} />
                    {p} {/* <--- Ditranslate */}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.skills && item.skills.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                {t("label_skills")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {item.skills.map((s) => (
                  <SkillBadge key={s} label={s} color={item.color} />
                ))}
              </div>
            </div>
          )}

          {item.certificates && item.certificates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.certificates.map((cert, i) => (
                cert.href ? (
                  <Link
                    key={i}
                    href={cert.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border hover:opacity-80 transition-opacity",
                      c.badge, c.badgeDark, c.border, c.borderDark
                    )}
                  >
                    <Award size={10} />
                    {cert.name}
                    <ExternalLink size={9} />
                  </Link>
                ) : (
                  <span
                    key={i}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border",
                      c.badge, c.badgeDark, c.border, c.borderDark
                    )}
                  >
                    <Award size={10} />
                    {cert.name}
                  </span>
                )
              ))}
            </div>
          )}

          {quote && (
            <blockquote
              className={cn(
                "relative mt-2 pl-4 py-2 border-l-[3px] rounded-r-lg",
                c.border, c.borderDark,
                c.bg, c.bgDark
              )}
            >
              <QuoteIcon size={14} className={cn("absolute -top-1 -left-1 opacity-50", c.text, c.textDark)} />
              <p className="text-[12px] italic text-gray-600 dark:text-gray-300 leading-relaxed">
                &ldquo;{quote}&rdquo; {/* <--- Ditranslate */}
              </p>
              {item.quote_author && (
                <cite className={cn("text-[11px] font-semibold not-italic mt-1 block", c.text, c.textDark)}>
                  — {item.quote_author}
                </cite>
              )}
            </blockquote>
          )}

          {item.externalLink && (
            <div className="pt-1">
              <Link
                href={item.externalLink.href}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-semibold hover:underline transition-colors",
                  c.text, c.textDark
                )}
              >
                <ExternalLink size={11} />
                {item.externalLink.label}
              </Link>
            </div>
          )}
        </div>
      </div>

      {lightboxIdx !== null && (
        <Lightbox
          open
          close={() => setLightboxIdx(null)}
          index={lightboxIdx}
          slides={slides}
        />
      )}
    </div>
  )
}

/* ─────────────────────────── YEAR LABEL ─────────────────────────── */
function YearLabel({ year, color }: { year: string; color: TimelineColor }) {
  const c = colorMap[color] || colorMap["blue"]
  return (
    <div className="flex justify-center my-2 z-10 relative">
      <div
        className={cn(
          "px-4 py-1 rounded-full text-xs font-bold border shadow-sm",
          c.badge, c.badgeDark, c.border, c.borderDark
        )}
      >
        {year}
      </div>
    </div>
  )
}

/* ─────────────────────────── TIMELINE SECTION ─────────────────────────── */
function TimelineSection({ items }: { items: TimelineItem[] }) {
  const lineRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const line = lineRef.current
    const container = containerRef.current
    if (!line || !container) return

    const update = () => {
      const rect = container.getBoundingClientRect()
      const visibleTop = Math.max(0, -rect.top)
      const total = rect.height
      const progress = Math.min(1, Math.max(0, visibleTop / (total - window.innerHeight / 2)))
      line.style.height = `${progress * 100}%`
    }

    window.addEventListener("scroll", update, { passive: true })
    update()
    return () => window.removeEventListener("scroll", update)
  }, [items])

  const rows: Array<{ type: "year"; label: string; color: TimelineColor } | { type: "item"; item: TimelineItem; side: "left" | "right"; globalIndex: number }> = []
  let sideIndex = 0
  let prevYear = ""

  items.forEach((item) => {
    const year = item.period_start.split(" ").pop() ?? item.period_start
    if (year !== prevYear) {
      rows.push({ type: "year", label: year, color: item.color })
      prevYear = year
    }
    rows.push({ type: "item", item, side: sideIndex % 2 === 0 ? "left" : "right", globalIndex: sideIndex })
    sideIndex++
  })

  return (
    <div ref={containerRef} className="relative">
      <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800 hidden md:block" />
      <div
        ref={lineRef}
        className="absolute left-1/2 -translate-x-1/2 top-0 w-0.5 bg-accentColor hidden md:block transition-all duration-100"
        style={{ height: "0%" }}
      />
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800 md:hidden" />

      <div className="space-y-8">
        {rows.map((row, i) => {
          if (row.type === "year") {
            return <YearLabel key={`year-${row.label}-${i}`} year={row.label} color={row.color} />
          }

          const { item, side } = row
          const c = colorMap[item.color] || colorMap["blue"]

          return (
            <div key={item.id} className="relative grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-0 md:gap-6 items-start">
              <div className={cn("md:flex md:justify-end pl-10 md:pl-0", side === "right" ? "md:block" : "")}>
                {side === "left" ? (
                  <div className="md:max-w-[480px] w-full">
                    <TimelineCard item={item} side="left" />
                  </div>
                ) : (
                  <div className="hidden md:block" />
                )}
              </div>

              <div className="hidden md:flex flex-col items-center justify-start pt-6">
                <div
                  className={cn(
                    "relative w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 shadow-md z-10",
                    c.dot, c.dotDark
                  )}
                >
                  <span className={cn("absolute inset-0 rounded-full animate-ping opacity-40", c.dot, c.dotDark)} />
                </div>
              </div>

              <div
                className={cn(
                  "absolute left-3.5 top-6 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 shadow z-10 md:hidden",
                  c.dot, c.dotDark
                )}
              />

              <div className={cn("hidden md:flex md:justify-start pl-10 md:pl-0")}>
                {side === "right" ? (
                  <div className="md:max-w-[480px] w-full">
                    <TimelineCard item={item} side="right" />
                  </div>
                ) : (
                  <div className="hidden md:block" />
                )}
              </div>

              {side === "right" && (
                <div className="md:hidden pl-10 -mt-[10px]">
                  <TimelineCard item={item} side="left" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────── FILTER PILLS ─────────────────────────── */
function FilterPills({
  active,
  onChange,
  counts,
}: {
  active: TimelineCategory
  onChange: (c: TimelineCategory) => void
  counts: Record<TimelineCategory, number>
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const t = useTranslations("timeline")

  return (
    <div
      ref={scrollRef}
      className="flex flex-nowrap md:flex-wrap gap-2 overflow-x-auto md:overflow-visible scrollbar-none pb-2 md:pb-0 w-full touch-pan-x snap-x"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {ALL_CATEGORIES.map((cat) => {
        const meta = categoryMeta[cat]
        const isActive = active === cat
        const labelText = getCategoryTranslation(cat, t)

        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={cn(
              "shrink-0 snap-start inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200",
              isActive
                ? "bg-accentColor text-white border-accentColor shadow-md shadow-accentColor/25"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-accentColor/50 hover:text-accentColor"
            )}
          >
            <span>{meta.emoji}</span>
            <span>{labelText}</span>
            <span
              className={cn(
                "text-[11px] px-1.5 py-0.5 rounded-full font-bold",
                isActive ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              )}
            >
              {counts[cat]}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ─────────────────────────── EMPTY STATE ─────────────────────────── */
function EmptyState({ category }: { category: TimelineCategory }) {
  const t = useTranslations("timeline")
  
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="text-5xl">{categoryMeta[category]?.emoji ?? "📭"}</div>
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        {t("empty_state")} <strong>{getCategoryTranslation(category, t)}</strong>
      </p>
    </div>
  )
}

/* ─────────────────────────── HERO SECTION ─────────────────────────── */
function HeroSection({
  onScrollDown,
  stats,
}: {
  onScrollDown: () => void
  stats: ReturnType<typeof computeStats>
}) {
  const t = useTranslations("timeline")
  const heroRef = useRef<HTMLDivElement>(null)
  const { ref: statsRef, inView: statsInView } = useInView(0.3)
  const typed = useTyping([t("typing_1"), t("typing_2"), t("typing_3"), t("typing_4")], 70, 2000)

  const statCards = [
    { icon: <GraduationCap size={20} />, value: stats.learnYears, suffix: t("suffix_years"), label: t("stat_learn_years"), start: statsInView },
    { icon: <Briefcase size={20} />, value: typeof stats.workYears === "string" ? parseInt(stats.workYears) : stats.workYears, suffix: typeof stats.workYears === "string" && stats.workYears.includes("Tahun") ? t("suffix_years") : t("suffix_months"), label: t("stat_work_exp"), start: statsInView },
    { icon: <Trophy size={20} />, value: stats.achievements, suffix: "", label: t("stat_achievements"), start: statsInView },
    { icon: <Users size={20} />, value: stats.orgs, suffix: "", label: t("stat_orgs"), start: statsInView },
  ]

  return (
    <section
      ref={heroRef}
      className="relative min-h-[70vh] flex flex-col justify-center items-center text-center overflow-hidden px-6 py-20 bg-gray-100 dark:bg-gray-950"
    >
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-accentColor/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-8">
        <Link href="/" className="hover:text-accentColor transition-colors">{t("breadcrumb_home")}</Link>
        <span>•</span>
        <span className="text-accentColor font-medium">{t("breadcrumb_timeline")}</span>
      </div>

      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accentColor/10 border border-accentColor/30 text-accentColor text-sm font-medium">
          <CalendarDays size={14} />
          {t("hero_badge")}
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white leading-tight">
          <span>{typed}</span>
          <span className="inline-block w-0.5 h-[1em] bg-accentColor ml-1 align-middle animate-pulse" />
        </h1>

        <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          {t("hero_desc")}
        </p>
      </div>

      <div ref={statsRef} className="flex flex-wrap justify-center gap-3 mt-12">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <button
        onClick={onScrollDown}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-accentColor transition-colors group"
        aria-label={t("scroll_aria")}
      >
        <span className="text-[11px] uppercase tracking-widest">{t("scroll_down")}</span>
        <ChevronDown
          size={20}
          className="animate-bounce group-hover:text-accentColor"
        />
      </button>
    </section>
  )
}

/* ─────────────────────────── MAIN PAGE ─────────────────────────── */
export default function TimelinePage() {
  const t = useTranslations("timeline")
  const [activeCategory, setActiveCategory] = useState<TimelineCategory>("Semua")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  
  // State untuk Supabase Data
  const [rawItems, setRawItems] = useState<TimelineItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const contentRef = useRef<HTMLDivElement>(null)

  const handleScrollDown = useCallback(() => {
    contentRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  // Fetch dari Supabase pada saat mount
  useEffect(() => {
    const fetchTimeline = async () => {
      setIsLoading(true)
      try {
        const data = await portfolioApi.list<TimelineItem & { id: number }>("timelines")
        setRawItems(data as TimelineItem[])
      } catch (err) {
        console.error("Gagal mengambil data timeline:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTimeline()
  }, [])

  // Hitung stats secara dinamis dari rawItems
  const dynamicStats = useMemo(() => computeStats(rawItems), [rawItems])

  // Filter & Urutkan Data
  const filteredItems = useMemo(() => {
    let items =
      activeCategory === "Semua"
        ? [...rawItems]
        : rawItems.filter((item) => item.category === activeCategory)

    items = items.slice().sort((a, b) => {
      const ya = parseInt(a.period_start.split(" ").pop() ?? a.period_start)
      const yb = parseInt(b.period_start.split(" ").pop() ?? b.period_start)
      return sortOrder === "asc" ? ya - yb : yb - ya
    })

    return items
  }, [activeCategory, sortOrder, rawItems])

  // Hitung jumlah items per kategori
  const counts = useMemo(() => {
    const result = {} as Record<TimelineCategory, number>
    ALL_CATEGORIES.forEach((cat) => {
      result[cat] = cat === "Semua" ? rawItems.length : rawItems.filter((d) => d.category === cat).length
    })
    return result
  }, [rawItems])

  return (
    <div className="min-h-screen bg-baseBackground">
      <HeroSection onScrollDown={handleScrollDown} stats={dynamicStats} />

      <div ref={contentRef} className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 pt-12">
        <div className="sticky top-[4.5rem] z-40 bg-baseBackground/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 pb-4 pt-4 mb-10">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-start justify-between">
            <div className="w-full min-w-0 flex-1">
              <FilterPills
                active={activeCategory}
                onChange={(cat) => setActiveCategory(cat)}
                counts={counts}
              />
            </div>
            {/* Sort toggle */}
            <button
              onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-accentColor/50 hover:text-accentColor transition-all duration-200"
            >
              <ArrowUpDown size={14} />
              {sortOrder === "asc" ? t("sort_asc") || "Terlama → Terbaru" : t("sort_desc") || "Terbaru → Terlama"}
            </button>
          </div>
        </div>

        {/* Handling Empty State & Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-10 h-10 border-4 border-accentColor/30 border-t-accentColor rounded-full animate-spin" />
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium animate-pulse">
              Memuat data perjalanan...
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState category={activeCategory} />
        ) : (
          <TimelineSection items={filteredItems} />
        )}
      </div>
    </div>
  )
}
