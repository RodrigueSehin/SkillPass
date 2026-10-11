import { describe, expect, it } from "vitest";
import { InMemoryJobOfferRepository } from "@/repositories/job-offer.memory";
import { InMemoryOpportunityRepository } from "@/repositories/opportunity.memory";
import { InMemoryOrganizationRepository } from "@/repositories/organization.memory";
import { InMemoryPlatformRepository } from "@/repositories/platform.memory";
import { InMemoryProfileRepository } from "@/repositories/profile.memory";
import { JobOfferService } from "./job-offer.service";
import { OrganizationService } from "./organization.service";
import { PlatformAdminService } from "./platform-admin.service";

async function setup() {
  const orgRepo = new InMemoryOrganizationRepository();
  const profiles = new InMemoryProfileRepository(true);
  const opportunities = new InMemoryOpportunityRepository();
  const offerRepo = new InMemoryJobOfferRepository(undefined, orgRepo, opportunities);
  const orgs = new OrganizationService(orgRepo);
  const offers = new JobOfferService(offerRepo, opportunities, orgRepo);
  const platform = new InMemoryPlatformRepository(orgRepo, profiles, offerRepo);
  const service = new PlatformAdminService(platform, profiles, orgs, offers);

  // "demo" is the SkillPass administrator; "talent-1" is an ordinary account.
  profiles.setRole("demo", "SKILLPASS_ADMIN");
  await profiles.ensure({ id: "talent-1", email: "t1@x.com", name: "Awa Koné" });
  const scope = await orgs.create(
    { profileId: "talent-1", firstName: "Awa", lastName: "Koné", email: "awa@acme.com" },
    { name: "ACME", industry: "Logistique & Transport", website: "https://acme.example.com" },
  );
  return { service, orgs, profiles, orgId: scope.organization.id };
}

describe("PlatformAdminService", () => {
  it("refuses everyone who is not the SkillPass administrator", async () => {
    const { service, orgId } = await setup();
    await expect(service.dashboard("talent-1")).rejects.toThrow();
    await expect(service.verify("talent-1", orgId)).rejects.toThrow();
    await expect(service.setRole("talent-1", "demo", "TALENT")).rejects.toThrow();
    await expect(service.listAudit("nobody")).rejects.toThrow();
  });

  it("a new company starts pending, then is validated, and the decision is logged", async () => {
    const { service, orgId } = await setup();
    const [pending] = await service.listOrganizations("demo", "PENDING");
    expect(pending?.organization.id).toBe(orgId);
    expect(pending?.contactEmail).toBe("awa@acme.com");

    const verified = await service.verify("demo", orgId);
    expect(verified.verified).toBe(true);
    expect(verified.verificationStatus).toBe("VERIFIED");
    expect(await service.listOrganizations("demo", "PENDING")).toHaveLength(0);
    const audit = await service.listAudit("demo");
    expect(audit[0]).toMatchObject({ action: "ORG_VERIFIED", targetId: orgId, actorId: "demo" });
  });

  it("a refusal needs a reason, which the company can then read", async () => {
    const { service, orgs, orgId } = await setup();
    await expect(service.reject("demo", orgId, "  ")).rejects.toThrow(/motif/i);
    await service.reject("demo", orgId, "Aucun justificatif d'existence légale");
    const org = await orgs.getOrganization(orgId);
    expect(org.verificationStatus).toBe("REJECTED");
    expect(org.rejectionReason).toContain("justificatif");
    // Reopening clears the reason.
    await service.reopen("demo", orgId);
    expect((await orgs.getOrganization(orgId)).rejectionReason).toBeNull();
  });

  it("suspends, reactivates, changes the plan and the maintenance mode", async () => {
    const { service, orgs, orgId } = await setup();
    await service.verify("demo", orgId);
    expect((await service.suspend("demo", orgId)).deactivated).toBe(true);
    expect((await service.reactivate("demo", orgId)).deactivated).toBe(false);
    expect((await service.setPlan("demo", orgId, "PRO")).plan).toBe("PRO");
    await service.setMaintenance("demo", orgId, true);
    expect((await orgs.getOrganization(orgId)).settings.maintenance).toBe(true);
  });

  it("edits a member's access but keeps the last administrator", async () => {
    const { service, orgId } = await setup();
    const detail = await service.organization("demo", orgId);
    const admin = detail.members.find((m) => m.role === "ADMIN")!;
    await expect(service.updateMember("demo", orgId, admin.id, { role: "VIEWER" })).rejects.toThrow(
      /au moins un administrateur/i,
    );
    const updated = await service.updateMember("demo", orgId, admin.id, {
      permissions: ["talents.view", "not.a.permission"],
    });
    expect(updated.permissions).toEqual(["talents.view"]);
  });

  it("assigns platform roles, never to oneself and never removing the last administrator", async () => {
    const { service } = await setup();
    const updated = await service.setRole("demo", "talent-1", "VERIFIER");
    expect(updated.role).toBe("VERIFIER");
    await expect(service.setRole("demo", "demo", "TALENT")).rejects.toThrow(/propre rôle/i);
    await expect(service.setRole("demo", "talent-1", "GOD")).rejects.toThrow();
    // A second administrator can be demoted, the last one cannot.
    await service.setRole("demo", "talent-1", "SKILLPASS_ADMIN");
    await service.setRole("demo", "talent-1", "TALENT");
    const log = await service.listAudit("demo");
    expect(log.filter((e) => e.action === "ROLE_CHANGED")).toHaveLength(3);
  });

  it("gives a dashboard across the platform", async () => {
    const { service } = await setup();
    const { stats, pending } = await service.dashboard("demo");
    expect(stats.organizations.pending).toBe(1);
    expect(stats.profiles).toBeGreaterThanOrEqual(2);
    expect(pending).toHaveLength(1);
  });
});

describe("talent plan", () => {
  it("the administrator moves a talent between Free and Pro, and it is logged", async () => {
    const { service, profiles } = await setup();
    expect((await profiles.findById("talent-1"))?.plan).toBe("FREE");
    const saved = await service.setTalentPlan("demo", "talent-1", "PRO");
    expect(saved.plan).toBe("PRO");
    await expect(service.setTalentPlan("demo", "talent-1", "GOLD")).rejects.toThrow();
    await expect(service.setTalentPlan("talent-1", "talent-1", "PRO")).rejects.toThrow();
    expect((await service.listAudit("demo"))[0]).toMatchObject({
      action: "TALENT_PLAN",
      detail: "Free → Pro",
    });
  });
});
