import { InMemoryCrudRepository } from "@/lib/crud";
import { DEMO_CERTIFICATIONS, DEMO_EXPERIENCES, DEMO_PROJECT_ROWS } from "@/config/demo-data";
import type {
  CreateCertificationInput,
  CreateExperienceInput,
  CreateProjectInput,
} from "@/schemas/portfolio";
import type { CertificationDTO, ExperienceDTO, ProjectDTO } from "@/types/portfolio";

const n = <T>(v: T | undefined) => v ?? null;

export const createMemoryProjects = (seedProfileId?: string) =>
  new InMemoryCrudRepository<ProjectDTO, CreateProjectInput, CreateProjectInput>(
    seedProfileId,
    () => DEMO_PROJECT_ROWS.map((p) => ({ ...p, skills: [...p.skills] })),
    (i) => ({
      name: i.name,
      description: n(i.description),
      organization: n(i.organization),
      role: n(i.role),
      startDate: n(i.startDate),
      endDate: n(i.endDate),
      repositoryUrl: n(i.repositoryUrl),
      url: n(i.url),
      skills: i.skills,
    }),
  );

export const createMemoryExperiences = (seedProfileId?: string) =>
  new InMemoryCrudRepository<ExperienceDTO, CreateExperienceInput, CreateExperienceInput>(
    seedProfileId,
    () => DEMO_EXPERIENCES.map((e) => ({ ...e })),
    (i) => ({
      title: i.title,
      company: i.company,
      location: n(i.location),
      description: n(i.description),
      contractType: n(i.contractType),
      workMode: n(i.workMode),
      domain: n(i.domain),
      startDate: i.startDate,
      endDate: n(i.endDate),
      skills: [...i.skills].sort(),
    }),
  );

/** Keeps proof-document metadata beside the rows; a quick edit never wipes skills or the document. */
export class MemoryCertificationRepository extends InMemoryCrudRepository<
  CertificationDTO,
  CreateCertificationInput,
  CreateCertificationInput
> {
  private paths = new Map<string, string>();

  constructor(seedProfileId?: string) {
    super(
      seedProfileId,
      () => DEMO_CERTIFICATIONS.map((c) => ({ ...c })),
      (i) => ({
        name: i.name,
        issuer: i.issuer,
        issueDate: i.issueDate,
        expirationDate: n(i.expirationDate),
        credentialId: n(i.credentialId),
        credentialUrl: n(i.credentialUrl),
        category: n(i.category),
        level: n(i.level),
        description: n(i.description),
        documentName: null,
        documentSize: null,
        skills: [...(i.skills ?? [])].sort(),
        verificationStatus: "UNVERIFIED",
      }),
    );
  }

  override async update(profileId: string, id: string, input: CreateCertificationInput) {
    const row = await this.findById(profileId, id);
    if (!row) return null;
    const { skills, category, level, description, ...scalars } = input;
    Object.assign(row, {
      name: scalars.name,
      issuer: scalars.issuer,
      issueDate: scalars.issueDate,
      expirationDate: n(scalars.expirationDate),
      credentialId: n(scalars.credentialId),
      credentialUrl: n(scalars.credentialUrl),
    });
    // Only the full form sends skills: without it the optional fields are left as they are.
    if (skills)
      Object.assign(row, {
        skills: [...skills].sort(),
        category: n(category),
        level: n(level),
        description: n(description),
      });
    return row;
  }

  async setDocument(profileId: string, id: string, doc: { path: string; name: string; size: number }) {
    const row = await this.findById(profileId, id);
    if (!row) return null;
    const previousPath = this.paths.get(id) ?? null;
    this.paths.set(id, doc.path);
    Object.assign(row, { documentName: doc.name, documentSize: doc.size });
    return { previousPath };
  }

  async getDocumentPath(profileId: string, id: string) {
    return (await this.findById(profileId, id)) ? (this.paths.get(id) ?? null) : null;
  }
}

export const createMemoryCertifications = (seedProfileId?: string) =>
  new MemoryCertificationRepository(seedProfileId);
