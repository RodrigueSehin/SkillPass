import { randomBytes } from "node:crypto";
import type { RecommendationDTO } from "@/types/verification";

export interface NewRecommendationRequest {
  token: string;
  talentSkillId?: string;
  skillName?: string;
  projectId?: string;
  authorName: string;
  authorEmail?: string;
  expiresAt: string;
}

export interface RecommendationRepository {
  create(profileId: string, input: NewRecommendationRequest): Promise<RecommendationDTO>;
  /** Public lookup used by the recommender's link. */
  findByToken(token: string): Promise<RecommendationDTO | null>;
  listByProfile(profileId: string): Promise<RecommendationDTO[]>;
  /** Atomic REQUESTED → SUBMITTED. Returns null if already answered, expired or unknown. */
  submitByToken(
    token: string,
    answer: { content: string; authorTitle?: string },
    now: string,
  ): Promise<RecommendationDTO | null>;
  /** Owner-scoped moderation, only from SUBMITTED. */
  moderate(profileId: string, id: string, status: "APPROVED" | "DECLINED"): Promise<RecommendationDTO | null>;
  remove(profileId: string, id: string): Promise<boolean>;
}

/** 256 bits of randomness: the link is the only credential the recommender has. */
export const newRecommendationToken = () => randomBytes(32).toString("hex");
