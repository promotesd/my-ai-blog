/**
 * projectsApi.ts
 * Supabase query functions for the projects feature.
 *
 * Exports:
 *   fetchPopularProjects()  — Home page "Popular Projects" section.
 *   fetchAboutStats()       — Home page About section dynamic stats
 *                             (years_experience, contributions, total_projects).
 *
 *   Data sources:
 *     • years_experience  → Supabase `portfolio_stats` table
 *     • contributions     → GitHub GraphQL API (via /api/github-stats, cached 6 h)
 *     • total_projects    → count(projects WHERE is_published = false) + public_repos
 *
 * Schema references:
 *   supabase/migrations/20260302000000_create_projects_tables.sql
 *   supabase/migrations/20260303000000_create_portfolio_stats.sql
 *   supabase/migrations/20260304000000_refactor_portfolio_stats.sql
 */

import { supabase } from "@/lib/supabase";
import type { PopularProjectRow, ProjectCardItem } from "@/types/project";
import { toProjectCardItem } from "@/types/project";

// ─────────────────────────────────────────────────────────────────────────────
// About-section stats
// ─────────────────────────────────────────────────────────────────────────────

/** Shape returned by fetchAboutStats() */
export interface AboutStats {
  /** "Tahun Pengalaman" — years of professional/active coding experience */
  yearsExperience: number;
  /** "Kontribusi" — open-source contributions, collaborations, etc. */
  contributions: number;
  /**
   * "Project Selesai" — total completed projects.
   * Computed as:  count(projects WHERE is_published = false)  (Supabase)
   *             + (public_repos - IGNORED_GITHUB_REPOS)       (GitHub API, via /api/github-stats)
   *
   * IGNORED_GITHUB_REPOS = 2 → "agungkurniawanid" (profile README) + "portfolio"
   * These are filtered out on the /projects page so the count must match.
   */
  totalProjects: number;
  /** "Teknologi Dikuasai" — total published rows in the `skills` table */
  totalSkills: number;
  /** "Total Sertifikat" — total published rows in the `certificates` table */
  totalCertificates: number;
}

/**
 * Repos excluded from the public-repo count (profile README + this portfolio).
 * Must stay in sync with IGNORE_NAMES in src/app/projects/page.tsx.
 */
const IGNORED_GITHUB_REPOS = 2; // "agungkurniawanid" + "portfolio"


/**
 * Fetches all About-section stats in parallel:
 *   1. `portfolio_stats` row from Supabase (years_experience only)
 *   2. Count of `projects` rows where `is_published = false`
 *   3. GitHub stats from /api/github-stats (GraphQL contributions + REST public_repos,
 *      cached server-side for 6 hours — max 4 GitHub calls per day)
 *
 * Falls back gracefully to hardcoded defaults if any source fails.
 */
