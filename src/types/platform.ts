import type { MemberDTO, OrganizationDTO } from "./business";
import type { UserRole } from "./profile";

/** One company in the administrator's list. */
export interface OrgAdminRow {
  organization: OrganizationDTO;
  memberCount: number;
  offerCount: number;
  /** The person who opened the account (its first administrator). */
  contactName: string | null;
  contactEmail: string | null;
}

export interface OrgAdminDetail extends OrgAdminRow {
  members: MemberDTO[];
  offers: { id: string; title: string; status: string; createdAt: string }[];
}

export interface ProfileAdminRow {
  id: string;
  email: string;
  fullName: string;
  username: string;
  role: UserRole;
  isPublic: boolean;
  createdAt: string;
  /** The organization the person belongs to, if any. */
  organization: { id: string; name: string; role: string } | null;
}

export interface PlatformStats {
  profiles: number;
  publicTalents: number;
  byRole: Partial<Record<UserRole, number>>;
  organizations: { pending: number; verified: number; rejected: number; suspended: number };
  offers: { published: number; total: number };
  evaluations: number;
  attempts: number;
  applications: number;
  savedMatches: number;
  /** New accounts over the last 30 days. */
  newTalents30d: number;
  newOrganizations30d: number;
}

export const AUDIT_ACTIONS = [
  "ORG_VERIFIED",
  "ORG_REJECTED",
  "ORG_REOPENED",
  "ORG_SUSPENDED",
  "ORG_REACTIVATED",
  "ORG_PLAN",
  "ORG_MAINTENANCE",
  "MEMBER_ACCESS",
  "ROLE_CHANGED",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_LABELS: Record<AuditAction, string> = {
  ORG_VERIFIED: "Entreprise validée",
  ORG_REJECTED: "Entreprise refusée",
  ORG_REOPENED: "Demande rouverte",
  ORG_SUSPENDED: "Entreprise suspendue",
  ORG_REACTIVATED: "Entreprise réactivée",
  ORG_PLAN: "Plan modifié",
  ORG_MAINTENANCE: "Mode maintenance",
  MEMBER_ACCESS: "Accès d'un membre modifié",
  ROLE_CHANGED: "Rôle modifié",
};

export interface AuditEntryDTO {
  id: string;
  actorId: string | null;
  actorName: string;
  action: AuditAction;
  targetType: "ORGANIZATION" | "PROFILE";
  targetId: string | null;
  targetLabel: string;
  detail: string;
  createdAt: string;
}

export type AuditEntryInput = Omit<AuditEntryDTO, "id" | "createdAt">;
