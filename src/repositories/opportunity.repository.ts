import type { CreateJobAlertInput } from "@/schemas/opportunity";
import type { JobAlertDTO, OpportunityDTO } from "@/types/opportunity";

/** The job board is shared by every user: no profile scoping. */
export interface OpportunityRepository {
  list(): Promise<OpportunityDTO[]>;
  findById(id: string): Promise<OpportunityDTO | null>;
  incrementViews(id: string): Promise<void>;
  /** Publishes (or updates) the talent-side copy of an organization's job offer. Returns its id. */
  upsertFromOffer(sourceOfferId: string, data: OpportunityInput): Promise<string>;
  /** Hides the copy of an offer that was closed, unpublished or deleted; applications are kept. */
  deactivateFromOffer(sourceOfferId: string): Promise<void>;
  /** Views and applicants measured for these opportunities. */
  statsFor(ids: string[]): Promise<Map<string, { views: number; applicants: number }>>;
}

export type OpportunityInput = Omit<OpportunityDTO, "id" | "views" | "applicants">;

export interface SavedOpportunityRepository {
  listIds(profileId: string): Promise<string[]>;
  /** Saves or un-saves. Returns the new state, or null when the offer does not exist. */
  toggle(profileId: string, opportunityId: string): Promise<boolean | null>;
}

export interface JobAlertRepository {
  list(profileId: string): Promise<JobAlertDTO[]>;
  create(profileId: string, input: CreateJobAlertInput & { name: string }): Promise<JobAlertDTO>;
  remove(profileId: string, id: string): Promise<boolean>;
}

export interface ApplicationRepository {
  listIds(profileId: string): Promise<string[]>;
  /** "created", "exists" (already applied) or null when the offer does not exist. */
  apply(profileId: string, opportunityId: string, message?: string): Promise<"created" | "exists" | null>;
}
