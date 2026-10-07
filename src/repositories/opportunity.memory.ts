import { randomUUID } from "node:crypto";
import { buildDemoOpportunities } from "@/config/demo-opportunities";
import type { CreateJobAlertInput } from "@/schemas/opportunity";
import type { JobAlertDTO, OpportunityDTO } from "@/types/opportunity";
import type { OpportunityInput } from "./opportunity.repository";
import type {
  ApplicationRepository,
  JobAlertRepository,
  OpportunityRepository,
  SavedOpportunityRepository,
} from "./opportunity.repository";

export class InMemoryOpportunityRepository implements OpportunityRepository {
  private rows: OpportunityDTO[] = buildDemoOpportunities().map((o) => ({ ...o, id: randomUUID() }));
  /** Offers published by organizations: source offer id → row id, and the rows currently hidden. */
  private sources = new Map<string, string>();
  private hidden = new Set<string>();

  private visible(o: OpportunityDTO) {
    if (this.hidden.has(o.id)) return false;
    const published = [...this.sources.values()].includes(o.id);
    if (!published) return true;
    // An organization's offer shows between its publication date and its deadline.
    return Date.parse(o.publishedAt) <= Date.now() && !(o.deadline && Date.parse(o.deadline) < Date.now());
  }

  async list() {
    return this.rows.filter((o) => this.visible(o)).map((o) => ({ ...o, skills: [...o.skills] }));
  }

  async findById(id: string) {
    const row = this.rows.find((o) => o.id === id && this.visible(o));
    return row ? { ...row, skills: [...row.skills] } : null;
  }

  async incrementViews(id: string) {
    const row = this.rows.find((o) => o.id === id);
    if (row) row.views += 1;
  }

  async upsertFromOffer(sourceOfferId: string, data: OpportunityInput) {
    const existing = this.sources.get(sourceOfferId);
    const row = existing ? this.rows.find((o) => o.id === existing) : undefined;
    if (row) {
      Object.assign(row, data);
      this.hidden.delete(row.id);
      return row.id;
    }
    const created: OpportunityDTO = { ...data, id: randomUUID(), views: 0, applicants: 0 };
    this.rows.push(created);
    this.sources.set(sourceOfferId, created.id);
    return created.id;
  }

  /** Demo only: gives a seeded offer the figures of the mockup. */
  seedStats(id: string, views: number, applicants: number) {
    const row = this.rows.find((o) => o.id === id);
    if (row) Object.assign(row, { views, applicants });
  }

  async deactivateFromOffer(sourceOfferId: string) {
    const id = this.sources.get(sourceOfferId);
    if (id) this.hidden.add(id);
  }

  async statsFor(ids: string[]) {
    return new Map(
      this.rows
        .filter((o) => ids.includes(o.id))
        .map((o) => [o.id, { views: o.views, applicants: o.applicants }] as const),
    );
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
