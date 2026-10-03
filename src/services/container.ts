import { CrudService } from "@/lib/crud";
import {
  getCertificationRepository,
  getExperienceRepository,
  getProjectRepository,
  getTalentSkillRepository,
} from "@/repositories";
import { SkillService } from "./skill.service";

export const getSkillService = () => new SkillService(getTalentSkillRepository());
export const getProjectService = () => new CrudService(getProjectRepository(), "Projet");
export const getExperienceService = () => new CrudService(getExperienceRepository(), "Expérience");
export const getCertificationService = () => new CrudService(getCertificationRepository(), "Certification");
