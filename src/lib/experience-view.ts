import { yearsFromExperiences } from "@/services/passport.service";
import type { ExperienceDTO } from "@/types/portfolio";

import { parseExperienceSort } from "./experience-options";

/** "Abidjan, Côte d'Ivoire" → "Côte d'Ivoire". A location without a comma has no separable country. */
export function countryOf(location: string | null): string | null {
  if (!location) return null;
  const parts = location.split(",").map((p) => p.trim());
  return parts.length > 1 ? parts[parts.length - 1] || null : null;
}

/** Facet value for the "Lieu" filter: remote work counts as its own place. */
export const placeOf = (e: Pick<ExperienceDTO, "location" | "workMode">) =>
  e.workMode === "REMOTE" ? "Télétravail" : (countryOf(e.location) ?? e.location?.trim() ?? null);

export const isCurrent = (e: Pick<ExperienceDTO, "endDate">) => !e.endDate;

export interface ExperienceFilters {
  q?: string;
  contract?: string[];
  period?: string[];
  domain?: string[];
  place?: string[];
  sort?: string;
}

/** URL params hold multi-select filters as comma-separated lists. */
export const parseList = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v)
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

const matches = (selected: string[] | undefined, value: string | null) =>
  !selected?.length || (value !== null && selected.includes(value));

export function filterExperiences(all: ExperienceDTO[], f: ExperienceFilters): ExperienceDTO[] {
  const q = f.q?.trim().toLowerCase();
  const rows = all.filter(
    (e) =>
      (!q || [e.title, e.company, e.location, e.description].some((t) => t?.toLowerCase().includes(q))) &&
      matches(f.contract, e.contractType) &&
      matches(f.period, isCurrent(e) ? "current" : "past") &&
      matches(f.domain, e.domain) &&
      matches(f.place, placeOf(e)),
  );
  const sort = parseExperienceSort(f.sort);
  return rows.sort((a, b) =>
    sort === "company"
      ? a.company.localeCompare(b.company, "fr")
      : sort === "oldest"
        ? a.startDate.localeCompare(b.startDate)
        : b.startDate.localeCompare(a.startDate),
  );
}

/** Counts per facet value over the whole list (not the filtered one), as the filter panel shows them. */
export function facetCounts(all: ExperienceDTO[], pick: (e: ExperienceDTO) => string | null) {
  const counts = new Map<string, number>();
  for (const e of all) {
    const value = pick(e);
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fr"));
}

export function experienceStats(all: ExperienceDTO[], today = new Date()) {
  const distinct = (values: (string | null)[]) => new Set(values.filter(Boolean)).size;
  return {
    total: all.length,
    companies: distinct(all.map((e) => e.company.trim().toLowerCase())),
    years: yearsFromExperiences(all, today),
    countries: distinct(all.map((e) => countryOf(e.location))),
    domains: distinct(all.map((e) => e.domain)),
  };
}

/** Skills tied to experiences, most used first. */
export function skillsByUsage(all: ExperienceDTO[]) {
  const counts = new Map<string, number>();
  for (const e of all) for (const s of e.skills) counts.set(s, (counts.get(s) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr")).map(([name]) => name);
}

const month = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric", timeZone: "UTC" });
const label = (day: string) => {
  const text = month.format(new Date(`${day}T00:00:00Z`)).replace(".", "");
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/** "Janv 2024 – Aujourd'hui". */
export const experiencePeriod = (e: Pick<ExperienceDTO, "startDate" | "endDate">) =>
  `${label(e.startDate)} – ${e.endDate ? label(e.endDate) : "Aujourd'hui"}`;
