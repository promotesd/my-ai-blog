/**
 * certificateData.ts
 * Static configuration constants for the Certificate page.
 *
 * Real certificate data is now fetched from Supabase via src/lib/certificateApi.ts.
 * This file retains only the static filter-option lists used by the page UI.
 */
import type { CertificateCategory } from "@/types/certificate"

export const CERTIFICATE_CATEGORIES: CertificateCategory[] = [
  "Semua",
  "Magang / Internship",
  "Bootcamp",
  "Course Online",
  "Webinar / Seminar",
  "Sertifikasi Resmi",
  "Kompetisi / Lomba",
]

export const CERTIFICATE_CATEGORY_LABELS: Record<CertificateCategory, string> = {
  "Semua": "全部",
  "Magang / Internship": "实习",
  "Bootcamp": "训练营",
  "Course Online": "在线课程",
  "Webinar / Seminar": "讲座 / 研讨会",
  "Sertifikasi Resmi": "官方认证",
  "Kompetisi / Lomba": "竞赛",
}

export function getCertificateCategoryLabel(category: CertificateCategory | string) {
  return CERTIFICATE_CATEGORY_LABELS[category as CertificateCategory] || category
}
