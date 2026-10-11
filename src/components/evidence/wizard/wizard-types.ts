import { ALLOWED_UPLOADS, MAX_EVIDENCE_FILES, MAX_UPLOAD_BYTES, requiresFile } from "@/schemas/evidence";
import type { EvidenceVisibility, UserEvidenceType } from "@/types/evidence";

export interface WizardFile {
  id: string;
  file: File;
  /** Object URL for image previews, null for documents. */
  preview: string | null;
}

export interface WizardState {
  type: UserEvidenceType;
  title: string;
  description: string;
  organization: string;
  startDate: string;
  endDate: string;
  role: string;
  url: string;
  visibility: EvidenceVisibility;
  technologies: string[];
  skillIds: string[];
  files: WizardFile[];
  tags: string[];
  category: string;
  allowContact: boolean;
  allowRecommendations: boolean;
}

export type Patch = (values: Partial<WizardState>) => void;
export type StepErrors = Record<string, string>;

export const STEPS = [
  { title: "Informations générales", hint: "Projet, rôle, contexte" },
  { title: "Technologies & compétences", hint: "Associez vos compétences" },
  { title: "Preuve", hint: "Ajoutez vos fichiers et liens" },
  { title: "Publication", hint: "Vérifiez et publiez" },
] as const;

const isUrl = (value: string) => {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

export function validateFile(file: File): string | undefined {
  if (!(file.type in ALLOWED_UPLOADS)) return `« ${file.name} » : format non accepté (PNG, JPG, PDF ou WebP).`;
  if (file.size > MAX_UPLOAD_BYTES) return `« ${file.name} » : fichier trop volumineux (5 Mo maximum).`;
  if (file.size === 0) return `« ${file.name} » : le fichier est vide.`;
  return undefined;
}

/** Client-side checks mirroring createEvidenceSchema, so each step can point at what is missing. */
export function validateStep(step: number, v: WizardState): StepErrors {
  const errors: StepErrors = {};
  if (step === 0) {
    if (v.title.trim().length < 2) errors.title = "Donnez un titre à votre preuve";
    if (!v.description.trim()) errors.description = "Décrivez votre preuve";
    if (v.type === "PROJECT" && !v.role.trim()) errors.role = "Indiquez votre rôle";
    if (v.url.trim() && !isUrl(v.url.trim())) errors.url = "URL invalide (https://…)";
    if (v.startDate && v.endDate && v.endDate < v.startDate) errors.endDate = "La fin précède le début";
  }
  if (step === 1) {
    if (v.technologies.length === 0) errors.technologies = "Ajoutez au moins une technologie";
    if (v.skillIds.length === 0) errors.skills = "Choisissez au moins une compétence";
  }
  if (step === 2) {
    if (v.files.length > MAX_EVIDENCE_FILES) errors.files = `${MAX_EVIDENCE_FILES} fichiers maximum`;
    else if (requiresFile(v.type) && v.files.length === 0) {
      errors.files = "Ajoutez au moins un fichier pour ce type de preuve";
    } else if (v.type === "SCREENSHOT" && v.files.some((f) => !f.file.type.startsWith("image/"))) {
      errors.files = "Une capture d'écran doit être une image";
    }
  }
  return errors;
}

/** What a draft needs: nothing more than the schema's hard requirements. */
export function validateDraft(v: WizardState): { step: number; errors: StepErrors } | null {
  if (v.title.trim().length < 2) return { step: 0, errors: { title: "Donnez au moins un titre pour enregistrer un brouillon" } };
  if (v.skillIds.length === 0) return { step: 1, errors: { skills: "Choisissez au moins une compétence" } };
  return null;
}
