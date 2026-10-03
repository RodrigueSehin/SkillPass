import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { CrudRepository } from "@/lib/crud";
import type {
  CreateCertificationInput,
  CreateExperienceInput,
  CreateProjectInput,
} from "@/schemas/portfolio";
import type { CertificationDTO, ExperienceDTO, ProjectDTO } from "@/types/portfolio";
import { slugify } from "./talent-skill.prisma";

const toDay = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);
const fromDay = (s: string | undefined) => (s ? new Date(`${s}T00:00:00.000Z`) : null);
const nul = <T>(v: T | undefined) => v ?? null;

// ---------- Projects ----------

const projectInclude = { skills: { include: { skill: true } } } satisfies Prisma.ProjectInclude;
type ProjectRow = Prisma.ProjectGetPayload<{ include: typeof projectInclude }>;

const toProject = (r: ProjectRow): ProjectDTO => ({
  id: r.id,
  name: r.name,
  description: r.description,
  organization: r.organization,
  role: r.role,
  startDate: toDay(r.startDate),
  endDate: toDay(r.endDate),
  repositoryUrl: r.repositoryUrl,
  url: r.url,
  skills: r.skills.map((s) => s.skill.name).sort(),
});

async function skillIdsFor(names: string[]) {
  const unique = [...new Set(names)];
  const skills = await Promise.all(
    unique.map((name) =>
      prisma.skill.upsert({
        where: { slug: slugify(name) },
        update: {},
        create: { name, slug: slugify(name) },
      }),
    ),
  );
  return skills.map((s) => s.id);
}

const projectScalars = (i: CreateProjectInput) => ({
  name: i.name,
  description: nul(i.description),
  organization: nul(i.organization),
  role: nul(i.role),
  startDate: fromDay(i.startDate),
  endDate: fromDay(i.endDate),
  repositoryUrl: nul(i.repositoryUrl),
  url: nul(i.url),
});

export class PrismaProjectRepository implements CrudRepository<
  ProjectDTO,
  CreateProjectInput,
  CreateProjectInput
> {
  async list(profileId: string) {
    const rows = await prisma.project.findMany({
      where: { profileId },
      include: projectInclude,
      orderBy: [{ startDate: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    });
    return rows.map(toProject);
  }

  async findById(profileId: string, id: string) {
    const row = await prisma.project.findFirst({ where: { id, profileId }, include: projectInclude });
    return row ? toProject(row) : null;
  }

  async create(profileId: string, input: CreateProjectInput) {
    const skillIds = await skillIdsFor(input.skills);
    const row = await prisma.project.create({
      data: {
        profileId,
        ...projectScalars(input),
        skills: { create: skillIds.map((skillId) => ({ skillId })) },
      },
      include: projectInclude,
    });
    return toProject(row);
  }

  async update(profileId: string, id: string, input: CreateProjectInput) {
    const skillIds = await skillIdsFor(input.skills);
    // The ownership check and the write share one transaction.
    const ok = await prisma.$transaction(async (tx) => {
      const { count } = await tx.project.updateMany({
        where: { id, profileId },
        data: projectScalars(input),
      });
      if (count === 0) return false;
      await tx.projectSkill.deleteMany({ where: { projectId: id } });
      await tx.projectSkill.createMany({ data: skillIds.map((skillId) => ({ projectId: id, skillId })) });
      return true;
    });
    return ok ? this.findById(profileId, id) : null;
  }

  async remove(profileId: string, id: string) {
    const { count } = await prisma.project.deleteMany({ where: { id, profileId } });
    return count > 0;
  }
}

// ---------- Experiences ----------

type ExperienceRow = Prisma.ExperienceGetPayload<object>;

const toExperience = (r: ExperienceRow): ExperienceDTO => ({
  id: r.id,
  title: r.title,
  company: r.company,
  location: r.location,
  description: r.description,
  startDate: toDay(r.startDate)!,
  endDate: toDay(r.endDate),
});

const experienceData = (i: CreateExperienceInput) => ({
  title: i.title,
  company: i.company,
  location: nul(i.location),
  description: nul(i.description),
  startDate: fromDay(i.startDate)!,
  endDate: fromDay(i.endDate),
});

export class PrismaExperienceRepository implements CrudRepository<
  ExperienceDTO,
  CreateExperienceInput,
  CreateExperienceInput
> {
  async list(profileId: string) {
    const rows = await prisma.experience.findMany({ where: { profileId }, orderBy: { startDate: "desc" } });
    return rows.map(toExperience);
  }

  async findById(profileId: string, id: string) {
    const row = await prisma.experience.findFirst({ where: { id, profileId } });
    return row ? toExperience(row) : null;
  }

  async create(profileId: string, input: CreateExperienceInput) {
    return toExperience(await prisma.experience.create({ data: { profileId, ...experienceData(input) } }));
  }

  async update(profileId: string, id: string, input: CreateExperienceInput) {
    const { count } = await prisma.experience.updateMany({
      where: { id, profileId },
      data: experienceData(input),
    });
    return count === 0 ? null : this.findById(profileId, id);
  }

  async remove(profileId: string, id: string) {
    const { count } = await prisma.experience.deleteMany({ where: { id, profileId } });
    return count > 0;
  }
}

// ---------- Certifications ----------

type CertificationRow = Prisma.CertificationGetPayload<object>;

const toCertification = (r: CertificationRow): CertificationDTO => ({
  id: r.id,
  name: r.name,
  issuer: r.issuer,
  issueDate: toDay(r.issueDate)!,
  expirationDate: toDay(r.expirationDate),
  credentialId: r.credentialId,
  credentialUrl: r.credentialUrl,
  verificationStatus: r.verificationStatus,
});

const certificationData = (i: CreateCertificationInput) => ({
  name: i.name,
  issuer: i.issuer,
  issueDate: fromDay(i.issueDate)!,
  expirationDate: fromDay(i.expirationDate),
  credentialId: nul(i.credentialId),
  credentialUrl: nul(i.credentialUrl),
});

export class PrismaCertificationRepository implements CrudRepository<
  CertificationDTO,
  CreateCertificationInput,
  CreateCertificationInput
> {
  async list(profileId: string) {
    const rows = await prisma.certification.findMany({
      where: { profileId },
      orderBy: { issueDate: "desc" },
    });
    return rows.map(toCertification);
  }

  async findById(profileId: string, id: string) {
    const row = await prisma.certification.findFirst({ where: { id, profileId } });
    return row ? toCertification(row) : null;
  }

  async create(profileId: string, input: CreateCertificationInput) {
    // verificationStatus keeps its UNVERIFIED default: only a verifier can change it.
    return toCertification(
      await prisma.certification.create({ data: { profileId, ...certificationData(input) } }),
    );
  }

  async update(profileId: string, id: string, input: CreateCertificationInput) {
    const { count } = await prisma.certification.updateMany({
      where: { id, profileId },
      data: certificationData(input),
    });
    return count === 0 ? null : this.findById(profileId, id);
  }

  async remove(profileId: string, id: string) {
    const { count } = await prisma.certification.deleteMany({ where: { id, profileId } });
    return count > 0;
  }
}
