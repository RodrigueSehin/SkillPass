import { CrudService } from "@/lib/crud";
import {
  getCertificationRepository,
  getExperienceRepository,
  getProfileRepository,
  getProjectRepository,
  getTalentSkillRepository,
} from "@/repositories";
import { SkillService } from "./skill.service";
import { PassportService } from "./passport.service";
import { ProfileAccountService } from "./profile-account.service";

export const getSkillService = () => new SkillService(getTalentSkillRepository());
export const getProjectService = () => new CrudService(getProjectRepository(), "Projet");
export const getExperienceService = () => new CrudService(getExperienceRepository(), "Expérience");
export const getCertificationService = () => new CrudService(getCertificationRepository(), "Certification");

export const getProfileAccountService = () => new ProfileAccountService(getProfileRepository());
export const getPassportService = () =>
  new PassportService(
    getSkillService(),
    getProjectService(),
    getExperienceService(),
    getCertificationService(),
  );
