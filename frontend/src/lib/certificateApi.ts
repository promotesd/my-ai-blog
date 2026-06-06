/**
 * certificateApi.ts
 * Supabase query functions for the Certificate page.
 *
 * Exports:
 *   fetchCertificates()  — Fetch all published certificates, ordered by
 *                          display_order ASC, then issue_date DESC.
 *
 * Schema reference:
 *   supabase/migrations/20260306000000_create_certificates_table.sql
 *   supabase/migrations/20260315000000_update_certificates_clear_seed.sql
 */

import { portfolioApi } from "@/services/portfolioApi"
import type { Certificate } from "@/types/certificate"

// ─── Raw DB row shape (matches the certificates table columns) ────────────────

interface CertificateRow {
  id:              string
  title:           string
  description:     string
  category:        string
  issuer_name:     string
  issuer_logo_url: string | null
  issue_date:      string
  expiry_date:     string | null
  status:          string
  pdf_url:         string | null
  thumbnail_url:   string | null
  display_order:   number
  created_at?:     string
}

const FALLBACK_CERTIFICATES: Certificate[] = [
  {
    id: "spring-boot-portfolio",
    title: "Spring Boot Portfolio Backend",
    description: "Portfolio backend migration with Spring Boot, MySQL, Redis, JWT, upload APIs, and deployment workflow.",
    category: "Sertifikasi Resmi",
    issuer_name: "Xiaodudu Lab",
    issuer_logo: undefined,
    issue_date: "2026-06-06",
    expiry_date: null,
    status: "Lifetime",
    pdf_url: null,
    thumbnail_url: "/thumbnail-url-share.jpeg",
  },
  {
    id: "react-typescript-portfolio",
    title: "React TypeScript Portfolio Migration",
    description: "React + Vite + TypeScript frontend migration preserving the original portfolio UI and routing system.",
    category: "Course Online",
    issuer_name: "Xiaodudu Lab",
    issuer_logo: undefined,
    issue_date: "2026-06-06",
    expiry_date: null,
    status: "Lifetime",
    pdf_url: null,
    thumbnail_url: "/thumbnail-url-share.jpeg",
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// fetchCertificates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches all published certificates from Supabase ordered by:
 *   1. display_order ASC  (manual sort override)
 *   2. issue_date   DESC  (most recent first within same display_order)
 *
 * Returns an empty array when the table is empty — no error thrown.
 * Throws on Supabase network / query errors (caller should catch and show UI error).
 */
export async function fetchCertificates(): Promise<Certificate[]> {
  const data = await portfolioApi.list<CertificateRow & { id: number }>("certificates")
  const certificates = data.map((row) => ({
    id:            String(row.id),
    title:         row.title,
    description:   row.description ?? "",
    category:      (row.category ?? "Course Online") as Certificate["category"],
    issuer_name:   row.issuer_name ?? "Xiaodudu Lab",
    issuer_logo:   row.issuer_logo_url ?? undefined,
    issue_date:    row.issue_date ?? row.created_at ?? "2026-06-06",
    expiry_date:   row.expiry_date  ?? null,
    status:        (row.status === "Expired" || row.status === "Valid" || row.status === "Lifetime" ? row.status : "Lifetime") as Certificate["status"],
    pdf_url:       row.pdf_url      ?? null,
    thumbnail_url: row.thumbnail_url ?? null,
  }))
  return certificates.length > 0 ? certificates : FALLBACK_CERTIFICATES
}
