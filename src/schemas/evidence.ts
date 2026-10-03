import { z } from "zod";
import { FILE_EVIDENCE_TYPES, URL_EVIDENCE_TYPES, USER_EVIDENCE_TYPES } from "@/types/evidence";

const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Allowed uploads with the magic bytes that prove the content matches the declared type. */
export const ALLOWED_UPLOADS = {
  "application/pdf": { ext: "pdf", magic: [0x25, 0x50, 0x44, 0x46] },
  "image/png": { ext: "png", magic: [0x89, 0x50, 0x4e, 0x47] },
  "image/jpeg": { ext: "jpg", magic: [0xff, 0xd8, 0xff] },
  "image/webp": { ext: "webp", magic: [0x52, 0x49, 0x46, 0x46] },
} as const;

export const createEvidenceSchema = z
  .object({
    talentSkillId: z.string().trim().min(1, "Choisissez une compétence"),
    projectId: z.preprocess(blankToUndefined, z.string().trim().min(1).optional()),
    type: z.enum(USER_EVIDENCE_TYPES),
    title: z.string().trim().min(2, "Titre trop court").max(160),
    description: z.preprocess(blankToUndefined, z.string().trim().max(1000).optional()),
    url: z.preprocess(blankToUndefined, z.string().trim().url("URL invalide").max(300).optional()),
  })
  .superRefine((v, ctx) => {
    if (URL_EVIDENCE_TYPES.includes(v.type) && !v.url) {
      ctx.addIssue({ code: "custom", path: ["url"], message: "Une URL est requise pour ce type de preuve" });
    }
  });

export type CreateEvidenceInput = z.infer<typeof createEvidenceSchema>;

export const listEvidenceQuerySchema = z.object({
  skillId: z.preprocess(blankToUndefined, z.string().trim().optional()),
});

/** Whether this evidence type needs an uploaded file. */
export const requiresFile = (type: CreateEvidenceInput["type"]) => FILE_EVIDENCE_TYPES.includes(type);
