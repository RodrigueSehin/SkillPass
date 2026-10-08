import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { withDefaults } from "@/types/org-settings";
import type {
  AccessLevel,
  DepartmentDTO,
  DepartmentDeputy,
  DepartmentLook,
  DepartmentStatus,
  MemberDTO,
  MemberInvite,
  MemberStatus,
  OrganizationDTO,
  OrgRole,
  PlanCode,
  SiteDTO,
} from "@/types/business";
import type {
  DepartmentInput,
  MemberPatch,
  NewMember,
  NewOrganization,
  OrganizationPatch,
  OrganizationRepository,
} from "./organization.repository";

const iso = (d: Date | null) => (d ? d.toISOString() : null);
const date = (s: string | null | undefined) => (s ? new Date(s) : null);

const toOrganization = (r: Prisma.OrganizationGetPayload<object>): OrganizationDTO => ({
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
  verified: r.verified,
  plan: r.plan as PlanCode,
  logoVersion: r.logoPath ? createHash("sha1").update(r.logoPath).digest("hex").slice(0, 8) : null,
  settings: withDefaults(r.settings),
  deactivated: r.deactivatedAt !== null,
  createdAt: r.createdAt.toISOString(),
});

const memberInclude = { departments: true } satisfies Prisma.OrganizationMemberInclude;
type MemberRow = Prisma.OrganizationMemberGetPayload<{ include: typeof memberInclude }>;

