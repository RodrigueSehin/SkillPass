import type { JobOfferDTO } from "@/types/job-offer";
import type { MatchEventDTO, MatchEventType, SavedMatchDTO } from "@/types/matching";
import { MATCH_STATUSES, type MatchStatus } from "@/types/matching";
import type { Availability } from "@/types/profile";
import type { TalentHit, TalentRecord } from "@/types/talent";
import type { OfferMatch } from "./matching";
import { searchTalents, TALENT_SORTS, type TalentFilters, type TalentSort } from "./talent-search";

export const MATCH_TABS = [
  ["recherche", "Recherche de talents"],
  ["recommandations", "Recommandations IA"],
  ["sauvegardes", "Correspondances sauvegardées"],
  ["historique", "Historique"],
] as const;
export type MatchTab = (typeof MATCH_TABS)[number][0];
export const parseMatchTab = (v: string | undefined): MatchTab =>
  MATCH_TABS.find(([k]) => k === v)?.[0] ?? "recherche";

export const EXPERIENCE_BUCKETS = [
  ["0-2", "0 - 2 ans", 0, 2],
  ["3-5", "3 - 5 ans", 3, 5],
  ["6-10", "6 - 10 ans", 6, 10],
  ["10+", "10+ ans", 10, Infinity],
] as const;

export const AVAILABILITY_OPTIONS: [Availability, string][] = [
  ["IMMEDIATE", "Immédiate"],
  ["ONE_MONTH", "Dans 1 mois"],
  ["THREE_MONTHS", "Dans 3 mois"],
  ["NOT_AVAILABLE", "Non disponible"],
];

export interface MatchSearch {
  q: string;
  skills: string[];
  /** The offer chosen as "poste recherché": its skills are used when none is typed. */
  offerId: string;
  location: string;
  exp: string[];
  dispo: Availability[];
  sort: TalentSort;
}

type Raw = Record<string, string | string[] | undefined>;
const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? [v] : []).map((x) => x.trim()).filter(Boolean);
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";

export function parseMatchSearch(raw: Raw): MatchSearch {
  const sort = one(raw.sort);
  return {
    q: one(raw.q).slice(0, 80),
    skills: list(raw.skill).slice(0, 10),
    offerId: one(raw.poste).slice(0, 64),
    location: one(raw.location).slice(0, 80),
    exp: list(raw.exp).filter((e) => EXPERIENCE_BUCKETS.some(([k]) => k === e)),
    dispo: list(raw.dispo).filter((d): d is Availability => AVAILABILITY_OPTIONS.some(([k]) => k === d)),
    sort: TALENT_SORTS.some(([k]) => k === sort) ? (sort as TalentSort) : "match",
  };
}

/** The search as a query string, without paging: what the history stores to reopen it. */
export function searchQuery(s: MatchSearch): string {
  const p = new URLSearchParams();
  if (s.q) p.set("q", s.q);
  for (const k of s.skills) p.append("skill", k);
  if (s.offerId) p.set("poste", s.offerId);
  if (s.location) p.set("location", s.location);
  for (const e of s.exp) p.append("exp", e);
  for (const d of s.dispo) p.append("dispo", d);
  if (s.sort !== "match") p.set("sort", s.sort);
  return p.toString();
}

/** Skills actually scored: the typed ones, or else the chosen offer's. */
export const effectiveSkills = (s: MatchSearch, offer: JobOfferDTO | undefined) =>
  s.skills.length > 0 ? s.skills : (offer?.skills ?? []);

export function runSearch(
  records: TalentRecord[],
  s: MatchSearch,
  offer: JobOfferDTO | undefined,
): TalentHit[] {
  const filters: TalentFilters = {
    q: s.q,
    skills: effectiveSkills(s, offer),
    levels: [],
    certs: s.skills.length > 0 ? [] : (offer?.certifications ?? []),
    location: s.location,
    minYears: 0,
    availableNow: false,
    sort: s.sort,
  };
  return searchTalents(records, filters).filter(({ record: t }) => {
    if (
      s.exp.length > 0 &&
      !EXPERIENCE_BUCKETS.some(
        ([k, , min, max]) => s.exp.includes(k) && t.yearsOfExperience >= min && t.yearsOfExperience <= max,
      )
    )
      return false;
    return s.dispo.length === 0 || s.dispo.includes(t.availability);
  });
}

