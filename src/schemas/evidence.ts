import { z } from "zod";
import {
  EVIDENCE_VISIBILITIES,
  FILE_EVIDENCE_TYPES,
  USER_EVIDENCE_TYPES,
  type EvidenceType,
} from "@/types/evidence";

const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optionalText = (max: number) => z.preprocess(blankToUndefined, z.string().trim().max(max).optional());
const month = z.preprocess(
  blankToUndefined,
  z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Date invalide")
    .optional(),
);
const labels = (maxItems: number) =>
  z
    .array(z.string().trim().min(1).max(60))
    .max(maxItems)
    .default([])
    .transform((list) => [...new Map(list.map((v) => [v.toLowerCase(), v])).values()]);

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_EVIDENCE_FILES = 5;

/** Allowed uploads with the magic bytes that prove the content matches the declared type. */
export const ALLOWED_UPLOADS = {
  "application/pdf": { ext: "pdf", magic: [0x25, 0x50, 0x44, 0x46] },
  "image/png": { ext: "png", magic: [0x89, 0x50, 0x4e, 0x47] },
  "image/jpeg": { ext: "jpg", magic: [0xff, 0xd8, 0xff] },
  "image/webp": { ext: "webp", magic: [0x52, 0x49, 0x46, 0x46] },
} as const;

const evidenceFields = z.object({
  /** The first one is the main skill (the one counted in skill statistics). */
  talentSkillIds: z.array(z.string().trim().min(1)).min(1, "Choisissez au moins une compétence").max(10),
  projectId: z.preprocess(blankToUndefined, z.string().trim().min(1).optional()),
  type: z.enum(USER_EVIDENCE_TYPES),
  title: z.string().trim().min(2, "Titre trop court").max(100, "100 caractères maximum"),
  description: optionalText(500),
  url: z.preprocess(blankToUndefined, z.string().trim().url("URL invalide").max(300).optional()),
  organization: optionalText(120),
  role: optionalText(120),
  startDate: month,
  endDate: month,
  technologies: labels(30),
  tags: labels(15),
  category: optionalText(80),
  visibility: z.enum(EVIDENCE_VISIBILITIES).default("PUBLIC"),
  allowContact: z.boolean().default(true),
  allowRecommendations: z.boolean().default(false),
  /** false saves a draft: only the title, type and a skill are then required. */
  publish: z.boolean().default(true),
});

type EvidenceFields = z.infer<typeof evidenceFields>;

function checkRules(v: EvidenceFields, ctx: z.RefinementCtx) {
  const need = (path: string, ok: unknown, message: string) =>
    ok || ctx.addIssue({ code: "custom", path: [path], message });
  if (v.startDate && v.endDate && v.endDate < v.startDate) {
    ctx.addIssue({ code: "custom", path: ["endDate"], message: "La fin précède le début" });
  }
  if (!v.publish) return;
  need("description", v.description, "Décrivez votre preuve");
  need("technologies", v.technologies.length > 0, "Ajoutez au moins une technologie");
  if (v.type === "PROJECT") need("role", v.role, "Indiquez votre rôle");
}

export const createEvidenceSchema = evidenceFields.superRefine(checkRules);
/** Editing: same fields, plus the ids of the stored files to keep (the others are removed). */
export const updateEvidenceSchema = evidenceFields
  .extend({ keepFileIds: z.array(z.string().trim().min(1)).max(5).default([]) })
  .superRefine(checkRules);

export type CreateEvidenceInput = z.infer<typeof createEvidenceSchema>;
export type UpdateEvidenceInput = z.infer<typeof updateEvidenceSchema>;
/** What the wizard sends (before defaults are applied); `keepFileIds` only matters when editing. */
export type CreateEvidenceValues = z.input<typeof updateEvidenceSchema>;

export const listEvidenceQuerySchema = z.object({
  skillId: z.preprocess(blankToUndefined, z.string().trim().optional()),
});

/** Whether a published evidence of this type needs an uploaded file. */
export const requiresFile = (type: EvidenceType) => FILE_EVIDENCE_TYPES.includes(type);
