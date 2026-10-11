import { beforeEach, describe, expect, it } from "vitest";
import { ASSESSMENT_BANK } from "@/config/assessment-bank";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { InMemoryAttemptRepository } from "@/repositories/attempt.memory";
import { InMemoryCredentialRepository } from "@/repositories/credential.memory";
import { CREDENTIAL_ID_PATTERN, generateCredentialId } from "@/repositories/credential.repository";
import { InMemoryProfileRepository } from "@/repositories/profile.memory";
import { InMemoryRecommendationRepository } from "@/repositories/recommendation.memory";
import { InMemoryTalentSkillRepository } from "@/repositories/talent-skill.memory";
import { AssessmentService } from "./assessment.service";
import { CredentialService } from "./credential.service";
import { RecommendationService } from "./recommendation.service";
import type { AnswerInput } from "@/types/verification";

const ME = "demo";
const OTHER = "other";
const REVIEWER = "reviewer";

let clock: Date;
let skills: InMemoryTalentSkillRepository;
let profiles: InMemoryProfileRepository;
let assessments: AssessmentService;
let credentials: CredentialService;

const advance = (ms: number) => (clock = new Date(clock.getTime() + ms));
const HOUR = 3_600_000;
const MIN = 60_000;

beforeEach(async () => {
  clock = new Date("2026-06-01T10:00:00Z");
  skills = new InMemoryTalentSkillRepository(ME);
  profiles = new InMemoryProfileRepository(true);
  await profiles.ensure({ id: REVIEWER, email: "r@x.com", name: "Revue Eur" });
  profiles.setRole(REVIEWER, "VERIFIER");
  await profiles.ensure({ id: OTHER, email: "o@x.com", name: "Autre Personne" });
  await profiles.setPlan(OTHER, "PRO");
  credentials = new CredentialService(new InMemoryCredentialRepository(), profiles, () => clock);
  assessments = new AssessmentService({
    attempts: new InMemoryAttemptRepository(),
    skills,
    profiles,
    credentials,
    now: () => clock,
    cooldownHours: 24,
  });
});

const bank = (slug: string) => ASSESSMENT_BANK.find((a) => a.slug === slug)!;
const perfect = (slug: string): AnswerInput[] =>
  bank(slug).questions.map((q) => ({ questionId: q.id, selected: q.correctIndex }));
const wrong = (slug: string): AnswerInput[] =>
  bank(slug).questions.map((q) => ({ questionId: q.id, selected: (q.correctIndex + 1) % q.options.length }));
const skillNamed = async (name: string, profileId = ME) =>
  (await skills.list(profileId)).find((s) => s.name === name)!;

