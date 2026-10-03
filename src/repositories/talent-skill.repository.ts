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
  searchCatalog(query: string, limit?: number): Promise<{ id: string; name: string; category: string | null }[]>;
}