const toMember = (r: MemberRow): MemberDTO => ({
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

const toInvite = (r: MemberRow): MemberInvite => ({ ...toMember(r), inviteToken: r.inviteToken });

const departmentInclude = { members: true, deputies: true } satisfies Prisma.DepartmentInclude;
type DepartmentRow = Prisma.DepartmentGetPayload<{ include: typeof departmentInclude }>;

const toDepartment = (r: DepartmentRow): DepartmentDTO => ({
  id: r.id,
  name: r.name,
  description: r.description,
  look: r.look as DepartmentLook,
  parentId: r.parentId,
  mainSiteId: r.mainSiteId,
  siteIds: r.siteIds,
  objectives: r.objectives,
  status: r.status as DepartmentStatus,
  accessLevel: r.accessLevel as AccessLevel,
  headId: r.headId,
  deputies: r.deputies.map((d): DepartmentDeputy => ({
    memberId: d.memberId,
    level: d.level as DepartmentDeputy["level"],
  })),
  replacementId: r.replacementId,
  members: r.members.map((m) => ({ memberId: m.memberId, role: m.role })),
});

const memberData = (m: NewMember) => ({
  profileId: m.profileId ?? null,
  firstName: m.firstName,
  lastName: m.lastName,
  email: m.email,
  phone: m.phone ?? null,
  jobTitle: m.jobTitle ?? null,
  role: m.role,
  permissions: m.permissions,
  status: m.status,
  siteId: m.siteId ?? null,
  managerId: m.managerId ?? null,
  invitationMessage: m.invitationMessage ?? null,
  inviteToken: m.inviteToken ?? null,
  inviteExpiresAt: date(m.inviteExpiresAt),
  invitedAt: date(m.invitedAt),
  lastActiveAt: date(m.lastActiveAt),
});

export class PrismaOrganizationRepository implements OrganizationRepository {
  // ---------------------------------------------------------------- organizations

  async findMembershipByProfile(profileId: string) {
    const row = await prisma.organizationMember.findFirst({
      where: { profileId, status: { not: "INVITED" } },
      include: { ...memberInclude, organization: true },
      orderBy: { createdAt: "asc" },
    });
    return row ? { organization: toOrganization(row.organization), member: toMember(row) } : null;
  }

  async findInviteByToken(token: string) {
    const row = await prisma.organizationMember.findUnique({
      where: { inviteToken: token },
      include: { ...memberInclude, organization: true },
    });
    return row ? { organization: toOrganization(row.organization), member: toInvite(row) } : null;
  }

  async slugTaken(slug: string) {
    return (await prisma.organization.count({ where: { slug } })) > 0;
  }

  async createOrganization(input: NewOrganization, creator: NewMember) {
    return prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          industry: input.industry,
          size: input.size,
          website: input.website,
          plan: input.plan ?? "BUSINESS",
          verified: input.verified ?? false,
        },
      });
      const member = await tx.organizationMember.create({
        data: { organizationId: org.id, ...memberData(creator) },
        include: memberInclude,
      });
      return { organization: toOrganization(org), member: toMember(member) };
    });
  }

  async getOrganization(id: string) {
    const row = await prisma.organization.findUnique({ where: { id } });
    return row ? toOrganization(row) : null;
  }

  async setLogo(orgId: string, path: string | null) {
    const previous = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { logoPath: true },
    });
    if (!previous) return null;
    await prisma.organization.update({ where: { id: orgId }, data: { logoPath: path } });
    return { previousPath: previous.logoPath };
  }

  async getLogoPath(orgId: string) {
    const row = await prisma.organization.findUnique({ where: { id: orgId }, select: { logoPath: true } });
    return row?.logoPath ?? null;
  }

  async updateOrganization(id: string, patch: OrganizationPatch) {
    const { settings, ...rest } = patch;
    const { count } = await prisma.organization.updateMany({
      where: { id },
      data: { ...rest, ...(settings ? { settings: settings as unknown as Prisma.InputJsonValue } : {}) },
    });
    return count === 0 ? null : this.getOrganization(id);
  }

  async setDeactivated(orgId: string, deactivated: boolean) {
    const { count } = await prisma.organization.updateMany({
      where: { id: orgId },
      data: { deactivatedAt: deactivated ? new Date() : null },
    });
    return count === 0 ? null : this.getOrganization(orgId);
  }

  async deleteOrganization(orgId: string) {
    const row = await prisma.organization.findUnique({ where: { id: orgId }, select: { logoPath: true } });
    if (!row) return null;
    await prisma.organization.delete({ where: { id: orgId } });
    return { logoPath: row.logoPath };
  }

  // ---------------------------------------------------------------- members

  async listMembers(orgId: string) {
    const rows = await prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: memberInclude,
      orderBy: [{ createdAt: "asc" }],
    });
    return rows.map(toMember);
  }

  async listInvites(orgId: string) {
    const rows = await prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: memberInclude,
      orderBy: [{ createdAt: "asc" }],
    });
    return rows.map(toInvite);
  }

  async getMember(orgId: string, id: string) {
    const row = await prisma.organizationMember.findFirst({
      where: { id, organizationId: orgId },
      include: memberInclude,
    });
    return row ? toMember(row) : null;
  }

  async emailTaken(orgId: string, email: string) {
    return (
      (await prisma.organizationMember.count({
        where: { organizationId: orgId, email: { equals: email, mode: "insensitive" } },
      })) > 0
    );
  }

  async createMember(orgId: string, input: NewMember) {
    const row = await prisma.organizationMember.create({
      data: {
        organizationId: orgId,
        ...memberData(input),
        departments: {
          create: input.teams.map((t) => ({ departmentId: t.departmentId, isPrimary: t.primary })),
        },
      },
      include: memberInclude,
    });
    return toMember(row);
  }

  async updateMember(orgId: string, id: string, patch: MemberPatch) {
    const { teams, ...fields } = patch;
    const ok = await prisma.$transaction(async (tx) => {
      const { count } = await tx.organizationMember.updateMany({
        where: { id, organizationId: orgId },
        data: {
          ...fields,
          inviteExpiresAt: fields.inviteExpiresAt === undefined ? undefined : date(fields.inviteExpiresAt),
          invitedAt: fields.invitedAt === undefined ? undefined : date(fields.invitedAt),
        },
      });
      if (count === 0) return false;
      if (teams) {
        await tx.departmentMember.deleteMany({ where: { memberId: id } });
        // Only departments of this organization can be linked.
        const valid = await tx.department.findMany({
          where: { organizationId: orgId, id: { in: teams.map((t) => t.departmentId) } },
          select: { id: true },
        });
        const ids = new Set(valid.map((d) => d.id));
        await tx.departmentMember.createMany({
          data: teams
            .filter((t) => ids.has(t.departmentId))
            .map((t) => ({ departmentId: t.departmentId, memberId: id, isPrimary: t.primary })),
        });
      }
      return true;
    });
    return ok ? this.getMember(orgId, id) : null;
  }

  async removeMember(orgId: string, id: string) {
    return prisma.$transaction(async (tx) => {
      const { count } = await tx.organizationMember.deleteMany({ where: { id, organizationId: orgId } });
      if (count === 0) return false;
      await tx.organizationMember.updateMany({
        where: { organizationId: orgId, managerId: id },
        data: { managerId: null },
      });
      await tx.department.updateMany({
        where: { organizationId: orgId, headId: id },
        data: { headId: null },
      });
      await tx.department.updateMany({
        where: { organizationId: orgId, replacementId: id },
        data: { replacementId: null },
      });
      return true;
    });
  }

  async acceptInvite(token: string, profileId: string, now: string) {
    return prisma.$transaction(async (tx) => {
      // A person belongs to one organization at a time.
      if ((await tx.organizationMember.count({ where: { profileId, status: { not: "INVITED" } } })) > 0)
        return null;
      // One conditional update: a replayed or expired link matches no row.
      const { count } = await tx.organizationMember.updateMany({
        where: { inviteToken: token, status: "INVITED", inviteExpiresAt: { gt: new Date(now) } },
        data: { profileId, status: "ACTIVE", inviteToken: null, lastActiveAt: new Date(now) },
      });
      if (count === 0) return null;
      const row = await tx.organizationMember.findFirst({ where: { profileId }, include: memberInclude });
      return row ? toMember(row) : null;
    });
  }

  async touchMember(orgId: string, id: string, now: string) {
    await prisma.organizationMember.updateMany({
      where: { id, organizationId: orgId },
      data: { lastActiveAt: new Date(now) },
    });
  }

  // ---------------------------------------------------------------- sites

  private toSite = (r: { id: string; name: string; address: string | null }): SiteDTO => ({
    id: r.id,
    name: r.name,
    address: r.address,
  });

  async listSites(orgId: string) {
    const rows = await prisma.site.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(this.toSite);
  }

  async createSite(orgId: string, site: Omit<SiteDTO, "id">) {
    return this.toSite(await prisma.site.create({ data: { organizationId: orgId, ...site } }));
  }

  async updateSite(orgId: string, id: string, site: Omit<SiteDTO, "id">) {
    const { count } = await prisma.site.updateMany({ where: { id, organizationId: orgId }, data: site });
    if (count === 0) return null;
    const row = await prisma.site.findUnique({ where: { id } });
    return row ? this.toSite(row) : null;
  }

  async deleteSite(orgId: string, id: string) {
    return prisma.$transaction(async (tx) => {
      const { count } = await tx.site.deleteMany({ where: { id, organizationId: orgId } });
      if (count === 0) return false;
      await tx.organizationMember.updateMany({
        where: { organizationId: orgId, siteId: id },
        data: { siteId: null },
      });
      await tx.department.updateMany({
        where: { organizationId: orgId, mainSiteId: id },
        data: { mainSiteId: null },
      });
      const withSite = await tx.department.findMany({
        where: { organizationId: orgId, siteIds: { has: id } },
      });
      for (const d of withSite) {
        await tx.department.update({
          where: { id: d.id },
          data: { siteIds: d.siteIds.filter((s) => s !== id) },
        });
      }
      return true;
    });
  }

  // ---------------------------------------------------------------- departments

  async listDepartments(orgId: string) {
    const rows = await prisma.department.findMany({
      where: { organizationId: orgId },
      include: departmentInclude,
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toDepartment);
  }

  async getDepartment(orgId: string, id: string) {
    const row = await prisma.department.findFirst({
      where: { id, organizationId: orgId },
      include: departmentInclude,
    });
    return row ? toDepartment(row) : null;
  }

  /** Keeps only ids of members of this organization, so a forged form cannot link a stranger. */
  private async ownMembers(tx: Prisma.TransactionClient, orgId: string, ids: string[]) {
    const rows = await tx.organizationMember.findMany({
      where: { organizationId: orgId, id: { in: ids } },
      select: { id: true },
    });
    return new Set(rows.map((r) => r.id));
  }

  private scalars(i: DepartmentInput) {
    return {
      name: i.name,
      description: i.description,
      look: i.look,
      parentId: i.parentId,
      mainSiteId: i.mainSiteId,
      siteIds: i.siteIds,
      objectives: i.objectives,
      status: i.status,
      accessLevel: i.accessLevel,
      headId: i.headId,
      replacementId: i.replacementId,
    };
  }

  private async writeLinks(tx: Prisma.TransactionClient, orgId: string, id: string, input: DepartmentInput) {
    const own = await this.ownMembers(tx, orgId, [
      ...input.members.map((m) => m.memberId),
      ...input.deputies.map((d) => d.memberId),
    ]);
    const previous = await tx.departmentMember.findMany({ where: { departmentId: id } });
    await tx.departmentMember.deleteMany({ where: { departmentId: id } });
    await tx.departmentDeputy.deleteMany({ where: { departmentId: id } });
    const rows = [];
    for (const m of input.members.filter((x) => own.has(x.memberId))) {
      const had = previous.find((p) => p.memberId === m.memberId);
      // A person's first team becomes their main one.
      const hasPrimary = had
        ? had.isPrimary
        : (await tx.departmentMember.count({ where: { memberId: m.memberId, isPrimary: true } })) > 0;
      rows.push({
        departmentId: id,
        memberId: m.memberId,
        role: m.role,
        isPrimary: had ? had.isPrimary : !hasPrimary,
      });
    }
    await tx.departmentMember.createMany({ data: rows });
    await tx.departmentDeputy.createMany({
      data: input.deputies
        .filter((d) => own.has(d.memberId))
        .map((d) => ({ departmentId: id, memberId: d.memberId, level: d.level })),
      skipDuplicates: true,
    });
  }

  async createDepartment(orgId: string, input: DepartmentInput) {
    const id = await prisma.$transaction(async (tx) => {
      const created = await tx.department.create({ data: { organizationId: orgId, ...this.scalars(input) } });
      await this.writeLinks(tx, orgId, created.id, input);
      return created.id;
    });
    return (await this.getDepartment(orgId, id))!;
  }

  async updateDepartment(orgId: string, id: string, input: DepartmentInput) {
    const ok = await prisma.$transaction(async (tx) => {
      const { count } = await tx.department.updateMany({
        where: { id, organizationId: orgId },
        data: this.scalars(input),
      });
      if (count === 0) return false;
      await this.writeLinks(tx, orgId, id, input);
      return true;
    });
    return ok ? this.getDepartment(orgId, id) : null;
  }

  async deleteDepartment(orgId: string, id: string) {
    return prisma.$transaction(async (tx) => {
      const { count } = await tx.department.deleteMany({ where: { id, organizationId: orgId } });
      if (count === 0) return false;
      await tx.department.updateMany({
        where: { organizationId: orgId, parentId: id },
        data: { parentId: null },
      });
      return true;
    });
  }
}
