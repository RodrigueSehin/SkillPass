import { countBy } from "@/lib/project-view";
import type { JobAlertDTO, OpportunityDTO } from "@/types/opportunity";

export const OPPORTUNITY_TABS = [
  ["all", "Toutes"],
  ["EMPLOI", "Emploi"],
  ["FREELANCE", "Freelance"],
  ["STAGE", "Stage"],
  ["PROJET", "Projet"],
  ["remote", "Remote"],
  ["international", "À l'international"],
] as const;
export type OpportunityTab = (typeof OPPORTUNITY_TABS)[number][0];

export const parseOpportunityTab = (v: string | undefined): OpportunityTab =>
  OPPORTUNITY_TABS.find(([key]) => key === v)?.[0] ?? "all";

export const OPPORTUNITY_SORTS = [
  ["recent", "Plus récentes"],
  ["oldest", "Plus anciennes"],
  ["match", "Meilleure correspondance"],
] as const;
export type OpportunitySort = (typeof OPPORTUNITY_SORTS)[number][0];

export const parseOpportunitySort = (v: string | undefined): OpportunitySort =>
  OPPORTUNITY_SORTS.find(([key]) => key === v)?.[0] ?? "recent";

export const OPPORTUNITIES_PER_PAGE = 6;
export const COMPANIES_SHOWN = 5;

const isRemote = (o: OpportunityDTO) => o.region === "REMOTE" || o.workMode === "REMOTE";
const isInternational = (o: OpportunityDTO) => o.region !== "CI" && o.region !== "REMOTE";

export interface OpportunityFilters {
  q?: string;
  tab?: string;
  kind?: string[];
  region?: string[];
  domain?: string[];
  level?: string[];
  company?: string;
  sort?: string;
}

const matches = (selected: string[] | undefined, value: string) =>
  !selected?.length || selected.includes(value);

/** Share (0-100) of the skills an offer asks for that the user already has. */
export function matchScore(offer: Pick<OpportunityDTO, "skills">, userSkills: ReadonlySet<string>) {
  if (offer.skills.length === 0) return 0;
  const owned = offer.skills.filter((s) => userSkills.has(s.toLowerCase())).length;
  return Math.round((owned / offer.skills.length) * 100);
}

export function filterOpportunities(
  all: OpportunityDTO[],
  f: OpportunityFilters,
  userSkills: ReadonlySet<string> = new Set(),
) {
  const q = f.q?.trim().toLowerCase();
  const tab = parseOpportunityTab(f.tab);
  const rows = all.filter(
    (o) =>
      (!q ||
        [o.title, o.company, o.companyLabel, o.location, o.domain, ...o.skills].some((t) =>
          t?.toLowerCase().includes(q),
        )) &&
      (tab === "all" ||
        (tab === "remote" ? isRemote(o) : tab === "international" ? isInternational(o) : o.kind === tab)) &&
      matches(f.kind, o.kind) &&
      matches(f.region, o.region) &&
      matches(f.domain, o.domain) &&
      matches(f.level, o.level) &&
      (!f.company || o.company === f.company),
  );
  const sort = parseOpportunitySort(f.sort);
  return rows.sort((a, b) =>
    sort === "oldest"
      ? a.publishedAt.localeCompare(b.publishedAt)
      : sort === "match"
        ? matchScore(b, userSkills) - matchScore(a, userSkills) || b.publishedAt.localeCompare(a.publishedAt)
        : b.publishedAt.localeCompare(a.publishedAt),
  );
}

/** Share (0-100) of a selection the profile fits: at least half of the asked skills are owned. */
export function selectionMatch(list: OpportunityDTO[], userSkills: ReadonlySet<string>) {
  if (list.length === 0) return 0;
  return Math.round((list.filter((o) => matchScore(o, userSkills) >= 50).length / list.length) * 100);
}

export function matchLabel(percent: number) {
  if (percent >= 70) return "Excellent match !";
  if (percent >= 40) return "Bon match";
  return "À renforcer";
}

export const companyRanking = (all: OpportunityDTO[]) => countBy(all.map((o) => o.company));

const DAY_MS = 86_400_000;

/** "il y a 2 jours", "il y a 1 semaine"… */
export function relativeDate(publishedAt: string, now = new Date()) {
  const days = Math.max(0, Math.floor((now.getTime() - Date.parse(publishedAt)) / DAY_MS));
  const plural = (n: number, unit: string) => `il y a ${n} ${unit}${n > 1 && unit !== "mois" ? "s" : ""}`;
  if (days === 0) return "aujourd'hui";
  if (days < 7) return plural(days, "jour");
  if (days < 30) return plural(Math.floor(days / 7), "semaine");
  if (days < 365) return plural(Math.floor(days / 30), "mois");
  return plural(Math.floor(days / 365), "an");
}

/** The page URL that re-applies an alert's criteria. */
export function alertHref(a: Pick<JobAlertDTO, "query" | "kind" | "region" | "domain" | "level">) {
  const params = new URLSearchParams();
  if (a.query) params.set("q", a.query);
  if (a.kind) params.set("kind", a.kind);
  if (a.region) params.set("region", a.region);
  if (a.domain) params.set("domain", a.domain);
  if (a.level) params.set("level", a.level);
  const qs = params.toString();
  return qs ? `/dashboard/opportunities?${qs}` : "/dashboard/opportunities";
}

export const alertFilters = (a: Pick<JobAlertDTO, "query" | "kind" | "region" | "domain" | "level">) =>
  ({
    q: a.query ?? undefined,
    kind: a.kind ? [a.kind] : undefined,
    region: a.region ? [a.region] : undefined,
    domain: a.domain ? [a.domain] : undefined,
    level: a.level ? [a.level] : undefined,
  }) satisfies OpportunityFilters;
