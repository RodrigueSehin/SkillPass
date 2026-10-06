import { z } from "zod";
import { OPPORTUNITY_KINDS, OPPORTUNITY_LEVELS, OPPORTUNITY_REGIONS } from "@/types/opportunity";

const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(blankToUndefined, z.enum(values).optional());

export const createJobAlertSchema = z
  .object({
    name: z.preprocess(blankToUndefined, z.string().trim().max(80).optional()),
    query: z.preprocess(blankToUndefined, z.string().trim().max(80).optional()),
    kind: optionalEnum(OPPORTUNITY_KINDS),
    region: optionalEnum(OPPORTUNITY_REGIONS),
    domain: z.preprocess(blankToUndefined, z.string().trim().max(60).optional()),
    level: optionalEnum(OPPORTUNITY_LEVELS),
  })
  .refine((v) => v.query || v.kind || v.region || v.domain || v.level, {
    message: "Choisissez au moins un critère pour votre alerte",
    path: ["query"],
  });

export const applyToOpportunitySchema = z.object({
  message: z.preprocess(
    blankToUndefined,
    z.string().trim().max(500, "Message trop long (500 caractères)").optional(),
  ),
});

export type CreateJobAlertInput = z.infer<typeof createJobAlertSchema>;
