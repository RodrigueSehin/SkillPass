import { randomUUID } from "node:crypto";
import { buildDemoOpportunities } from "@/config/demo-opportunities";
import type { CreateJobAlertInput } from "@/schemas/opportunity";
import type { JobAlertDTO, OpportunityDTO } from "@/types/opportunity";
import type {
  ApplicationRepository,
  JobAlertRepository,
  OpportunityRepository,
  SavedOpportunityRepository,
} from "./opportunity.repository";

export class InMemoryOpportunityRepository implements OpportunityRepository {
  private rows: OpportunityDTO[] = buildDemoOpportunities().map((o) => ({ ...o, id: randomUUID() }));

  async list() {
    return this.rows.map((o) => ({ ...o, skills: [...o.skills] }));
  }

  async findById(id: string) {
    const row = this.rows.find((o) => o.id === id);
    return row ? { ...row, skills: [...row.skills] } : null;
  }

  async incrementViews(id: string) {
    const row = this.rows.find((o) => o.id === id);
    if (row) row.views += 1;
  }

  /** Used by the in-memory applications: someone applied through SkillPass. */
  addApplicant(id: string) {
    const row = this.rows.find((o) => o.id === id);
    if (row) row.applicants += 1;
  }
}

export class InMemoryApplicationRepository implements ApplicationRepository {
  private applied = new Map<string, Set<string>>();

  constructor(private readonly offers: InMemoryOpportunityRepository) {}

  async listIds(profileId: string) {
    return [...(this.applied.get(profileId) ?? [])];
  }

  async apply(profileId: string, opportunityId: string) {
    if (!(await this.offers.findById(opportunityId))) return null;
    const set = this.applied.get(profileId) ?? new Set<string>();
    this.applied.set(profileId, set);
    if (set.has(opportunityId)) return "exists" as const;
    set.add(opportunityId);
    this.offers.addApplicant(opportunityId);
    return "created" as const;
  }
}

export class InMemorySavedOpportunityRepository implements SavedOpportunityRepository {
  private saved = new Map<string, Set<string>>();

  constructor(private readonly offers: OpportunityRepository) {}

  async listIds(profileId: string) {
    return [...(this.saved.get(profileId) ?? [])];
  }

  async toggle(profileId: string, opportunityId: string) {
    if (!(await this.offers.findById(opportunityId))) return null;
    const set = this.saved.get(profileId) ?? new Set<string>();
    this.saved.set(profileId, set);
    if (set.delete(opportunityId)) return false;
    set.add(opportunityId);
    return true;
  }
}

/** Drops the owner column: callers only ever see their own alerts. */
const toDto = ({ profileId, ...alert }: JobAlertDTO & { profileId: string }): JobAlertDTO => {
  void profileId;
  return alert;
};

export class InMemoryJobAlertRepository implements JobAlertRepository {
  private rows: (JobAlertDTO & { profileId: string })[] = [];

  async list(profileId: string) {
    return this.rows
      .filter((a) => a.profileId === profileId)
      .map((a) => toDto(a))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async create(profileId: string, input: CreateJobAlertInput & { name: string }) {
    const row = {
      id: randomUUID(),
      profileId,
      name: input.name,
      query: input.query ?? null,
      kind: input.kind ?? null,
      region: input.region ?? null,
      domain: input.domain ?? null,
      level: input.level ?? null,
      createdAt: new Date().toISOString(),
    };
    this.rows.push(row);
    return toDto(row);
  }

  async remove(profileId: string, id: string) {
    const index = this.rows.findIndex((a) => a.id === id && a.profileId === profileId);
    if (index === -1) return false;
    this.rows.splice(index, 1);
    return true;
  }
}
