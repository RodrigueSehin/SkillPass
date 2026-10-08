import { describe, expect, it } from "vitest";
import { ROLE_PRESETS } from "@/lib/business/permissions";
import { PLANS } from "@/lib/business/plans";
import { InMemoryEvaluationRepository } from "@/repositories/evaluation.memory";
import { InMemoryJobOfferRepository } from "@/repositories/job-offer.memory";
import { InMemoryOpportunityRepository } from "@/repositories/opportunity.memory";
import { InMemoryOrgSkillRepository } from "@/repositories/org-skill.memory";
import { InMemoryOrganizationRepository } from "@/repositories/organization.memory";
import { brandingSchema, complianceSchema, notificationsSchema } from "@/schemas/org-settings";
import { DEFAULT_ORG_SETTINGS, withDefaults } from "@/types/org-settings";
import { JobOfferService } from "./job-offer.service";
import { OrganizationLifecycleService } from "./organization-lifecycle.service";
import { OrganizationService } from "./organization.service";
import { publishableJobOfferSchema } from "@/schemas/job-offer";
import type { JobOfferInput } from "@/types/job-offer";

const NOW = new Date("2026-10-07T10:00:00.000Z");

async function setup() {
  const orgRepo = new InMemoryOrganizationRepository();
  const opportunities = new InMemoryOpportunityRepository();
  const offers = new InMemoryJobOfferRepository(undefined, orgRepo, opportunities);
  const evaluations = new InMemoryEvaluationRepository(undefined, orgRepo);
  const skills = new InMemoryOrgSkillRepository();
  const orgs = new OrganizationService(orgRepo, () => NOW);
  const offerService = new JobOfferService(offers, opportunities, orgRepo, () => NOW);
  const removed: string[] = [];
  const lifecycle = new OrganizationLifecycleService(
    orgs,
    offers,
    offerService,
    opportunities,
    evaluations,
    skills,
    () => ({ remove: async (key: string) => void removed.push(key) }) as never,
    () => NOW,
  );
  const scope = await orgs.create(
    { profileId: "p1", firstName: "Awa", lastName: "Koné", email: "awa@acme.com" },
    { name: "ACME", industry: "Logistique & Transport" },
  );
  return {
    orgs,
    orgRepo,
    opportunities,
    offers,
    offerService,
    lifecycle,
    scope,
    removed,
    evaluations,
    skills,
  };
}

async function publishOffer(ctx: Awaited<ReturnType<typeof setup>>) {
  const department = await ctx.orgs.createDepartment(ctx.scope.organization.id, {
    name: "IT",
    look: "monitor",
    siteIds: [],
    objectives: [],
    status: "ACTIVE",
    accessLevel: "LIMITED",
    deputies: [],
    members: [],
  });
  const input = publishableJobOfferSchema.parse({
    title: "Développeur",
    description: "Dans le cadre du renforcement de notre équipe IT.\n\n- Développer\n- Livrer",
    location: "Abidjan, Côte d'Ivoire",
    departmentId: department.id,
    deadline: "2026-11-30",
    skills: ["Power Apps"],
  }) as JobOfferInput;
  return ctx.offerService.save(ctx.scope, null, input, true, null);
}

describe("organization settings", () => {
  it("completes stored settings with the defaults", () => {
    expect(withDefaults(undefined)).toEqual(DEFAULT_ORG_SETTINGS);
    const partial = withDefaults({
      branding: { primary: "#112233" },
      notifications: { matrix: { "job.application": { sms: true } } },
    });
    expect(partial.branding.primary).toBe("#112233");
    expect(partial.branding.accent).toBe(DEFAULT_ORG_SETTINGS.branding.accent);
    expect(partial.notifications.matrix["job.application"]).toEqual({ inApp: true, email: true, sms: true });
    expect(partial.notifications.matrix["org.security"]!.sms).toBe(true);
  });

  it("saves a section without touching the others", async () => {
    const { orgs, scope } = await setup();
    const branding = brandingSchema.parse({ ...DEFAULT_ORG_SETTINGS.branding, primary: "#123456" });
    const after = await orgs.saveSettings(scope.organization.id, { branding });
    expect(after.settings.branding.primary).toBe("#123456");
    const next = await orgs.saveSettings(scope.organization.id, { maintenance: true });
    expect(next.settings.maintenance).toBe(true);
    expect(next.settings.branding.primary).toBe("#123456");
  });

  it("rejects bad colours, hours and regulations", () => {
    expect(brandingSchema.safeParse({ ...DEFAULT_ORG_SETTINGS.branding, primary: "red" }).success).toBe(
      false,
    );
    expect(
      brandingSchema.safeParse({ ...DEFAULT_ORG_SETTINGS.branding, welcomeText: "x".repeat(201) }).success,
    ).toBe(false);
    const base = DEFAULT_ORG_SETTINGS.notifications;
    expect(notificationsSchema.safeParse(base).success).toBe(true);
    expect(notificationsSchema.safeParse({ ...base, start: "19:00", end: "08:00" }).success).toBe(false);
    expect(notificationsSchema.safeParse({ ...base, days: [] }).success).toBe(false);
    expect(
      notificationsSchema.safeParse({
        ...base,
        matrix: { "made.up": { inApp: true, email: true, sms: true } },
      }).success,
    ).toBe(false);
    expect(complianceSchema.safeParse({ regulations: ["RGPD", "NOPE"], retentionYears: 5 }).success).toBe(
      false,
    );
    expect(complianceSchema.safeParse({ regulations: ["RGPD"], retentionYears: 4 }).success).toBe(false);
    expect(complianceSchema.safeParse({ regulations: ["RGPD"], retentionYears: 10 }).success).toBe(true);
  });
});

