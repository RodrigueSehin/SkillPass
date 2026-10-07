import { randomBytes } from "node:crypto";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { ROLE_PRESETS, sanitizePermissions } from "@/lib/business/permissions";
import { PLANS } from "@/lib/business/plans";
import type { OrganizationRepository } from "@/repositories/organization.repository";
import type {
  CreateOrganizationInput,
  DepartmentFormInput,
  InviteMemberInput,
  SiteInput,
  UpdateMemberInput,
  UpdateOrganizationInput,
} from "@/schemas/business";
import type { DepartmentDTO, MemberDTO, MemberInvite, OrganizationDTO } from "@/types/business";

export const INVITE_DAYS = 7;
const DAY_MS = 86_400_000;

/** URL-safe slug: "AGL Côte d'Ivoire" → "agl-cote-d-ivoire". */
export function slugify(name: string) {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "organisation"
  );
}

export interface Actor {
  profileId: string;
  firstName: string;
  lastName: string;
  email: string;
}

/** Who is acting inside an organization: the organization and the member row of the signed-in person. */
export interface OrgScope {
  organization: OrganizationDTO;
  member: MemberDTO;
}

const newToken = () => randomBytes(32).toString("hex");

export class OrganizationService {
  constructor(
    private readonly repo: OrganizationRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  // ---------------------------------------------------------------- organizations

  scopeFor(profileId: string) {
    return this.repo.findMembershipByProfile(profileId);
  }

  async create(actor: Actor, input: CreateOrganizationInput): Promise<OrgScope> {
    if (await this.repo.findMembershipByProfile(actor.profileId)) {
      throw new ConflictError("Vous appartenez déjà à une organisation.");
    }
    const base = slugify(input.name);
    let slug = base;
    for (let i = 2; await this.repo.slugTaken(slug); i++) slug = `${base}-${i}`;
    const at = this.now().toISOString();
    return this.repo.createOrganization(
      { name: input.name, slug, industry: input.industry, size: input.size, website: input.website },
      {
        profileId: actor.profileId,
        firstName: actor.firstName,
        lastName: actor.lastName,
        email: actor.email,
        role: "ADMIN",
        permissions: ROLE_PRESETS.ADMIN,
        status: "ACTIVE",
        teams: [],
        lastActiveAt: at,
      },
    );
  }

  async update(orgId: string, input: UpdateOrganizationInput) {
    const updated = await this.repo.updateOrganization(orgId, {
      name: input.name,
      description: input.description ?? null,
      industry: input.industry ?? null,
      size: input.size ?? null,
      website: input.website ?? null,
      address: input.address ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      ...(input.timezone ? { timezone: input.timezone } : {}),
      ...(input.language ? { language: input.language } : {}),
    });
    if (!updated) throw new NotFoundError("Organisation introuvable");
    return updated;
  }

  /** Records that the person was seen, at most once a minute so reads stay cheap. */
  async touch(scope: OrgScope) {
    const last = scope.member.lastActiveAt ? Date.parse(scope.member.lastActiveAt) : 0;
    if (this.now().getTime() - last > 60_000) {
      await this.repo.touchMember(scope.organization.id, scope.member.id, this.now().toISOString());
    }
  }

  // ---------------------------------------------------------------- members

  listMembers(orgId: string) {
    return this.repo.listMembers(orgId);
  }

  listInvites(orgId: string) {
    return this.repo.listInvites(orgId);
  }

  async getMember(orgId: string, id: string) {
    const member = await this.repo.getMember(orgId, id);
    if (!member) throw new NotFoundError("Membre introuvable");
    return member;
  }

  /** Throws when an id does not belong to the organization: a forged form cannot link a stranger's data. */
  private async assertOwn(
    orgId: string,
    ids: {
      members?: (string | null | undefined)[];
      departments?: (string | null | undefined)[];
      sites?: (string | null | undefined)[];
    },
  ) {
    const [members, departments, sites] = await Promise.all([
      ids.members?.some(Boolean) ? this.repo.listMembers(orgId) : [],
      ids.departments?.some(Boolean) ? this.repo.listDepartments(orgId) : [],
      ids.sites?.some(Boolean) ? this.repo.listSites(orgId) : [],
    ]);
    const check = (
      wanted: (string | null | undefined)[] | undefined,
      known: { id: string }[],
      what: string,
    ) => {
      for (const id of wanted ?? []) {
        if (id && !known.some((k) => k.id === id)) throw new NotFoundError(`${what} introuvable`);
      }
    };
    check(ids.members, members, "Membre");
    check(ids.departments, departments, "Département");
    check(ids.sites, sites, "Site");
  }

  /** Creates the pending member and its single-use invitation link (valid for a week). */
  async invite(scope: OrgScope, input: InviteMemberInput): Promise<MemberInvite> {
    const { organization } = scope;
    const members = await this.repo.listMembers(organization.id);
    const seats = PLANS[organization.plan].maxMembers;
    if (seats !== null && members.length >= seats) {
      throw new ForbiddenError(`Votre plan ${PLANS[organization.plan].name} est limité à ${seats} membres.`);
    }
    if (await this.repo.emailTaken(organization.id, input.email)) {
      throw new ConflictError("Cette adresse e-mail est déjà dans l'organisation.");
    }
    const secondary = input.secondaryTeamIds.filter((id) => id !== input.primaryTeamId);
    await this.assertOwn(organization.id, {
      departments: [input.primaryTeamId, ...secondary],
      members: [input.managerId],
      sites: [input.siteId],
    });

    const at = this.now();
    const token = newToken();
    const created = await this.repo.createMember(organization.id, {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      jobTitle: input.jobTitle,
      role: input.role,
      permissions: sanitizePermissions(input.permissions),
      status: "INVITED",
      siteId: input.siteId,
      managerId: input.managerId,
      invitationMessage: input.invitationMessage,
      inviteToken: token,
      invitedAt: at.toISOString(),
      inviteExpiresAt: new Date(at.getTime() + INVITE_DAYS * DAY_MS).toISOString(),
      teams: [
        { departmentId: input.primaryTeamId, primary: true },
        ...secondary.map((departmentId) => ({ departmentId, primary: false })),
      ],
    });
    return { ...created, inviteToken: token };
  }

  /** Whether removing, demoting or deactivating this administrator would leave nobody in charge. */
  private async isLastAdmin(orgId: string, member: MemberDTO) {
    if (member.role !== "ADMIN" || member.status !== "ACTIVE") return false;
    const members = await this.repo.listMembers(orgId);
    return members.filter((m) => m.role === "ADMIN" && m.status === "ACTIVE").length <= 1;
  }

  async updateMember(scope: OrgScope, id: string, input: UpdateMemberInput) {
    const orgId = scope.organization.id;
    const member = await this.getMember(orgId, id);
    const losesAdmin =
      (input.role !== undefined && input.role !== "ADMIN") ||
      (input.status !== undefined && input.status !== "ACTIVE");
    if (losesAdmin && (await this.isLastAdmin(orgId, member))) {
      throw new ForbiddenError("L'organisation doit garder au moins un administrateur actif.");
    }
    if (input.status === "INACTIVE" && id === scope.member.id) {
      throw new ForbiddenError("Vous ne pouvez pas désactiver votre propre compte.");
    }
    if (member.status === "INVITED" && input.status === "ACTIVE") {
      throw new ForbiddenError("Ce membre doit d'abord accepter son invitation.");
    }
    const updated = await this.repo.updateMember(orgId, id, {
      ...(input.role ? { role: input.role } : {}),
      ...(input.role && !input.permissions ? { permissions: ROLE_PRESETS[input.role] } : {}),
      ...(input.permissions ? { permissions: sanitizePermissions(input.permissions) } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.jobTitle !== undefined ? { jobTitle: input.jobTitle } : {}),
    });
    if (!updated) throw new NotFoundError("Membre introuvable");
    return updated;
  }

  async removeMember(scope: OrgScope, id: string) {
    const orgId = scope.organization.id;
    const member = await this.getMember(orgId, id);
    if (id === scope.member.id) throw new ForbiddenError("Vous ne pouvez pas vous retirer vous-même.");
    if (await this.isLastAdmin(orgId, member)) {
      throw new ForbiddenError("L'organisation doit garder au moins un administrateur actif.");
    }
    await this.repo.removeMember(orgId, id);
  }

  /** A fresh link and a fresh week, for an invitation that was lost or expired. */
  async resendInvite(orgId: string, id: string): Promise<MemberInvite> {
    const member = await this.getMember(orgId, id);
    if (member.status !== "INVITED") throw new ConflictError("Ce membre a déjà rejoint l'organisation.");
    const at = this.now();
    const token = newToken();
    const updated = await this.repo.updateMember(orgId, id, {
      inviteToken: token,
      invitedAt: at.toISOString(),
      inviteExpiresAt: new Date(at.getTime() + INVITE_DAYS * DAY_MS).toISOString(),
    });
    if (!updated) throw new NotFoundError("Membre introuvable");
    return { ...updated, inviteToken: token };
  }

  /** What the invited person sees on their link: enough context, never the other members. */
  async getInvite(token: string) {
    const found = await this.repo.findInviteByToken(token);
    if (!found) throw new NotFoundError("Invitation introuvable");
    const { organization, member } = found;
    const state =
      member.status !== "INVITED"
        ? ("answered" as const)
        : member.inviteExpiresAt && Date.parse(member.inviteExpiresAt) <= this.now().getTime()
          ? ("expired" as const)
          : ("open" as const);
    return {
      organizationName: organization.name,
      firstName: member.firstName,
      email: member.email,
      role: member.role,
      message: member.invitationMessage,
      state,
    };
  }

  async acceptInvite(token: string, profileId: string) {
    const accepted = await this.repo.acceptInvite(token, profileId, this.now().toISOString());
    if (accepted) return accepted;
    const invite = await this.getInvite(token);
    if (invite.state === "expired") throw new ConflictError("Cette invitation a expiré.");
    if (invite.state === "answered") throw new ConflictError("Cette invitation a déjà été utilisée.");
    throw new ConflictError("Vous appartenez déjà à une organisation.");
  }

  // ---------------------------------------------------------------- sites

  listSites(orgId: string) {
    return this.repo.listSites(orgId);
  }

  createSite(orgId: string, input: SiteInput) {
    return this.repo.createSite(orgId, { name: input.name, address: input.address ?? null });
  }

  async updateSite(orgId: string, id: string, input: SiteInput) {
    const site = await this.repo.updateSite(orgId, id, { name: input.name, address: input.address ?? null });
    if (!site) throw new NotFoundError("Site introuvable");
    return site;
  }

  async deleteSite(orgId: string, id: string) {
    if (!(await this.repo.deleteSite(orgId, id))) throw new NotFoundError("Site introuvable");
  }

  // ---------------------------------------------------------------- departments

  listDepartments(orgId: string) {
    return this.repo.listDepartments(orgId);
  }

  async getDepartment(orgId: string, id: string) {
    const department = await this.repo.getDepartment(orgId, id);
    if (!department) throw new NotFoundError("Département introuvable");
    return department;
  }

  private async toInput(
    orgId: string,
    input: DepartmentFormInput,
    selfId?: string,
  ): Promise<Omit<DepartmentDTO, "id">> {
    const all = await this.repo.listDepartments(orgId);
    await this.assertOwn(orgId, {
      members: [
        input.headId,
        input.replacementId,
        ...input.deputies.map((d) => d.memberId),
        ...input.members.map((m) => m.memberId),
      ],
      departments: [input.parentId],
      sites: [input.mainSiteId, ...input.siteIds],
    });
    // A department cannot sit under itself or under one of its own descendants.
    if (selfId && input.parentId) {
      let cursor: string | null = input.parentId;
      for (let guard = 0; cursor && guard < 50; guard++) {
        if (cursor === selfId)
          throw new ConflictError(
            "Un département ne peut pas être rattaché à lui-même ou à l'un de ses sous-départements.",
          );
        cursor = all.find((d) => d.id === cursor)?.parentId ?? null;
      }
    }
    return {
      name: input.name,
      description: input.description ?? null,
      look: input.look,
      parentId: input.parentId ?? null,
      mainSiteId: input.mainSiteId ?? null,
      siteIds: [...new Set(input.siteIds)],
      objectives: input.objectives,
      status: input.status,
      accessLevel: input.accessLevel,
      headId: input.headId ?? null,
      deputies: input.deputies.filter((d) => d.memberId !== input.headId),
      replacementId: input.replacementId ?? null,
      members: [...new Map(input.members.map((m) => [m.memberId, m])).values()],
    };
  }

  async createDepartment(orgId: string, input: DepartmentFormInput) {
    return this.repo.createDepartment(orgId, await this.toInput(orgId, input));
  }

  async updateDepartment(orgId: string, id: string, input: DepartmentFormInput) {
    const updated = await this.repo.updateDepartment(orgId, id, await this.toInput(orgId, input, id));
    if (!updated) throw new NotFoundError("Département introuvable");
    return updated;
  }

  async deleteDepartment(orgId: string, id: string) {
    if (!(await this.repo.deleteDepartment(orgId, id))) throw new NotFoundError("Département introuvable");
  }
}
