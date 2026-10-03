import type { SkillLevel, SkillVerificationStatus } from "@/types/skill";

export interface TalentSkillDTO {
  id: string;
  skillId: string;
  name: string;
  category: string | null;
  level: SkillLevel;
  score: number;
  yearsOfExperience: number;
  verificationStatus: SkillVerificationStatus;
  evidenceCount: number;
  recommendationCount: number;
}

export interface NewTalentSkill {
  name: string;
  category?: string;
  level: SkillLevel;
  score: number;
  yearsOfExperience: number;
}

export interface TalentSkillPatch {
  level?: SkillLevel;
  score?: number;
  yearsOfExperience?: number;
}

/**
 * Every method is scoped by profileId: a repository never returns or mutates
 * another user's data, whatever id it is given.
 */
export interface TalentSkillRepository {
  list(profileId: string): Promise<TalentSkillDTO[]>;
  findById(profileId: string, id: string): Promise<TalentSkillDTO | null>;
  /** Returns null when the profile already has this skill. */
  create(profileId: string, input: NewTalentSkill): Promise<TalentSkillDTO | null>;
  update(profileId: string, id: string, patch: TalentSkillPatch): Promise<TalentSkillDTO | null>;
  remove(profileId: string, id: string): Promise<boolean>;
  /**
   * System-only write used when an assessment is passed or reviewed. Deliberately separate from
   * update(): user-facing code paths can never set a measured score or a verification status.
   */
  applyVerification(
    profileId: string,
    id: string,
    result: { level: SkillLevel; score: number; status: SkillVerificationStatus },
  ): Promise<TalentSkillDTO | null>;
  /** Changes only the status (e.g. PENDING while a verifier reviews). */
  setStatus(profileId: string, id: string, status: SkillVerificationStatus): Promise<TalentSkillDTO | null>;
  searchCatalog(
    query: string,
    limit?: number,
  ): Promise<{ id: string; name: string; category: string | null }[]>;
}
