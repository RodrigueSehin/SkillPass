import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { TalentDetail, TalentRecord } from "@/types/talent";
import type { TalentDirectoryRepository } from "./talent-directory.repository";

const include = {
  talentSkills: { include: { skill: true, _count: { select: { evidence: true } } } },
  certifications: true,
  _count: {
    select: {
      projects: { where: { isPublic: true } },
      recommendations: { where: { status: "APPROVED" } },
    },
  },
} satisfies Prisma.ProfileInclude;
type Row = Prisma.ProfileGetPayload<{ include: typeof include }>;

const day = (d: Date) => d.toISOString().slice(0, 10);

function toRecord(row: Row, today = day(new Date())): TalentRecord {
  return {
    id: row.id,
    username: row.username,
    fullName: row.fullName,
    headline: row.headline,
    profession: row.profession,
    location: row.location,
    yearsOfExperience: row.yearsOfExperience,
    availability: row.availability,
    updatedAt: row.updatedAt.toISOString(),
    skills: row.talentSkills.map((s) => ({
      name: s.skill.name,
      level: s.level,
      score: s.score,
      verified: s.verificationStatus === "VERIFIED",
      evidenceCount: s._count.evidence,
    })),
    certifications: row.certifications.map((c) => ({
      name: c.name,
      issuer: c.issuer,
      date: day(c.issueDate),
      verified: c.verificationStatus === "VERIFIED",
      expired: Boolean(c.expirationDate && day(c.expirationDate) < today),
    })),
    projectCount: row._count.projects,
    recommendationCount: row._count.recommendations,
  };
}

export class PrismaTalentDirectoryRepository implements TalentDirectoryRepository {
  async listPublic(limit: number) {
    const rows = await prisma.profile.findMany({
      where: { isPublic: true, role: "TALENT" },
      include,
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
    return rows.map((r) => toRecord(r));
  }

  async detail(username: string): Promise<TalentDetail | null> {
    const row = await prisma.profile.findFirst({
      where: { username, isPublic: true, role: "TALENT" },
      include: {
        ...include,
        projects: {
          where: { isPublic: true },
          orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
          take: 8,
        },
        experiences: { orderBy: { startDate: "desc" }, take: 10 },
      },
    });
    if (!row) return null;
    return {
      record: toRecord(row),
      projects: row.projects.map((p) => ({ name: p.name, organization: p.organization, domain: p.domain })),
      experiences: row.experiences.map((e) => ({
        title: e.title,
        company: e.company,
        startDate: day(e.startDate),
        endDate: e.endDate ? day(e.endDate) : null,
      })),
    };
  }
}
