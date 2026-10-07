/** Roles of a member inside an organization (SkillPass Business). */
export const ORG_ROLES = ["ADMIN", "MANAGER", "RECRUITER", "EVALUATOR", "VIEWER"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  RECRUITER: "Recruteur",
  EVALUATOR: "Évaluateur",
  VIEWER: "Lecture seule",
};

export const ORG_ROLE_DESCRIPTIONS: Record<OrgRole, string> = {
  ADMIN: "Accès complet à toutes les fonctionnalités",
  MANAGER: "Gère les équipes et les évaluations",
  RECRUITER: "Peut publier des offres et consulter les talents",
  EVALUATOR: "Peut créer et gérer des évaluations",
  VIEWER: "Accès en consultation uniquement",
};

export const MEMBER_STATUSES = ["ACTIVE", "INACTIVE", "INVITED"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];
export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  INVITED: "Invité",
};

export const DEPARTMENT_STATUSES = ["DRAFT", "ACTIVE"] as const;
export type DepartmentStatus = (typeof DEPARTMENT_STATUSES)[number];
export const DEPARTMENT_STATUS_LABELS: Record<DepartmentStatus, string> = {
  DRAFT: "Brouillon",
  ACTIVE: "Actif",
};

/** How far a department's people can see talents and evaluations. */
export const ACCESS_LEVELS = ["LIMITED", "EXTENDED", "FULL"] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];
export const ACCESS_LEVEL_LABELS: Record<
  AccessLevel,
  { title: string; description: string; summary: string }
> = {
  LIMITED: {
    title: "Accès limité",
    description: "Uniquement les membres du département",
    summary: "Accès limité (uniquement les membres du département)",
  },
  EXTENDED: {
    title: "Accès étendu",
    description: "Membres + départements enfants",
    summary: "Accès étendu (membres et départements enfants)",
  },
  FULL: {
    title: "Accès complet",
    description: "Toute l'organisation",
    summary: "Accès complet (toute l'organisation)",
  },
};

/** Icon and colour a department is drawn with. */
export const DEPARTMENT_LOOKS = [
  "users",
  "settings",
  "truck",
  "chart",
  "monitor",
  "coins",
  "megaphone",
] as const;
export type DepartmentLook = (typeof DEPARTMENT_LOOKS)[number];

export const PLAN_CODES = ["STARTER", "PRO", "BUSINESS", "ENTERPRISE"] as const;
export type PlanCode = (typeof PLAN_CODES)[number];

export const ORG_SIZES = [
  "1 - 10 employés",
  "11 - 50 employés",
  "51 - 200 employés",
  "201 - 500 employés",
  "501 - 1 000 employés",
  "Plus de 1 000 employés",
] as const;
export const ORG_INDUSTRIES = [
  "Logistique & Transport",
  "Banque & Finance",
  "Télécommunications",
  "Énergie",
  "Industrie",
  "Santé",
  "Éducation",
  "Commerce & Distribution",
  "Technologie & Numérique",
  "Conseil & Services",
  "Administration publique",
  "Autre",
] as const;

export interface OrganizationDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  industry: string | null;
  size: string | null;
  website: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  timezone: string;
  language: string;
  verified: boolean;
  plan: PlanCode;
  /** Changes with every new logo, so browsers do not keep showing the old one. Null when there is none. */
  logoVersion: string | null;
  createdAt: string;
}

export interface SiteDTO {
  id: string;
  name: string;
  address: string | null;
}

export interface DepartmentDeputy {
  memberId: string;
  /** "Adjoint principal" or "Adjoint". */
  level: "PRINCIPAL" | "DEPUTY";
}

export interface DepartmentMembership {
  memberId: string;
  /** Free label shown in the wizard ("Membre"). */
  role: string;
}

export interface DepartmentDTO {
  id: string;
  name: string;
  description: string | null;
  look: DepartmentLook;
  parentId: string | null;
  mainSiteId: string | null;
  siteIds: string[];
  objectives: string[];
  status: DepartmentStatus;
  accessLevel: AccessLevel;
  headId: string | null;
  deputies: DepartmentDeputy[];
  replacementId: string | null;
  members: DepartmentMembership[];
}

export interface MemberTeam {
  departmentId: string;
  primary: boolean;
}

export interface MemberDTO {
  id: string;
  /** Null until the invitation is accepted. */
  profileId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  role: OrgRole;
  /** The permissions ticked in the wizard; an administrator always has all of them. */
  permissions: string[];
  status: MemberStatus;
  siteId: string | null;
  managerId: string | null;
  teams: MemberTeam[];
  invitationMessage: string | null;
  invitedAt: string | null;
  inviteExpiresAt: string | null;
  lastActiveAt: string | null;
  createdAt: string;
}

/** The member row with its invitation secret: only ever read by the invited person or an administrator. */
export type MemberInvite = MemberDTO & { inviteToken: string | null };

export const memberName = (m: Pick<MemberDTO, "firstName" | "lastName">) =>
  `${m.firstName} ${m.lastName}`.trim();
export const memberInitials = (m: Pick<MemberDTO, "firstName" | "lastName">) =>
  `${m.firstName[0] ?? ""}${m.lastName[0] ?? ""}`.toUpperCase();
