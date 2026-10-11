import { describe, expect, it } from "vitest";
import { CrudService, InMemoryCrudRepository } from "@/lib/crud";
import { PLAN_COMPARISON, PLANS } from "@/lib/business/plans";
import { permissionGroupsFor } from "@/lib/business/permissions";
import {
  businessHas,
  featureOfPermission,
  parseTalentPlan,
  planAllowsPermission,
  talentHas,
  talentLimit,
} from "./entitlements";
import { assertWithinCapacity, type Capacity } from "./limits";

describe("Business entitlements", () => {
  it("Starter has no matching, evaluations or analytics; Pro and above do", () => {
    expect(businessHas("STARTER", "talentSearch")).toBe(true);
    for (const f of ["matching", "evaluations", "analytics"] as const) {
      expect(businessHas("STARTER", f)).toBe(false);
      expect(businessHas("PRO", f)).toBe(true);
    }
    expect(businessHas("PRO", "integrations")).toBe(false);
    expect(businessHas("BUSINESS", "integrations")).toBe(true);
  });

  it("the comparison table is built from the same rules", () => {
    const row = PLAN_COMPARISON.find((r) => r.label === "Matching IA")!;
    expect(row.values).toEqual({ STARTER: false, PRO: true, BUSINESS: true, ENTERPRISE: true });
    expect(Object.keys(PLANS)).toHaveLength(4);
  });

  it("a permission is usable only when its feature is in the plan", () => {
    expect(featureOfPermission("evaluations.create")).toBe("evaluations");
    expect(featureOfPermission("talents.view")).toBeNull();
    expect(planAllowsPermission("STARTER", "evaluations.create")).toBe(false);
    expect(planAllowsPermission("STARTER", "analytics.view")).toBe(false);
    expect(planAllowsPermission("STARTER", "talents.recommendations")).toBe(false);
    expect(planAllowsPermission("STARTER", "jobs.create")).toBe(true);
    expect(planAllowsPermission("PRO", "evaluations.create")).toBe(true);
  });

  it("the permission editors do not offer what the plan lacks", () => {
    const keys = (plan: "STARTER" | "PRO") =>
      permissionGroupsFor(plan).flatMap((g) => g.permissions.map((p) => p.key));
    expect(keys("STARTER").some((k) => k.startsWith("evaluations."))).toBe(false);
    expect(keys("STARTER")).not.toContain("analytics.view");
    expect(keys("STARTER")).toContain("talents.view");
    expect(keys("PRO").some((k) => k.startsWith("evaluations."))).toBe(true);
  });
});

describe("talent entitlements", () => {
  it("Free has no assessments or portfolio and badges; Pro does", () => {
    expect(talentHas("FREE", "assessments")).toBe(false);
    expect(talentHas("FREE", "portfolioBadges")).toBe(false);
    expect(talentHas("PRO", "assessments")).toBe(true);
    expect(talentHas("PRO", "portfolioBadges")).toBe(true);
  });

  it("Free is limited to 5 skills and 3 projects, Pro is not", () => {
    expect(talentLimit("FREE", "skills")).toBe(5);
    expect(talentLimit("FREE", "projects")).toBe(3);
    expect(talentLimit("PRO", "skills")).toBeNull();
  });

  it("anything unknown counts as Free", () => {
    expect(parseTalentPlan("GOLD")).toBe("FREE");
    expect(parseTalentPlan(undefined)).toBe("FREE");
    expect(parseTalentPlan("PRO")).toBe("PRO");
  });
});

describe("plan limits when adding items", () => {
  const free: Capacity = async () => ({ max: 3, planName: "Free", noun: ["projet", "projets"] });
  const pro: Capacity = async () => ({ max: null, planName: "Pro", noun: ["projet", "projets"] });
  type Item = { id: string; name: string };
  const repo = () =>
    new InMemoryCrudRepository<Item, { name: string }>(
      undefined,
      () => [],
      (input) => ({ name: input.name }),
    );

  it("refuses the item that goes over the limit, with a message naming the plan", async () => {
    const service = new CrudService(repo(), "Projet", free);
    for (const name of ["a", "b", "c"]) await service.add("p1", { name });
    await expect(service.add("p1", { name: "d" })).rejects.toThrow(/plan Free est limité à 3 projets/);
    // Another profile has its own count.
    await expect(service.add("p2", { name: "x" })).resolves.toBeTruthy();
  });

  it("lets an unlimited plan add as many as it wants", async () => {
    const service = new CrudService(repo(), "Projet", pro);
    for (let i = 0; i < 6; i++) await service.add("p1", { name: String(i) });
    expect(await service.list("p1")).toHaveLength(6);
  });

  it("does nothing without a capacity", async () => {
    await expect(assertWithinCapacity(undefined, "p1", async () => 99)).resolves.toBeUndefined();
  });
});
