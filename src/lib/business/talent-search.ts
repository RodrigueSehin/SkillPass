import { computeSkillPassScore, type ScoreResult } from "@/lib/score";
import { yearsFromExperiences } from "@/services/passport.service";
import type { SkillLevel } from "@/types/skill";
import { SKILL_LEVELS } from "@/types/skill";
import type { TalentDetail, TalentHit, TalentRecord } from "@/types/talent";

export const TALENTS_PER_PAGE = 8;
export const TALENT_SORTS = [
  ["match", "Meilleure correspondance"],
  ["experience", "Expérience"],
  ["recent", "Activité récente"],
] as const;
export type TalentSort = (typeof TALENT_SORTS)[number][0];

export interface TalentFilters {
  q: string;
  skills: string[];
  levels: SkillLevel[];
  certs: string[];
  location: string;
  minYears: number;
  availableNow: boolean;
  sort: TalentSort;
}

type Raw = Record<string, string | string[] | undefined>;
const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? [v] : []).map((x) => x.trim()).filter(Boolean);
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";

export function parseTalentFilters(raw: Raw): TalentFilters {
  const sort = one(raw.sort);
  const years = Number.parseInt(one(raw.years), 10);
  return {
    q: one(raw.q).slice(0, 80),
    skills: list(raw.skill).slice(0, 10),
    levels: list(raw.level).filter((l): l is SkillLevel => (SKILL_LEVELS as readonly string[]).includes(l)),
    certs: list(raw.cert).slice(0, 10),
    location: one(raw.location).slice(0, 80),
    minYears: Number.isFinite(years) && years > 0 ? Math.min(years, 40) : 0,
    availableNow: one(raw.available) === "1",
    sort: TALENT_SORTS.some(([k]) => k === sort) ? (sort as TalentSort) : "match",
  };
}

export const hasCriteria = (f: TalentFilters) => f.skills.length > 0 || f.certs.length > 0;

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Match against the requested skills and certifications: 70 % skill coverage (a skill below the
 * wanted level counts half), 20 % certification coverage, 10 % share of matched skills that are verified.
 */
export function matchScore(t: TalentRecord, f: TalentFilters): number | null {
  if (!hasCriteria(f)) return null;
  let coverage = 0;
  let verified = 0;
  for (const wanted of f.skills) {
    const owned = t.skills.find((s) => norm(s.name) === norm(wanted));
    if (!owned) continue;
    coverage += f.levels.length === 0 || f.levels.includes(owned.level) ? 1 : 0.5;
    if (owned.verified) verified += 1;
  }
  const matchedSkills = f.skills.length ? coverage / f.skills.length : 1;
  const certs = f.certs.length
    ? f.certs.filter((c) => t.certifications.some((x) => norm(x.name).includes(norm(c)))).length /
      f.certs.length
    : 1;
  const verifiedShare = f.skills.length ? verified / f.skills.length : 1;
  return Math.round(100 * (0.7 * matchedSkills + 0.2 * certs + 0.1 * verifiedShare));
}

function qualifies(t: TalentRecord, f: TalentFilters): boolean {
  if (f.q) {
    const hay = norm(
      [t.fullName, t.profession, t.headline, ...t.skills.map((s) => s.name)].filter(Boolean).join(" "),
    );
    if (!f.q.split(/\s+/).every((word) => hay.includes(norm(word)))) return false;
  }
  if (f.skills.length > 0 && !f.skills.some((w) => t.skills.some((s) => norm(s.name) === norm(w))))
    return false;
  if (
    f.certs.length > 0 &&
    !f.certs.some((c) => t.certifications.some((x) => norm(x.name).includes(norm(c))))
  )
    return false;
  if (f.levels.length > 0) {
    const pool = f.skills.length
      ? t.skills.filter((s) => f.skills.some((w) => norm(w) === norm(s.name)))
      : t.skills;
    if (!pool.some((s) => f.levels.includes(s.level))) return false;
  }
  if (f.location && !norm(t.location ?? "").includes(norm(f.location))) return false;
  if (t.yearsOfExperience < f.minYears) return false;
  if (f.availableNow && t.availability !== "IMMEDIATE") return false;
  return true;
}

/** Ranking when no skill is searched: verified skills first, then certifications and experience. */
const rank = (t: TalentRecord) =>
  t.skills.filter((s) => s.verified).length * 3 + t.certifications.length + t.yearsOfExperience / 2;

export function searchTalents(records: TalentRecord[], f: TalentFilters): TalentHit[] {
  const hits = records
    .filter((t) => qualifies(t, f))
    .map((record) => ({ record, match: matchScore(record, f) }));
  return hits.sort((a, b) => {
    if (f.sort === "experience") return b.record.yearsOfExperience - a.record.yearsOfExperience;
    if (f.sort === "recent") return b.record.updatedAt.localeCompare(a.record.updatedAt);
    return (b.match ?? rank(b.record)) - (a.match ?? rank(a.record)) || rank(b.record) - rank(a.record);
  });
}

export function directoryStats(records: TalentRecord[], hits: TalentHit[]) {
  const matches = hits.flatMap((h) => (h.match === null ? [] : [h.match]));
  return {
    total: records.length,
    verified: records.filter((t) => t.skills.some((s) => s.verified)).length,
    averageMatch: matches.length ? Math.round(matches.reduce((a, b) => a + b, 0) / matches.length) : null,
  };
}

/** Distinct locations, most common first, for the location filter. */
export function locationOptions(records: TalentRecord[]) {
  const counts = new Map<string, number>();
  for (const t of records) if (t.location) counts.set(t.location, (counts.get(t.location) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([l]) => l);
}

/** Same rules as the talent's own "Mon SkillPass" page. */
export function talentScore(detail: TalentDetail, now = new Date()): ScoreResult {
  const { record } = detail;
  const experiences = detail.experiences.map((e) => ({ startDate: e.startDate, endDate: e.endDate }));
  return computeSkillPassScore({
    skills: record.skills.map((s) => ({
      score: s.score,
      verificationStatus: s.verified ? "VERIFIED" : "UNVERIFIED",
      evidenceCount: s.evidenceCount,
    })),
    yearsOfExperience: Math.max(record.yearsOfExperience, yearsFromExperiences(experiences as never, now)),
    projectCount: record.projectCount,
    certifications: record.certifications.map((c) => ({
      verificationStatus: c.verified ? "VERIFIED" : "UNVERIFIED",
      expired: c.expired,
    })),
    recommendationCount: record.recommendationCount,
    daysSinceActivity: Math.floor((now.getTime() - Date.parse(record.updatedAt)) / 86_400_000),
  });
}