export async function fetchAboutStats(): Promise<AboutStats> {
  type GitHubStats = { contributions: number; public_repos: number };

  const [supabaseResult, unpublishedResult, githubResult, skillsResult, certificatesResult] = await Promise.allSettled([
    supabase
      .from("portfolio_stats")
      .select("years_experience")
      .limit(1), // Fetches at most 1 row, returns an array
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("is_published", false),
    fetch("/api/github-stats").then((r) => r.json() as Promise<GitHubStats>),
    supabase
      .from("skills")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    supabase
      .from("certificates")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
  ]);

  // ── Supabase portfolio_stats (years_experience only) ─────────────────────
  let yearsExperience = 0;

  if (
    supabaseResult.status === "fulfilled" &&
    !supabaseResult.value.error &&
    supabaseResult.value.data
  ) {
    // Data is now an array, so we safely access the first element.
    const statsData = supabaseResult.value.data[0];
    if (statsData) {
      yearsExperience = statsData.years_experience ?? 0;
    }
  } else {
    console.error(
      "[projectsApi] fetchAboutStats — Supabase portfolio_stats error:",
      supabaseResult.status === "fulfilled"
        ? supabaseResult.value.error?.message
        : supabaseResult.reason
    );
  }

  // ── Supabase unpublished projects count ───────────────────────────────────
  let unpublishedCount = 0;

  if (
    unpublishedResult.status === "fulfilled" &&
    !unpublishedResult.value.error &&
    typeof unpublishedResult.value.count === "number"
  ) {
    unpublishedCount = unpublishedResult.value.count;
  } else {
    console.error(
      "[projectsApi] fetchAboutStats — Supabase projects count error:",
      unpublishedResult.status === "fulfilled"
        ? unpublishedResult.value.error?.message
        : unpublishedResult.reason
    );
  }

  // ── GitHub (contributions + public repos) ────────────────────────────────
  let contributions = 0;
  let publicRepos   = 0;

  if (
    githubResult.status === "fulfilled" &&
    githubResult.value !== null &&
    typeof githubResult.value === "object"
  ) {
    const gh = githubResult.value;
    contributions = typeof gh.contributions === "number" ? gh.contributions : 0;
    // Subtract ignored repos so count matches the /projects page (same as IGNORE_NAMES there)
    publicRepos = typeof gh.public_repos === "number"
      ? Math.max(0, gh.public_repos - IGNORED_GITHUB_REPOS)
      : 0;
  } else {
    console.error(
      "[projectsApi] fetchAboutStats — GitHub API error:",
      githubResult.status === "rejected" ? githubResult.reason : "unknown"
    );
  }

  // ── Supabase skills count ──────────────────────────────────────────────────
  let totalSkills = 0;

  if (
    skillsResult.status === "fulfilled" &&
    !skillsResult.value.error &&
    typeof skillsResult.value.count === "number"
  ) {
    totalSkills = skillsResult.value.count;
  } else {
    console.error(
      "[projectsApi] fetchAboutStats — Supabase skills count error:",
      skillsResult.status === "fulfilled"
        ? skillsResult.value.error?.message
        : skillsResult.reason
    );
  }

  // ── Supabase certificates count ───────────────────────────────────────────
  let totalCertificates = 0;

  if (
    certificatesResult.status === "fulfilled" &&
    !certificatesResult.value.error &&
    typeof certificatesResult.value.count === "number"
  ) {
    totalCertificates = certificatesResult.value.count;
  } else {
    console.error(
      "[projectsApi] fetchAboutStats — Supabase certificates count error:",
      certificatesResult.status === "fulfilled"
        ? certificatesResult.value.error?.message
        : certificatesResult.reason
    );
  }

  return {
    yearsExperience,
    contributions,
    totalProjects: unpublishedCount + publicRepos,
    totalSkills,
    totalCertificates,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Coding Journey timeline
// ─────────────────────────────────────────────────────────────────────────────

/** Shape of a row in the `coding_journey` Supabase table */
export interface CodingJourneyRow {
  id: string;
  year: string;
  title: string;
  description: string;
  /** React icon identifier resolved on the frontend (e.g. "GraduationCap", "SiCplusplus") */
  icon_key: string;
  /** Tailwind gradient class (e.g. "from-blue-500 to-cyan-500") */
  color: string;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Fetches published coding-journey milestones from Supabase ordered by
 * `display_order` ascending.
 *
 * Returns an empty array on error so the caller can gracefully fall back
 * to the static TIMELINE_STATIC scaffold in about/page.tsx.
 */
export async function fetchCodingJourney(): Promise<CodingJourneyRow[]> {
  const { data, error } = await supabase
    .from("coding_journey")
    .select("*")
    .eq("is_published", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("[projectsApi] fetchCodingJourney error:", error.message);
    return [];
  }

  return (data ?? []) as CodingJourneyRow[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Work Experiences
// ─────────────────────────────────────────────────────────────────────────────

/** Shape of a row in the `work_experiences` Supabase table */
export interface WorkExperienceRow {
  id: string;
  company: string;
  position: string;
  /** 'Full-time' | 'Part-time' | 'Internship' | 'Contract' | 'Freelance' */
  employment_type: string;
  /** ISO date string — first day of employment (e.g. "2025-10-01") */
  start_date: string;
  /** ISO date string — last day; null means still active ("Present") */
  end_date: string | null;
  /** Explicit "currently working here" flag */
  is_current: boolean;
  /** City + region (e.g. "Kediri, East Java, Indonesia") */
  location: string;
  /** 'On-site' | 'Remote' | 'Hybrid' | '' */
  work_mode: string;
  description: string;
  /** Array of technology / tool names */
  tech_stack: string[];
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Fetches published work-experience entries from Supabase ordered by
 * `display_order` ascending.
 *
 * Returns an empty array on error so the caller can gracefully fall back
 * to the static EXPERIENCES_STATIC scaffold in about/page.tsx.
 */
export async function fetchWorkExperiences(): Promise<WorkExperienceRow[]> {
  const { data, error } = await supabase
    .from("work_experiences")
    .select("*")
    .eq("is_published", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("[projectsApi] fetchWorkExperiences error:", error.message);
    return [];
  }

  return (data ?? []) as WorkExperienceRow[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Skills
// ─────────────────────────────────────────────────────────────────────────────

/** Shape of a row in the `skills` Supabase table */
export interface SkillRow {
  id: string;
  name: string;
  /** 'frontend' | 'backend' | 'ai_ml' | 'mobile' | 'devops' | 'database' | 'cloud' */
  category: string;
  /** react-icons SI identifier, e.g. "SiReact" or "FaMicrochip" */
  icon_key: string;
  /** Hex tint colour, e.g. "#61DAFB" */
  icon_color: string;
  /** Proficiency 0–100 (shown as progress bar / percentage) */
  level: number;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Fetches all published skills from Supabase ordered by category then
 * display_order.
 *
 * Returns an empty array on error so the caller can fall back to the
 * static `techStackGroups` scaffold in about/page.tsx.
 */
export async function fetchSkills(): Promise<SkillRow[]> {
  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .eq("is_published", true)
    .order("category", { ascending: true })
    .order("display_order", { ascending: true });

  if (error) {
    console.error("[projectsApi] fetchSkills error:", error.message);
    return [];
  }

  return (data ?? []) as SkillRow[];
}

// Number of slots in the Home page Popular Projects grid
const POPULAR_PROJECTS_LIMIT = 9;

// ─────────────────────────────────────────────────────────────────────────────
// Unpublished (private / company) projects
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shape of a row returned by fetchUnpublishedProjects.
 * Only the fields needed by the Projects page are selected.
 */
export interface UnpublishedProjectRow {
  id: string;
  title: string;
  description: string;
  tech_stack: string[];
  category: string;
  year: number | null;
  platform_apps: string[];
  live_url: string | null;
}

/**
 * Fetches all projects where `is_published = false` (draft / private /
 * company-confidential) ordered by display_order ascending.
 *
 * Used by the Projects page to populate the "Company / Private" section.
 * Returns an empty array on error so the UI can fall back gracefully.
 */
export async function fetchUnpublishedProjects(): Promise<UnpublishedProjectRow[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id,title,description,tech_stack,category,year,platform_apps,live_url")
    .eq("is_published", false)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("[projectsApi] fetchUnpublishedProjects error:", error.message);
    return [];
  }

  return (data ?? []) as UnpublishedProjectRow[];
}



/**
 * Fetches the 9 popular projects for the Home page in display_order.
 *
 * Supabase JS equivalent of:
 *
 *   SELECT p.*, gu.label, gu.url
 *   FROM popular_projects pp
 *   JOIN projects p ON p.id = pp.project_id AND p.is_published = true
 *   LEFT JOIN project_github_urls gu ON gu.project_id = p.id
 *   ORDER BY pp.display_order ASC
 *   LIMIT 9;
 *
 * @returns Array of ProjectCardItem ready for the ProjectCard component.
 *          Returns an empty array on error so the UI can fall back gracefully.
 */
export async function fetchPopularProjects(): Promise<ProjectCardItem[]> {
  const { data, error } = await supabase
    .from("popular_projects")
    .select(
      `
      display_order,
      projects (
        id,
        title,
        description,
        thumbnail_url,
        platform_apps,
        tech_stack,
        live_url,
        github_api,
        category,
        year,
        is_published,
        display_order,
        created_at,
        updated_at,
        project_github_urls (
          label,
          url,
          display_order
        )
      )
    `
    )
    .eq("projects.is_published", true)
    .order("display_order", { ascending: true })
    .limit(POPULAR_PROJECTS_LIMIT);

  if (error) {
    console.error("[projectsApi] fetchPopularProjects error:", error.message);
    return [];
  }

  if (!data) return [];

  // Flatten the nested join into PopularProjectRow objects
  const rows: PopularProjectRow[] = (data as any[])
    .filter((row) => row.projects !== null)
    .map((row) => ({
      ...(row.projects as any),
      project_github_urls: (row.projects as any).project_github_urls ?? [],
      popular_display_order: row.display_order as number,
    }));

  return rows.map(toProjectCardItem);
}
