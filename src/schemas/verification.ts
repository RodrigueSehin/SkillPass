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

export const requestRecommendationSchema = z.object({
  authorName: z.string().trim().min(2, "Nom trop court").max(100),
  authorEmail: z.preprocess(blankToUndefined, z.string().trim().email("E-mail invalide").max(200).optional()),
  talentSkillId: z.preprocess(blankToUndefined, z.string().trim().min(1).optional()),
});

export const submitRecommendationSchema = z.object({
  content: z.string().trim().min(40, "Écrivez au moins quelques phrases (40 caractères)").max(2000),
  authorTitle: z.preprocess(blankToUndefined, z.string().trim().max(120).optional()),
});

export type RequestRecommendationInput = z.infer<typeof requestRecommendationSchema>;
export type SubmitRecommendationInput = z.infer<typeof submitRecommendationSchema>;
