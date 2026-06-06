/**
 * statsApi.ts
 *
 * NOTE: All portfolio-stats functionality has been consolidated into
 * projectsApi.ts (fetchAboutStats, AboutStats) to keep the API layer
 * in one place.  This file simply re-exports those symbols so any code
 * that imported from statsApi.ts continues to work without change.
 */

export { fetchAboutStats, type AboutStats } from "@/lib/projectsApi";
