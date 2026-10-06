import type { CreateJobAlertInput } from "@/schemas/opportunity";
import type { JobAlertDTO, OpportunityDTO } from "@/types/opportunity";

/** The job board is shared by every user: no profile scoping. */
export interface OpportunityRepository {
  list(): Promise<OpportunityDTO[]>;
  findById(id: string): Promise<OpportunityDTO | null>;
}

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
