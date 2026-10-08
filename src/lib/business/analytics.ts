import type { EvaluationAttemptRow, EvaluationRow, EvaluationType } from "@/types/evaluation";
import { EVALUATION_TYPES } from "@/types/evaluation";
import type { JobOfferRow } from "@/types/job-offer";

export const ANALYTICS_RANGES = [
  ["30", "30 derniers jours"],
  ["90", "3 derniers mois"],
  ["180", "6 derniers mois"],
  ["365", "12 derniers mois"],
] as const;
export const DEFAULT_RANGE = "180";
export const parseRange = (v: string | undefined) =>
  ANALYTICS_RANGES.find(([k]) => k === v)?.[0] ?? DEFAULT_RANGE;

const DAY = 86_400_000;
const MONTH = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });
const DAY_LABEL = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });

export const RESULT_BANDS = [
  { key: "excellent", label: "Excellent (85–100%)", min: 85, color: "#16A34A" },
  { key: "good", label: "Bon (70–84%)", min: 70, color: "#60A5FA" },
  { key: "average", label: "Moyen (50–69%)", min: 50, color: "#F59E0B" },
  { key: "weak", label: "Faible (<50%)", min: 0, color: "#EF4444" },
] as const;

export interface Kpi {
  value: number | null;
  previous: number | null;
  /** Change against the previous period, in %; null when there is nothing to compare with. */
  delta: number | null;
}

const kpi = (value: number | null, previous: number | null): Kpi => ({
  value,
  previous,
  delta:
    value !== null && previous !== null && previous > 0
      ? Math.round(((value - previous) / previous) * 100)
      : null,
});

const inRange = (iso: string | null, from: number, to: number) => {
  if (!iso) return false;
  const t = Date.parse(iso);
  return t >= from && t < to;
};

const rate = (attempts: EvaluationAttemptRow[]) => {
  const graded = attempts.filter((a) => a.status === "GRADED");
  return graded.length ? Math.round((graded.filter((a) => a.passed).length / graded.length) * 100) : null;
};

/** Everything the analytics page shows, for the `days` days before `now` and the same span just before. */
export function computeAnalytics(input: {
  evaluations: EvaluationRow[];
  attempts: EvaluationAttemptRow[];
  offers: JobOfferRow[];
  days: number;
  now: Date;
}) {
  const { evaluations, attempts, offers, days, now } = input;
  const end = now.getTime() + 1;
  const start = end - days * DAY;
  const prevStart = start - days * DAY;
  const submitted = attempts.filter((a) => a.submittedAt);
  const current = submitted.filter((a) => inRange(a.submittedAt, start, end));
  const previous = submitted.filter((a) => inRange(a.submittedAt, prevStart, start));
  const people = (list: EvaluationAttemptRow[]) => new Set(list.map((a) => a.candidateId)).size;
  const applicants = (from: number, to: number) =>
    offers.reduce((n, o) => n + (inRange(o.publishedAt, from, to) ? o.applicants : 0), 0);

  const kpis = {
    candidates: kpi(people(current), people(previous)),
    created: kpi(
      evaluations.filter((e) => inRange(e.createdAt, start, end)).length,
      evaluations.filter((e) => inRange(e.createdAt, prevStart, start)).length,
    ),
    successRate: kpi(rate(current), rate(previous)),
    applications: kpi(applicants(start, end), applicants(prevStart, start)),
  };

  // Buckets: six steps of about five days for a month, calendar months beyond.
  const short = days <= 31;
  const bucketStarts: number[] = [];
  if (short) {
    const step = (days * DAY) / 6;
    for (let i = 0; i < 6; i++) bucketStarts.push(start + i * step);
  } else {
    const first = new Date(start);
    let cursor = Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1);
    while (cursor < end) {
      bucketStarts.push(cursor);
      const d = new Date(cursor);
      cursor = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
    }
  }
  const bucketOf = (iso: string) => {
    const t = Date.parse(iso);
    let found = -1;
    bucketStarts.forEach((b, i) => {
      if (t >= b) found = i;
    });
    return t >= start && t < end ? found : -1;
  };
  const created = bucketStarts.map(() => 0);
  const evaluated = bucketStarts.map(() => 0);
  for (const e of evaluations) {
    const i = bucketOf(e.createdAt);
    if (i >= 0) created[i]! += 1;
  }
  for (const a of current) {
    const i = bucketOf(a.submittedAt!);
    if (i >= 0) evaluated[i]! += 1;
  }
  const trend = {
    labels: bucketStarts.map((b) =>
      short ? DAY_LABEL.format(new Date(b)) : MONTH.format(new Date(b)).replace(".", ""),
    ),
    created,
    evaluated,
  };

  const graded = current.filter((a) => a.status === "GRADED" && a.score !== null);
  const bands = RESULT_BANDS.map((band, i) => {
    const upper = i === 0 ? 101 : RESULT_BANDS[i - 1]!.min;
    const count = graded.filter((a) => a.score! >= band.min && a.score! < upper).length;
    return { ...band, count, percent: graded.length ? Math.round((count / graded.length) * 100) : 0 };
  });

  const evaluationOf = new Map(evaluations.map((e) => [e.id, e]));
  const bySkill = new Map<string, number>();
  for (const a of current) {
    const skill = evaluationOf.get(a.evaluationId)?.skill;
    if (skill) bySkill.set(skill, (bySkill.get(skill) ?? 0) + 1);
  }
  const topSkills = [...bySkill.entries()]
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill))
    .slice(0, 6);

  const byType = EVALUATION_TYPES.map(
    (type): { type: EvaluationType; rate: number | null; count: number } => {
      const list = current.filter((a) => evaluationOf.get(a.evaluationId)?.type === type);
      return { type, rate: rate(list), count: list.length };
    },
  );

  const perPerson = new Map<string, { name: string; username: string | null; scores: number[] }>();
  for (const a of graded) {
    const p = perPerson.get(a.candidateId) ?? {
      name: a.candidateName,
      username: a.candidateUsername,
      scores: [],
    };
    p.scores.push(a.score!);
    perPerson.set(a.candidateId, p);
  }
  const topTalents = [...perPerson.values()]
    .map((p) => ({
      name: p.name,
      username: p.username,
      average: Math.round(p.scores.reduce((a, b) => a + b, 0) / p.scores.length),
      count: p.scores.length,
    }))
    .sort((a, b) => b.average - a.average || b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 5);

  const topOffers = offers
    .filter((o) => o.applicants > 0)
    .sort((a, b) => b.applicants - a.applicants || a.title.localeCompare(b.title))
    .slice(0, 5)
    .map((o) => ({ id: o.id, title: o.title, applicants: o.applicants }));

  const recent = [...submitted]
    .sort((a, b) => b.submittedAt!.localeCompare(a.submittedAt!))
    .slice(0, 5)
    .map((a) => ({ ...a, evaluation: evaluationOf.get(a.evaluationId) ?? null }));

  return {
    kpis,
    trend,
    bands,
    gradedCount: graded.length,
    evaluatedCount: current.length,
    topSkills,
    byType,
    topTalents,
    topOffers,
    recent,
  };
}
