import { beforeEach, describe, expect, it } from "vitest";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type { StorageService } from "@/lib/storage/storage";
import { InMemoryEvidenceRepository } from "@/repositories/evidence.memory";
import { InMemoryJobOfferRepository } from "@/repositories/job-offer.memory";
import { InMemoryOpportunityRepository } from "@/repositories/opportunity.memory";
import { InMemoryOrganizationRepository } from "@/repositories/organization.memory";
import { InMemoryPlatformRepository } from "@/repositories/platform.memory";
import { InMemoryProfileRepository } from "@/repositories/profile.memory";
import type { NewEvidence } from "@/types/evidence";
import { EvidenceReviewService } from "./evidence-review.service";
import { EvidenceService } from "./evidence.service";

const storage = {
  async read(key: string) {
    return { bytes: new TextEncoder().encode(key) };
  },
} as unknown as StorageService;

const SKILLS = [{ id: "s1", name: "Power Apps" }];

const record = (over: Partial<NewEvidence> = {}): NewEvidence => ({
  talentSkillId: "s1",
  skillIds: ["s1"],
  type: "PROJECT",
  title: "CRUISE",
  description: "Application métier",
  technologies: ["Power Apps"],
  tags: [],
  visibility: "PUBLIC",
  published: true,
  allowContact: true,
  allowRecommendations: false,
  files: [{ path: "talent-1/a.png", name: "a.png", mimeType: "image/png", sizeBytes: 10 }],
  ...over,
});

let evidence: InMemoryEvidenceRepository;
let profiles: InMemoryProfileRepository;
let review: EvidenceReviewService;
let service: EvidenceService;
let platform: InMemoryPlatformRepository;

beforeEach(async () => {
  evidence = new InMemoryEvidenceRepository();
  profiles = new InMemoryProfileRepository(true);
  const orgRepo = new InMemoryOrganizationRepository();
  const offers = new InMemoryJobOfferRepository(undefined, orgRepo, new InMemoryOpportunityRepository());
  platform = new InMemoryPlatformRepository(orgRepo, profiles, offers);
  profiles.setRole("demo", "SKILLPASS_ADMIN");
  await profiles.ensure({ id: "talent-1", email: "t1@x.com", name: "Awa Koné" });
  review = new EvidenceReviewService(evidence, profiles, platform, () => storage);
  const lookup = { get: async (_profileId: string, id: string) => ({ id, name: "Power Apps" }) };
  service = new EvidenceService(evidence, lookup, lookup, () => storage);
});

describe("requesting a verification", () => {
  it("moves a published evidence to pending, once", async () => {
    const e = await evidence.create("talent-1", record(), SKILLS);
    await service.requestVerification("talent-1", e.id);
    const [stored] = await evidence.list("talent-1");
    expect(stored.status).toBe("PENDING");
    expect(stored.verificationRequestedAt).not.toBeNull();
    await expect(service.requestVerification("talent-1", e.id)).rejects.toBeInstanceOf(ConflictError);
  });

  it("refuses drafts, evidence with nothing to examine, and other people's evidence", async () => {
    const draft = await evidence.create("talent-1", record({ published: false }), SKILLS);
    await expect(service.requestVerification("talent-1", draft.id)).rejects.toBeInstanceOf(ConflictError);
    const empty = await evidence.create("talent-1", record({ files: [] }), SKILLS);
    await expect(service.requestVerification("talent-1", empty.id)).rejects.toBeInstanceOf(ConflictError);
    const ok = await evidence.create("talent-1", record(), SKILLS);
    await expect(service.requestVerification("someone", ok.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("EvidenceReviewService", () => {
  async function pending() {
    const e = await evidence.create("talent-1", record(), SKILLS);
    await service.requestVerification("talent-1", e.id);
    return e;
  }

  it("is closed to everyone but the SkillPass administrator", async () => {
    const e = await pending();
    await expect(review.listPending("talent-1")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(review.decide("talent-1", e.id, "VERIFIED")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(review.openFile("talent-1", e.id, e.files[0].id)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("lists the queue with the talent's name and verifies an evidence, logging the decision", async () => {
    const e = await pending();
    const [item] = await review.listPending("demo");
    expect(item).toMatchObject({ id: e.id, talentName: "Awa Koné", profileId: "talent-1" });

    await review.decide("demo", e.id, "VERIFIED");
    expect((await evidence.list("talent-1"))[0]).toMatchObject({
      status: "VERIFIED",
      verificationNote: null,
    });
    expect(await review.listPending("demo")).toHaveLength(0);
    expect((await platform.listAudit(10))[0]).toMatchObject({
      action: "EVIDENCE_VERIFIED",
      targetId: "talent-1",
    });
    // No longer pending: a second decision is refused.
    await expect(review.decide("demo", e.id, "VERIFIED")).rejects.toBeInstanceOf(ConflictError);
  });

  it("a refusal needs a reason, which the talent can read before asking again", async () => {
    const e = await pending();
    await expect(review.decide("demo", e.id, "REJECTED", "  ")).rejects.toBeInstanceOf(ConflictError);
    await review.decide("demo", e.id, "REJECTED", "Capture illisible");
    expect((await evidence.list("talent-1"))[0]).toMatchObject({
      status: "UNVERIFIED",
      verificationNote: "Capture illisible",
    });
    await service.requestVerification("talent-1", e.id);
    expect((await evidence.list("talent-1"))[0]).toMatchObject({ status: "PENDING", verificationNote: null });
  });

  it("serves a file of the queue to the administrator only", async () => {
    const e = await pending();
    const opened = await review.openFile("demo", e.id, e.files[0].id);
    expect(opened.fileName).toBe("a.png");
    await expect(review.openFile("demo", e.id, "nope")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("editing a verified evidence", () => {
  it("sends it back to unverified", async () => {
    const e = await evidence.create("talent-1", record(), SKILLS);
    await service.requestVerification("talent-1", e.id);
    await review.decide("demo", e.id, "VERIFIED");
    await evidence.update("talent-1", e.id, record({ title: "Autre titre" }), SKILLS, [e.files[0].id]);
    expect((await evidence.list("talent-1"))[0]).toMatchObject({
      title: "Autre titre",
      status: "UNVERIFIED",
    });
  });
});
