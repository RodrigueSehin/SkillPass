import { TALENT_PLAN_CODES, TALENT_PLANS, type TalentPlanCode } from "@/lib/plans/entitlements";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type { PlatformRepository } from "@/repositories/platform.repository";
import type { ProfileRepository } from "@/repositories/profile.repository";
import type { MemberDTO, OrganizationDTO, PlanCode } from "@/types/business";
import type { AuditAction, OrgAdminDetail } from "@/types/platform";
import { ROLE_LABELS, type UserRole } from "@/types/profile";
import type { JobOfferService } from "./job-offer.service";
import type { OrganizationService, OrgScope } from "./organization.service";

export const ORG_FILTERS = ["PENDING", "VERIFIED", "REJECTED", "SUSPENDED", "ALL"] as const;
export type OrgFilter = (typeof ORG_FILTERS)[number];

const USER_ROLES = Object.keys(ROLE_LABELS) as UserRole[];
const DAY = 86_400_000;

/** A stand-in member for actions the platform administrator takes inside an organization. */
const platformScope = (organization: OrganizationDTO): OrgScope => ({
  organization,
  member: {
    id: "platform-admin",
    profileId: null,
    firstName: "SkillPass",
    lastName: "",
    email: "",
    phone: null,
    jobTitle: null,
    role: "ADMIN",
    permissions: [],
    status: "ACTIVE",
    siteId: null,
    managerId: null,
    teams: [],
    invitationMessage: null,
    invitedAt: null,
    inviteExpiresAt: null,
    lastActiveAt: null,
    createdAt: organization.createdAt,
  } satisfies MemberDTO,
});

/**
 * What the general administrator of SkillPass can do across the platform. Every method re-checks the role
 * from the database: a page that forgot to check it would still be refused here.
 */
