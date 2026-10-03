import { CrudService } from "@/lib/crud";
import {
  getCertificationRepository,
  getAttemptRepository,
  getCredentialRepository,
  getEvidenceRepository,
  getRecommendationRepository,
  getExperienceRepository,
  getProfileRepository,
  getProjectRepository,
  getTalentSkillRepository,
} from "@/repositories";
import { SkillService } from "./skill.service";
import { getStorage } from "@/lib/storage/storage";
import { EvidenceService } from "./evidence.service";
import { AssessmentService } from "./assessment.service";
import { CredentialService } from "./credential.service";
import { RecommendationService } from "./recommendation.service";
import { PassportService } from "./passport.service";
import { ProfileAccountService } from "./profile-account.service";

export const getSkillService = () => new SkillService(getTalentSkillRepository(), getEvidenceRepository());
export const getProjectService = () => new CrudService(getProjectRepository(), "Projet");
export const getExperienceService = () => new CrudService(getExperienceRepository(), "Expérience");
export const getCertificationService = () => new CrudService(getCertificationRepository(), "Certification");

export const getProfileAccountService = () => new ProfileAccountService(getProfileRepository());
export const getCredentialService = () =>
  new CredentialService(getCredentialRepository(), getProfileRepository());

export const getRecommendationService = () =>
  new RecommendationService(
    getRecommendationRepository(),
    getTalentSkillRepository(),
    getProfileRepository(),
  );

export const getAssessmentService = () =>
  new AssessmentService({
    attempts: getAttemptRepository(),
    skills: getTalentSkillRepository(),
    profiles: getProfileRepository(),
    credentials: getCredentialService(),
    // Waiting time between attempts; set to 0 in tests and local demos.
    cooldownHours: Number(process.env.ASSESSMENT_COOLDOWN_HOURS ?? 24),
  });

export const getPassportService = () =>
  new PassportService(
    getSkillService(),
    getProjectService(),
    getExperienceService(),
    getCertificationService(),
    getCredentialService(),
    getRecommendationService(),
  );

export const getEvidenceService = () =>
  new EvidenceService(getEvidenceRepository(), getSkillService(), getProjectService(), getStorage);
