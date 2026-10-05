import { Award, Briefcase, FolderKanban, type LucideIcon } from "lucide-react";
import type { ZodType } from "zod";
import {
  addCertificationAction,
  deleteCertificationAction,
  updateCertificationAction,
} from "@/app/dashboard/certifications/actions";
import {
  addExperienceAction,
  deleteExperienceAction,
  updateExperienceAction,
} from "@/app/dashboard/experiences/actions";
import { addProjectAction, deleteProjectAction, updateProjectAction } from "@/app/dashboard/projects/actions";
import type { ActionResult } from "@/lib/actions/run";
import {
  CONTRACT_LABELS,
  CONTRACT_TYPES,
  WORK_MODES,
  WORK_MODE_LABELS,
  createCertificationSchema,
  createExperienceSchema,
  createProjectSchema,
} from "@/schemas/portfolio";

export type FieldType = "text" | "textarea" | "date" | "url" | "multiselect" | "select";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  /** For "select": [value, label] pairs. */
  options?: readonly (readonly [string, string])[];
}

export interface ResourceConfig {
  singular: string;
  addLabel: string;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  fields: FieldDef[];
  schema: ZodType;
  add: (values: unknown) => Promise<ActionResult>;
  update: (id: string, values: unknown) => Promise<ActionResult>;
  remove: (id: string) => Promise<ActionResult>;
}

export type ResourceKey = "project" | "experience" | "certification";

export const RESOURCE_CONFIGS: Record<ResourceKey, ResourceConfig> = {
  project: {
    singular: "projet",
    addLabel: "Ajouter un projet",
    icon: FolderKanban,
    emptyTitle: "Aucun projet pour l'instant",
    emptyDescription:
      "Les projets sont vos meilleures preuves : reliez-les aux compétences qu'ils démontrent.",
    fields: [
      { name: "name", label: "Nom du projet", type: "text", required: true },
      { name: "organization", label: "Client / Organisation", type: "text" },
      { name: "role", label: "Rôle", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "startDate", label: "Date de début", type: "date" },
      { name: "endDate", label: "Date de fin", type: "date" },
      { name: "repositoryUrl", label: "Dépôt (GitHub…)", type: "url", placeholder: "https://github.com/…" },
      { name: "url", label: "URL du projet", type: "url", placeholder: "https://…" },
      { name: "skills", label: "Compétences démontrées", type: "multiselect" },
    ],
    schema: createProjectSchema,
    add: addProjectAction,
    update: updateProjectAction,
    remove: deleteProjectAction,
  },
  experience: {
    singular: "expérience",
    addLabel: "Ajouter une expérience",
    icon: Briefcase,
    emptyTitle: "Aucune expérience pour l'instant",
    emptyDescription: "Ajoutez vos postes pour appuyer vos années d'expérience.",
    fields: [
      { name: "title", label: "Intitulé du poste", type: "text", required: true },
      { name: "company", label: "Entreprise", type: "text", required: true },
      { name: "location", label: "Lieu (ville, pays)", type: "text", placeholder: "Abidjan, Côte d'Ivoire" },
      { name: "startDate", label: "Date de début", type: "date", required: true },
      { name: "endDate", label: "Date de fin (vide = en cours)", type: "date" },
      { name: "description", label: "Description", type: "textarea" },
      {
        name: "contractType",
        label: "Type de contrat",
        type: "select",
        options: CONTRACT_TYPES.map((v) => [v, CONTRACT_LABELS[v]] as const),
      },
      {
        name: "workMode",
        label: "Mode de travail",
        type: "select",
        options: WORK_MODES.map((v) => [v, WORK_MODE_LABELS[v]] as const),
      },
      { name: "domain", label: "Domaine", type: "text", placeholder: "Tech & Digital, Gestion & Business…" },
      { name: "skills", label: "Compétences mobilisées", type: "multiselect" },
    ],
    schema: createExperienceSchema,
    add: addExperienceAction,
    update: updateExperienceAction,
    remove: deleteExperienceAction,
  },
  certification: {
    singular: "certification",
    addLabel: "Ajouter une certification",
    icon: Award,
    emptyTitle: "Aucune certification pour l'instant",
    emptyDescription:
      "Ajoutez vos certifications : elles pèsent dans votre SkillPass Score une fois vérifiées.",
    fields: [
      { name: "name", label: "Nom de la certification", type: "text", required: true },
      { name: "issuer", label: "Émetteur", type: "text", required: true },
      { name: "issueDate", label: "Date d'émission", type: "date", required: true },
      { name: "expirationDate", label: "Date d'expiration", type: "date" },
      { name: "credentialId", label: "Credential ID", type: "text" },
      { name: "credentialUrl", label: "URL de la credential", type: "url", placeholder: "https://…" },
    ],
    schema: createCertificationSchema,
    add: addCertificationAction,
    update: updateCertificationAction,
    remove: deleteCertificationAction,
  },
};
