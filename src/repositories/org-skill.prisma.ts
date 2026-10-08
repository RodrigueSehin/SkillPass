import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { OrgSkillDTO, OrgSkillInput, SkillKind } from "@/types/org-skill";
import type { OrgSkillRepository } from "./org-skill.repository";

type Row = Prisma.OrganizationSkillGetPayload<object>;

const toSkill = (r: Row): OrgSkillDTO => ({
  id: r.id,
  name: r.name,
  category: r.category,
  kind: r.kind as SkillKind,
  description: r.description,
  keywords: r.keywords,
  synonyms: r.synonyms,
  createdAt: r.createdAt.toISOString(),
});

const isUniqueViolation = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";

export class PrismaOrgSkillRepository implements OrgSkillRepository {
  async list(orgId: string) {
    const rows = await prisma.organizationSkill.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
    });
    return rows.map(toSkill);
  }

  async get(orgId: string, id: string) {
    const row = await prisma.organizationSkill.findFirst({ where: { id, organizationId: orgId } });
    return row ? toSkill(row) : null;
  }

  async create(orgId: string, input: OrgSkillInput) {
    try {
      return toSkill(
        await prisma.organizationSkill.create({
          data: { organizationId: orgId, nameKey: input.name.trim().toLowerCase(), ...input },
        }),
      );
    } catch (err) {
      if (isUniqueViolation(err)) return null;
      throw err;
    }
  }

  async update(orgId: string, id: string, input: OrgSkillInput) {
    try {
      const { count } = await prisma.organizationSkill.updateMany({
        where: { id, organizationId: orgId },
        data: { nameKey: input.name.trim().toLowerCase(), ...input },
      });
      return count === 0 ? null : this.get(orgId, id);
    } catch (err) {
      if (isUniqueViolation(err)) return "conflict" as const;
      throw err;
    }
  }

  async delete(orgId: string, id: string) {
    const { count } = await prisma.organizationSkill.deleteMany({ where: { id, organizationId: orgId } });
    return count > 0;
  }
}
