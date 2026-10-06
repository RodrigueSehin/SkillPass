import { countBy } from "@/lib/project-view";
import type { RecommendationDTO } from "@/types/verification";

export const RECOMMENDATION_SORTS = [
  ["recent", "Plus récentes"],
  ["oldest", "Plus anciennes"],
  ["rating", "Mieux notées"],
] as const;
export type RecommendationSort = (typeof RECOMMENDATION_SORTS)[number][0];

export const parseRecommendationSort = (v: string | undefined): RecommendationSort =>
  RECOMMENDATION_SORTS.find(([key]) => key === v)?.[0] ?? "recent";

export const KEYWORD_FILTERS_SHOWN = 5;

/** Recommendations the holder has published: the only ones that count in the figures. */
export const isPublished = (r: Pick<RecommendationDTO, "status">) => r.status === "APPROVED";

/** The day it was written, or asked for when it has not been answered yet. */
const dateOf = (r: RecommendationDTO) => r.submittedAt ?? r.createdAt;
export const yearOf = (r: RecommendationDTO) => dateOf(r).slice(0, 4);

export interface RecommendationFilters {
  q?: string;
  status?: string[];
  relation?: string[];
  keyword?: string[];
  year?: string[];
  sort?: string;
}

const matches = (selected: string[] | undefined, values: (string | null)[]) =>
  !selected?.length || values.some((v) => v !== null && selected.includes(v));

export function filterRecommendations(all: RecommendationDTO[], f: RecommendationFilters) {
  const q = f.q?.trim().toLowerCase();
  const rows = all.filter(
    (r) =>
      (!q ||
        [r.authorName, r.authorTitle, r.content, ...r.keywords].some((t) => t?.toLowerCase().includes(q))) &&
      matches(f.status, [r.status]) &&
      matches(f.relation, [r.relation]) &&
      matches(f.keyword, r.keywords) &&
      matches(f.year, [yearOf(r)]),
  );
  const sort = parseRecommendationSort(f.sort);
  return rows.sort((a, b) =>
    sort === "oldest"
      ? dateOf(a).localeCompare(dateOf(b))
      : sort === "rating"
        ? (b.rating ?? 0) - (a.rating ?? 0) || dateOf(b).localeCompare(dateOf(a))
        : dateOf(b).localeCompare(dateOf(a)),
  );
}

export function recommendationStats(all: RecommendationDTO[]) {
  const published = all.filter(isPublished);
  const rated = published.filter((r) => r.rating !== null);
  const average = rated.length ? rated.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rated.length : null;
  return {
    received: published.length,
    recommenders: new Set(published.map((r) => r.authorName.trim().toLowerCase())).size,
    average: average === null ? null : Math.round(average * 10) / 10,
    /** Share of rated recommendations with 4 stars or more. */
    recommendPercent: rated.length
      ? Math.round((rated.filter((r) => (r.rating ?? 0) >= 4).length / rated.length) * 100)
      : null,
    ratedCount: rated.length,
  };
}

/** Number of published recommendations per star count, 5 down to 1. */
export function ratingDistribution(all: RecommendationDTO[]) {
  const published = all.filter(isPublished);
  return [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: published.filter((r) => r.rating === stars).length,
  }));
}

export function topKeywords(all: RecommendationDTO[], limit = 8) {
  return countBy(all.filter(isPublished).flatMap((r) => r.keywords)).slice(0, limit);
}

export function credibilityLabel(average: number | null) {
  if (average === null) return "Pas encore de note";
  if (average >= 4.5) return "Excellent !";
  if (average >= 3.5) return "Très bien";
  if (average >= 2.5) return "Correct";
  return "À améliorer";
}

const dayFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
/** "2026-09-12T…" → "12 sept. 2026". */
export const recommendationDate = (r: RecommendationDTO) => dayFmt.format(new Date(dateOf(r)));

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
