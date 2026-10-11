import { randomUUID } from "node:crypto";
import type {
  AuditEntryDTO,
  AuditEntryInput,
  OrgAdminDetail,
  OrgAdminRow,
  PlatformStats,
  ProfileAdminRow,
} from "@/types/platform";
import type { UserRole } from "@/types/profile";
import type { InMemoryOrganizationRepository } from "./organization.memory";
import type { InMemoryProfileRepository } from "./profile.memory";
import type { JobOfferRepository } from "./job-offer.repository";
import type { PlatformRepository } from "./platform.repository";

/** Platform administration over the in-memory repositories (local demo and tests). */
export class InMemoryPlatformRepository implements PlatformRepository {
  private audit: AuditEntryDTO[] = [];

  constructor(
    private readonly orgs: InMemoryOrganizationRepository,
    private readonly profiles: InMemoryProfileRepository,
    private readonly offers: JobOfferRepository,
  ) {}

  private async row(
    org: ReturnType<InMemoryOrganizationRepository["allOrganizations"]>[number],
  ): Promise<OrgAdminRow> {
    const [members, offers] = await Promise.all([this.orgs.listMembers(org.id), this.offers.list(org.id)]);
    const admin = members.find((m) => m.role === "ADMIN");
    return {
      organization: org,
      memberCount: members.length,
      offerCount: offers.length,
      contactName: admin ? `${admin.firstName} ${admin.lastName}`.trim() : null,
      contactEmail: admin?.email ?? null,
    };
  }

  async listOrganizations() {
    return Promise.all(this.orgs.allOrganizations().map((o) => this.row(o)));
  }

  async getOrganization(id: string): Promise<OrgAdminDetail | null> {
    const org = this.orgs.allOrganizations().find((o) => o.id === id);
    if (!org) return null;
    const [row, members, offers] = await Promise.all([
      this.row(org),
      this.orgs.listMembers(id),
      this.offers.list(id),
    ]);
    return {
      ...row,
      members,
      offers: offers.map((o) => ({ id: o.id, title: o.title, status: o.status, createdAt: o.createdAt })),
    };
  }

  private async profileRows(): Promise<ProfileAdminRow[]> {
    const orgs = this.orgs.allOrganizations();
    const memberships = await Promise.all(
      orgs.map(async (o) => ({ org: o, members: await this.orgs.listMembers(o.id) })),
    );
    return this.profiles.all().map((p) => {
      const found = memberships.flatMap(({ org, members }) =>
        members.filter((m) => m.profileId === p.id && m.status === "ACTIVE").map((m) => ({ org, m })),
      )[0];
      return {
        id: p.id,
        email: `${p.username}@demo.skillpass`,
        fullName: p.fullName,
        username: p.username,
        role: p.role,
        plan: p.plan,
        isPublic: p.isPublic,
        createdAt: p.updatedAt,
        organization: found ? { id: found.org.id, name: found.org.name, role: found.m.role } : null,
      };
    });
  }

  async listProfiles(limit: number) {
    return (await this.profileRows()).slice(0, limit);
  }

  async getProfile(id: string) {
    return (await this.profileRows()).find((p) => p.id === id) ?? null;
  }

  async setProfileRole(id: string, role: UserRole) {
    if (!this.profiles.all().some((p) => p.id === id)) return null;
    this.profiles.setRole(id, role);
    return this.getProfile(id);
  }

  async countProfilesWithRole(role: UserRole) {
    return this.profiles.all().filter((p) => p.role === role).length;
  }

  async stats(since: string): Promise<PlatformStats> {
    const profiles = this.profiles.all();
    const orgs = this.orgs.allOrganizations();
    const offers = (await Promise.all(orgs.map((o) => this.offers.list(o.id)))).flat();
    const byRole: PlatformStats["byRole"] = {};
    for (const p of profiles) byRole[p.role] = (byRole[p.role] ?? 0) + 1;
    return {
      profiles: profiles.length,
      publicTalents: profiles.filter((p) => p.isPublic && p.role === "TALENT").length,
      byRole,
      organizations: {
        pending: orgs.filter((o) => o.verificationStatus === "PENDING").length,
        verified: orgs.filter((o) => o.verificationStatus === "VERIFIED").length,
        rejected: orgs.filter((o) => o.verificationStatus === "REJECTED").length,
        suspended: orgs.filter((o) => o.deactivated).length,
      },
      offers: { published: offers.filter((o) => o.status === "PUBLISHED").length, total: offers.length },
      evaluations: 0,
      attempts: 0,
      applications: 0,
      savedMatches: 0,
      newTalents30d: profiles.filter((p) => p.updatedAt >= since && p.role === "TALENT").length,
      newOrganizations30d: orgs.filter((o) => o.createdAt >= since).length,
    };
  }

  async addAudit(entry: AuditEntryInput) {
    const row: AuditEntryDTO = { ...entry, id: randomUUID(), createdAt: new Date().toISOString() };
    this.audit.push(row);
    return structuredClone(row);
  }

  async listAudit(limit: number) {
    return this.audit
      .map((a) => structuredClone(a))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }
}