/** One-line summary of the criteria, for the history. */
export function searchSubtitle(s: MatchSearch, offer: JobOfferDTO | undefined): string {
  return [
    ...(offer && s.skills.length === 0 ? [offer.title] : []),
    s.location,
    s.exp.length ? `${s.exp.join(", ")} ans` : "",
    s.dispo.length ? `${s.dispo.length} disponibilité${s.dispo.length > 1 ? "s" : ""}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

export const searchTitle = (s: MatchSearch, offer: JobOfferDTO | undefined) =>
  [s.q, ...s.skills].filter(Boolean).join(", ") || offer?.title || "Tous les talents";

// ---- Recommendations -------------------------------------------------------------------------

export const TIERS = [
  ["all", "Tous", 0],
  ["high", "Hautement pertinents", 85],
  ["good", "Pertinents", 70],
  ["consider", "À considérer", 0],
] as const;
export type Tier = (typeof TIERS)[number][0];
export const parseTier = (v: string | undefined): Tier => TIERS.find(([k]) => k === v)?.[0] ?? "all";

export const tierOf = (score: number): Exclude<Tier, "all"> =>
  score >= 85 ? "high" : score >= 70 ? "good" : "consider";

export const tierCounts = (matches: OfferMatch[]): Record<Tier, number> => ({
  all: matches.length,
  high: matches.filter((m) => tierOf(m.score) === "high").length,
  good: matches.filter((m) => tierOf(m.score) === "good").length,
  consider: matches.filter((m) => tierOf(m.score) === "consider").length,
});

export interface Refinement {
  minYears: number;
  skills: string[];
  location: string;
}

export function parseRefinement(raw: Raw): Refinement {
  const years = Number.parseInt(one(raw.years), 10);
  return {
    minYears: Number.isFinite(years) && years > 0 ? Math.min(years, 40) : 0,
    skills: list(raw.skill).slice(0, 10),
    location: one(raw.location).slice(0, 80),
  };
}

/** The offer with the member's refinements applied. Nothing is saved on the offer itself. */
export const refineOffer = (offer: JobOfferDTO, r: Refinement): JobOfferDTO =>
  r.skills.length > 0 ? { ...offer, skills: r.skills } : offer;

export function applyRefinement(matches: OfferMatch[], r: Refinement): OfferMatch[] {
  return matches.filter(
    (m) =>
      m.record.yearsOfExperience >= r.minYears &&
      (!r.location || (m.record.location ?? "").toLowerCase().includes(r.location.toLowerCase())),
  );
}

// ---- Why a talent fits -------------------------------------------------------------------------

/** Plain-language strengths read from the profile and the wanted skills. Nothing is invented. */
export function strengths(t: TalentRecord, wanted: string[]): string[] {
  const norm = (s: string) => s.toLowerCase();
  const owned = t.skills.filter((s) => wanted.some((w) => norm(w) === norm(s.name)));
  const out: string[] = [];
  if (owned.length > 0)
    out.push(
      `Maîtrise ${owned.length} compétence${owned.length > 1 ? "s" : ""} recherchée${owned.length > 1 ? "s" : ""} (${owned
        .slice(0, 3)
        .map((s) => s.name)
        .join(", ")})`,
    );
  const verified = owned.filter((s) => s.verified);
  if (verified.length > 0)
    out.push(
      `${verified.length} compétence${verified.length > 1 ? "s" : ""} vérifiée${verified.length > 1 ? "s" : ""}`,
    );
  const cert =
    t.certifications.find((c) => c.verified && !c.expired) ?? t.certifications.find((c) => !c.expired);
  if (cert) out.push(`Certifié ${cert.name}`);
  if (t.yearsOfExperience > 0)
    out.push(`${t.yearsOfExperience} an${t.yearsOfExperience > 1 ? "s" : ""} d'expérience`);
  if (t.availability === "IMMEDIATE") out.push("Disponible immédiatement");
  if (t.projectCount > 0)
    out.push(
      `${t.projectCount} projet${t.projectCount > 1 ? "s" : ""} réalisé${t.projectCount > 1 ? "s" : ""}`,
    );
  if (t.recommendationCount > 0)
    out.push(`${t.recommendationCount} recommandation${t.recommendationCount > 1 ? "s" : ""}`);
  return out;
}

/** A short factual synthesis (rules, not a language model). */
export function synthesis(t: TalentRecord, wanted: string[]): string {
  const owned = t.skills.filter((s) => wanted.some((w) => w.toLowerCase() === s.name.toLowerCase()));
  const top = [...t.skills]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.name);
  const role = t.profession ?? t.headline ?? "Profil";
  const base = `${role}, ${t.yearsOfExperience} an${t.yearsOfExperience > 1 ? "s" : ""} d'expérience${top.length ? `, surtout sur ${top.join(", ")}` : ""}.`;
  return wanted.length > 0
    ? `${base} Couvre ${owned.length} des ${wanted.length} compétences recherchées.`
    : base;
}

