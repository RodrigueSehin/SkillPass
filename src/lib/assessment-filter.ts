import type { AssessmentOverview } from "@/services/assessment.service";

export const ASSESSMENT_TABS = ["all", "available", "inProgress", "finished"] as const;
export type AssessmentTab = (typeof ASSESSMENT_TABS)[number];

export const ASSESSMENT_TAB_LABELS: Record<AssessmentTab, string> = {
  all: "Toutes",
  available: "Disponibles",
  inProgress: "En cours",
  finished: "Terminées",
};

export const RESULT_FILTERS = [
  ["PASSED", "Réussie"],
  ["FAILED", "Non réussie"],
  ["PENDING_REVIEW", "En attente de validation"],
] as const;

export interface AssessmentFilter {
  tab?: string;
  q?: string;
  result?: string;
}

/** Unknown tab values fall back to "all" so a hand-edited URL never breaks the page. */
export function parseTab(value: string | undefined): AssessmentTab {
  return ASSESSMENT_TABS.find((t) => t === value) ?? "all";
}

export function filterAssessments(items: AssessmentOverview[], filter: AssessmentFilter) {
  const tab = parseTab(filter.tab);
  const q = filter.q?.trim().toLowerCase();
  // Unknown results are ignored, like unknown tabs.
  const result = RESULT_FILTERS.find(([value]) => value === filter.result)?.[0];
  return items.filter((a) => {
    if (q && !`${a.title} ${a.skillName}`.toLowerCase().includes(q)) return false;
    if (result && a.lastAttempt?.status !== result) return false;
    switch (tab) {
      case "available":
        return !a.activeAttemptId && !a.blockedReason;
      case "inProgress":
        return Boolean(a.activeAttemptId);
      case "finished":
        return a.lastAttempt !== null;
      default:
        return true;
    }
  });
}
