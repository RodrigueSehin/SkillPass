import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { RecommendationDTO } from "@/types/verification";
import type { NewRecommendationRequest, RecommendationRepository } from "./recommendation.repository";

const include = { talentSkill: { include: { skill: true } } } satisfies Prisma.RecommendationInclude;
type Row = Prisma.RecommendationGetPayload<{ include: typeof include }>;

const toDTO = (r: Row): RecommendationDTO => ({
  id: r.id,
  profileId: r.profileId,
  talentSkillId: r.talentSkillId,
  skillName: r.talentSkill?.skill.name ?? null,
  projectId: r.projectId,
  token: r.token,
  authorName: r.authorName,
  authorEmail: r.authorEmail,
  authorTitle: r.authorTitle,
  relation: r.relation,
  rating: r.rating,
  keywords: r.keywords,
  content: r.content,
  status: r.status,
  createdAt: r.createdAt.toISOString(),
  submittedAt: r.submittedAt ? r.submittedAt.toISOString() : null,
  expiresAt: r.expiresAt.toISOString(),
});

export class PrismaRecommendationRepository implements RecommendationRepository {
  async create(profileId: string, input: NewRecommendationRequest) {
    const row = await prisma.recommendation.create({
      data: {
        profileId,
        token: input.token,
        talentSkillId: input.talentSkillId,
        projectId: input.projectId,
        authorName: input.authorName,
        authorEmail: input.authorEmail,
        expiresAt: new Date(input.expiresAt),
      },
      include,
    });
    return toDTO(row);
  }

  async findByToken(token: string) {
    const row = await prisma.recommendation.findUnique({ where: { token }, include });
    return row ? toDTO(row) : null;
  }

  async listByProfile(profileId: string) {
    const rows = await prisma.recommendation.findMany({
      where: { profileId },
      include,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDTO);
  }

  async submitByToken(
    token: string,
    answer: {
      content: string;
      authorTitle?: string;
      relation?: string;
      rating?: number;
      keywords?: string[];
    },
    now: string,
  ) {
    // One atomic conditional update: a replayed or expired link matches no row.
    const { count } = await prisma.recommendation.updateMany({
      where: { token, status: "REQUESTED", expiresAt: { gt: new Date(now) } },
      data: {
        status: "SUBMITTED",
        content: answer.content,
        authorTitle: answer.authorTitle,
        relation: answer.relation,
        rating: answer.rating,
        keywords: [...new Set(answer.keywords ?? [])],
        submittedAt: new Date(now),
      },
    });
    return count === 0 ? null : this.findByToken(token);
  }

  async moderate(profileId: string, id: string, status: "APPROVED" | "DECLINED") {
    const { count } = await prisma.recommendation.updateMany({
      where: { id, profileId, status: "SUBMITTED" },
      data: { status },
    });
    if (count === 0) return null;
    const row = await prisma.recommendation.findFirst({ where: { id, profileId }, include });
    return row ? toDTO(row) : null;
  }

  async remove(profileId: string, id: string) {
    const { count } = await prisma.recommendation.deleteMany({ where: { id, profileId } });
    return count > 0;
  }
}
