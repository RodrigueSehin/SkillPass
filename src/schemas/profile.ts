import { z } from "zod";
import { AVAILABILITIES } from "@/types/profile";

/** Usernames that would shadow an application route. */
export const RESERVED_USERNAMES = [
  "admin",
  "api",
  "auth",
  "about",
  "academy",
  "business",
  "dashboard",
  "forgot-password",
  "help",
  "jobs",
  "login",
  "pricing",
  "register",
  "resources",
  "settings",
  "verify",
  "verify-email",
];

const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optionalText = (max: number) => z.preprocess(blankToUndefined, z.string().trim().max(max).optional());

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Nom trop court").max(100),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "3 caractères minimum")
    .max(40)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lettres minuscules, chiffres et tirets uniquement")
    .refine((u) => !RESERVED_USERNAMES.includes(u), "Ce nom d'utilisateur est réservé"),
  headline: optionalText(160),
  profession: optionalText(100),
  location: optionalText(100),
  bio: optionalText(1500),
  careerGoal: optionalText(500),
  yearsOfExperience: z.coerce.number().int().min(0).max(60),
  availability: z.enum(AVAILABILITIES),
  isPublic: z.boolean(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
