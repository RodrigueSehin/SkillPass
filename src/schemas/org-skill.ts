import { z } from "zod";
import { SKILL_KINDS } from "@/types/org-skill";

const tags = (max: number) =>
  z
    .array(z.string().trim().min(1).max(60))
    .max(max)
    .default([])
    .transform((list) =>
      list.filter((v, i) => list.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i),
    );

export const orgSkillSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom de la compétence est requis (2 caractères minimum)")
    .max(100, "Nom trop long (100 caractères)"),
  category: z.string().trim().min(1, "Choisissez une catégorie").max(60),
  kind: z.enum(SKILL_KINDS).default("TECHNICAL"),
  description: z
    .string()
    .trim()
    .min(10, "Ajoutez une description (10 caractères minimum)")
    .max(2000, "Description trop longue (2000 caractères)"),
  keywords: tags(20).refine((k) => k.length > 0, "Ajoutez au moins un mot-clé"),
  synonyms: tags(20),
});

export type OrgSkillFormInput = z.infer<typeof orgSkillSchema>;
