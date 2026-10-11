import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type {
  MemberDTO,
  MemberStatus,
  OrgRole,
  OrganizationDTO,
  OrgVerificationStatus,
  PlanCode,
} from "@/types/business";
import { withDefaults } from "@/types/org-settings";
import type {
  AuditAction,
  AuditEntryDTO,
  AuditEntryInput,
  OrgAdminDetail,
  OrgAdminRow,
  PlatformStats,
  ProfileAdminRow,
} from "@/types/platform";
import type { UserRole } from "@/types/profile";
import { parseTalentPlan } from "@/lib/plans/entitlements";
import type { PlatformRepository } from "./platform.repository";

type OrgRow = Prisma.OrganizationGetPayload<object>;

const toOrg = (r: OrgRow): OrganizationDTO => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  description: r.description,
  industry: r.industry,
  size: r.size,
  website: r.website,
  address: r.address,
  phone: r.phone,
  email: r.email,
  timezone: r.timezone,
  language: r.language,
  verified: r.verificationStatus === "VERIFIED",
  verificationStatus: r.verificationStatus as OrgVerificationStatus,
  verificationNote: r.verificationNote,
  rejectionReason: r.rejectionReason,
  verifiedAt: r.verifiedAt?.toISOString() ?? null,
  plan: r.plan as PlanCode,
  logoVersion: null,
  settings: withDefaults(r.settings),
  deactivated: r.deactivatedAt !== null,
  createdAt: r.createdAt.toISOString(),
});

const iso = (d: Date | null) => d?.toISOString() ?? null;

const toMember = (r: Prisma.OrganizationMemberGetPayload<{ include: { departments: true } }>): MemberDTO => ({
  id: r.id,
  profileId: r.profileId,
  firstName: r.firstName,
  lastName: r.lastName,
  email: r.email,
  phone: r.phone,
  jobTitle: r.jobTitle,
  role: r.role as OrgRole,
  permissions: r.permissions,
  status: r.status as MemberStatus,
  siteId: r.siteId,
  managerId: r.managerId,
  teams: r.departments.map((d) => ({ departmentId: d.departmentId, primary: d.isPrimary })),
  invitationMessage: r.invitationMessage,
  invitedAt: iso(r.invitedAt),
  inviteExpiresAt: iso(r.inviteExpiresAt),
  lastActiveAt: iso(r.lastActiveAt),
  createdAt: r.createdAt.toISOString(),
});

const toAudit = (r: Prisma.AdminAuditLogGetPayload<object>): AuditEntryDTO => ({
  id: r.id,
  actorId: r.actorId,
  actorName: r.actorName,
  action: r.action as AuditAction,
  targetType: r.targetType as AuditEntryDTO["targetType"],
  targetId: r.targetId,
  targetLabel: r.targetLabel,
  detail: r.detail,
  createdAt: r.createdAt.toISOString(),
});

const profileInclude = {
  orgMemberships: { where: { status: "ACTIVE" }, include: { organization: true }, take: 1 },
} satisfies Prisma.ProfileInclude;

const toProfile = (r: Prisma.ProfileGetPayload<{ include: typeof profileInclude }>): ProfileAdminRow => {
  const membership = r.orgMemberships[0];
  return {
    id: r.id,
    email: r.email,
    fullName: r.fullName,
    username: r.username,
    role: r.role,
    plan: parseTalentPlan(r.plan),
    isPublic: r.isPublic,
    createdAt: r.createdAt.toISOString(),
    organization: membership
      ? { id: membership.organizationId, name: membership.organization.name, role: membership.role }
      : null,
  };
};

export class PrismaPlatformRepository implements PlatformRepository {
  async stats(since: string): Promise<PlatformStats> {
    const from = new Date(since);
    const [
      profiles,
      publicTalents,
      roles,
      orgStatus,
      suspended,
      offers,
      publishedOffers,
      evaluations,
      attempts,
      applications,
      saves,
      newTalents,
      newOrgs,
    ] = await Promise.all([
      prisma.profile.count(),
      prisma.profile.count({ where: { isPublic: true, role: "TALENT" } }),
      prisma.profile.groupBy({ by: ["role"], _count: { _all: true } }),
      prisma.organization.groupBy({ by: ["verificationStatus"], _count: { _all: true } }),
      prisma.organization.count({ where: { deactivatedAt: { not: null } } }),
      prisma.jobOffer.count(),
      prisma.jobOffer.count({ where: { status: "PUBLISHED" } }),
      prisma.evaluation.count(),
      prisma.evaluationAttempt.count(),
      prisma.application.count(),
      prisma.matchingSave.count(),
      prisma.profile.count({ where: { createdAt: { gte: from }, role: "TALENT" } }),
      prisma.organization.count({ where: { createdAt: { gte: from } } }),
    ]);
    const status = (s: string) => orgStatus.find((o) => o.verificationStatus === s)?._count._all ?? 0;
    return {
      profiles,
      publicTalents,
      byRole: Object.fromEntries(roles.map((r) => [r.role, r._count._all])),
      organizations: {
        pending: status("PENDING"),
        verified: status("VERIFIED"),
        rejected: status("REJECTED"),
        suspended,
      },
      offers: { published: publishedOffers, total: offers },
      evaluations,
      attempts,
      applications,
      savedMatches: saves,
      newTalents30d: newTalents,
      newOrganizations30d: newOrgs,
    };
  }

  private async rows(where: Prisma.OrganizationWhereInput = {}): Promise<OrgAdminRow[]> {
    const orgs = await prisma.organization.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        _count: { select: { members: true, jobOffers: true } },
        members: { where: { role: "ADMIN" }, orderBy: { createdAt: "asc" }, take: 1 },
      },
    });
    return orgs.map(({ _count, members, ...org }) => ({
      organization: toOrg(org),
      memberCount: _count.members,
      offerCount: _count.jobOffers,
      contactName: members[0] ? `${members[0].firstName} ${members[0].lastName}`.trim() : null,
      contactEmail: members[0]?.email ?? null,
    }));
  }

  listOrganizations() {
    return this.rows();
  }

  async getOrganization(id: string): Promise<OrgAdminDetail | null> {
    const [row] = await this.rows({ id });
    if (!row) return null;
    const [members, offers] = await Promise.all([
      prisma.organizationMember.findMany({
        where: { organizationId: id },
        include: { departments: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.jobOffer.findMany({
        where: { organizationId: id },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, title: true, status: true, createdAt: true },
      }),
    ]);
    return {
      ...row,
      members: members.map(toMember),
      offers: offers.map((o) => ({
        id: o.id,
        title: o.title,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })),
    };
  }

  async listProfiles(limit: number) {
    const rows = await prisma.profile.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: profileInclude,
    });
    return rows.map(toProfile);
  }

  async getProfile(id: string) {
    const row = await prisma.profile.findUnique({ where: { id }, include: profileInclude });
    return row ? toProfile(row) : null;
  }

  async setProfileRole(id: string, role: UserRole) {
    const { count } = await prisma.profile.updateMany({ where: { id }, data: { role } });
    return count === 0 ? null : this.getProfile(id);
  }

  countProfilesWithRole(role: UserRole) {
    return prisma.profile.count({ where: { role } });
  }

  async addAudit(entry: AuditEntryInput) {
    return toAudit(await prisma.adminAuditLog.create({ data: entry }));
  }

  async listAudit(limit: number) {
    const rows = await prisma.adminAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: limit });
    return rows.map(toAudit);
  }
}
