import { describe, expect, it } from "vitest";
import {
  displayStatus,
  domainOf,
  levelOf,
  regionOf,
  salaryLabel,
  splitDescription,
  toOpportunityInput,
} from "@/lib/business/job-offer-mapping";
import { InMemoryJobOfferRepository } from "@/repositories/job-offer.memory";
import { InMemoryOpportunityRepository } from "@/repositories/opportunity.memory";
import { InMemoryOrganizationRepository } from "@/repositories/organization.memory";
import { jobOfferSchema, publishableJobOfferSchema } from "@/schemas/job-offer";
import type { JobOfferInput } from "@/types/job-offer";
import { DEFAULT_ORG_SETTINGS } from "@/types/org-settings";
import { JobOfferService } from "./job-offer.service";
import { OrganizationService, type OrgScope } from "./organization.service";

const NOW = new Date("2026-10-07T10:00:00.000Z");
const DAY = 86_400_000;
const day = (offset: number) => new Date(NOW.getTime() + offset * DAY).toISOString().slice(0, 10);

const complete = (over: Partial<JobOfferInput> = {}): JobOfferInput =>
  publishableJobOfferSchema.parse({
    title: "Power Platform Developer",
    description:
      "Dans le cadre du renforcement de notre équipe IT.\n\n- Développer des applications\n- Automatiser des processus",
    contract: "CDI",
    location: "Abidjan, Côte d'Ivoire",
    workMode: "HYBRID",
    departmentId: "placeholder",
    experience: "3 à 5 ans",
    deadline: day(30),
    skills: ["Power Apps", "Dataverse"],
    ...over,
  }) as JobOfferInput;

async function setup(plan: OrgScope["organization"]["plan"] = "BUSINESS") {
  const orgs = new InMemoryOrganizationRepository();
  const opportunities = new InMemoryOpportunityRepository();
  const offers = new InMemoryJobOfferRepository(undefined, orgs, opportunities);
  const service = new JobOfferService(offers, opportunities, orgs, () => NOW);
  const organizations = new OrganizationService(orgs, () => NOW);
  const scope = await organizations.create(
    { profileId: "p1", firstName: "Awa", lastName: "Koné", email: "awa@acme.com" },
    { name: "ACME Côte d'Ivoire", industry: "Logistique & Transport" },
  );
  const department = await organizations.createDepartment(scope.organization.id, {
    name: "IT",
    look: "monitor",
    siteIds: [],
    objectives: [],
    status: "ACTIVE",
    accessLevel: "LIMITED",
    deputies: [],
    members: [],
  });
  const withPlan = { ...scope, organization: { ...scope.organization, plan } };
  const input = (over: Partial<JobOfferInput> = {}) => ({
    ...complete(),
    departmentId: department.id,
    ...over,
  });
  const board = async () => (await opportunities.list()).filter((o) => o.company === "ACME Côte d'Ivoire");
  return { service, orgs, organizations, opportunities, scope: withPlan, department, input, board };
}

