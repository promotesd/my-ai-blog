/**
 * project.ts
 * TypeScript types that mirror the Supabase database schema defined in:
 * supabase/migrations/20260302000000_create_projects_tables.sql
 */

// ──────────────────────────────────────────────────────────────
// Raw Supabase row types (match column names exactly)
// ──────────────────────────────────────────────────────────────

export interface DbProject {
  id: string;                  // UUID
  title: string;
  description: string;
  thumbnail_url: string | null;
  platform_apps: string[];
  tech_stack: string[];
  live_url: string | null;
  github_api: string | null;
  category: "personal" | "academic" | "freelance" | "company";
  year: number | null;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbProjectGithubUrl {
  id: string;
  project_id: string;
  label: string;       // 'web' | 'mobile' | 'iot' | 'model AI' | …
  url: string;
  display_order: number;
  created_at: string;
}

export interface DbProjectImage {
  id: string;
  project_id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  is_thumbnail: boolean;
  created_at: string;
}

export interface DbPopularProject {
  id: string;
  project_id: string;
  display_order: number;
  created_at: string;
}

// ──────────────────────────────────────────────────────────────
// Joined / enriched type returned by the popular-projects query.
// This is what the Home page actually consumes.
// ──────────────────────────────────────────────────────────────

export interface PopularProjectRow extends DbProject {
  /** Ordered list of GitHub repositories for this project. */
  project_github_urls: Pick<DbProjectGithubUrl, "label" | "url" | "display_order">[];
  /** Slot position (0–8) on the Home page grid. */
  popular_display_order: number;
}

// ──────────────────────────────────────────────────────────────
// UI-facing type consumed by ProjectCard and ProjectSection.
// This is intentionally kept compatible with the legacy static
// `Project` interface so the card component stays unchanged.
// ──────────────────────────────────────────────────────────────

export interface ProjectCardItem {
  id: number | string;
  title: string;
  description: string;
  platformApp: string[];
  /** Supabase CDN URL string for the project thumbnail. */
  image: string;
  /** Map of  label → GitHub URL  (e.g. { web: "https://…", mobile: "https://…" }) */
  githubURL: Record<string, string>;
  githubApi: string;
  liveURL: string;
  technologies: string[];
}

// ──────────────────────────────────────────────────────────────
// Helper — converts a raw PopularProjectRow into a ProjectCardItem
// ──────────────────────────────────────────────────────────────

export function toProjectCardItem(row: PopularProjectRow): ProjectCardItem {
  const githubURL: Record<string, string> = {};
  (row.project_github_urls ?? [])
    .sort((a, b) => a.display_order - b.display_order)
    .forEach(({ label, url }) => {
      githubURL[label] = url;
    });

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    platformApp: row.platform_apps ?? [],
    image: row.thumbnail_url ?? "",
    githubURL,
    githubApi: row.github_api ?? "",
    liveURL: row.live_url ?? "#",
    technologies: row.tech_stack ?? [],
  };
}
