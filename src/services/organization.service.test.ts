import { describe, expect, it } from "vitest";
import { can, ROLE_PRESETS } from "@/lib/business/permissions";
import { InMemoryOrganizationRepository } from "@/repositories/organization.memory";
import type { InviteMemberInput } from "@/schemas/business";
import { INVITE_DAYS, OrganizationService, slugify, type OrgScope } from "./organization.service";

const DAY_MS = 86_400_000;
const actor = { profileId: "p-admin", firstName: "Awa", lastName: "Koné", email: "awa@acme.com" };

function setup() {
  let now = new Date("2026-10-07T10:00:00.000Z");
  const repo = new InMemoryOrganizationRepository();
  const service = new OrganizationService(repo, () => now);
  return { repo, service, advance: (ms: number) => (now = new Date(now.getTime() + ms)) };
}

const invite = (over: Partial<InviteMemberInput> & { primaryTeamId: string }): InviteMemberInput => ({
  firstName: "Marc",
  lastName: "Kouamé",
  email: "marc@acme.com",
  jobTitle: "Recruteur",
  role: "RECRUITER",
  permissions: ROLE_PRESETS.RECRUITER,
  secondaryTeamIds: [],
  ...over,
});

async function organization() {
  const ctx = setup();
  const scope: OrgScope = await ctx.service.create(actor, { name: "ACME Côte d'Ivoire" });
  const team = await ctx.service.createDepartment(scope.organization.id, {
    name: "RH",
    look: "users",
    siteIds: [],
    objectives: [],
    status: "ACTIVE",
    accessLevel: "LIMITED",
    deputies: [],
    members: [],
  });
  return { ...ctx, scope, team };
}

