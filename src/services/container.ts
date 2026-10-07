import { CrudService } from "@/lib/crud";
import {
  getCertificationRepository,
  getApplicationRepository,
  getContactRepository,
  getJobAlertRepository,
  getOpportunityRepository,
  getOrganizationRepository,
  getSavedOpportunityRepository,
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
import { CertificationDocumentService } from "./certification-document.service";
import { ExperienceDocumentService } from "./experience-document.service";
import { OpportunityService } from "./opportunity.service";
import { OrganizationLogoService } from "./organization-logo.service";
import { OrganizationService } from "./organization.service";
import { ProjectCoverService } from "./project-cover.service";
import { AssessmentService } from "./assessment.service";
import { CredentialService } from "./credential.service";
import { RecommendationService } from "./recommendation.service";
import { PassportService } from "./passport.service";
import { ProfileAccountService } from "./profile-account.service";

export const getSkillService = () => new SkillService(getTalentSkillRepository(), getEvidenceRepository());
export const getProjectService = () => new CrudService(getProjectRepository(), "Projet");
export const getProjectCoverService = () => new ProjectCoverService(getProjectRepository(), getStorage);
export const getExperienceService = () => new CrudService(getExperienceRepository(), "Expérience");
export const getExperienceDocumentService = () =>
  new ExperienceDocumentService(getExperienceRepository(), getStorage);
export const getCertificationService = () => new CrudService(getCertificationRepository(), "Certification");
export const getCertificationDocumentService = () =>
  new CertificationDocumentService(getCertificationRepository(), getStorage);

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

export const getContactService = () => new CrudService(getContactRepository(), "Contact");
export const getOpportunityService = () =>
  new OpportunityService(
    getOpportunityRepository(),
    getSavedOpportunityRepository(),
    getJobAlertRepository(),
    getApplicationRepository(),
  );

export const getOrganizationService = () => new OrganizationService(getOrganizationRepository());
export const getOrganizationLogoService = () =>
  new OrganizationLogoService(getOrganizationRepository(), getStorage);
