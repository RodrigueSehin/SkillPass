import type {
  EvaluationDTO,
  EvaluationDisplayStatus,
  EvaluationRow,
  EvaluationType,
} from "@/types/evaluation";
import { EVALUATION_TYPES } from "@/types/evaluation";

export const EVALUATIONS_PER_PAGE = 10;

export const EVALUATION_TABS = [
  ["mine", "Mes évaluations"],
  ["library", "Bibliothèque de tests"],
  ["results", "Résultats"],
  ["stats", "Statistiques"],
] as const;
export type EvaluationTab = (typeof EVALUATION_TABS)[number][0];
export const parseEvaluationTab = (v: string | undefined): EvaluationTab =>
  EVALUATION_TABS.find(([k]) => k === v)?.[0] ?? "mine";

export function displayStatus(
  e: Pick<EvaluationDTO, "status" | "publishAt">,
  nowIso: string,
): EvaluationDisplayStatus {
  // publishAt is a local date-time without zone: compare it to the same prefix of "now".
  if (e.status === "PUBLISHED" && e.publishAt && e.publishAt > nowIso.slice(0, 16)) return "SCHEDULED";
  return e.status;
}

export const DATE_RANGES = [
  ["", "Toutes les dates"],
  ["30", "30 derniers jours"],
  ["90", "90 derniers jours"],
  ["365", "12 derniers mois"],
] as const;

export interface EvaluationFilters {
  q?: string;
  type?: string;
  skill?: string;
  status?: string;
  range?: string;
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function filterEvaluations(
  rows: EvaluationRow[],
  f: EvaluationFilters,
  now = new Date(),
): EvaluationRow[] {
  const q = f.q ? norm(f.q.trim()) : "";
  const days = Number.parseInt(f.range ?? "", 10);
  const since = Number.isFinite(days) && days > 0 ? now.getTime() - days * 86_400_000 : null;
  return rows.filter(
    (e) =>
      (!q || norm(`${e.title} ${e.skill} ${e.description}`).includes(q)) &&
      (!f.type || e.type === f.type) &&
      (!f.skill || e.skill === f.skill) &&
      (!f.status || e.displayStatus === f.status) &&
      (since === null || Date.parse(e.createdAt) >= since),
  );
}

export function evaluationStats(rows: EvaluationRow[]) {
  const live = rows.filter((e) => e.displayStatus !== "ARCHIVED");
  const graded = rows.reduce((n, e) => n + (e.successRate === null ? 0 : e.candidates), 0);
  const passed = rows.reduce(
    (n, e) => n + (e.successRate === null ? 0 : (e.successRate / 100) * e.candidates),
    0,
  );
  return {
    created: live.length,
    published: rows.filter((e) => e.displayStatus === "PUBLISHED").length,
    candidates: rows.reduce((n, e) => n + e.candidates, 0),
    successRate: graded > 0 ? Math.round((passed / graded) * 100) : null,
  };
}

/** Share of each type among the tests that are not archived. */
export function typeDistribution(
  rows: EvaluationRow[],
): { type: EvaluationType; count: number; percent: number }[] {
  const live = rows.filter((e) => e.displayStatus !== "ARCHIVED");
  return EVALUATION_TYPES.map((type) => {
    const count = live.filter((e) => e.type === type).length;
    return { type, count, percent: live.length ? Math.round((count / live.length) * 100) : 0 };
  });
}

/** Success rate per main skill, weighted by candidates, best known first. */
export function successBySkill(rows: EvaluationRow[], limit = 5) {
  const skills = new Map<string, { candidates: number; passed: number }>();
  for (const e of rows) {
    if (e.successRate === null || !e.skill) continue;
    const s = skills.get(e.skill) ?? { candidates: 0, passed: 0 };
    s.candidates += e.candidates;
    s.passed += (e.successRate / 100) * e.candidates;
    skills.set(e.skill, s);
  }
  return [...skills.entries()]
    .map(([skill, s]) => ({
      skill,
      rate: Math.round((s.passed / s.candidates) * 100),
      candidates: s.candidates,
    }))
    .sort((a, b) => b.candidates - a.candidates || b.rate - a.rate)
    .slice(0, limit);
}

export function skillOptions(rows: EvaluationRow[]) {
  return [...new Set(rows.map((e) => e.skill).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function questionMix(questions: EvaluationDTO["questions"]) {
  const counts = new Map<string, number>();
  for (const q of questions) counts.set(q.type, (counts.get(q.type) ?? 0) + 1);
  return [...counts.entries()]
    .map(([type, count]) => ({ type, count, percent: Math.round((count / questions.length) * 100) }))
    .sort((a, b) => b.count - a.count);
}

export const totalPoints = (questions: EvaluationDTO["questions"]) =>
  questions.reduce((n, q) => n + q.points, 0);

/** Score of a set of answers: `given[questionId]` holds the chosen option indexes. Open questions are skipped. */
export function gradeChoices(
  questions: EvaluationDTO["questions"],
  given: Record<string, number[]>,
  weighting: "EQUAL" | "BY_POINTS",
) {
  let earned = 0;
  let possible = 0;
  for (const q of questions) {
    if (q.type !== "SINGLE" && q.type !== "MULTIPLE" && q.type !== "TRUE_FALSE") continue;
    const weight = weighting === "BY_POINTS" ? q.points : 1;
    possible += weight;
    const answer = [...new Set(given[q.id] ?? [])].sort();
    const right = [...q.correct].sort();
    if (answer.length === right.length && answer.every((v, i) => v === right[i])) earned += weight;
  }
  return { earned, possible, percent: possible === 0 ? null : Math.round((earned / possible) * 100) };
}
