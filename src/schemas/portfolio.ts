import { z } from "zod";

/** Form inputs send "" for empty fields: normalize to undefined before validating. */
const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const optionalText = (max: number) => z.preprocess(blankToUndefined, z.string().trim().max(max).optional());
const optionalUrl = z.preprocess(blankToUndefined, z.string().trim().url("URL invalide").max(300).optional());
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (AAAA-MM-JJ)");
const optionalDate = z.preprocess(blankToUndefined, date.optional());

const endAfterStart = (v: { startDate?: string; endDate?: string }) =>
  !v.startDate || !v.endDate || v.endDate >= v.startDate;
const endAfterStartIssue = { message: "La date de fin précède la date de début", path: ["endDate"] };

export const createProjectSchema = z
  .object({
    name: z.string().trim().min(2, "Nom trop court").max(120),
    description: optionalText(2000),
    organization: optionalText(120),
    role: optionalText(120),
    startDate: optionalDate,
    endDate: optionalDate,
    repositoryUrl: optionalUrl,
    url: optionalUrl,
    domain: optionalText(60),
    teamSize: z.preprocess(
      blankToUndefined,
      z.coerce.number().int("Nombre entier").min(1, "Au moins 1").max(500, "Trop élevé").optional(),
    ),
    // Forms send "true" / "" for a checkbox.
    featured: z.preprocess((v) => v === true || v === "true", z.boolean()).default(false),
    skills: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  })
  .refine(endAfterStart, endAfterStartIssue);

export const updateProjectSchema = createProjectSchema;

export const CONTRACT_TYPES = [
  "CDI",
  "CDD",
  "INTERNSHIP",
  "FREELANCE",
  "APPRENTICESHIP",
  "ACADEMIC",
] as const;
export const CONTRACT_LABELS: Record<(typeof CONTRACT_TYPES)[number], string> = {
  CDI: "CDI",
  CDD: "CDD",
  INTERNSHIP: "Stage",
  FREELANCE: "Freelance",
  APPRENTICESHIP: "Alternance",
  ACADEMIC: "Projet académique",
};
export const WORK_MODES = ["ONSITE", "HYBRID", "REMOTE"] as const;
export const WORK_MODE_LABELS: Record<(typeof WORK_MODES)[number], string> = {
  ONSITE: "Sur site",
  HYBRID: "Hybride",
  REMOTE: "Télétravail",
};

export const createExperienceSchema = z
  .object({
    title: z.string().trim().min(2, "Intitulé trop court").max(120),
    company: z.string().trim().min(2, "Entreprise requise").max(120),
    location: optionalText(120),
    description: optionalText(2000),
    contractType: z.preprocess(blankToUndefined, z.enum(CONTRACT_TYPES).optional()),
    workMode: z.preprocess(blankToUndefined, z.enum(WORK_MODES).optional()),
    domain: optionalText(60),
    startDate: date,
    endDate: optionalDate,
    skills: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  })
  .refine(endAfterStart, endAfterStartIssue);

export const updateExperienceSchema = createExperienceSchema;

export const CERTIFICATION_LEVELS = ["FUNDAMENTAL", "ASSOCIATE", "PROFESSIONAL", "EXPERT"] as const;
export const CERTIFICATION_LEVEL_LABELS: Record<(typeof CERTIFICATION_LEVELS)[number], string> = {
  FUNDAMENTAL: "Fondamental",
  ASSOCIATE: "Associé",
  PROFESSIONAL: "Professionnel",
  EXPERT: "Expert",
};

export const createCertificationSchema = z
  .object({
    name: z.string().trim().min(2, "Nom trop court").max(160),
    issuer: z.string().trim().min(2, "Émetteur requis").max(120),
    issueDate: date,
    expirationDate: optionalDate,
    credentialId: optionalText(120),
    credentialUrl: optionalUrl,
    category: optionalText(60),
    level: z.preprocess(blankToUndefined, z.enum(CERTIFICATION_LEVELS).optional()),
    description: optionalText(500),
    /** Omitted by the quick edit dialog: the existing skills are then left untouched. */
    skills: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
  })
  .refine((v) => !v.expirationDate || v.expirationDate >= v.issueDate, {
    message: "L'expiration précède la date d'émission",
    path: ["expirationDate"],
  });

export const updateCertificationSchema = createCertificationSchema;

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;
export type CreateCertificationInput = z.infer<typeof createCertificationSchema>;
