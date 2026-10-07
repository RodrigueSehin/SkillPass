import { z } from "zod";
import { ACCESS_LEVELS, DEPARTMENT_LOOKS, DEPARTMENT_STATUSES, ORG_ROLES } from "@/types/business";

const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optionalText = (max: number) => z.preprocess(blankToUndefined, z.string().trim().max(max).optional());
const optionalUrl = z.preprocess(blankToUndefined, z.string().trim().url("URL invalide").max(300).optional());
const optionalId = z.preprocess(blankToUndefined, z.string().trim().min(1).max(64).optional());

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(120),
  industry: optionalText(80),
  size: optionalText(60),
  website: optionalUrl,
});

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(120),
  description: optionalText(500),
  industry: optionalText(80),
  size: optionalText(60),
  website: optionalUrl,
  address: optionalText(200),
  phone: optionalText(40),
  email: z.preprocess(blankToUndefined, z.string().trim().email("E-mail invalide").max(200).optional()),
  timezone: z.preprocess(blankToUndefined, z.string().trim().max(60).optional()),
  language: z.preprocess(blankToUndefined, z.enum(["fr", "en"]).optional()),
});

export const siteSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(100),
  address: optionalText(200),
});

export const departmentSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(80),
  description: optionalText(500),
  look: z.enum(DEPARTMENT_LOOKS).default("users"),
  parentId: optionalId,
  mainSiteId: optionalId,
  siteIds: z.array(z.string().trim().min(1)).max(20).default([]),
  objectives: z.array(z.string().trim().min(1, "Objectif vide").max(100)).max(10).default([]),
  status: z.enum(DEPARTMENT_STATUSES).default("ACTIVE"),
  accessLevel: z.enum(ACCESS_LEVELS).default("LIMITED"),
  headId: optionalId,
  deputies: z
    .array(z.object({ memberId: z.string().min(1), level: z.enum(["PRINCIPAL", "DEPUTY"]) }))
    .max(10)
    .default([]),
  replacementId: optionalId,
  members: z
    .array(
      z.object({ memberId: z.string().min(1), role: z.string().trim().min(1).max(40).default("Membre") }),
    )
    .max(500)
    .default([]),
});

export const inviteMemberSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis").max(60),
  lastName: z.string().trim().min(1, "Nom requis").max(60),
  email: z.string().trim().email("E-mail invalide").max(200),
  phone: optionalText(40),
  jobTitle: z.string().trim().min(2, "Fonction requise").max(100),
  invitationMessage: optionalText(500),
  role: z.enum(ORG_ROLES),
  permissions: z.array(z.string()).max(60).default([]),
  primaryTeamId: z.string().trim().min(1, "Choisissez l'équipe principale"),
  secondaryTeamIds: z.array(z.string().trim().min(1)).max(20).default([]),
  managerId: optionalId,
  siteId: optionalId,
});

export const updateMemberSchema = z.object({
  role: z.enum(ORG_ROLES).optional(),
  permissions: z.array(z.string()).max(60).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  jobTitle: optionalText(100),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type SiteInput = z.infer<typeof siteSchema>;
export type DepartmentFormInput = z.infer<typeof departmentSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