describe("job offer mapping", () => {
  it("guesses the region, domain and level of an offer", () => {
    expect(regionOf({ location: "Abidjan, Côte d'Ivoire", workMode: "HYBRID" })).toBe("CI");
    expect(regionOf({ location: "Paris, France", workMode: "ONSITE" })).toBe("EUROPE");
    expect(regionOf({ location: "Dakar", workMode: "ONSITE" })).toBe("AFRICA");
    expect(regionOf({ location: "Paris", workMode: "REMOTE" })).toBe("REMOTE");
    expect(domainOf({ title: "Data Analyst", skills: ["Power BI"] })).toBe("Data & IA");
    expect(domainOf({ title: "Développeur", skills: ["React"] })).toBe("Tech & Digital");
    expect(levelOf("Moins d'1 an")).toBe("BEGINNER");
    expect(levelOf("3 à 5 ans")).toBe("INTERMEDIATE");
    expect(levelOf("10 ans et plus")).toBe("SENIOR");
  });

  it("words the salary", () => {
    expect(salaryLabel({ salaryMin: 800_000, salaryMax: 1_200_000, currency: "FCFA" })).toBe(
      "800 000 – 1 200 000 FCFA",
    );
    expect(salaryLabel({ salaryMin: 800_000, salaryMax: null, currency: "EUR" })).toBe(
      "À partir de 800 000 EUR",
    );
    expect(salaryLabel({ salaryMin: null, salaryMax: null, currency: "FCFA" })).toBeNull();
  });

  it("turns bullet lines into missions and strips the markdown", () => {
    expect(splitDescription("Un **poste** clé.\n- Développer\n- [Lien](https://x.io) utile")).toEqual({
      description: "Un poste clé.",
      missions: ["Développer", "Lien utile"],
    });
  });

  it("builds the talent-side sheet", () => {
    const org = {
      name: "ACME",
      industry: "Énergie",
      size: "51 - 200",
      description: "À propos",
      verified: true,
      website: "https://acme.com",
    };
    const sheet = toOpportunityInput(
      {
        ...complete(),
        id: "o",
        status: "PUBLISHED",
        opportunityId: null,
        createdById: null,
        publishedAt: NOW.toISOString(),
        createdAt: NOW.toISOString(),
        salaryMin: 1,
        salaryMax: 2,
      },
      {
        ...org,
        id: "org",
        slug: "acme",
        address: null,
        phone: null,
        email: null,
        timezone: "UTC",
        language: "fr",
        plan: "BUSINESS",
        logoVersion: null,
        settings: DEFAULT_ORG_SETTINGS,
        deactivated: false,
        createdAt: NOW.toISOString(),
      },
      NOW,
    );
    expect(sheet).toMatchObject({
      company: "ACME",
      kind: "EMPLOI",
      region: "CI",
      commitment: "CDI",
      level: "INTERMEDIATE",
      companySector: "Énergie",
      companyVerified: true,
      salary: "1 – 2 FCFA",
    });
    expect(sheet.missions).toEqual(["Développer des applications", "Automatiser des processus"]);
  });

  it("reads a published offer past its deadline as expired", () => {
    expect(displayStatus({ status: "PUBLISHED", deadline: "2026-10-01" }, "2026-10-07")).toBe("EXPIRED");
    expect(displayStatus({ status: "PUBLISHED", deadline: "2026-10-30" }, "2026-10-07")).toBe("PUBLISHED");
    expect(displayStatus({ status: "DRAFT", deadline: "2026-10-01" }, "2026-10-07")).toBe("DRAFT");
  });
});

describe("job offer validation", () => {
  it("accepts a half-written draft but not a half-written publication", () => {
    expect(jobOfferSchema.safeParse({ title: "Chef de projet" }).success).toBe(true);
    expect(jobOfferSchema.safeParse({ title: "x" }).success).toBe(false);
    const result = publishableJobOfferSchema.safeParse({ title: "Chef de projet" });
    expect(result.success).toBe(false);
    expect(jobOfferSchema.safeParse({ title: "Chef de projet", salaryMin: 5, salaryMax: 1 }).success).toBe(
      false,
    );
  });
});

