import type { AssessmentDomain } from "@/config/assessment-bank";
import type { SkillLevel } from "./skill";

export type AttemptStatus = "IN_PROGRESS" | "PASSED" | "FAILED" | "PENDING_REVIEW" | "REJECTED";

export const ATTEMPT_STATUS_LABELS: Record<AttemptStatus, string> = {
  IN_PROGRESS: "En cours",
  PASSED: "Réussie",
  FAILED: "Non réussie",
  PENDING_REVIEW: "En attente de validation",
  REJECTED: "Refusée par le vérificateur",
};

export interface AnswerInput {
  questionId: string;
  /** Index of the chosen option, or null when left blank. */
  selected: number | null;
}

export type DomainScores = Record<AssessmentDomain, number>;

export interface AttemptDTO {
  id: string;
  profileId: string;
  talentSkillId: string;
  assessmentSlug: string;
  bankVersion: number;
  status: AttemptStatus;
  startedAt: string;
  deadlineAt: string;
  submittedAt: string | null;
  answers: AnswerInput[] | null;
  overallScore: number | null;
  domainScores: DomainScores | null;
  level: SkillLevel | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
}

export type CredentialStatus = "VALID" | "REVOKED";
/** Status shown to the public: expiry is derived from the date, not stored. */
export type CredentialEffectiveStatus = "VALID" | "REVOKED" | "EXPIRED";

export interface CredentialDTO {
  /** Public identifier, format SP-XXXXXX. */
  credentialId: string;
  profileId: string;
  talentSkillId: string | null;
  skillName: string;
  level: SkillLevel;
  issuer: string;
  issuedAt: string;
  expiresAt: string | null;
  status: CredentialStatus;
  attemptId: string | null;
}

export const CREDENTIAL_STATUS_LABELS: Record<CredentialEffectiveStatus, string> = {
  VALID: "Valide",
  REVOKED: "Révoquée",
  EXPIRED: "Expirée",
};

export function effectiveCredentialStatus(c: Pick<CredentialDTO, "status" | "expiresAt">, now = new Date()) {
  if (c.status === "REVOKED") return "REVOKED" as const;
  if (c.expiresAt && Date.parse(c.expiresAt) < now.getTime()) return "EXPIRED" as const;
  return "VALID" as const;
}

export type RecommendationStatus = "REQUESTED" | "SUBMITTED" | "APPROVED" | "DECLINED";

export const RECOMMENDATION_STATUS_LABELS: Record<RecommendationStatus, string> = {
  REQUESTED: "En attente de réponse",
  SUBMITTED: "À valider",
  APPROVED: "Publiée",
  DECLINED: "Refusée",
};

export interface RecommendationDTO {
  id: string;
  profileId: string;
  talentSkillId: string | null;
  skillName: string | null;
  projectId: string | null;
  token: string;
  authorName: string;
  authorEmail: string | null;
  authorTitle: string | null;
  content: string | null;
  status: RecommendationStatus;
  createdAt: string;
  submittedAt: string | null;
  expiresAt: string;
}

/** Recommendation as shown on public pages: no token, no e-mail. */
export type PublicRecommendation = Pick<
  RecommendationDTO,
  "id" | "authorName" | "authorTitle" | "content" | "skillName" | "submittedAt"
>;
