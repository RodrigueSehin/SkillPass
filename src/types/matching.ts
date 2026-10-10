/** Where a saved talent stands in the organization's own follow-up. */
export const MATCH_STATUSES = [
  "TO_CONTACT",
  "IN_DISCUSSION",
  "IN_EVALUATION",
  "POOL",
  "RECRUITED",
  "NOT_RETAINED",
] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  TO_CONTACT: "À contacter",
  IN_DISCUSSION: "En discussion",
  IN_EVALUATION: "En évaluation",
  POOL: "Vivier",
  RECRUITED: "Recruté",
  NOT_RETAINED: "Non retenu",
};

export const MATCH_STATUS_TONES: Record<MatchStatus, string> = {
  TO_CONTACT: "bg-blue-50 text-brand",
  IN_DISCUSSION: "bg-violet-50 text-violet-700",
  IN_EVALUATION: "bg-amber-50 text-amber-700",
  POOL: "bg-green-50 text-green-700",
  RECRUITED: "bg-emerald-100 text-emerald-700",
  NOT_RETAINED: "bg-slate-100 text-slate-600",
};

export interface SavedMatchDTO {
  id: string;
  /** The talent's profile id. */
  profileId: string;
  status: MatchStatus;
  /** The offer the talent was saved for, when there was one and it still exists. */
  jobOfferId: string | null;
  /** The match shown when the talent was saved, 0-100; null when no criteria were set. */
  match: number | null;
  savedById: string | null;
  createdAt: string;
}

export interface SaveMatchInput {
  profileId: string;
  jobOfferId: string | null;
  match: number | null;
  savedById: string | null;
}

export const MATCH_EVENT_TYPES = ["SEARCH", "RECOMMENDATION", "SAVE", "EXPORT"] as const;
export type MatchEventType = (typeof MATCH_EVENT_TYPES)[number];

export const MATCH_EVENT_LABELS: Record<MatchEventType, string> = {
  SEARCH: "Recherche",
  RECOMMENDATION: "Recommandation",
  SAVE: "Correspondance sauvegardée",
  EXPORT: "Export",
};

/** One action of a member in the matching tools, kept so the history can be read back. */
export interface MatchEventDTO {
  id: string;
  type: MatchEventType;
  /** Main line: the search, the offer, the talent. */
  title: string;
  /** Second line: filters, contract and place. */
  subtitle: string;
  /** Talents returned, for searches and recommendations. */
  results: number | null;
  /** Query string that reopens the same results, without the leading "?". */
  query: string | null;
  profileId: string | null;
  memberId: string | null;
  createdAt: string;
}

export interface MatchEventInput {
  type: MatchEventType;
  title: string;
  subtitle: string;
  results: number | null;
  query: string | null;
  profileId: string | null;
  memberId: string | null;
}