describe("plan change", () => {
  it("moves to another plan and refuses one too small for the members", async () => {
    const { orgs, scope } = await setup();
    const team = await orgs.createDepartment(scope.organization.id, {
      name: "RH",
      look: "users",
      siteIds: [],
      objectives: [],
      status: "ACTIVE",
      accessLevel: "LIMITED",
      deputies: [],
      members: [],
    });
    expect((await orgs.changePlan(scope.organization.id, "PRO")).plan).toBe("PRO");
    for (let i = 0; i < PLANS.STARTER.maxMembers!; i++) {
      await orgs.invite(
        { ...scope, organization: { ...scope.organization, plan: "PRO" } },
        {
          firstName: `M${i}`,
          lastName: "X",
          email: `m${i}@acme.com`,
          jobTitle: "Recruteur",
          role: "VIEWER",
          permissions: ROLE_PRESETS.VIEWER,
          primaryTeamId: team.id,
          secondaryTeamIds: [],
        },
      );
    }
    await expect(orgs.changePlan(scope.organization.id, "STARTER")).rejects.toThrow("Retirez des membres");
    expect((await orgs.changePlan(scope.organization.id, "BUSINESS")).plan).toBe("BUSINESS");
  });
});

describe("leaving, suspending and deleting", () => {
  it("lets a member leave but keeps the last administrator", async () => {
    const { orgs, scope } = await setup();
    await expect(orgs.leave(scope)).rejects.toThrow("autre administrateur");
  });

  it("suspends: offers leave the job board, and come back on reactivation", async () => {
    const ctx = await setup();
    await publishOffer(ctx);
    const board = async () => (await ctx.opportunities.list()).filter((o) => o.company === "ACME");
    expect(await board()).toHaveLength(1);
    await ctx.lifecycle.suspend(ctx.scope);
    expect((await ctx.orgRepo.getOrganization(ctx.scope.organization.id))!.deactivated).toBe(true);
    expect(await board()).toHaveLength(0);
    await ctx.lifecycle.resume(ctx.scope);
    expect((await ctx.orgRepo.getOrganization(ctx.scope.organization.id))!.deactivated).toBe(false);
    expect(await board()).toHaveLength(1);
  });

  it("asks for the exact name, then deletes everything and clears the job board", async () => {
    const ctx = await setup();
    await publishOffer(ctx);
    await expect(ctx.lifecycle.deleteOrganization(ctx.scope, "acme")).rejects.toThrow("ne correspond pas");
    expect(await ctx.orgRepo.getOrganization(ctx.scope.organization.id)).not.toBeNull();
    await ctx.lifecycle.deleteOrganization(ctx.scope, " ACME ");
    expect(await ctx.orgRepo.getOrganization(ctx.scope.organization.id)).toBeNull();
    expect((await ctx.opportunities.list()).filter((o) => o.company === "ACME")).toHaveLength(0);
    expect(await ctx.orgRepo.findMembershipByProfile("p1")).toBeNull();
  });

  it("only an administrator deletes", async () => {
    const { orgs, scope } = await setup();
    const viewer = { ...scope, member: { ...scope.member, role: "VIEWER" as const } };
    await expect(orgs.deleteOrganization(viewer, "ACME")).rejects.toThrow("administrateur");
  });

  it("exports readable data without any invitation token", async () => {
    const ctx = await setup();
    await ctx.skills.create(ctx.scope.organization.id, {
      name: "Écoute",
      category: "Communication",
      kind: "TRANSVERSAL",
      description: "Écouter",
      keywords: ["a"],
      synonyms: [],
    });
    await publishOffer(ctx);
    const data = await ctx.lifecycle.exportData(ctx.scope);
    expect(data.jobOffers).toHaveLength(1);
    expect(data.skills).toHaveLength(1);
    expect(data.members).toHaveLength(1);
    expect(JSON.stringify(data)).not.toMatch(/inviteToken|logoVersion/);
    expect((data.organization as { name: string }).name).toBe("ACME");
  });
});
