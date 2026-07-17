export type TimelineCategory =
  | "Semua"
  | "Pendidikan"
  | "Karir & Magang"
  | "Kursus & Bootcamp"
  | "Pencapaian & Award"
  | "Organisasi & Komunitas"

export type TimelineStatus = "Selesai" | "Sedang Berlangsung"
export type TimelineColor = "blue" | "orange" | "green" | "yellow" | "purple"

export interface TimelineHighlight {
  text: string
}

export interface TimelinePhoto {
  src: string
  alt: string
  caption?: string
}

export interface TimelineItem {
  id: number
  category: TimelineCategory
  /** Sub-type within the category, e.g. "SD", "SMP", "Kuliah", "Internship" */
  type: string
  title: string
  /** For edu: major/dept; for work: position; for awards: issuing body; for org: role */
  subtitle?: string
  location: string
  locationDetail?: string           // e.g. "Remote" | "On-site"
  period_start: string              // e.g. "2007"
  period_end: string                // e.g. "2013" | "Sekarang"
  status: TimelineStatus
  /** Short narrative describing this life phase */
  description: string
  /** GPA or key academic metric */
  gpa?: string
  /** Extracurricular activities */
  extracurricular?: string[]
  /** Key responsibilities / deliverables */
  responsibilities?: string[]
  /** Projects worked on during this phase */
  projects?: string[]
  /** Certifications earned */
  certificates?: { name: string; href?: string }[]
  /** Award level: Sekolah | Kota | Provinsi | Nasional | Internasional */
  awardLevel?: "Sekolah" | "Kota" | "Provinsi" | "Nasional" | "Internasional"
  highlights: string[]
  skills: string[]
  photos: TimelinePhoto[]
  quote?: string
  quote_author?: string
  /** Tailwind color key, drives accent colours throughout the card */
  color: TimelineColor
  /** React-icons icon name (fa or si prefix), rendered dynamically */
  icon: string
  /** Tech stack badges (subset of skills, specifically technologies) */
  techStack?: string[]
  /** Link to related certificate or project */
  externalLink?: { label: string; href: string }
}

/* ─────────────────────────── COLOR MAP ─────────────────────────── */
export const colorMap: Record<
  TimelineColor,
  {
    bg: string
    bgDark: string
    border: string
    borderDark: string
    badge: string
    badgeDark: string
    dot: string
    dotDark: string
    glow: string
    text: string
    textDark: string
    iconBg: string
    iconBgDark: string
  }
> = {
  blue: {
    bg: "bg-blue-50",
    bgDark: "dark:bg-blue-950/30",
    border: "border-blue-200",
    borderDark: "dark:border-blue-800/60",
    badge: "bg-blue-100 text-blue-700",
    badgeDark: "dark:bg-blue-900/50 dark:text-blue-300",
    dot: "bg-blue-500",
    dotDark: "dark:bg-blue-400",
    glow: "shadow-blue-500/20",
    text: "text-blue-600",
    textDark: "dark:text-blue-400",
    iconBg: "bg-blue-500",
    iconBgDark: "dark:bg-blue-600",
  },
  orange: {
    bg: "bg-orange-50",
    bgDark: "dark:bg-orange-950/30",
    border: "border-orange-200",
    borderDark: "dark:border-orange-800/60",
    badge: "bg-orange-100 text-orange-700",
    badgeDark: "dark:bg-orange-900/50 dark:text-orange-300",
    dot: "bg-orange-500",
    dotDark: "dark:bg-orange-400",
    glow: "shadow-orange-500/20",
    text: "text-orange-600",
    textDark: "dark:text-orange-400",
    iconBg: "bg-orange-500",
    iconBgDark: "dark:bg-orange-600",
  },
  green: {
    bg: "bg-emerald-50",
    bgDark: "dark:bg-emerald-950/30",
    border: "border-emerald-200",
    borderDark: "dark:border-emerald-800/60",
    badge: "bg-emerald-100 text-emerald-700",
    badgeDark: "dark:bg-emerald-900/50 dark:text-emerald-300",
    dot: "bg-emerald-500",
    dotDark: "dark:bg-emerald-400",
    glow: "shadow-emerald-500/20",
    text: "text-emerald-600",
    textDark: "dark:text-emerald-400",
    iconBg: "bg-emerald-500",
    iconBgDark: "dark:bg-emerald-600",
  },
  yellow: {
    bg: "bg-yellow-50",
    bgDark: "dark:bg-yellow-950/30",
    border: "border-yellow-200",
    borderDark: "dark:border-yellow-800/60",
    badge: "bg-yellow-100 text-yellow-700",
    badgeDark: "dark:bg-yellow-900/50 dark:text-yellow-300",
    dot: "bg-yellow-500",
    dotDark: "dark:bg-yellow-400",
    glow: "shadow-yellow-500/20",
    text: "text-yellow-600",
    textDark: "dark:text-yellow-400",
    iconBg: "bg-yellow-500",
    iconBgDark: "dark:bg-yellow-600",
  },
  purple: {
    bg: "bg-purple-50",
    bgDark: "dark:bg-purple-950/30",
    border: "border-purple-200",
    borderDark: "dark:border-purple-800/60",
    badge: "bg-purple-100 text-purple-700",
    badgeDark: "dark:bg-purple-900/50 dark:text-purple-300",
    dot: "bg-purple-500",
    dotDark: "dark:bg-purple-400",
    glow: "shadow-purple-500/20",
    text: "text-purple-600",
    textDark: "dark:text-purple-400",
    iconBg: "bg-purple-500",
    iconBgDark: "dark:bg-purple-600",
  },
}

