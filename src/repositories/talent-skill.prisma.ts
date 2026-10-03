import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";
import type {
  NewTalentSkill,
  TalentSkillDTO,
  TalentSkillPatch,
  TalentSkillRepository,
} from "./talent-skill.repository";
import type { SkillLevel, SkillVerificationStatus } from "@/types/skill";

const include = { skill: { include: { category: true } } } satisfies Prisma.TalentSkillInclude;
type Row = Prisma.TalentSkillGetPayload<{ include: typeof include }>;

export const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function toDTO(row: Row): TalentSkillDTO {
  return {
    id: row.id,
    skillId: row.skillId,
    name: row.skill.name,
    category: row.skill.category?.name ?? null,
    level: row.level,
    score: row.score,
    yearsOfExperience: row.yearsOfExperience,
    verificationStatus: row.verificationStatus,
    // Evidence and recommendations arrive in later steps of Phase 2/3.
    evidenceCount: 0,
    recommendationCount: 0,
  };
}

export class PrismaTalentSkillRepository implements TalentSkillRepository {
  async list(profileId: string) {
    const rows = await prisma.talentSkill.findMany({ where: { profileId }, include });
    return rows.map(toDTO);
  }

  async findById(profileId: string, id: string) {
    const row = await prisma.talentSkill.findFirst({ where: { id, profileId }, include });
    return row ? toDTO(row) : null;
  }

  async create(profileId: string, input: NewTalentSkill) {
    const category = input.category
      ? await prisma.skillCategory.upsert({
          where: { slug: slugify(input.category) },
          update: {},
          create: { name: input.category, slug: slugify(input.category) },
        })
      : null;
    const skill = await prisma.skill.upsert({
      where: { slug: slugify(input.name) },
      update: {},
      create: { name: input.name, slug: slugify(input.name), categoryId: category?.id },
    });
    try {
      const row = await prisma.talentSkill.create({
        data: {
          profileId,
          skillId: skill.id,
          level: input.level,
          score: input.score,
          yearsOfExperience: input.yearsOfExperience,
        },
        include,
      });
      return toDTO(row);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return null;
      throw err;
    }
  }

  async update(profileId: string, id: string, patch: TalentSkillPatch) {
    // updateMany keeps the profileId in the WHERE clause, so ownership is enforced atomically.
    const { count } = await prisma.talentSkill.updateMany({ where: { id, profileId }, data: patch });
    return count === 0 ? null : this.findById(profileId, id);
  }

  async applyVerification(
    profileId: string,
    id: string,
    result: { level: SkillLevel; score: number; status: SkillVerificationStatus },
  ) {
    const { count } = await prisma.talentSkill.updateMany({
      where: { id, profileId },
      data: { level: result.level, score: result.score, verificationStatus: result.status },
    });
    return count === 0 ? null : this.findById(profileId, id);
  }

  async setStatus(profileId: string, id: string, status: SkillVerificationStatus) {
    const { count } = await prisma.talentSkill.updateMany({
      where: { id, profileId },
      data: { verificationStatus: status },
    });
    return count === 0 ? null : this.findById(profileId, id);
  }

  async remove(profileId: string, id: string) {
    const { count } = await prisma.talentSkill.deleteMany({ where: { id, profileId } });
    return count > 0;
  }

  async searchCatalog(query: string, limit = 8) {
    const skills = await prisma.skill.findMany({
      where: { name: { contains: query, mode: "insensitive" } },
      include: { category: true },
      take: limit,
      orderBy: { name: "asc" },
    });
    return skills.map((s) => ({ id: s.id, name: s.name, category: s.category?.name ?? null }));
  }
}
