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
    skills: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  })
  .refine(endAfterStart, endAfterStartIssue);

export const updateProjectSchema = createProjectSchema;

export const createExperienceSchema = z
  .object({
    title: z.string().trim().min(2, "Intitulé trop court").max(120),
    company: z.string().trim().min(2, "Entreprise requise").max(120),
    location: optionalText(120),
    description: optionalText(2000),
    startDate: date,
    endDate: optionalDate,
  })
  .refine(endAfterStart, endAfterStartIssue);

export const updateExperienceSchema = createExperienceSchema;

export const createCertificationSchema = z
  .object({
    name: z.string().trim().min(2, "Nom trop court").max(160),
    issuer: z.string().trim().min(2, "Émetteur requis").max(120),
    issueDate: date,
    expirationDate: optionalDate,
    credentialId: optionalText(120),
    credentialUrl: optionalUrl,
  })
  .refine((v) => !v.expirationDate || v.expirationDate >= v.issueDate, {
    message: "L'expiration précède la date d'émission",
    path: ["expirationDate"],
  });

export const updateCertificationSchema = createCertificationSchema;

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;
export type CreateCertificationInput = z.infer<typeof createCertificationSchema>;
