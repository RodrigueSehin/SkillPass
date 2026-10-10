import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";
import type {
  MatchEventDTO,
  MatchEventInput,
  MatchEventType,
  MatchStatus,
  SavedMatchDTO,
  SaveMatchInput,
} from "@/types/matching";
import type { MatchingRepository } from "./matching.repository";

const toSaved = (r: Prisma.MatchingSaveGetPayload<object>): SavedMatchDTO => ({
  id: r.id,
  profileId: r.profileId,
  status: r.status as MatchStatus,
  jobOfferId: r.jobOfferId,
  match: r.match,
  savedById: r.savedById,
  createdAt: r.createdAt.toISOString(),
});

const toEvent = (r: Prisma.MatchingEventGetPayload<object>): MatchEventDTO => ({
  id: r.id,
  type: r.type as MatchEventType,
  title: r.title,
  subtitle: r.subtitle,
  results: r.results,
  query: r.query,
  profileId: r.profileId,
  memberId: r.memberId,
  createdAt: r.createdAt.toISOString(),
});

export class PrismaMatchingRepository implements MatchingRepository {
  async listSaved(orgId: string) {
    const rows = await prisma.matchingSave.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toSaved);
  }

  async save(orgId: string, input: SaveMatchInput) {
    const row = await prisma.matchingSave.upsert({
      where: { organizationId_profileId: { organizationId: orgId, profileId: input.profileId } },
      create: { organizationId: orgId, ...input },
      update: {},
    });
    return toSaved(row);
  }

  async setStatus(orgId: string, id: string, status: MatchStatus) {
    const { count } = await prisma.matchingSave.updateMany({
      where: { id, organizationId: orgId },
      data: { status },
    });
    if (count === 0) return null;
    const row = await prisma.matchingSave.findFirst({ where: { id, organizationId: orgId } });
    return row ? toSaved(row) : null;
  }

  async removeSaved(orgId: string, ids: string[]) {
    const { count } = await prisma.matchingSave.deleteMany({
      where: { organizationId: orgId, id: { in: ids } },
    });
    return count;
  }

  async removeSavedByProfile(orgId: string, profileId: string) {
    const { count } = await prisma.matchingSave.deleteMany({ where: { organizationId: orgId, profileId } });
    return count > 0;
  }

  async addEvent(orgId: string, input: MatchEventInput) {
    return toEvent(await prisma.matchingEvent.create({ data: { organizationId: orgId, ...input } }));
  }

  async listEvents(orgId: string, since: string, limit: number) {
    const rows = await prisma.matchingEvent.findMany({
      where: { organizationId: orgId, createdAt: { gte: new Date(since) } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(toEvent);
  }
}
