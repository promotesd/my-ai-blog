export const GALLERY_CATEGORIES = [
  "Semua",
  "Aktivitas & Daily Life",
  "Travel & Wisata",
  "Coding & Workspace",
  "Kuliner & Food",
  "Kucing & Hewan Peliharaan",
  "Event & Komunitas",
] as const

export const GALLERY_CATEGORY_LABELS: Record<(typeof GALLERY_CATEGORIES)[number], string> = {
  Semua: "全部",
  "Aktivitas & Daily Life": "日常生活",
  "Travel & Wisata": "旅行",
  "Coding & Workspace": "学习与工作台",
  "Kuliner & Food": "美食",
  "Kucing & Hewan Peliharaan": "宠物",
  "Event & Komunitas": "活动",
}

export function getGalleryCategoryLabel(category: string) {
  return GALLERY_CATEGORY_LABELS[category as keyof typeof GALLERY_CATEGORY_LABELS] || category
}
