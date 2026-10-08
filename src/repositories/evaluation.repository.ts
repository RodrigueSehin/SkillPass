import type {
  EvaluationAttemptDTO,
  EvaluationAttemptRow,
  EvaluationDTO,
  EvaluationInput,
  EvaluationStatus,
} from "@/types/evaluation";

export interface AttemptTotals {
  /** Distinct people who submitted. */
  candidates: number;
  graded: number;
  passed: number;
}

/** Evaluations of an organization. Every method takes the organization id: no test can cross tenants. */
export interface EvaluationRepository {
  list(orgId: string): Promise<EvaluationDTO[]>;
  get(orgId: string, id: string): Promise<EvaluationDTO | null>;
  create(orgId: string, input: EvaluationInput, createdById: string | null): Promise<EvaluationDTO>;
  update(orgId: string, id: string, input: EvaluationInput): Promise<EvaluationDTO | null>;
  setStatus(orgId: string, id: string, status: EvaluationStatus): Promise<EvaluationDTO | null>;
  delete(orgId: string, id: string): Promise<boolean>;
  /** Attempt totals per evaluation id. */
  attemptTotals(orgId: string): Promise<Map<string, AttemptTotals>>;
  /** Latest submitted attempts of the organization's evaluations. */
  listAttempts(orgId: string, limit: number): Promise<EvaluationAttemptRow[]>;

  /** Cross-tenant lookup by the unguessable candidate link; never expose the result without checking its status. */
  findByToken(token: string): Promise<{ orgId: string; evaluation: EvaluationDTO } | null>;
  /** A test by id alone, for code that already holds one of its attempts. */
  getEvaluationById(id: string): Promise<EvaluationDTO | null>;
  profileAttempts(evaluationId: string, profileId: string): Promise<EvaluationAttemptDTO[]>;
  createAttempt(
    evaluationId: string,
    profile: { id: string; fullName: string },
    startedAt: string,
  ): Promise<EvaluationAttemptDTO>;
  getAttempt(id: string): Promise<EvaluationAttemptDTO | null>;
  saveAttempt(
    id: string,
    patch: Partial<
      Pick<
        EvaluationAttemptDTO,
        "responses" | "review" | "released" | "score" | "passed" | "status" | "submittedAt"
      >
    >,
  ): Promise<EvaluationAttemptDTO | null>;
  /** An attempt with its test and its candidate, only if the test belongs to the organization. */
  getAttemptForOrg(
    orgId: string,
    attemptId: string,
  ): Promise<{
    attempt: EvaluationAttemptDTO;
    evaluation: EvaluationDTO;
    candidate: { name: string; username: string | null };
  } | null>;
}
