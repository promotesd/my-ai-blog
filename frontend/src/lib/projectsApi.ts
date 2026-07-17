import type { ProjectCardItem } from "@/types/project"

export interface AboutStats {
  yearsExperience: number
  contributions: number
  totalProjects: number
  totalSkills: number
  totalCertificates: number
}

export interface CodingJourneyRow {
  id: string
  year: string
  title: string
  description: string
  icon_key: string
  color: string
  display_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface WorkExperienceRow {
  id: string
  company: string
  position: string
  employment_type: string
  start_date: string
  end_date: string | null
  is_current: boolean
  location: string
  work_mode: string
  description: string
  tech_stack: string[]
  display_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface SkillRow {
  id: string
  name: string
  category: string
  icon_key: string
  icon_color: string
  level: number
  display_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface UnpublishedProjectRow {
  id: string
  title: string
  description: string
  tech_stack: string[]
  category: string
  year: number | null
  platform_apps: string[]
  live_url: string | null
}

const EMPTY_STATS: AboutStats = {
  yearsExperience: 0,
  contributions: 0,
  totalProjects: 0,
  totalSkills: 0,
  totalCertificates: 0,
}

export async function fetchAboutStats(): Promise<AboutStats> {
  return EMPTY_STATS
}

export async function fetchCodingJourney(): Promise<CodingJourneyRow[]> {
  return []
}

export async function fetchWorkExperiences(): Promise<WorkExperienceRow[]> {
  return []
}

export async function fetchSkills(): Promise<SkillRow[]> {
  return []
}

export async function fetchUnpublishedProjects(): Promise<UnpublishedProjectRow[]> {
  return []
}

export async function fetchPopularProjects(): Promise<ProjectCardItem[]> {
  return []
}
