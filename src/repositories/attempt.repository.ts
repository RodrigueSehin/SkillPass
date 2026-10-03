import type { SkillLevel } from "@/types/skill";
import type { AnswerInput, AttemptDTO, AttemptStatus, DomainScores } from "@/types/verification";

export interface NewAttempt {
  talentSkillId: string;
  assessmentSlug: string;
  bankVersion: number;
  deadlineAt: string;
}

export interface AttemptResultPatch {
  status: AttemptStatus;
  submittedAt?: string;
  answers?: AnswerInput[];
  overallScore?: number;
  domainScores?: DomainScores;
  level?: SkillLevel | null;
}

export interface ReviewPatch {
  status: Extract<AttemptStatus, "PASSED" | "REJECTED">;
  reviewedById: string;
  reviewedAt: string;
  reviewNote: string | null;
}

export interface AttemptRepository {
  create(profileId: string, input: NewAttempt): Promise<AttemptDTO>;
  /** Owner-scoped read. */
  findById(profileId: string, id: string): Promise<AttemptDTO | null>;
  listByProfile(profileId: string): Promise<AttemptDTO[]>;
  /**
   * Owner-scoped write of a submission. Only succeeds while the attempt is still IN_PROGRESS,
   * so a result can never be overwritten by a second submission.
   */
  submit(profileId: string, id: string, patch: AttemptResultPatch): Promise<AttemptDTO | null>;
  /** Reviewer-only, cross-profile. Only succeeds while the attempt is PENDING_REVIEW. */
  review(id: string, patch: ReviewPatch): Promise<AttemptDTO | null>;
  /** Reviewer-only, cross-profile. */
  findAnyById(id: string): Promise<AttemptDTO | null>;
  listPendingReview(): Promise<AttemptDTO[]>;
}