/** Offers (open ones) for which the talent clears the threshold, best first. */
export function compatibleOffers(
  talent: TalentRecord,
  offers: JobOfferDTO[],
  score: (o: JobOfferDTO, t: TalentRecord) => OfferMatch | null,
  threshold: number,
) {
  return offers
    .flatMap((o) => {
      const m = score(o, talent);
      return m && m.matchedSkills.length > 0 && m.score >= threshold ? [{ offer: o, score: m.score }] : [];
    })
    .sort((a, b) => b.score - a.score);
}

// ---- Saved matches ---------------------------------------------------------------------------

export interface SavedFilters {
  q: string;
  offerId: string;
  status: MatchStatus | "";
}

export function parseSavedFilters(raw: Raw): SavedFilters {
  const status = one(raw.statut);
  return {
    q: one(raw.sq).slice(0, 80),
    offerId: one(raw.sposte).slice(0, 64),
    status: (MATCH_STATUSES as readonly string[]).includes(status) ? (status as MatchStatus) : "",
  };
}

export function filterSaved(
  saved: SavedMatchDTO[],
  byProfile: Map<string, TalentRecord>,
  f: SavedFilters,
): SavedMatchDTO[] {
  const q = f.q.toLowerCase();
  return saved.filter((s) => {
    const t = byProfile.get(s.profileId);
    if (!t) return false;
    if (f.status && s.status !== f.status) return false;
    if (f.offerId && s.jobOfferId !== f.offerId) return false;
    return (
      !q ||
      [t.fullName, t.profession, t.headline, ...t.skills.map((k) => k.name)]
        .filter(Boolean)
        .some((x) => x!.toLowerCase().includes(q))
    );
  });
}

// ---- History ---------------------------------------------------------------------------------

export const PERIODS = [
  ["7", "7 derniers jours"],
  ["30", "30 derniers jours"],
  ["90", "90 derniers jours"],
] as const;
export const parsePeriod = (v: string | undefined) => (PERIODS.some(([k]) => k === v) ? Number(v) : 30);

const DAY = 86_400_000;

export interface Delta {
  value: number;
  /** Percent change against the previous period; null when the previous one was empty. */
  percent: number | null;
}

const delta = (now: number, before: number): Delta => ({
  value: now,
  percent: before === 0 ? null : Math.round(((now - before) / before) * 100),
});

/** Events of the last `days` days (current) and the `days` before them (previous), from a 2x window. */
export function historyStats(events: MatchEventDTO[], days: number, now = new Date()) {
  const end = now.getTime();
  const cut = end - days * DAY;
  const current = events.filter((e) => Date.parse(e.createdAt) > cut);
  const previous = events.filter(
    (e) => Date.parse(e.createdAt) <= cut && Date.parse(e.createdAt) > cut - days * DAY,
  );
  const count = (list: MatchEventDTO[], t: MatchEventType) => list.filter((e) => e.type === t).length;
  const analysed = (list: MatchEventDTO[]) =>
    list.reduce(
      (sum, e) => sum + (e.type === "SEARCH" || e.type === "RECOMMENDATION" ? (e.results ?? 0) : 0),
      0,
    );

  const dayKey = (t: number) => new Date(t).toISOString().slice(0, 10);
  const points = Array.from({ length: days }, (_, i) => dayKey(end - (days - 1 - i) * DAY));
  const series = (t: MatchEventType) =>
    points.map((d) => current.filter((e) => e.type === t && e.createdAt.slice(0, 10) === d).length);

  return {
    searches: delta(count(current, "SEARCH"), count(previous, "SEARCH")),
    analysed: delta(analysed(current), analysed(previous)),
    recommendations: delta(count(current, "RECOMMENDATION"), count(previous, "RECOMMENDATION")),
    saves: delta(count(current, "SAVE"), count(previous, "SAVE")),
    chart: {
      days: points,
      searches: series("SEARCH"),
      recommendations: series("RECOMMENDATION"),
      saves: series("SAVE"),
    },
    byType: (["SEARCH", "RECOMMENDATION", "SAVE", "EXPORT"] as const).map(
      (t) => [t, count(current, t)] as const,
    ),
    current,
  };
}

export const statusBreakdown = (saved: SavedMatchDTO[]) =>
  MATCH_STATUSES.map((s) => [s, saved.filter((x) => x.status === s).length] as const);
