import { SOFT_SKILLS } from "@/config/job-catalog";
import type { OrgSkillDTO, SkillKind, SkillRow, DemandLevel } from "@/types/org-skill";
import type { TalentRecord } from "@/types/talent";

export const SKILLS_PER_PAGE = 10;
export const SKILL_TABS = [
  ["all", "Toutes les compétences"],
  ["technical", "Compétences techniques"],
  ["transversal", "Compétences transversales"],
  ["referential", "Référentiel"],
] as const;
export type SkillTab = (typeof SKILL_TABS)[number][0];
export const parseSkillTab = (v: string | undefined): SkillTab =>
  SKILL_TABS.find(([k]) => k === v)?.[0] ?? "all";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const SOFT = new Set(SOFT_SKILLS.map(norm));
const SOFT_CATEGORIES = new Set(["communication", "leadership", "soft skills"]);

/** A skill is transversal when it is a known soft skill or sits in a behavioural category. */
export function skillKindOf(name: string, category: string | null): SkillKind {
  return SOFT.has(norm(name)) || (category !== null && SOFT_CATEGORIES.has(norm(category)))
    ? "TRANSVERSAL"
    : "TECHNICAL";
}

/** Demand relative to the most asked-for skill: a skill nobody asks for has no demand at all. */
export function demandLevel(count: number, max: number): DemandLevel {
  if (count <= 0 || max <= 0) return "NONE";
  const ratio = count / max;
  if (ratio >= 0.7) return "VERY_HIGH";
  if (ratio >= 0.4) return "HIGH";
  if (ratio >= 0.15) return "MEDIUM";
  return "LOW";
}

interface OfferSkills {
  skills: string[];
  publishedAt: string;
}

/** One row per skill, merging what talents hold, what offers ask for and what the organization defined. */
export function buildSkillRows(
  talents: TalentRecord[],
  offers: OfferSkills[],
  orgSkills: OrgSkillDTO[],
): SkillRow[] {
  const rows = new Map<
    string,
    { name: string; category: string | null; scores: number[]; offers: number; orgSkill: OrgSkillDTO | null }
  >();
  const entry = (name: string) => {
    const key = norm(name);
    let row = rows.get(key);
    if (!row)
      rows.set(key, (row = { name: name.trim(), category: null, scores: [], offers: 0, orgSkill: null }));
    return row;
  };
  for (const t of talents) {
    for (const s of t.skills) {
      const row = entry(s.name);
      row.scores.push(s.score);
      row.category ??= s.category;
    }
  }
  for (const o of offers)
    for (const name of new Set(o.skills.map((s) => s.trim()).filter(Boolean))) entry(name).offers += 1;
  for (const s of orgSkills) {
    const row = entry(s.name);
    row.orgSkill = s;
    row.name = s.name;
  }
  const maxOffers = Math.max(0, ...[...rows.values()].map((r) => r.offers));
  return [...rows.values()]
    .map((r): SkillRow => {
      const category = r.orgSkill?.category ?? r.category ?? "Autres";
      return {
        name: r.name,
        category,
        kind: r.orgSkill?.kind ?? skillKindOf(r.name, category),
        talents: r.scores.length,
        averageLevel: r.scores.length
          ? Math.round((r.scores.reduce((a, b) => a + b, 0) / r.scores.length / 20) * 10) / 10
          : null,
        offers: r.offers,
        demand: demandLevel(r.offers, maxOffers),
        orgSkillId: r.orgSkill?.id ?? null,
      };
    })
    .sort((a, b) => b.talents - a.talents || b.offers - a.offers || a.name.localeCompare(b.name));
}

export interface SkillFilters {
  tab?: SkillTab;
  q?: string;
  category?: string;
  demand?: string;
}

export function filterSkillRows(rows: SkillRow[], f: SkillFilters): SkillRow[] {
  const q = f.q ? norm(f.q) : "";
  return rows.filter(
    (r) =>
      (f.tab !== "technical" || r.kind === "TECHNICAL") &&
      (f.tab !== "transversal" || r.kind === "TRANSVERSAL") &&
      (f.tab !== "referential" || r.orgSkillId !== null) &&
      (!q || norm(r.name).includes(q)) &&
      (!f.category || r.category === f.category) &&
      (!f.demand || r.demand === f.demand),
  );
}

export function skillStats(rows: SkillRow[], talents: TalentRecord[]) {
  const held = rows.filter((r) => r.talents > 0);
  const weight = held.reduce((n, r) => n + r.talents, 0);
  return {
    unique: rows.length,
    technical: rows.filter((r) => r.kind === "TECHNICAL").length,
    transversal: rows.filter((r) => r.kind === "TRANSVERSAL").length,
    talents: talents.filter((t) => t.skills.length > 0).length,
    veryDemanded: rows.filter((r) => r.demand === "VERY_HIGH").length,
    averageLevel: weight
      ? Math.round((held.reduce((n, r) => n + (r.averageLevel ?? 0) * r.talents, 0) / weight) * 10) / 10
      : null,
  };
}

/** Share of skills per category: the five biggest, then the rest together. */
export function categoryShare(rows: SkillRow[], top = 5) {
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const head = sorted.slice(0, top);
  const rest = sorted.slice(top).reduce((n, [, c]) => n + c, 0);
  // "Autres" may already be one of the biggest categories: fold the small ones into it rather than listing it twice.
  const other = head.findIndex(([category]) => category === "Autres");
  const all =
    rest === 0
      ? head
      : other >= 0
        ? head.map(([category, count], i): [string, number] => [category, i === other ? count + rest : count])
        : [...head, ["Autres", rest] as [string, number]];
  return all.map(([category, count]) => ({
    category,
    count,
    percent: rows.length ? Math.round((count / rows.length) * 100) : 0,
  }));
}

export const topDemanded = (rows: SkillRow[], limit = 5) =>
  rows
    .filter((r) => r.offers > 0)
    .sort((a, b) => b.offers - a.offers || b.talents - a.talents || a.name.localeCompare(b.name))
    .slice(0, limit);

const MONTH = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });

/** Offers published per month for the most asked-for skills, over the last `months` months. */
export function demandTrend(offers: OfferSkills[], names: string[], now: Date, months = 6) {
  const starts = Array.from(
    { length: months },
    (_, i) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1 - i), 1)),
  );
  const key = (d: Date) => `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
  const index = new Map(starts.map((d, i) => [key(d), i]));
  const series = names.map((name) => {
    const values = starts.map(() => 0);
    for (const o of offers) {
      if (!o.skills.some((s) => norm(s) === norm(name))) continue;
      const i = index.get(key(new Date(o.publishedAt)));
      if (i !== undefined) values[i]! += 1;
    }
    return { name, values };
  });
  return { labels: starts.map((d) => MONTH.format(d).replace(".", "")), series };
}