describe("starting an assessment", () => {
  it("requires the user to own the matching skill", async () => {
    await expect(assessments.start(OTHER, "power-apps")).rejects.toBeInstanceOf(ConflictError);
    const overview = (await assessments.list(OTHER)).find((a) => a.slug === "power-apps")!;
    expect(overview.blockedReason).toMatch(/Ajoutez d'abord/);
  });

  it("is reserved to the Pro plan", async () => {
    await profiles.setPlan(OTHER, "FREE");
    await expect(assessments.start(OTHER, "power-apps")).rejects.toThrow(/plan Pro/);
  });

  it("rejects unknown assessments", async () => {
    await expect(assessments.start(ME, "cobol")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("resumes the running attempt instead of opening a second one", async () => {
    const a = await assessments.start(ME, "power-apps");
    expect((await assessments.start(ME, "power-apps")).id).toBe(a.id);
  });

  it("sets a server-side deadline from the assessment duration", async () => {
    const a = await assessments.start(ME, "power-apps");
    expect(Date.parse(a.deadlineAt) - clock.getTime()).toBe(15 * MIN);
  });

  it("never sends correct answers or explanations to the browser", async () => {
    const a = await assessments.start(ME, "power-apps");
    const takeable = await assessments.getTakeable(ME, a.id);
    const json = JSON.stringify(takeable);
    expect(json).not.toContain("correctIndex");
    expect(json).not.toContain("explanation");
    expect(takeable.questions).toHaveLength(9);
  });

  it("does not let another user open someone's attempt", async () => {
    const a = await assessments.start(ME, "power-apps");
    await expect(assessments.getTakeable(OTHER, a.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(assessments.submit(OTHER, a.id, perfect("power-apps"))).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("submitting an assessment", () => {
  it("verifies the skill, applies the measured score and issues a credential on a pass", async () => {
    const a = await assessments.start(ME, "power-apps");
    advance(5 * MIN);
    const { attempt, credential } = await assessments.submit(ME, a.id, perfect("power-apps"));

    expect(attempt).toMatchObject({ status: "PASSED", overallScore: 100, level: "EXPERT" });
    expect(credential?.credentialId).toMatch(CREDENTIAL_ID_PATTERN);
    const skill = await skillNamed("Power Apps");
    expect(skill).toMatchObject({ verificationStatus: "VERIFIED", level: "EXPERT", score: 100 });
  });

  it("leaves the skill untouched and issues nothing on a fail", async () => {
    const before = await skillNamed("Power Automate");
    const a = await assessments.start(ME, "power-automate");
    const { attempt, credential } = await assessments.submit(ME, a.id, wrong("power-automate"));
    expect(attempt.status).toBe("FAILED");
    expect(credential).toBeNull();
    expect(await skillNamed("Power Automate")).toEqual(before);
  });

  it("rejects a second submission of the same attempt", async () => {
    const a = await assessments.start(ME, "power-apps");
    await assessments.submit(ME, a.id, perfect("power-apps"));
    await expect(assessments.submit(ME, a.id, perfect("power-apps"))).rejects.toBeInstanceOf(ConflictError);
  });

  it("discards answers sent after the deadline", async () => {
    const a = await assessments.start(ME, "power-apps");
    advance(15 * MIN + 31_000); // past the 30 s grace period
    const { attempt, timedOut, credential } = await assessments.submit(ME, a.id, perfect("power-apps"));
    expect(timedOut).toBe(true);
    expect(attempt).toMatchObject({ status: "FAILED", overallScore: 0 });
    expect(credential).toBeNull();
  });

  it("accepts a submission inside the grace period", async () => {
    const a = await assessments.start(ME, "power-apps");
    advance(15 * MIN + 10_000);
    expect((await assessments.submit(ME, a.id, perfect("power-apps"))).attempt.status).toBe("PASSED");
  });

  it("enforces a cooldown between attempts and reports the wait", async () => {
    const a = await assessments.start(ME, "power-automate");
    await assessments.submit(ME, a.id, wrong("power-automate"));
    await expect(assessments.start(ME, "power-automate")).rejects.toThrow(/Nouvelle tentative possible dans/);

    advance(24 * HOUR + MIN);
    expect((await assessments.start(ME, "power-automate")).status).toBe("IN_PROGRESS");
  });

  it("closes an abandoned attempt as failed and applies the cooldown", async () => {
    await assessments.start(ME, "power-automate");
    advance(2 * HOUR);
    await expect(assessments.start(ME, "power-automate")).rejects.toThrow(/Nouvelle tentative possible/);
  });
});

describe("human validation of critical assessments", () => {
  async function pendingDataverseAttempt() {
    const a = await assessments.start(ME, "dataverse");
    const { attempt, credential } = await assessments.submit(ME, a.id, perfect("dataverse"));
    return { attempt, credential };
  }

  it("holds a passed critical assessment for review: skill pending, no credential yet", async () => {
    const { attempt, credential } = await pendingDataverseAttempt();
    expect(attempt.status).toBe("PENDING_REVIEW");
    expect(credential).toBeNull();
    expect((await skillNamed("Dataverse")).verificationStatus).toBe("PENDING");
    await expect(assessments.start(ME, "dataverse")).rejects.toThrow(/en attente de validation/);
  });

  it("issues the credential and verifies the skill when a verifier approves", async () => {
    const { attempt } = await pendingDataverseAttempt();
    const result = await assessments.review(REVIEWER, attempt.id, "approve", "Dossier solide");
    expect(result.attempt).toMatchObject({
      status: "PASSED",
      reviewedById: REVIEWER,
      reviewNote: "Dossier solide",
    });
    expect(result.credential?.skillName).toBe("Dataverse");
    expect(await skillNamed("Dataverse")).toMatchObject({ verificationStatus: "VERIFIED", level: "EXPERT" });
  });

  it("resets the skill when a verifier rejects", async () => {
    const { attempt } = await pendingDataverseAttempt();
    const result = await assessments.review(REVIEWER, attempt.id, "reject");
    expect(result.attempt.status).toBe("REJECTED");
    expect(result.credential).toBeNull();
    expect((await skillNamed("Dataverse")).verificationStatus).toBe("UNVERIFIED");
  });

  it("only lets reviewer roles list and decide, and never on their own attempt", async () => {
    const { attempt } = await pendingDataverseAttempt();
    await expect(assessments.listPendingReview(OTHER)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(assessments.review(OTHER, attempt.id, "approve")).rejects.toBeInstanceOf(ForbiddenError);

    profiles.setRole(ME, "VERIFIER");
    await expect(assessments.review(ME, attempt.id, "approve")).rejects.toThrow(/propre évaluation/);
    profiles.setRole(ME, "TALENT");

    const items = await assessments.listPendingReview(REVIEWER);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ holderName: "Sehin G. Rodrigue", skillName: "Dataverse" });
  });

  it("cannot be decided twice", async () => {
    const { attempt } = await pendingDataverseAttempt();
    await assessments.review(REVIEWER, attempt.id, "approve");
    await expect(assessments.review(REVIEWER, attempt.id, "reject")).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("credentials", () => {
  it("generates unambiguous SP-XXXXXX identifiers", () => {
    for (let i = 0; i < 200; i++) expect(generateCredentialId()).toMatch(CREDENTIAL_ID_PATTERN);
  });

  it("is idempotent per attempt", async () => {
    const input = {
      talentSkillId: "s",
      skillName: "Power Apps",
      level: "ADVANCED" as const,
      attemptId: "att-1",
    };
    const first = await credentials.issue(ME, input);
    expect((await credentials.issue(ME, input)).credentialId).toBe(first.credentialId);
    expect(await credentials.listForProfile(ME)).toHaveLength(1);
  });

  it("verifies publicly, case-insensitively, with the holder and a derived status", async () => {
    const c = await credentials.issue(ME, {
      talentSkillId: null,
      skillName: "Power Apps",
      level: "ADVANCED",
      attemptId: null,
    });
    const verified = await credentials.verify(` ${c.credentialId.toLowerCase()} `);
    expect(verified).toMatchObject({
      holderName: "Sehin G. Rodrigue",
      holderUsername: "sehin-rodrigue",
      skillName: "Power Apps",
      status: "VALID",
    });
    expect(JSON.stringify(verified)).not.toContain("profileId");
  });

  it("reports EXPIRED after two years", async () => {
    const c = await credentials.issue(ME, {
      talentSkillId: null,
      skillName: "Power Apps",
      level: "ADVANCED",
      attemptId: null,
    });
    advance(2 * 366 * 24 * HOUR);
    expect((await credentials.verify(c.credentialId)).status).toBe("EXPIRED");
  });

  it("hides the profile link when the holder's profile is private", async () => {
    const c = await credentials.issue(ME, {
      talentSkillId: null,
      skillName: "Power Apps",
      level: "ADVANCED",
      attemptId: null,
    });
    await profiles.update(ME, {
      fullName: "Sehin G. Rodrigue",
      username: "sehin-rodrigue",
      yearsOfExperience: 5,
      availability: "IMMEDIATE",
      isPublic: false,
    });
    expect((await credentials.verify(c.credentialId)).holderUsername).toBeNull();
  });

  it("answers identically for malformed and unknown identifiers", async () => {
    await expect(credentials.verify("nope")).rejects.toBeInstanceOf(NotFoundError);
    await expect(credentials.verify("SP-AAAAAA")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("recommendations", () => {
  let service: RecommendationService;
  beforeEach(() => {
    service = new RecommendationService(
      new InMemoryRecommendationRepository(),
      skills,
      profiles,
      () => clock,
    );
  });
  const text = "Sehin conçoit des applications fiables et sait traduire des besoins métiers complexes.";

  it("creates an unguessable link and only for the requester's own skills", async () => {
    const skill = await skillNamed("Power Apps");
    const r = await service.request(ME, { authorName: "Awa Koné", talentSkillId: skill.id });
    expect(r.token).toMatch(/^[0-9a-f]{64}$/);
    expect(r.skillName).toBe("Power Apps");
    await expect(
      service.request(OTHER, { authorName: "Awa Koné", talentSkillId: skill.id }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("accepts one answer per link, then refuses replays", async () => {
    const r = await service.request(ME, { authorName: "Awa Koné" });
    expect((await service.getInvite(r.token)).state).toBe("open");
    expect(await service.submit(r.token, { content: text, authorTitle: "Directrice SI" })).toMatchObject({
      status: "SUBMITTED",
    });
    expect((await service.getInvite(r.token)).state).toBe("answered");
    await expect(service.submit(r.token, { content: text })).rejects.toThrow(/déjà été envoyée/);
  });

  it("refuses expired links and unknown tokens", async () => {
    const r = await service.request(ME, { authorName: "Awa Koné" });
    advance(31 * 24 * HOUR);
    expect((await service.getInvite(r.token)).state).toBe("expired");
    await expect(service.submit(r.token, { content: text })).rejects.toThrow(/expiré/);
    await expect(service.submit("0".repeat(64), { content: text })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("publishes only approved recommendations, without token or e-mail", async () => {
    const r = await service.request(ME, { authorName: "Awa Koné", authorEmail: "awa@example.com" });
    await service.submit(r.token, { content: text });
    expect(await service.listApproved(ME)).toHaveLength(0);

    await expect(service.moderate(OTHER, r.id, "APPROVED")).rejects.toBeInstanceOf(NotFoundError);
    await service.moderate(ME, r.id, "APPROVED");
    const [published] = await service.listApproved(ME);
    expect(published).toMatchObject({ authorName: "Awa Koné", content: text });
    expect(JSON.stringify(published)).not.toMatch(/token|awa@example/);
    await expect(service.moderate(ME, r.id, "DECLINED")).rejects.toBeInstanceOf(NotFoundError);
  });
});