/* ─────────────────────────── CATEGORY META ─────────────────────────── */
export const categoryMeta: Record<
  TimelineCategory,
  { emoji: string; label: string; color: TimelineColor }
> = {
  Semua: { emoji: "✨", label: "Semua", color: "blue" },
  Pendidikan: { emoji: "🏫", label: "Pendidikan", color: "blue" },
  "Karir & Magang": { emoji: "💼", label: "Karir & Magang", color: "green" },
  "Kursus & Bootcamp": { emoji: "📚", label: "Kursus & Bootcamp", color: "orange" },
  "Pencapaian & Award": { emoji: "🏆", label: "Pencapaian & Award", color: "yellow" },
  "Organisasi & Komunitas": { emoji: "🤝", label: "Organisasi & Komunitas", color: "purple" },
}

export const ALL_CATEGORIES: TimelineCategory[] = [
  "Semua",
  "Pendidikan",
  "Karir & Magang",
  "Kursus & Bootcamp",
  "Pencapaian & Award",
  "Organisasi & Komunitas",
]

/* ─────────────────────────── DATA ─────────────────────────── */
export const timelineData: TimelineItem[] = [
  {
    id: 1,
    category: "Pendidikan",
    type: "本科",
    title: "福州大学",
    subtitle: "数字媒体技术专业",
    location: "中国 福建 福州",
    period_start: "2022",
    period_end: "2026",
    status: "Selesai",
    description: "本科阶段就读于福州大学数字媒体技术专业，学习编程、交互、图形和内容系统相关基础。",
    highlights: ["数字媒体技术专业", "本科阶段：2022 - 2026", "持续积累计算机与工程基础"],
    skills: ["数字媒体技术", "编程基础", "计算机基础"],
    photos: [],
    quote: "把基础打牢，再慢慢走向更复杂的问题。",
    quote_author: "小嘟嘟",
    color: "blue",
    icon: "FaUniversity",
  },
  {
    id: 2,
    category: "Pendidikan",
    type: "研究生",
    title: "哈尔滨工程大学",
    subtitle: "智能科学与技术专业",
    location: "中国 黑龙江 哈尔滨",
    period_start: "2026",
    period_end: "Sekarang",
    status: "Sedang Berlangsung",
    description: "2026 年开始研究生阶段学习，研究方向主要关注 LiDAR SLAM、IMU、机器人感知与路径规划。",
    highlights: ["智能科学与技术专业", "研究方向：LiDAR SLAM、IMU、机器人感知、路径规划", "研究生阶段：2026 至今"],
    skills: ["LiDAR SLAM", "IMU", "机器人感知", "路径规划"],
    photos: [],
    quote: "保持好奇，持续复现，认真记录。",
    quote_author: "小嘟嘟",
    color: "green",
    icon: "FaBrain",
  },
]

/* ─────────────────────────── STATS DERIVATION ─────────────────────────── */

export function computeStats(data: TimelineItem[] = timelineData) {
  const educations = data.filter((d) => d.category === "Pendidikan")
  const firstEdu = educations.sort((a, b) => +a.period_start - +b.period_start)[0]
  const currentYear = new Date().getFullYear()
  const learnYears = firstEdu ? currentYear - parseInt(firstEdu.period_start) : 0

  const works = data.filter((d) => d.category === "Karir & Magang")
  const totalWorkMonths = works.reduce((acc, w) => {
    const start = parseDate(w.period_start)
    const end = w.period_end === "Sekarang" ? new Date() : parseDate(w.period_end)
    if (!start || !end) return acc
    return acc + diffMonths(start, end)
  }, 0)
  const workYears =
    totalWorkMonths >= 12
      ? `${Math.floor(totalWorkMonths / 12)} Tahun`
      : `${totalWorkMonths} Bulan`

  const achievements = data.filter(
    (d) => d.category === "Pencapaian & Award"
  ).length

  const orgs = data.filter(
    (d) => d.category === "Organisasi & Komunitas"
  ).length

  return { learnYears, workYears, achievements, orgs }
}

function parseDate(str: string): Date | null {
  if (!str) return null
  const clean = str.replace(/^[A-Za-z]+ /, "").trim()
  const monthMap: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, Jun: 5,
    Jul: 6, Agu: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11,
  }
  const parts = clean.split(" ")
  if (parts.length === 2) {
    const m = monthMap[parts[0]]
    const y = parseInt(parts[1])
    if (!isNaN(y)) return new Date(y, m ?? 0, 1)
  }
  const y = parseInt(clean)
  if (!isNaN(y)) return new Date(y, 0, 1)
  return null
}

function diffMonths(start: Date, end: Date): number {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  )
}
