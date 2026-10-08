import type { MemberDTO } from "@/types/business";
import type { EvaluationAttemptRow, EvaluationRow } from "@/types/evaluation";
import type { JobOfferRow } from "@/types/job-offer";
import type { SkillLevel } from "@/types/skill";
import { SKILL_LEVELS } from "@/types/skill";
import type { TalentRecord } from "@/types/talent";

/** Share of each level among every skill held by the public talents. */
export function levelDistribution(talents: TalentRecord[]) {
  const counts = new Map<SkillLevel, number>(SKILL_LEVELS.map((l) => [l, 0]));
  for (const t of talents) for (const s of t.skills) counts.set(s.level, (counts.get(s.level) ?? 0) + 1);
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  return [...SKILL_LEVELS].reverse().map((level) => ({
    level,
    count: counts.get(level) ?? 0,
    percent: total ? Math.round(((counts.get(level) ?? 0) / total) * 100) : 0,
  }));
}

export interface ActivityItem {
  id: string;
  kind: "evaluation" | "offer" | "member";
  title: string;
  detail: string;
  at: string;
  /** Short badge on the right: a score, a number of applicants. */
  badge: string | null;
  href: string | null;
}

/** The latest things that happened in the organization, newest first. */
export function activityFeed(input: {
  attempts: EvaluationAttemptRow[];
  evaluations: EvaluationRow[];
  offers: JobOfferRow[];
  members: MemberDTO[];
  limit?: number;
}): ActivityItem[] {
  const titles = new Map(input.evaluations.map((e) => [e.id, e.title]));
  const items: ActivityItem[] = [];
  for (const a of input.attempts) {
    if (!a.submittedAt) continue;
    items.push({
      id: `attempt-${a.id}`,
      kind: "evaluation",
      title: a.status === "SUBMITTED" ? "Évaluation à corriger" : "Évaluation complétée",
      detail: `${a.candidateName} · ${titles.get(a.evaluationId) ?? "Évaluation"}`,
      at: a.submittedAt,
      badge: a.score === null ? null : `${a.score}%`,
      href: `/business/evaluations/resultats/${a.id}`,
    });
  }
  for (const o of input.offers) {
    if (!o.publishedAt) continue;
    items.push({
      id: `offer-${o.id}`,
      kind: "offer",
      title: "Offre publiée",
      detail: o.title,
      at: o.publishedAt,
      badge: o.applicants > 0 ? `${o.applicants} cand.` : null,
      href: `/business/offres/${o.id}/modifier`,
    });
  }
  for (const m of input.members) {
    if (m.status !== "ACTIVE") continue;
    items.push({
      id: `member-${m.id}`,
      kind: "member",
      title: "Nouveau membre",
      detail: `${m.firstName} ${m.lastName}`,
      at: m.createdAt,
      badge: null,
      href: null,
    });
  }
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, input.limit ?? 4);
}

/** "Il y a 12 min", "Il y a 3 h", "Il y a 2 j", then the date. */
export function relativeTime(iso: string, now: Date) {
  const minutes = Math.round((now.getTime() - Date.parse(iso)) / 60_000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (minutes < 60 * 24) return `Il y a ${Math.floor(minutes / 60)} h`;
  if (minutes < 60 * 24 * 14) return `Il y a ${Math.floor(minutes / (60 * 24))} j`;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}