export class PlatformAdminService {
  constructor(
    private readonly platform: PlatformRepository,
    private readonly profiles: ProfileRepository,
    private readonly orgs: OrganizationService,
    private readonly offers: JobOfferService,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async admin(userId: string) {
    const profile = await this.profiles.findById(userId);
    if (!profile || profile.role !== "SKILLPASS_ADMIN") throw new ForbiddenError();
    return profile;
  }

  private async audit(
    actor: { id: string; fullName: string },
    action: AuditAction,
    target: { type: "ORGANIZATION" | "PROFILE"; id: string; label: string },
    detail = "",
  ) {
    await this.platform.addAudit({
      actorId: actor.id,
      actorName: actor.fullName,
      action,
      targetType: target.type,
      targetId: target.id,
      targetLabel: target.label,
      detail,
    });
  }

  async dashboard(userId: string) {
    await this.admin(userId);
    const since = new Date(this.now().getTime() - 30 * DAY).toISOString();
    const [stats, organizations, profiles, audit] = await Promise.all([
      this.platform.stats(since),
      this.platform.listOrganizations(),
      this.platform.listProfiles(6),
      this.platform.listAudit(6),
    ]);
    return {
      stats,
      pending: organizations.filter((o) => o.organization.verificationStatus === "PENDING").slice(0, 6),
      recentProfiles: profiles,
      audit,
    };
  }

  async listOrganizations(userId: string, filter: OrgFilter = "ALL", q = "") {
    await this.admin(userId);
    const needle = q.trim().toLowerCase();
    return (await this.platform.listOrganizations()).filter(
      ({ organization: o, contactEmail, contactName }) => {
        if (filter === "SUSPENDED" ? !o.deactivated : filter !== "ALL" && o.verificationStatus !== filter)
          return false;
        return (
          !needle ||
          [o.name, o.website, o.industry, contactEmail, contactName].some((t) =>
            t?.toLowerCase().includes(needle),
          )
        );
      },
    );
  }

  async organization(userId: string, id: string): Promise<OrgAdminDetail> {
    await this.admin(userId);
    const detail = await this.platform.getOrganization(id);
    if (!detail) throw new NotFoundError("Organisation introuvable");
    return detail;
  }

  async verify(userId: string, id: string) {
    const actor = await this.admin(userId);
    const org = await this.orgs.setVerification(id, "VERIFIED");
    await this.audit(actor, "ORG_VERIFIED", { type: "ORGANIZATION", id, label: org.name });
    return org;
  }

  /** Refusing takes the company's offers off the job board; the reason is shown to its members. */
  async reject(userId: string, id: string, reason: string) {
    const actor = await this.admin(userId);
    const clean = reason.trim();
    if (clean.length < 5) throw new ConflictError("Indiquez le motif du refus (5 caractères minimum).");
    const org = await this.orgs.setVerification(id, "REJECTED", clean.slice(0, 500));
    await this.offers.takeOffBoard(id);
    await this.audit(
      actor,
      "ORG_REJECTED",
      { type: "ORGANIZATION", id, label: org.name },
      clean.slice(0, 200),
    );
    return org;
  }

  async reopen(userId: string, id: string) {
    const actor = await this.admin(userId);
    const org = await this.orgs.setVerification(id, "PENDING");
    await this.audit(actor, "ORG_REOPENED", { type: "ORGANIZATION", id, label: org.name });
    return org;
  }

  async suspend(userId: string, id: string) {
    const actor = await this.admin(userId);
    const org = await this.orgs.setDeactivated(id, true);
    await this.offers.takeOffBoard(id);
    await this.audit(actor, "ORG_SUSPENDED", { type: "ORGANIZATION", id, label: org.name });
    return org;
  }

  async reactivate(userId: string, id: string) {
    const actor = await this.admin(userId);
    const org = await this.orgs.setDeactivated(id, false);
    if (org.verificationStatus === "VERIFIED") await this.offers.putBackOnBoard(platformScope(org));
    await this.audit(actor, "ORG_REACTIVATED", { type: "ORGANIZATION", id, label: org.name });
    return org;
  }

  async setPlan(userId: string, id: string, plan: PlanCode) {
    const actor = await this.admin(userId);
    const before = await this.orgs.getOrganization(id);
    const org = await this.orgs.changePlan(id, plan);
    await this.audit(
      actor,
      "ORG_PLAN",
      { type: "ORGANIZATION", id, label: org.name },
      `${before.plan} → ${plan}`,
    );
    return org;
  }

  async setMaintenance(userId: string, id: string, on: boolean) {
    const actor = await this.admin(userId);
    const org = await this.orgs.saveSettings(id, { maintenance: on });
    await this.audit(
      actor,
      "ORG_MAINTENANCE",
      { type: "ORGANIZATION", id, label: org.name },
      on ? "activé" : "désactivé",
    );
    return org;
  }

  /** Changes a member's role, permissions or status in any organization. The last administrator stays. */
  async updateMember(
    userId: string,
    orgId: string,
    memberId: string,
    input: { role?: MemberDTO["role"]; permissions?: string[]; status?: "ACTIVE" | "INACTIVE" },
  ) {
    const actor = await this.admin(userId);
    const org = await this.orgs.getOrganization(orgId);
    const member = await this.orgs.updateMember(platformScope(org), memberId, input);
    await this.audit(
      actor,
      "MEMBER_ACCESS",
      { type: "ORGANIZATION", id: orgId, label: org.name },
      `${member.firstName} ${member.lastName}`.trim() +
        (input.role ? ` · rôle ${input.role}` : "") +
        (input.permissions ? ` · ${input.permissions.length} permissions` : "") +
        (input.status ? ` · ${input.status}` : ""),
    );
    return member;
  }

  async listProfiles(userId: string, q = "", role: UserRole | "" = "") {
    await this.admin(userId);
    const needle = q.trim().toLowerCase();
    return (await this.platform.listProfiles(500)).filter(
      (p) =>
        (!role || p.role === role) &&
        (!needle ||
          [p.fullName, p.email, p.username, p.organization?.name].some((t) =>
            t?.toLowerCase().includes(needle),
          )),
    );
  }

  /** Gives an account another platform role. Nobody changes their own, and the last administrator stays. */
  async setRole(userId: string, profileId: string, role: string) {
    const actor = await this.admin(userId);
    if (!USER_ROLES.includes(role as UserRole)) throw new NotFoundError("Rôle inconnu");
    if (profileId === actor.id) throw new ForbiddenError("Vous ne pouvez pas changer votre propre rôle.");
    const target = await this.platform.getProfile(profileId);
    if (!target) throw new NotFoundError("Compte introuvable");
    if (target.role === "SKILLPASS_ADMIN" && role !== "SKILLPASS_ADMIN") {
      if ((await this.platform.countProfilesWithRole("SKILLPASS_ADMIN")) <= 1)
        throw new ForbiddenError("SkillPass doit garder au moins un administrateur général.");
    }
    const updated = await this.platform.setProfileRole(profileId, role as UserRole);
    if (!updated) throw new NotFoundError("Compte introuvable");
    await this.audit(
      actor,
      "ROLE_CHANGED",
      { type: "PROFILE", id: profileId, label: target.fullName },
      `${ROLE_LABELS[target.role]} → ${ROLE_LABELS[role as UserRole]}`,
    );
    return updated;
  }

  /** Moves a talent to another plan (free or pro), whatever payment says: the administrator can grant it. */
  async setTalentPlan(userId: string, profileId: string, plan: string) {
    const actor = await this.admin(userId);
    if (!(TALENT_PLAN_CODES as readonly string[]).includes(plan)) throw new NotFoundError("Plan inconnu");
    const target = await this.platform.getProfile(profileId);
    if (!target) throw new NotFoundError("Compte introuvable");
    const saved = await this.profiles.setPlan(profileId, plan as TalentPlanCode);
    if (!saved) throw new NotFoundError("Compte introuvable");
    await this.audit(
      actor,
      "TALENT_PLAN",
      { type: "PROFILE", id: profileId, label: target.fullName },
      `${TALENT_PLANS[target.plan].name} → ${TALENT_PLANS[plan as TalentPlanCode].name}`,
    );
    return saved;
  }

  async listAudit(userId: string, limit = 200) {
    await this.admin(userId);
    return this.platform.listAudit(limit);
  }
}
