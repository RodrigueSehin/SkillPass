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
  domain: r.domain,
  teamSize: r.teamSize,
  featured: r.featured,
  hasCover: Boolean(r.coverPath),
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
  domain: nul(i.domain),
  teamSize: nul(i.teamSize),
  featured: i.featured,
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

  /** Stores the cover's storage key. Returns the previous key, or null when the project is not the caller's. */
  async setCover(profileId: string, id: string, path: string) {
    const previous = await prisma.project.findFirst({
      where: { id, profileId },
      select: { coverPath: true },
    });
    if (!previous) return null;
    await prisma.project.update({ where: { id }, data: { coverPath: path } });
    return { previousPath: previous.coverPath };
  }

  async getCoverPath(profileId: string, id: string) {
    const row = await prisma.project.findFirst({ where: { id, profileId }, select: { coverPath: true } });
    return row?.coverPath ?? null;
  }
}

// ---------- Experiences ----------

const experienceInclude = {
  skills: { include: { skill: true } },
  documents: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.ExperienceInclude;
type ExperienceRow = Prisma.ExperienceGetPayload<{ include: typeof experienceInclude }>;

const toExperience = (r: ExperienceRow): ExperienceDTO => ({
  id: r.id,
  title: r.title,
  company: r.company,
  location: r.location,
  description: r.description,
  contractType: r.contractType,
  workMode: r.workMode,
  domain: r.domain,
  startDate: toDay(r.startDate)!,
  endDate: toDay(r.endDate),
  skills: r.skills.map((s) => s.skill.name).sort(),
  documents: r.documents.map((d) => ({ id: d.id, name: d.name, size: d.size })),
});

const experienceData = (i: CreateExperienceInput) => ({
  title: i.title,
  company: i.company,
  location: nul(i.location),
  description: nul(i.description),
  contractType: nul(i.contractType),
  workMode: nul(i.workMode),
  domain: nul(i.domain),
  startDate: fromDay(i.startDate)!,
  endDate: fromDay(i.endDate),
});

export class PrismaExperienceRepository implements CrudRepository<
  ExperienceDTO,
  CreateExperienceInput,
  CreateExperienceInput
> {
  async list(profileId: string) {
    const rows = await prisma.experience.findMany({
      where: { profileId },
      include: experienceInclude,
      orderBy: { startDate: "desc" },
    });
    return rows.map(toExperience);
  }

  async findById(profileId: string, id: string) {
    const row = await prisma.experience.findFirst({ where: { id, profileId }, include: experienceInclude });
    return row ? toExperience(row) : null;
  }

  async create(profileId: string, input: CreateExperienceInput) {
    const skillIds = await skillIdsFor(input.skills);
    const row = await prisma.experience.create({
      data: {
        profileId,
        ...experienceData(input),
        skills: { create: skillIds.map((skillId) => ({ skillId })) },
      },
      include: experienceInclude,
    });
    return toExperience(row);
  }

  async update(profileId: string, id: string, input: CreateExperienceInput) {
    const skillIds = await skillIdsFor(input.skills);
    const ok = await prisma.$transaction(async (tx) => {
      const { count } = await tx.experience.updateMany({
        where: { id, profileId },
        data: experienceData(input),
      });
      if (count === 0) return false;
      await tx.experienceSkill.deleteMany({ where: { experienceId: id } });
      await tx.experienceSkill.createMany({
        data: skillIds.map((skillId) => ({ experienceId: id, skillId })),
      });
      return true;
    });
    return ok ? this.findById(profileId, id) : null;
  }

  async remove(profileId: string, id: string) {
    const { count } = await prisma.experience.deleteMany({ where: { id, profileId } });
    return count > 0;
  }

  /** Returns the new document id, or null when the experience is not the caller's. */
  async addDocument(profileId: string, id: string, doc: { path: string; name: string; size: number }) {
    const owned = await prisma.experience.findFirst({ where: { id, profileId }, select: { id: true } });
    if (!owned) return null;
    const row = await prisma.experienceDocument.create({ data: { experienceId: id, ...doc } });
    return row.id;
  }

  async getDocumentPath(profileId: string, id: string, docId: string) {
    const row = await prisma.experienceDocument.findFirst({
      where: { id: docId, experienceId: id, experience: { profileId } },
      select: { path: true },
    });
    return row?.path ?? null;
  }
}

// ---------- Certifications ----------

const certificationInclude = { skills: { include: { skill: true } } } satisfies Prisma.CertificationInclude;
type CertificationRow = Prisma.CertificationGetPayload<{ include: typeof certificationInclude }>;

const toCertification = (r: CertificationRow): CertificationDTO => ({
  id: r.id,
  name: r.name,
  issuer: r.issuer,
  issueDate: toDay(r.issueDate)!,
  expirationDate: toDay(r.expirationDate),
  credentialId: r.credentialId,
  credentialUrl: r.credentialUrl,
  category: r.category,
  level: r.level,
  description: r.description,
  documentName: r.documentName,
  documentSize: r.documentSize,
  skills: r.skills.map((s) => s.skill.name).sort(),
  verificationStatus: r.verificationStatus,
});

const certificationData = (i: CreateCertificationInput) => ({
  name: i.name,
  issuer: i.issuer,
  issueDate: fromDay(i.issueDate)!,
  expirationDate: fromDay(i.expirationDate),
  credentialId: nul(i.credentialId),
  credentialUrl: nul(i.credentialUrl),
  // The quick edit dialog does not send these: undefined leaves the stored value untouched.
  ...(i.category !== undefined || i.skills === undefined ? { category: nul(i.category) } : {}),
  ...(i.level !== undefined || i.skills === undefined ? { level: nul(i.level) } : {}),
  ...(i.description !== undefined || i.skills === undefined ? { description: nul(i.description) } : {}),
});

export class PrismaCertificationRepository implements CrudRepository<
  CertificationDTO,
  CreateCertificationInput,
  CreateCertificationInput
> {
  async list(profileId: string) {
    const rows = await prisma.certification.findMany({
      where: { profileId },
      include: certificationInclude,
      orderBy: { issueDate: "desc" },
    });
    return rows.map(toCertification);
  }

  async findById(profileId: string, id: string) {
    const row = await prisma.certification.findFirst({
      where: { id, profileId },
      include: certificationInclude,
    });
    return row ? toCertification(row) : null;
  }

  async create(profileId: string, input: CreateCertificationInput) {
    const skillIds = await skillIdsFor(input.skills ?? []);
    // verificationStatus keeps its UNVERIFIED default: only a verifier can change it.
    const row = await prisma.certification.create({
      data: {
        profileId,
        ...certificationData(input),
        skills: { create: skillIds.map((skillId) => ({ skillId })) },
      },
      include: certificationInclude,
    });
    return toCertification(row);
  }

  async update(profileId: string, id: string, input: CreateCertificationInput) {
    const skillIds = input.skills ? await skillIdsFor(input.skills) : undefined;
    const ok = await prisma.$transaction(async (tx) => {
      const { count } = await tx.certification.updateMany({
        where: { id, profileId },
        data: certificationData(input),
      });
      if (count === 0) return false;
      if (skillIds) {
        await tx.certificationSkill.deleteMany({ where: { certificationId: id } });
        await tx.certificationSkill.createMany({
          data: skillIds.map((skillId) => ({ certificationId: id, skillId })),
        });
      }
      return true;
    });
    return ok ? this.findById(profileId, id) : null;
  }

  async remove(profileId: string, id: string) {
    const { count } = await prisma.certification.deleteMany({ where: { id, profileId } });
    return count > 0;
  }

  /** Stores the proof's storage key and display metadata. Returns the previous key, if any. */
  async setDocument(profileId: string, id: string, doc: { path: string; name: string; size: number }) {
    const previous = await prisma.certification.findFirst({
      where: { id, profileId },
      select: { documentPath: true },
    });
    if (!previous) return null;
    await prisma.certification.update({
      where: { id },
      data: { documentPath: doc.path, documentName: doc.name, documentSize: doc.size },
    });
    return { previousPath: previous.documentPath };
  }

  async getDocumentPath(profileId: string, id: string) {
    const row = await prisma.certification.findFirst({
      where: { id, profileId },
      select: { documentPath: true },
    });
    return row?.documentPath ?? null;
  }
}
