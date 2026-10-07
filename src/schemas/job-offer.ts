import { z } from "zod";
import {
  APPLICATION_MODES,
  AVAILABILITIES,
  CURRENCIES,
  JOB_CHANNELS,
  JOB_CONTRACTS,
  JOB_WORK_MODES,
  MOBILITIES,
  VISIBILITIES,
} from "@/types/job-offer";

const blank = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optionalText = (max: number) => z.preprocess(blank, z.string().trim().max(max).optional());
const optionalDay = z.preprocess(
  blank,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide")
    .optional(),
);
const optionalMoney = z.preprocess(
  (v) => (v === "" || v === null ? undefined : v),
  z.coerce.number().int("Montant entier").min(0).max(1_000_000_000).optional(),
);
const tags = (max: number) => z.array(z.string().trim().min(1).max(60)).max(max).default([]);

/** What is stored: lenient, so a draft can be saved half-written. */
export const jobOfferSchema = z
  .object({
    title: z.string().trim().min(3, "Le titre du poste est requis (3 caractères minimum)").max(100),
    description: z.string().trim().max(2000, "Description trop longue (2000 caractères)").default(""),
    contract: z.enum(JOB_CONTRACTS).default("CDI"),
    location: z.string().trim().max(120).default(""),
    workMode: z.preprocess(blank, z.enum(JOB_WORK_MODES).optional()),
    departmentId: z.preprocess(blank, z.string().trim().min(1).max(64).optional()),
    experience: z.string().trim().max(40).default("1 à 3 ans"),
    positions: z.coerce.number().int().min(1, "Au moins 1 poste").max(500).default(1),
    deadline: optionalDay,
    salaryMin: optionalMoney,
    salaryMax: optionalMoney,
    currency: z.enum(CURRENCIES).default("FCFA"),
    skills: tags(30),
    softSkills: tags(20),
    certifications: tags(20),
    education: optionalText(60),
    languages: tags(8),
    otherLanguage: optionalText(60),
    permit: optionalText(40),
    mobility: z.enum(MOBILITIES).default("NONE"),
    availability: z.enum(AVAILABILITIES).default("ASAP"),
    visibility: z.enum(VISIBILITIES).default("PUBLIC"),
    publishOn: optionalDay,
    durationMonths: z.coerce.number().int().min(1).max(12).default(2),
    channels: z.array(z.enum(JOB_CHANNELS)).max(4).default(["PLATFORM"]),
    applicationMode: z.enum(APPLICATION_MODES).default("SIMPLE"),
  })
  .refine((v) => v.salaryMin === undefined || v.salaryMax === undefined || v.salaryMin <= v.salaryMax, {
    message: "Le minimum du salaire dépasse le maximum",
    path: ["salaryMax"],
  });

/** What publishing needs on top: an offer nobody can read or apply to is not published. */
export const publishableJobOfferSchema = jobOfferSchema.superRefine((v, ctx) => {
  const need = (path: string, ok: unknown, message: string) =>
    ok || ctx.addIssue({ code: "custom", path: [path], message });
  need(
    "description",
    v.description.length >= 20,
    "Décrivez le poste avant de publier (20 caractères minimum)",
  );
  need("location", v.location, "La localisation est requise pour publier");
  need("departmentId", v.departmentId, "Choisissez le service ou département");
  need("skills", v.skills.length > 0, "Ajoutez au moins une compétence technique");
  need("channels", v.channels.length > 0, "Choisissez au moins un canal de diffusion");
  need("deadline", v.deadline, "La date limite de candidature est requise pour publier");
});

export type JobOfferFormInput = z.infer<typeof jobOfferSchema>;