describe("organization service", () => {
  it("slugifies names", () => {
    expect(slugify("AGL Côte d'Ivoire")).toBe("agl-cote-d-ivoire");
    expect(slugify("  !!  ")).toBe("organisation");
  });

  it("creates an organization whose creator is its first active administrator", async () => {
    const { scope } = await organization();
    expect(scope.organization.slug).toBe("acme-cote-d-ivoire");
    expect(scope.member).toMatchObject({ role: "ADMIN", status: "ACTIVE", profileId: "p-admin" });
    expect(can(scope.member, "org.manage")).toBe(true);
  });

  it("refuses a second organization for the same person and numbers clashing slugs", async () => {
    const { service } = await organization();
    await expect(service.create(actor, { name: "Autre" })).rejects.toThrow("appartenez déjà");
    const other = await service.create(
      { ...actor, profileId: "p-2", email: "b@x.com" },
      { name: "ACME Côte d'Ivoire" },
    );
    expect(other.organization.slug).toBe("acme-cote-d-ivoire-2");
  });

  it("invites a member with a single-use link valid for a week", async () => {
    const { service, scope, team, repo } = await organization();
    const invited = await service.invite(scope, invite({ primaryTeamId: team.id }));
    expect(invited).toMatchObject({ status: "INVITED", role: "RECRUITER" });
    expect(invited.inviteToken).toMatch(/^[0-9a-f]{64}$/);
    expect(invited.teams).toEqual([{ departmentId: team.id, primary: true }]);
    expect(Date.parse(invited.inviteExpiresAt!) - Date.parse(invited.invitedAt!)).toBe(INVITE_DAYS * DAY_MS);

    // Not a member yet: the invited person cannot act.
    expect(await repo.findMembershipByProfile("p-new")).toBeNull();
    const accepted = await service.acceptInvite(invited.inviteToken!, "p-new");
    expect(accepted).toMatchObject({ status: "ACTIVE", profileId: "p-new" });
    await expect(service.acceptInvite(invited.inviteToken!, "p-other")).rejects.toThrow();
  });

  it("rejects an expired invitation and issues a fresh one on resend", async () => {
    const { service, scope, team, advance } = await organization();
    const invited = await service.invite(scope, invite({ primaryTeamId: team.id }));
    advance((INVITE_DAYS + 1) * DAY_MS);
    await expect(service.acceptInvite(invited.inviteToken!, "p-new")).rejects.toThrow("expiré");
    const again = await service.resendInvite(scope.organization.id, invited.id);
    expect(again.inviteToken).not.toBe(invited.inviteToken);
    expect(await service.acceptInvite(again.inviteToken!, "p-new")).toMatchObject({ status: "ACTIVE" });
  });

  it("does not let a member join two organizations", async () => {
    const { service, scope, team } = await organization();
    const invited = await service.invite(scope, invite({ primaryTeamId: team.id }));
    await expect(service.acceptInvite(invited.inviteToken!, "p-admin")).rejects.toThrow("appartenez déjà");
  });

  it("enforces the seats of the plan and unique e-mails", async () => {
    const { service, scope, team, repo } = await organization();
    await repo.updateOrganization(scope.organization.id, {});
    await service.invite(scope, invite({ primaryTeamId: team.id }));
    await expect(
      service.invite(scope, invite({ primaryTeamId: team.id, email: "MARC@acme.com" })),
    ).rejects.toThrow("déjà dans l'organisation");
    const starter = { ...scope, organization: { ...scope.organization, plan: "STARTER" as const } };
    for (let i = 0; i < 3; i++) {
      await service.invite(starter, invite({ primaryTeamId: team.id, email: `p${i}@acme.com` }));
    }
    // admin + marc + 3 = 5 seats on Starter
    await expect(
      service.invite(starter, invite({ primaryTeamId: team.id, email: "z@acme.com" })),
    ).rejects.toThrow("limité à 5 membres");
  });

  it("filters invented permissions out", async () => {
    const { service, scope, team } = await organization();
    const invited = await service.invite(
      scope,
      invite({ primaryTeamId: team.id, permissions: ["talents.view", "root.everything"] }),
    );
    expect(invited.permissions).toEqual(["talents.view"]);
  });

  it("refuses to link a department that belongs to another organization", async () => {
    const { service, scope } = await organization();
    const other = await service.create(
      { ...actor, profileId: "p-2", email: "b@x.com" },
      { name: "Autre société" },
    );
    const foreign = await service.createDepartment(other.organization.id, {
      name: "Secret",
      look: "users",
      siteIds: [],
      objectives: [],
      status: "ACTIVE",
      accessLevel: "LIMITED",
      deputies: [],
      members: [],
    });
    await expect(service.invite(scope, invite({ primaryTeamId: foreign.id }))).rejects.toThrow("introuvable");
  });

  it("keeps at least one active administrator", async () => {
    const { service, scope } = await organization();
    await expect(service.updateMember(scope, scope.member.id, { role: "MANAGER" })).rejects.toThrow(
      "au moins un administrateur",
    );
    await expect(service.removeMember(scope, scope.member.id)).rejects.toThrow();
    await expect(service.updateMember(scope, scope.member.id, { status: "INACTIVE" })).rejects.toThrow();
  });

  it("applies the role preset when the role changes", async () => {
    const { service, scope, team } = await organization();
    const invited = await service.invite(
      scope,
      invite({ primaryTeamId: team.id, role: "VIEWER", permissions: ["talents.view"] }),
    );
    const updated = await service.updateMember(scope, invited.id, { role: "EVALUATOR" });
    expect(updated.permissions).toEqual(ROLE_PRESETS.EVALUATOR);
  });

  it("prevents department cycles", async () => {
    const { service, scope, team } = await organization();
    const child = await service.createDepartment(scope.organization.id, {
      name: "Recrutement",
      look: "users",
      parentId: team.id,
      siteIds: [],
      objectives: [],
      status: "ACTIVE",
      accessLevel: "LIMITED",
      deputies: [],
      members: [],
    });
    await expect(
      service.updateDepartment(scope.organization.id, team.id, {
        name: "RH",
        look: "users",
        parentId: child.id,
        siteIds: [],
        objectives: [],
        status: "ACTIVE",
        accessLevel: "LIMITED",
        deputies: [],
        members: [],
      }),
    ).rejects.toThrow("rattaché à lui-même");
  });

  it("makes the first team of a person their main team", async () => {
    const { service, scope, team } = await organization();
    const other = await service.createDepartment(scope.organization.id, {
      name: "Finance",
      look: "coins",
      siteIds: [],
      objectives: [],
      status: "ACTIVE",
      accessLevel: "LIMITED",
      deputies: [],
      members: [{ memberId: scope.member.id, role: "Membre" }],
    });
    await service.updateDepartment(scope.organization.id, team.id, {
      name: "RH",
      look: "users",
      siteIds: [],
      objectives: [],
      status: "ACTIVE",
      accessLevel: "LIMITED",
      deputies: [],
      members: [{ memberId: scope.member.id, role: "Membre" }],
    });
    const member = await service.getMember(scope.organization.id, scope.member.id);
    expect(member.teams.find((t) => t.departmentId === other.id)?.primary).toBe(true);
    expect(member.teams.find((t) => t.departmentId === team.id)?.primary).toBe(false);
  });

  it("detaches a deleted member and a deleted site everywhere", async () => {
    const { service, scope, team } = await organization();
    const site = await service.createSite(scope.organization.id, { name: "Siège" });
    const invited = await service.invite(scope, invite({ primaryTeamId: team.id, siteId: site.id }));
    await service.updateDepartment(scope.organization.id, team.id, {
      name: "RH",
      look: "users",
      mainSiteId: site.id,
      siteIds: [site.id],
      objectives: [],
      status: "ACTIVE",
      accessLevel: "LIMITED",
      headId: invited.id,
      deputies: [],
      members: [{ memberId: invited.id, role: "Membre" }],
    });
    await service.deleteSite(scope.organization.id, site.id);
    await service.removeMember(scope, invited.id);
    const department = await service.getDepartment(scope.organization.id, team.id);
    expect(department).toMatchObject({ mainSiteId: null, siteIds: [], headId: null, members: [] });
  });
});

describe("permissions", () => {
  it("lets an administrator do everything but nobody else without the box ticked", () => {
    expect(can({ role: "ADMIN", permissions: [], status: "ACTIVE" }, "jobs.delete")).toBe(true);
    expect(can({ role: "RECRUITER", permissions: ["jobs.create"], status: "ACTIVE" }, "jobs.create")).toBe(
      true,
    );
    expect(can({ role: "RECRUITER", permissions: ["jobs.create"], status: "ACTIVE" }, "jobs.delete")).toBe(
      false,
    );
  });

  it("gives nothing to a deactivated or invited account", () => {
    expect(can({ role: "ADMIN", permissions: [], status: "INACTIVE" }, "talents.view")).toBe(false);
    expect(can({ role: "ADMIN", permissions: [], status: "INVITED" }, "talents.view")).toBe(false);
    expect(can(null, "talents.view")).toBe(false);
  });
});
