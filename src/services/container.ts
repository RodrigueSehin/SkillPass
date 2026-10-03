import { getTalentSkillRepository } from "@/repositories";
import { SkillService } from "./skill.service";

export const getSkillService = () => new SkillService(getTalentSkillRepository());