describe("job offer service", () => {
  it("keeps a draft off the talent job board", async () => {
    const { service, scope, input, board } = await setup();
    const draft = await service.save(scope, null, input(), false, scope.member.id);
    expect(draft.status).toBe("DRAFT");
    expect(await board()).toHaveLength(0);
  });

  it("publishes an offer on the board with its organization and counts it", async () => {
    const { service, scope, input, board, opportunities } = await setup();
    const offer = await service.save(scope, null, input(), true, scope.member.id);
    expect(offer).toMatchObject({ status: "PUBLISHED" });
    const [onBoard] = await board();
    expect(onBoard).toMatchObject({
      title: "Power Platform Developer",
      companySector: "Logistique & Transport",
      region: "CI",
    });

    opportunities.addApplicant(onBoard.id);
    opportunities.addApplicant(onBoard.id);
    const [row] = await service.list(scope.organization.id);
    expect(row).toMatchObject({ id: offer.id, displayStatus: "PUBLISHED", applicants: 2 });
  });

  it("updates the board when a published offer is edited, and hides it when closed or deleted", async () => {
    const { service, scope, input, board } = await setup();
    const offer = await service.save(scope, null, input(), true, scope.member.id);
    await service.save(
      scope,
      offer.id,
      input({ title: "Développeur Power Platform Senior" }),
      false,
      scope.member.id,
    );
    expect((await board())[0].title).toBe("Développeur Power Platform Senior");

    await service.close(scope, offer.id);
    expect(await board()).toHaveLength(0);
    expect((await service.list(scope.organization.id))[0].displayStatus).toBe("CLOSED");

    const other = await service.save(scope, null, input({ title: "Autre poste" }), true, scope.member.id);
    expect(await board()).toHaveLength(1);
    await service.remove(scope, other.id);
    expect(await board()).toHaveLength(0);
  });

  it("does not publish restricted or internal offers on the public board", async () => {
    const { service, scope, input, board } = await setup();
    await service.save(scope, null, input({ visibility: "RESTRICTED" }), true, scope.member.id);
    await service.save(scope, null, input({ channels: ["LINKEDIN"] }), true, scope.member.id);
    expect(await board()).toHaveLength(0);
  });

  it("hides an offer after its deadline and before its publication date", async () => {
    const { service, scope, input, board } = await setup();
    await service.save(scope, null, input({ deadline: day(-1) }), true, scope.member.id);
    expect(await board()).toHaveLength(0);
    await service.save(scope, null, input({ publishOn: day(5), title: "Bientôt" }), true, scope.member.id);
    expect(await board()).toHaveLength(0);
  });

  it("publishes a saved draft only when it is complete", async () => {
    const { service, scope, department } = await setup();
    const draft = await service.save(
      scope,
      null,
      jobOfferSchema.parse({ title: "Brouillon", departmentId: department.id }) as JobOfferInput,
      false,
      null,
    );
    await expect(service.publish(scope, draft.id)).rejects.toThrow();
  });

  it("applies the monthly limit of the plan", async () => {
    const { service, scope, input } = await setup("STARTER");
    for (let i = 0; i < 10; i++)
      await service.save(scope, null, input({ title: `Offre ${i}` }), true, scope.member.id);
    await expect(
      service.save(scope, null, input({ title: "Offre 11" }), true, scope.member.id),
    ).rejects.toThrow("limité à 10 offres");
    // Drafts are free, and editing an offer already counted is allowed.
    await expect(
      service.save(scope, null, input({ title: "Brouillon" }), false, scope.member.id),
    ).resolves.toBeTruthy();
  });

  it("keeps offers inside their organization", async () => {
    const { service, scope, organizations, input } = await setup();
    const offer = await service.save(scope, null, input(), false, scope.member.id);
    const other = await organizations.create(
      { profileId: "p2", firstName: "B", lastName: "C", email: "b@x.com" },
      { name: "Autre" },
    );
    await expect(service.get(other.organization.id, offer.id)).rejects.toThrow("introuvable");
    await expect(service.remove(other, offer.id)).rejects.toThrow("introuvable");
    await expect(service.save(other, null, input(), false, null)).rejects.toThrow("Département introuvable");
  });

  it("duplicates an offer as a fresh draft", async () => {
    const { service, scope, input } = await setup();
    const offer = await service.save(scope, null, input(), true, scope.member.id);
    const copy = await service.duplicate(scope, offer.id, scope.member.id);
    expect(copy).toMatchObject({
      status: "DRAFT",
      title: "Copie de Power Platform Developer",
      deadline: null,
    });
  });
});
