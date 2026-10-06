import { randomUUID } from "node:crypto";
import { InMemoryCrudRepository } from "@/lib/crud";
import { DEMO_CERTIFICATIONS, DEMO_EXPERIENCES, DEMO_PROJECT_ROWS } from "@/config/demo-data";
import type {
  CreateCertificationInput,
  CreateExperienceInput,
  CreateProjectInput,
} from "@/schemas/portfolio";
import type { CertificationDTO, ExperienceDTO, ProjectDTO } from "@/types/portfolio";

const n = <T>(v: T | undefined) => v ?? null;

/** The cover image path lives beside the rows; editing a project never wipes the cover. */
export class MemoryProjectRepository extends InMemoryCrudRepository<
  ProjectDTO,
  CreateProjectInput,
  CreateProjectInput
> {
  private covers = new Map<string, string>();

  constructor(seedProfileId?: string) {
    super(
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
        domain: n(i.domain),
        teamSize: n(i.teamSize),
        featured: i.featured,
        hasCover: false,
        status: n(i.status),
        videoUrl: n(i.videoUrl),
        otherUrl: n(i.otherUrl),
        isPublic: i.isPublic,
        skills: i.skills,
      }),
    );
  }

  override async update(profileId: string, id: string, input: CreateProjectInput) {
    const row = await this.findById(profileId, id);
    if (!row) return null;
    const { hasCover, ...fields } = (
      this as unknown as { build: (i: CreateProjectInput) => ProjectDTO }
    ).build(input);
    void hasCover;
    Object.assign(row, fields);
    return row;
  }

  async setCover(profileId: string, id: string, path: string) {
    const row = await this.findById(profileId, id);
    if (!row) return null;
    const previousPath = this.covers.get(id) ?? null;
    this.covers.set(id, path);
    row.hasCover = true;
    return { previousPath };
  }

  async getCoverPath(profileId: string, id: string) {
    return (await this.findById(profileId, id)) ? (this.covers.get(id) ?? null) : null;
  }
}

export const createMemoryProjects = (seedProfileId?: string) => new MemoryProjectRepository(seedProfileId);

/** Attachments live beside the rows; editing an experience never wipes them. */
export class MemoryExperienceRepository extends InMemoryCrudRepository<
  ExperienceDTO,
  CreateExperienceInput,
  CreateExperienceInput
> {
  private paths = new Map<string, string>();

  constructor(seedProfileId?: string) {
    super(
      seedProfileId,
      () => DEMO_EXPERIENCES.map((e) => ({ ...e, skills: [...e.skills], documents: [] })),
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
        documents: [],
      }),
    );
  }

  override async update(profileId: string, id: string, input: CreateExperienceInput) {
    const row = await this.findById(profileId, id);
    if (!row) return null;
    const { documents, ...scalars } = this.rebuild(input);
    void documents;
    Object.assign(row, scalars);
    return row;
  }

  private rebuild(input: CreateExperienceInput) {
    return {
      title: input.title,
      company: input.company,
      location: n(input.location),
      description: n(input.description),
      contractType: n(input.contractType),
      workMode: n(input.workMode),
      domain: n(input.domain),
      startDate: input.startDate,
      endDate: n(input.endDate),
      skills: [...input.skills].sort(),
      documents: [],
    };
  }

  async addDocument(profileId: string, id: string, doc: { path: string; name: string; size: number }) {
    const row = await this.findById(profileId, id);
    if (!row) return null;
    const docId = randomUUID();
    this.paths.set(docId, doc.path);
    row.documents = [...row.documents, { id: docId, name: doc.name, size: doc.size }];
    return docId;
  }

  async getDocumentPath(profileId: string, id: string, docId: string) {
    const row = await this.findById(profileId, id);
    return row?.documents.some((d) => d.id === docId) ? (this.paths.get(docId) ?? null) : null;
  }
}

export const createMemoryExperiences = (seedProfileId?: string) =>
  new MemoryExperienceRepository(seedProfileId);

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
