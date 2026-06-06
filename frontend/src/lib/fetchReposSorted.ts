/**
 * fetchReposSorted.ts
 *
 * Fetch all GitHub repositories owned by the portfolio owner,
 * sorted from the OLDEST created_at to the NEWEST created_at.
 *
 * - GITHUB_TOKEN present  → fetch ALL repos (public + private)
 *   via GET /user/repos?visibility=all
 * - GITHUB_TOKEN absent   → fetch only PUBLIC repos
 *   via GET /users/{username}/repos
 *
 * Uses the native `fetch` available in Node 18+ / Next.js runtime.
 */

const GITHUB_USERNAME = "agungkurniawanid";
const GITHUB_API_BASE = "https://api.github.com";

export interface RepoRecord {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  topics: string[];
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  created_at: string;
  updated_at: string;
  visibility: string;
}

interface RawRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  topics?: string[];
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  created_at: string;
  updated_at: string;
  visibility: string;
}

function buildHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "portfolio-site",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function fetchAllPages(baseUrl: string): Promise<RawRepo[]> {
  const headers = buildHeaders();
  const allItems: RawRepo[] = [];
  let page = 1;

  while (true) {
    const sep = baseUrl.includes("?") ? "&" : "?";
    const url = `${baseUrl}${sep}per_page=100&page=${page}`;

    const res = await fetch(url, { headers });

    if (!res.ok) {
      console.error(
        `[fetchReposSorted] GitHub API responded ${res.status} on page ${page}`
      );
      break;
    }

    const items: RawRepo[] = await res.json();

    if (!items || items.length === 0) break;

    allItems.push(...items);

    if (items.length < 100) break;

    page++;
  }

  return allItems;
}

export async function fetchReposSortedByCreated(): Promise<RepoRecord[]> {
  const token = process.env.GITHUB_TOKEN;

  const baseUrl = token
    ? `${GITHUB_API_BASE}/user/repos?visibility=all&affiliation=owner&sort=created&direction=asc`
    : `${GITHUB_API_BASE}/users/${GITHUB_USERNAME}/repos?sort=created&direction=asc`;

  const raw = await fetchAllPages(baseUrl);

  const repos: RepoRecord[] = raw.map((r) => ({
    id: r.id,
    name: r.name,
    full_name: r.full_name,
    html_url: r.html_url,
    description: r.description,
    homepage: r.homepage,
    topics: r.topics ?? [],
    language: r.language,
    stargazers_count: r.stargazers_count,
    forks_count: r.forks_count,
    watchers_count: r.watchers_count,
    created_at: r.created_at,
    updated_at: r.updated_at,
    visibility: r.visibility,
  }));

  // Sort oldest → newest (API already sorts this way, but enforce it explicitly)
  repos.sort((a, b) => a.created_at.localeCompare(b.created_at));

  return repos;
}
