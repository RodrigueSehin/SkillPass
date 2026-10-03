import { z } from "zod";
import { SKILL_LEVELS, SKILL_VERIFICATION_STATUSES } from "@/types/skill";

/** Only declarative fields are user-editable. Score and verification status are set by assessments. */
export const createTalentSkillSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(60),
  category: z.string().trim().min(2).max(60).optional(),
  level: z.enum(SKILL_LEVELS),
  yearsOfExperience: z.coerce.number().int().min(0).max(60),
});

export const updateTalentSkillSchema = createTalentSkillSchema
  .pick({ level: true, yearsOfExperience: true })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Aucune modification");

export const SKILL_SORT_KEYS = ["name", "score", "level", "experience"] as const;

export const listTalentSkillsQuerySchema = z.object({
  q: z.string().trim().max(60).optional(),
  level: z.enum(SKILL_LEVELS).optional(),
  status: z.enum(SKILL_VERIFICATION_STATUSES).optional(),
  category: z.string().trim().max(60).optional(),
  sort: z.enum(SKILL_SORT_KEYS).default("score"),
});

export type CreateTalentSkillInput = z.infer<typeof createTalentSkillSchema>;
export type UpdateTalentSkillInput = z.infer<typeof updateTalentSkillSchema>;
export type ListTalentSkillsQuery = z.infer<typeof listTalentSkillsQuerySchema>;
/** Form values before Zod coercion (yearsOfExperience arrives as a string). */
export type CreateTalentSkillFormValues = z.input<typeof createTalentSkillSchema>;
