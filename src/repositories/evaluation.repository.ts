import type {
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
}
