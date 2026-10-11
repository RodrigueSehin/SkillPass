import { planAllowsPermission } from "@/lib/plans/entitlements";
import type { MemberDTO, OrgRole, PlanCode } from "@/types/business";

export interface PermissionDef {
  key: string;
  label: string;
}

export interface PermissionGroup {
  key: string;
  title: string;
  description: string;
  permissions: PermissionDef[];
}

/** Every permission a member can hold, grouped the way the "Ajouter un membre" wizard shows them. */
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: "talents",
    title: "Gestion des talents",
    description: "Accès aux profils, recherche et suivi des talents",
    permissions: [
      { key: "talents.view", label: "Consulter les profils de talents" },
      { key: "talents.export", label: "Exporter les profils" },
      { key: "talents.shortlist", label: "Ajouter des talents à une shortlist" },
      { key: "talents.recommendations", label: "Accéder aux recommandations IA" },
    ],
  },
  {
    key: "jobs",
    title: "Offres d'emploi",
    description: "Gestion des offres et du processus de recrutement",
    permissions: [
      { key: "jobs.create", label: "Créer et publier des offres" },
      { key: "jobs.applications", label: "Consulter les candidatures" },
      { key: "jobs.edit", label: "Modifier les offres de son équipe" },
      { key: "jobs.delete", label: "Supprimer des offres" },
    ],
  },
  {
    key: "evaluations",
    title: "Évaluations",
    description: "Création et gestion des évaluations de compétences",
    permissions: [
      { key: "evaluations.create", label: "Créer des évaluations" },
      { key: "evaluations.results", label: "Consulter les résultats" },
      { key: "evaluations.edit", label: "Modifier les évaluations" },
      { key: "evaluations.delete", label: "Supprimer des évaluations" },
    ],
  },
  {
    key: "administration",
    title: "Administration",
    description: "Équipes, analytics et paramètres de l'organisation",
    permissions: [
      { key: "team.manage", label: "Administrer les équipes et les membres" },
      { key: "analytics.view", label: "Accéder aux analytics et rapports" },
      { key: "org.manage", label: "Gérer les paramètres de l'organisation" },
    ],
  },
];

/** The permissions an organization's plan lets it use: the others are not offered at all. */
export function permissionGroupsFor(plan: PlanCode): PermissionGroup[] {
  return PERMISSION_GROUPS.map((g) => ({
    ...g,
    permissions: g.permissions.filter((p) => planAllowsPermission(plan, p.key)),
  })).filter((g) => g.permissions.length > 0);
}

export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key));
export const PERMISSION_LABELS: Record<string, string> = Object.fromEntries(
  PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => [p.key, p.label])),
);

/** What each role is given when it is picked; the wizard lets the inviter adjust it afterwards. */
export const ROLE_PRESETS: Record<OrgRole, string[]> = {
  ADMIN: ALL_PERMISSIONS.filter((p) => p !== "jobs.delete" && p !== "evaluations.delete"),
  MANAGER: [
    "talents.view",
    "talents.export",
    "talents.shortlist",
    "jobs.applications",
    "evaluations.create",
    "evaluations.edit",
    "evaluations.results",
    "team.manage",
    "analytics.view",
  ],
  RECRUITER: [
    "talents.view",
    "talents.export",
    "talents.shortlist",
    "talents.recommendations",
    "jobs.create",
    "jobs.applications",
    "jobs.edit",
    "evaluations.results",
  ],
  EVALUATOR: [
    "talents.view",
    "evaluations.create",
    "evaluations.edit",
    "evaluations.results",
    "evaluations.delete",
  ],
  VIEWER: ["talents.view", "jobs.applications", "evaluations.results"],
};

/** What a role generally includes, as summarised in the wizard. */
export const ROLE_SUMMARIES: Record<OrgRole, string[]> = {
  ADMIN: [
    "Gestion des talents et des offres",
    "Création et gestion des évaluations",
    "Administration des équipes",
    "Accès aux analytics et rapports",
    "Gestion des paramètres de l'organisation",
  ],
  MANAGER: [
    "Consultation des talents",
    "Création et suivi des évaluations",
    "Administration des équipes",
    "Accès aux analytics et rapports",
  ],
  RECRUITER: [
    "Consultation et shortlist des talents",
    "Publication et suivi des offres",
    "Lecture des résultats d'évaluation",
  ],
  EVALUATOR: ["Consultation des talents", "Création et gestion des évaluations", "Lecture des résultats"],
  VIEWER: ["Consultation des talents", "Lecture des candidatures", "Lecture des résultats"],
};

type Actor = Pick<MemberDTO, "role" | "permissions" | "status">;

/** An administrator can do everything; anyone else needs the permission ticked, and an active account. */
export function can(actor: Actor | null | undefined, permission: string) {
  if (!actor || actor.status !== "ACTIVE") return false;
  return actor.role === "ADMIN" || actor.permissions.includes(permission);
}

/** Keeps only permissions that exist, so a tampered form cannot grant an invented one. */
export const sanitizePermissions = (keys: readonly string[]) =>
  ALL_PERMISSIONS.filter((p) => keys.includes(p));

/** Short list shown as "Permissions clés": one entry per group the member can use. */
export function keyPermissionGroups(permissions: readonly string[]) {
  return PERMISSION_GROUPS.filter((g) => g.permissions.some((p) => permissions.includes(p.key)));
}
