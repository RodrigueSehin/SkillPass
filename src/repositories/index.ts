import { InMemoryTalentSkillRepository } from "./talent-skill.memory";
import { PrismaTalentSkillRepository } from "./talent-skill.prisma";
import type { TalentSkillRepository } from "./talent-skill.repository";
import { InMemoryProfileRepository } from "./profile.memory";
import { PrismaProfileRepository } from "./profile.prisma";
import type { ProfileRepository } from "./profile.repository";
import {
  createMemoryCertifications,
  createMemoryExperiences,
  createMemoryProjects,
} from "./portfolio.memory";
import {
  PrismaCertificationRepository,
  PrismaExperienceRepository,
  PrismaProjectRepository,
} from "./portfolio.prisma";

const DEMO_PROFILE_ID = "demo";

const g = globalThis as unknown as {
  memory?: {
    skills: InMemoryTalentSkillRepository;
    profiles: InMemoryProfileRepository;
    projects: ReturnType<typeof createMemoryProjects>;
    experiences: ReturnType<typeof createMemoryExperiences>;
    certifications: ReturnType<typeof createMemoryCertifications>;
  };
};

/**
 * Prisma when DATABASE_URL is set. Otherwise (never in production) in-memory repositories
 * seeded with demo data for the preview user, shared across requests via globalThis.
 */
function memory() {
  if (process.env.NODE_ENV === "production") throw new Error("DATABASE_URL is required in production");
  return (g.memory ??= {
    skills: new InMemoryTalentSkillRepository(DEMO_PROFILE_ID),
    profiles: new InMemoryProfileRepository(true),
    projects: createMemoryProjects(DEMO_PROFILE_ID),
    experiences: createMemoryExperiences(DEMO_PROFILE_ID),
    certifications: createMemoryCertifications(DEMO_PROFILE_ID),
  });
}

const hasDatabase = () => Boolean(process.env.DATABASE_URL);

export const getTalentSkillRepository = (): TalentSkillRepository =>
  hasDatabase() ? new PrismaTalentSkillRepository() : memory().skills;
export const getProjectRepository = () => (hasDatabase() ? new PrismaProjectRepository() : memory().projects);
export const getExperienceRepository = () =>
  hasDatabase() ? new PrismaExperienceRepository() : memory().experiences;
export const getCertificationRepository = () =>
  hasDatabase() ? new PrismaCertificationRepository() : memory().certifications;

export const getProfileRepository = (): ProfileRepository =>
  hasDatabase() ? new PrismaProfileRepository() : memory().profiles;
