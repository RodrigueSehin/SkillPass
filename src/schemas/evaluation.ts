import { z } from "zod";
import {
  ATTEMPT_LIMITS,
  DEFAULT_SETTINGS,
  EVALUATION_LANGUAGES,
  EVALUATION_TYPES,
  QUESTION_DIFFICULTIES,
  QUESTION_TYPES,
  SHOW_SCORE_OPTIONS,
  TRUE_FALSE_OPTIONS,
  WEIGHTINGS,
  isChoice,
} from "@/types/evaluation";
import { SKILL_LEVELS } from "@/types/skill";

const blank = (v: unknown) => (v === null || (typeof v === "string" && v.trim() === "") ? undefined : v);
const nullableLocal = z
  .preprocess(
    blank,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Date et heure invalides")
      .optional(),
  )
  .transform((v) => v ?? null);

export const questionSchema = z
  .object({
    id: z.string().trim().min(1).max(64),
    type: z.enum(QUESTION_TYPES),
    prompt: z
      .string()
      .trim()
      .min(3, "Écrivez la question (3 caractères minimum)")
      .max(500, "Question trop longue"),
    options: z.array(z.string().trim().max(200)).max(6).default([]),
    correct: z.array(z.number().int().min(0).max(5)).max(6).default([]),
    difficulty: z.enum(QUESTION_DIFFICULTIES).default("MEDIUM"),
    points: z.coerce.number().int().min(1, "Au moins 1 point").max(20).default(1),
  })
  .transform((q) => {
    if (q.type === "TRUE_FALSE")
      return { ...q, options: [...TRUE_FALSE_OPTIONS], correct: q.correct.slice(0, 1) };
    if (!isChoice(q.type)) return { ...q, options: [], correct: [] };
    return q;
  })
  .superRefine((q, ctx) => {
    const issue = (message: string, path: string) => ctx.addIssue({ code: "custom", message, path: [path] });
    if (q.type === "TRUE_FALSE") {
      if (q.correct.length !== 1) issue("Indiquez si l'affirmation est vraie ou fausse", "correct");
      return;
    }
    if (!isChoice(q.type)) return;
    if (q.options.length < 2 || q.options.some((o) => o === ""))
      issue("Au moins 2 réponses, aucune vide", "options");
    if (new Set(q.options.map((o) => o.toLowerCase())).size !== q.options.length)
      issue("Deux réponses identiques", "options");
    if (q.correct.some((i) => i >= q.options.length)) issue("Bonne réponse invalide", "correct");
    if (q.type === "SINGLE" && q.correct.length !== 1) issue("Cochez la bonne réponse", "correct");
    if (q.type === "MULTIPLE" && q.correct.length < 1) issue("Cochez au moins une bonne réponse", "correct");
  });

export const settingsSchema = z
  .object({
    attempts: z.coerce
      .number()
      .refine((n) => (ATTEMPT_LIMITS as readonly number[]).includes(n), "Nombre de tentatives invalide")
      .default(DEFAULT_SETTINGS.attempts),
    display: z.enum(["ONE_BY_ONE", "ALL"]).default(DEFAULT_SETTINGS.display),
    navigation: z.enum(["FREE", "LINEAR"]).default(DEFAULT_SETTINGS.navigation),
    timePerQuestion: z
      .preprocess(
        (v) => (v === "" || v === null ? undefined : v),
        z.coerce.number().int().min(10).max(3600).optional(),
      )
      .transform((v) => v ?? null),
    devices: z
      .object({ computer: z.boolean(), tablet: z.boolean(), mobile: z.boolean() })
      .default(DEFAULT_SETTINGS.devices)
      .refine((d) => d.computer || d.tablet || d.mobile, "Autorisez au moins un type d'appareil"),
    passScore: z.coerce
      .number()
      .int()
      .min(1, "Score minimum 1 %")
      .max(100)
      .default(DEFAULT_SETTINGS.passScore),
    weighting: z.enum(WEIGHTINGS).default(DEFAULT_SETTINGS.weighting),
    showScore: z.enum(SHOW_SCORE_OPTIONS).default(DEFAULT_SETTINGS.showScore),
    shuffleQuestions: z.boolean().default(true),
    shuffleAnswers: z.boolean().default(true),
    fullscreen: z.boolean().default(true),
    limitCopyPaste: z.boolean().default(true),
    windowStart: nullableLocal,
    windowEnd: nullableLocal,
    certificate: z.boolean().default(true),
    badge: z.string().trim().max(80).default(""),
    shareWithOrg: z.boolean().default(true),
  })
  .refine((s) => (s.windowStart === null) === (s.windowEnd === null), {
    message: "Indiquez le début et la fin de la plage de passage",
    path: ["windowEnd"],
  })
  .refine((s) => s.windowStart === null || s.windowEnd === null || s.windowStart < s.windowEnd, {
    message: "La fin de la plage précède son début",
    path: ["windowEnd"],
  });

/** What is stored: lenient, so a draft can be saved half-written. */
export const evaluationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Le titre est requis (3 caractères minimum)")
    .max(100, "Titre trop long (100 caractères)"),
  description: z.string().trim().max(500, "Description trop longue (500 caractères)").default(""),
  skill: z.string().trim().max(60).default(""),
  type: z.enum(EVALUATION_TYPES).default("TECHNICAL"),
  difficulty: z.enum(SKILL_LEVELS).default("INTERMEDIATE"),
  durationMinutes: z.coerce.number().int().min(5).max(240).default(45),
  language: z.enum(EVALUATION_LANGUAGES).default("Français"),
  questions: z.array(questionSchema).max(100, "100 questions au maximum").default([]),
  settings: settingsSchema.default(() => settingsSchema.parse({})),
  publishAt: nullableLocal,
});

/** What publishing needs on top: a test nobody can take is not published. */
export const publishableEvaluationSchema = evaluationSchema.superRefine((v, ctx) => {
  const need = (path: string, ok: unknown, message: string) =>
    ok || ctx.addIssue({ code: "custom", path: [path], message });
  need("description", v.description.length >= 20, "Décrivez l'évaluation (20 caractères minimum)");
  need("skill", v.skill, "Choisissez la compétence principale");
  need("questions", v.questions.length > 0, "Ajoutez au moins une question");
});

export type EvaluationFormInput = z.infer<typeof evaluationSchema>;
