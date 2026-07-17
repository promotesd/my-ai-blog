export type ToolBadge = "Favorite" | "Daily Use" | "Recommended" | "Pernah Dicoba"

export type ToolCategory =
  | "Code Editor & IDE"
  | "Design & UI Tools"
  | "Framework & Library"
  | "Database & Storage"
  | "DevOps & Cloud"
  | "Browser & Extensions"
  | "Software & Aplikasi Desktop"
  | "Website Tools & Online Services"
  | "Streaming & Entertainment"
  | "AI Tools & Productivity"
  | "Hardware & Gadget"

export interface ToolItem {
  id: number
  name: string
  category: ToolCategory
  iconKey: string
  iconColor: string
  description: string
  usageRating: number
  badge: ToolBadge
  isFavorite: boolean
  officialUrl: string
  tags: string[]
  detail?: string
}

export const ALL_TOOL_CATEGORIES: ToolCategory[] = [
  "Code Editor & IDE",
  "Design & UI Tools",
  "Framework & Library",
  "Database & Storage",
  "DevOps & Cloud",
  "Browser & Extensions",
  "Software & Aplikasi Desktop",
  "Website Tools & Online Services",
  "Streaming & Entertainment",
  "AI Tools & Productivity",
  "Hardware & Gadget",
]

export const CATEGORY_META: Record<ToolCategory, { emoji: string; description: string }> = {
  "Code Editor & IDE": { emoji: "💻", description: "代码编辑器与集成开发环境" },
  "Design & UI Tools": { emoji: "🎨", description: "界面与视觉设计工具" },
  "Framework & Library": { emoji: "🧩", description: "开发框架与库" },
  "Database & Storage": { emoji: "🗄️", description: "数据库与存储方案" },
  "DevOps & Cloud": { emoji: "☁️", description: "部署、CI/CD 与云服务" },
  "Browser & Extensions": { emoji: "🌍", description: "浏览器与扩展" },
  "Software & Aplikasi Desktop": { emoji: "🖥️", description: "桌面软件" },
  "Website Tools & Online Services": { emoji: "🔧", description: "网站工具与在线服务" },
  "Streaming & Entertainment": { emoji: "🎬", description: "娱乐与流媒体平台" },
  "AI Tools & Productivity": { emoji: "🤖", description: "AI 与效率工具" },
  "Hardware & Gadget": { emoji: "📱", description: "硬件设备" },
}

export const BADGE_META: Record<ToolBadge, { emoji: string; color: string; bg: string; border: string }> = {
  Favorite: {
    emoji: "❤️",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800/60",
  },
  "Daily Use": {
    emoji: "🔵",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800/60",
  },
  Recommended: {
    emoji: "🟢",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800/60",
  },
  "Pernah Dicoba": {
    emoji: "⚪",
    color: "text-gray-500 dark:text-gray-400",
    bg: "bg-gray-50 dark:bg-gray-800/40",
    border: "border-gray-200 dark:border-gray-700",
  },
}
