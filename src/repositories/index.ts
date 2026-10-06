import { InMemoryTalentSkillRepository } from "./talent-skill.memory";
import { PrismaTalentSkillRepository } from "./talent-skill.prisma";
import type { TalentSkillRepository } from "./talent-skill.repository";
import { InMemoryAttemptRepository } from "./attempt.memory";
import { PrismaAttemptRepository } from "./attempt.prisma";
import type { AttemptRepository } from "./attempt.repository";
import { InMemoryCredentialRepository } from "./credential.memory";
import { PrismaCredentialRepository } from "./credential.prisma";
import type { CredentialRepository } from "./credential.repository";
import { InMemoryRecommendationRepository } from "./recommendation.memory";
import { PrismaRecommendationRepository } from "./recommendation.prisma";
import type { RecommendationRepository } from "./recommendation.repository";
import { InMemoryEvidenceRepository } from "./evidence.memory";
import { PrismaEvidenceRepository } from "./evidence.prisma";
import type { EvidenceRepository } from "./evidence.repository";
import { InMemoryProfileRepository } from "./profile.memory";
import { PrismaProfileRepository } from "./profile.prisma";
import type {
  ApplicationRepository,
  JobAlertRepository,
  OpportunityRepository,
  SavedOpportunityRepository,
} from "./opportunity.repository";
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

import { createMemoryContacts } from "./contact.memory";
import { PrismaContactRepository } from "./contact.prisma";
import {
  InMemoryApplicationRepository,
  InMemoryJobAlertRepository,
  InMemoryOpportunityRepository,
  InMemorySavedOpportunityRepository,
} from "./opportunity.memory";
import {
  PrismaApplicationRepository,
  PrismaJobAlertRepository,
  PrismaOpportunityRepository,
  PrismaSavedOpportunityRepository,
} from "./opportunity.prisma";

const DEMO_PROFILE_ID = "demo";

const g = globalThis as unknown as {
  memory?: {
    skills: InMemoryTalentSkillRepository;
    profiles: InMemoryProfileRepository;
    evidence: InMemoryEvidenceRepository;
    attempts: InMemoryAttemptRepository;
    credentials: InMemoryCredentialRepository;
    recommendations: InMemoryRecommendationRepository;
    projects: ReturnType<typeof createMemoryProjects>;
    experiences: ReturnType<typeof createMemoryExperiences>;
    certifications: ReturnType<typeof createMemoryCertifications>;
    opportunities: InMemoryOpportunityRepository;
    savedOpportunities: InMemorySavedOpportunityRepository;
    jobAlerts: InMemoryJobAlertRepository;
    applications: InMemoryApplicationRepository;
    contacts: ReturnType<typeof createMemoryContacts>;
  };
};

/**
 * Prisma when DATABASE_URL is set. Otherwise (never in production) in-memory repositories
 * seeded with demo data for the preview user, shared across requests via globalThis.
 */
function memory() {
  if (process.env.NODE_ENV === "production") throw new Error("DATABASE_URL is required in production");
  if (!g.memory) {
    const opportunities = new InMemoryOpportunityRepository();
    g.memory = {
      ...baseMemory(),
      opportunities,
      savedOpportunities: new InMemorySavedOpportunityRepository(opportunities),
      jobAlerts: new InMemoryJobAlertRepository(),
      applications: new InMemoryApplicationRepository(opportunities),
      contacts: createMemoryContacts(DEMO_PROFILE_ID),
    };
  }
  return g.memory;
}

function baseMemory() {
  return {
    skills: new InMemoryTalentSkillRepository(DEMO_PROFILE_ID),
    profiles: new InMemoryProfileRepository(true),
    evidence: new InMemoryEvidenceRepository(DEMO_PROFILE_ID),
    attempts: new InMemoryAttemptRepository(),
    credentials: new InMemoryCredentialRepository(),
    recommendations: new InMemoryRecommendationRepository(),
    projects: createMemoryProjects(DEMO_PROFILE_ID),
    experiences: createMemoryExperiences(DEMO_PROFILE_ID),
    certifications: createMemoryCertifications(DEMO_PROFILE_ID),
  };
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

export const getEvidenceRepository = (): EvidenceRepository =>
  hasDatabase() ? new PrismaEvidenceRepository() : memory().evidence;

export const getAttemptRepository = (): AttemptRepository =>
  hasDatabase() ? new PrismaAttemptRepository() : memory().attempts;
export const getCredentialRepository = (): CredentialRepository =>
  hasDatabase() ? new PrismaCredentialRepository() : memory().credentials;
export const getRecommendationRepository = (): RecommendationRepository =>
  hasDatabase() ? new PrismaRecommendationRepository() : memory().recommendations;

export const getOpportunityRepository = (): OpportunityRepository =>
  hasDatabase() ? new PrismaOpportunityRepository() : memory().opportunities;
export const getSavedOpportunityRepository = (): SavedOpportunityRepository =>
  hasDatabase() ? new PrismaSavedOpportunityRepository() : memory().savedOpportunities;
export const getJobAlertRepository = (): JobAlertRepository =>
  hasDatabase() ? new PrismaJobAlertRepository() : memory().jobAlerts;
export const getApplicationRepository = (): ApplicationRepository =>
  hasDatabase() ? new PrismaApplicationRepository() : memory().applications;
export const getContactRepository = () => (hasDatabase() ? new PrismaContactRepository() : memory().contacts);
