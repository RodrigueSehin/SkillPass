import type { JobOfferDTO, JobOfferInput } from "@/types/job-offer";

export interface JobPublication {
  status: JobOfferDTO["status"];
  opportunityId: string | null;
  publishedAt: string | null;
}

/** Job offers of an organization. Every method takes the organization id: no offer can cross tenants. */
export interface JobOfferRepository {
  list(orgId: string): Promise<JobOfferDTO[]>;
  get(orgId: string, id: string): Promise<JobOfferDTO | null>;
  create(orgId: string, input: JobOfferInput, createdById: string | null): Promise<JobOfferDTO>;
  update(orgId: string, id: string, input: JobOfferInput): Promise<JobOfferDTO | null>;
  setPublication(orgId: string, id: string, publication: JobPublication): Promise<JobOfferDTO | null>;
  /** Returns the deleted offer so its talent-side copy can be hidden. */
  delete(orgId: string, id: string): Promise<JobOfferDTO | null>;
}
