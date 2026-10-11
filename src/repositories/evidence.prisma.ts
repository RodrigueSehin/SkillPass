import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { EvidenceVisibility, NewEvidence } from "@/types/evidence";
import {
  dateToMonth,
  isImageMime,
  monthToDate,
  toPublicEvidence,
  type EvidenceCounts,
  type EvidenceRepository,
  type StoredEvidence,
} from "./evidence.repository";

const include = {
  talentSkill: { include: { skill: true } },
  skills: { include: { talentSkill: { include: { skill: true } } } },
  files: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.SkillEvidenceInclude;
type Row = Prisma.SkillEvidenceGetPayload<{ include: typeof include }>;

const toStored = (r: Row): StoredEvidence => {
  const skills = r.skills.map((s) => ({ id: s.talentSkillId, name: s.talentSkill.skill.name }));
  // Rows written before the join table existed still carry their main skill only.
  if (!skills.some((s) => s.id === r.talentSkillId)) {
    skills.unshift({ id: r.talentSkillId, name: r.talentSkill.skill.name });
  }
  return {
    id: r.id,
    talentSkillId: r.talentSkillId,
    skillName: r.talentSkill.skill.name,
    skills,
    projectId: r.projectId,
    type: r.type,
    title: r.title,
    description: r.description,
    url: r.url,
    organization: r.organization,
    role: r.role,
    startDate: dateToMonth(r.startDate),
    endDate: dateToMonth(r.endDate),
    technologies: r.technologies,
    tags: r.tags,
    category: r.category,
    visibility: r.visibility as EvidenceVisibility,
    published: r.published,
    allowContact: r.allowContact,
    allowRecommendations: r.allowRecommendations,
    files: r.files.map((f) => ({
      id: f.id,
      name: f.fileName,
      mimeType: f.mimeType,
      sizeBytes: f.sizeBytes,
      isImage: isImageMime(f.mimeType),
      filePath: f.filePath,
    })),
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  };
};

export class PrismaEvidenceRepository implements EvidenceRepository {
  async list(profileId: string, filter?: { talentSkillId?: string }) {
    const skillId = filter?.talentSkillId;
    const rows = await prisma.skillEvidence.findMany({
      where: {
        profileId,
        ...(skillId ? { OR: [{ talentSkillId: skillId }, { skills: { some: { talentSkillId: skillId } } }] } : {}),
      },
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
        organization: input.organization,
        role: input.role,
        startDate: monthToDate(input.startDate),
        endDate: monthToDate(input.endDate),
        technologies: input.technologies,
        tags: input.tags,
        category: input.category,
        visibility: input.visibility,
        published: input.published,
        allowContact: input.allowContact,
        allowRecommendations: input.allowRecommendations,
        skills: { create: input.skillIds.map((talentSkillId) => ({ talentSkillId })) },
        files: {
          create: input.files.map((f) => ({
            filePath: f.path,
            fileName: f.name,
            mimeType: f.mimeType,
            sizeBytes: f.sizeBytes,
          })),
        },
      },
      include,
    });
    return toPublicEvidence(toStored(row));
  }

  async publish(profileId: string, id: string) {
    const { count } = await prisma.skillEvidence.updateMany({
      where: { id, profileId },
      data: { published: true },
    });
    return count > 0;
  }

  async remove(profileId: string, id: string) {
    const row = await prisma.skillEvidence.findFirst({
      where: { id, profileId },
      select: { filePath: true, files: { select: { filePath: true } } },
    });
    if (!row) return undefined;
    await prisma.skillEvidence.deleteMany({ where: { id, profileId } });
    const filePaths = row.files.map((f) => f.filePath);
    if (row.filePath && !filePaths.includes(row.filePath)) filePaths.push(row.filePath);
    return { filePaths };
  }

  async countBySkill(profileId: string) {
    const grouped = await prisma.skillEvidence.groupBy({
      by: ["talentSkillId", "status"],
      where: { profileId, published: true },
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
