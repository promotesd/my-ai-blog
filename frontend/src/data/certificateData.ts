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
