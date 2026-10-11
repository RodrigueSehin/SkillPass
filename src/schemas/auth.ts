import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Adresse e-mail invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const forgotPasswordSchema = z.object({
  email: loginSchema.shape.email,
});

/** Registration wizard — one schema per step so each step validates independently. */
export const registerAccountSchema = z.object({
  fullName: z.string().trim().min(2, "Nom trop court").max(100),
  email: loginSchema.shape.email,
  password: z
    .string()
    .min(8, "8 caractères minimum")
    .regex(/[A-Z]/, "Une majuscule requise")
    .regex(/[0-9]/, "Un chiffre requis"),
});

export const AVAILABILITY_VALUES = ["IMMEDIATE", "ONE_MONTH", "THREE_MONTHS", "NOT_AVAILABLE"] as const;

export const registerProfileSchema = z.object({
  profession: z.string().trim().min(2, "Profession requise").max(100),
  location: z.string().trim().min(2, "Localisation requise").max(100),
  yearsOfExperience: z.coerce.number().int().min(0).max(60),
});

export const registerGoalsSchema = z.object({
  mainSkills: z.string().trim().min(2, "Indiquez au moins une compétence").max(300),
  careerGoal: z.string().trim().min(2, "Objectif requis").max(500),
  availability: z.enum(AVAILABILITY_VALUES),
});

export const registerSchema = registerAccountSchema.merge(registerProfileSchema).merge(registerGoalsSchema);

/** Company sign-up: the person who opens the account, then the organization. */
export const registerCompanySchema = registerAccountSchema.extend({
  organization: z.string().trim().min(2, "Nom de l'organisation trop court").max(120),
  industry: z.string().trim().max(80).optional(),
  size: z.string().trim().max(60).optional(),
  website: z
    .string()
    .trim()
    .max(200)
    .optional()
    .refine((v) => !v || /^https?:\/\/\S+\.\S+$/.test(v), "Adresse du site invalide (https://…)"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
/** Form values before Zod coercion (yearsOfExperience arrives as a string). */
export type RegisterFormValues = z.input<typeof registerSchema>;
