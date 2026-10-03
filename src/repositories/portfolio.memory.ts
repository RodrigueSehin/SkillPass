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
      startDate: i.startDate,
      endDate: n(i.endDate),
    }),
  );

export const createMemoryCertifications = (seedProfileId?: string) =>
  new InMemoryCrudRepository<CertificationDTO, CreateCertificationInput, CreateCertificationInput>(
    seedProfileId,
    () => DEMO_CERTIFICATIONS.map((c) => ({ ...c })),
    (i) => ({
      name: i.name,
      issuer: i.issuer,
      issueDate: i.issueDate,
      expirationDate: n(i.expirationDate),
      credentialId: n(i.credentialId),
      credentialUrl: n(i.credentialUrl),
      verificationStatus: "UNVERIFIED",
    }),
  );
