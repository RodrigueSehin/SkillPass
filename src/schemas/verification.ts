import { z } from "zod";

export const submitAssessmentSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1).max(40),
        selected: z.number().int().min(0).max(10).nullable(),
      }),
    )
    // The longest bank is far below this; the cap only bounds hostile payloads.
    .max(100),
});

export const reviewDecisionSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  note: z.string().trim().max(1000).optional(),
});

const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const REQUEST_ASPECTS = [
  "TECHNICAL",
  "PROFESSIONAL",
  "TEAMWORK",
  "LEADERSHIP",
  "PROJECT_MANAGEMENT",
  "OTHER",
] as const;
export const REQUEST_ASPECT_LABELS: Record<(typeof REQUEST_ASPECTS)[number], string> = {
  TECHNICAL: "Compétences techniques",
  PROFESSIONAL: "Qualités professionnelles",
  TEAMWORK: "Travail en équipe",
  LEADERSHIP: "Leadership",
  PROJECT_MANAGEMENT: "Gestion de projet",
  OTHER: "Autre",
};

export const requestRecommendationSchema = z.object({
  authorName: z.string().trim().min(2, "Nom trop court").max(100),
  authorEmail: z.preprocess(blankToUndefined, z.string().trim().email("E-mail invalide").max(200).optional()),
  talentSkillId: z.preprocess(blankToUndefined, z.string().trim().min(1).optional()),
  authorTitle: z.preprocess(blankToUndefined, z.string().trim().max(120).optional()),
  subject: z.preprocess(blankToUndefined, z.string().trim().max(120).optional()),
  message: z.preprocess(
    blankToUndefined,
    z.string().trim().max(1000, "Message trop long (1000 caractères)").optional(),
  ),
  aspects: z.array(z.enum(REQUEST_ASPECTS)).max(6).default([]),
});

export const RECOMMENDATION_RELATIONS = [
  "MANAGER",
  "COLLEAGUE",
  "CLIENT",
  "PARTNER",
  "MENTOR",
  "OTHER",
] as const;
export const RECOMMENDATION_RELATION_LABELS: Record<(typeof RECOMMENDATION_RELATIONS)[number], string> = {
  MANAGER: "Manager",
  COLLEAGUE: "Collègue",
  CLIENT: "Client",
  PARTNER: "Partenaire",
  MENTOR: "Mentor",
  OTHER: "Autre",
};

export const submitRecommendationSchema = z.object({
  content: z.string().trim().min(40, "Écrivez au moins quelques phrases (40 caractères)").max(2000),
  authorTitle: z.preprocess(blankToUndefined, z.string().trim().max(120).optional()),
  relation: z.preprocess(blankToUndefined, z.enum(RECOMMENDATION_RELATIONS).optional()),
  rating: z.preprocess(
    (v) => (v === "" || v === null || v === 0 ? undefined : v),
    z.coerce.number().int().min(1, "Note entre 1 et 5").max(5, "Note entre 1 et 5").optional(),
  ),
  keywords: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
});

export type RequestRecommendationInput = z.infer<typeof requestRecommendationSchema>;
export type SubmitRecommendationInput = z.infer<typeof submitRecommendationSchema>;
