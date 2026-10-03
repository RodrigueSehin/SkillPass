import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { NewEvidence } from "@/types/evidence";
import {
  toPublicEvidence,
  type EvidenceCounts,
  type EvidenceRepository,
  type StoredEvidence,
} from "./evidence.repository";

const include = { talentSkill: { include: { skill: true } } } satisfies Prisma.SkillEvidenceInclude;
type Row = Prisma.SkillEvidenceGetPayload<{ include: typeof include }>;

const toStored = (r: Row): StoredEvidence => ({
  id: r.id,
  talentSkillId: r.talentSkillId,
  skillName: r.talentSkill.skill.name,
  projectId: r.projectId,
  type: r.type,
  title: r.title,
  description: r.description,
  url: r.url,
  fileName: r.fileName,
  mimeType: r.mimeType,
  sizeBytes: r.sizeBytes,
  hasFile: r.filePath !== null,
  filePath: r.filePath,
  status: r.status,
  createdAt: r.createdAt.toISOString(),
});

export class PrismaEvidenceRepository implements EvidenceRepository {
  async list(profileId: string, filter?: { talentSkillId?: string }) {
    const rows = await prisma.skillEvidence.findMany({
      where: { profileId, ...(filter?.talentSkillId ? { talentSkillId: filter.talentSkillId } : {}) },
      include,
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => toPublicEvidence(toStored(r)));
  }

  async findById(profileId: string, id: string) {
    const row = await prisma.skillEvidence.findFirst({ where: { id, profileId }, include });
    return row ? toStored(row) : null;
  }

  async create(profileId: string, input: NewEvidence) {
    const row = await prisma.skillEvidence.create({
      data: {
        profileId,
        talentSkillId: input.talentSkillId,
        projectId: input.projectId,
        type: input.type,
        title: input.title,
        description: input.description,
        url: input.url,
        filePath: input.file?.path,
        fileName: input.file?.name,
        mimeType: input.file?.mimeType,
        sizeBytes: input.file?.sizeBytes,
      },
      include,
    });
    return toPublicEvidence(toStored(row));
  }

  async remove(profileId: string, id: string) {
    const row = await prisma.skillEvidence.findFirst({
      where: { id, profileId },
      select: { filePath: true },
    });
    if (!row) return undefined;
    await prisma.skillEvidence.deleteMany({ where: { id, profileId } });
    return { filePath: row.filePath };
  }

  async countBySkill(profileId: string) {
    const grouped = await prisma.skillEvidence.groupBy({
      by: ["talentSkillId", "status"],
      where: { profileId },
      _count: { _all: true },
    });
    const counts: Record<string, EvidenceCounts> = {};
    for (const g of grouped) {
      const c = (counts[g.talentSkillId] ??= { total: 0, verified: 0 });
      c.total += g._count._all;
      if (g.status === "VERIFIED") c.verified += g._count._all;
    }
    return counts;
  }
}
