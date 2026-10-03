export const SKILL_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const SKILL_VERIFICATION_STATUSES = ["UNVERIFIED", "PENDING", "VERIFIED", "EXPIRED"] as const;
export type SkillVerificationStatus = (typeof SKILL_VERIFICATION_STATUSES)[number];

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
  EXPERT: "Expert",
};

export const VERIFICATION_STATUS_LABELS: Record<SkillVerificationStatus, string> = {
  UNVERIFIED: "Non vérifiée",
  PENDING: "En cours de vérification",
  VERIFIED: "Vérifiée",
  EXPIRED: "Expirée",
};

/** Maps a 0–100 score to a skill level. Thresholds are shared by UI and services. */
export function levelFromScore(score: number): SkillLevel {
  if (score >= 90) return "EXPERT";
  if (score >= 75) return "ADVANCED";
  if (score >= 50) return "INTERMEDIATE";
  return "BEGINNER";
}
