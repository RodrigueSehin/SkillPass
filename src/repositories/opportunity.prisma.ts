import { prisma } from "@/lib/db/prisma";
import type { Opportunity } from "@/generated/prisma/client";
import type { CreateJobAlertInput } from "@/schemas/opportunity";
import type { JobAlertDTO, OpportunityDTO } from "@/types/opportunity";
import type {
  JobAlertRepository,
  OpportunityRepository,
  SavedOpportunityRepository,
} from "./opportunity.repository";

const toOpportunity = (r: Opportunity): OpportunityDTO => ({
  id: r.id,
  title: r.title,
  company: r.company,
  companyLabel: r.companyLabel,
  kind: r.kind,
  region: r.region,
  location: r.location,
  workMode: r.workMode,
  commitment: r.commitment,
  domain: r.domain,
  level: r.level,
  skills: r.skills,
  description: r.description,
  applyUrl: r.applyUrl,
  publishedAt: r.publishedAt.toISOString(),
});

export class PrismaOpportunityRepository implements OpportunityRepository {
  async list() {
    const rows = await prisma.opportunity.findMany({ orderBy: { publishedAt: "desc" } });
    return rows.map(toOpportunity);
  }

  async findById(id: string) {
    const row = await prisma.opportunity.findUnique({ where: { id } });
    return row ? toOpportunity(row) : null;
  }
}

export class PrismaSavedOpportunityRepository implements SavedOpportunityRepository {
  async listIds(profileId: string) {
    const rows = await prisma.savedOpportunity.findMany({
      where: { profileId },
      select: { opportunityId: true },
    });
    return rows.map((r) => r.opportunityId);
  }

  async toggle(profileId: string, opportunityId: string) {
    const offer = await prisma.opportunity.findUnique({ where: { id: opportunityId }, select: { id: true } });
    if (!offer) return null;
    const { count } = await prisma.savedOpportunity.deleteMany({ where: { profileId, opportunityId } });
    if (count > 0) return false;
    await prisma.savedOpportunity.create({ data: { profileId, opportunityId } });
    return true;
  }
}

const toAlert = (r: {
  id: string;
  name: string;
  query: string | null;
  kind: string | null;
  region: string | null;
  domain: string | null;
  level: string | null;
  createdAt: Date;
}): JobAlertDTO => ({
  id: r.id,
  name: r.name,
  query: r.query,
  kind: r.kind,
  region: r.region,
  domain: r.domain,
  level: r.level,
  createdAt: r.createdAt.toISOString(),
});

export class PrismaJobAlertRepository implements JobAlertRepository {
  async list(profileId: string) {
    const rows = await prisma.jobAlert.findMany({ where: { profileId }, orderBy: { createdAt: "desc" } });
    return rows.map(toAlert);
  }

  async create(profileId: string, input: CreateJobAlertInput & { name: string }) {
    return toAlert(
      await prisma.jobAlert.create({
        data: {
          profileId,
          name: input.name,
          query: input.query,
          kind: input.kind,
          region: input.region,
          domain: input.domain,
          level: input.level,
        },
      }),
    );
  }

  async remove(profileId: string, id: string) {
    const { count } = await prisma.jobAlert.deleteMany({ where: { id, profileId } });
    return count > 0;
  }
}
