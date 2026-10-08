import { describe, expect, it } from "vitest";
import { InMemoryTalentDirectoryRepository } from "@/repositories/talent-directory.memory";
import type { MemberDTO } from "@/types/business";
import type { EvaluationAttemptRow, EvaluationRow } from "@/types/evaluation";
import type { JobOfferRow } from "@/types/job-offer";
import { activityFeed, levelDistribution, relativeTime } from "./dashboard";

const NOW = new Date("2026-10-07T10:00:00.000Z");
const ago = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000).toISOString();

describe("relativeTime", () => {
  it("speaks in minutes, hours, days and then dates", () => {
    expect(relativeTime(ago(0), NOW)).toBe("À l'instant");
    expect(relativeTime(ago(12), NOW)).toBe("Il y a 12 min");
    expect(relativeTime(ago(185), NOW)).toBe("Il y a 3 h");
    expect(relativeTime(ago(60 * 24 * 3), NOW)).toBe("Il y a 3 j");
    expect(relativeTime(ago(60 * 24 * 30), NOW)).toMatch(/2026/);
  });
});

describe("levelDistribution", () => {
  it("shares every held skill between the four levels, expert first", async () => {
    const talents = await new InMemoryTalentDirectoryRepository().listPublic(100);
    const dist = levelDistribution(talents);
    expect(dist.map((d) => d.level)).toEqual(["EXPERT", "ADVANCED", "INTERMEDIATE", "BEGINNER"]);
    expect(dist.reduce((n, d) => n + d.count, 0)).toBe(talents.reduce((n, t) => n + t.skills.length, 0));
    expect(dist.reduce((n, d) => n + d.percent, 0)).toBeGreaterThanOrEqual(99);
  });

  it("is all zeros without talents", () => {
    expect(levelDistribution([]).every((d) => d.count === 0 && d.percent === 0)).toBe(true);
  });
});

describe("activityFeed", () => {
  const attempt = {
    id: "a1",
    evaluationId: "e1",
    candidateId: "c",
    candidateName: "Aïcha",
    candidateUsername: null,
    score: 88,
    passed: true,
    status: "GRADED",
    submittedAt: ago(30),
  } as EvaluationAttemptRow;
  const evaluations = [{ id: "e1", title: "Power BI" }] as EvaluationRow[];
  const offers = [
    { id: "o1", title: "Data Analyst", publishedAt: ago(120), applicants: 5 },
    { id: "o2", title: "Brouillon", publishedAt: null, applicants: 0 },
  ] as JobOfferRow[];
  const members = [
    { id: "m1", firstName: "Awa", lastName: "Koné", status: "ACTIVE", createdAt: ago(600) },
    { id: "m2", firstName: "Invité", lastName: "Pas Encore", status: "INVITED", createdAt: ago(5) },
  ] as MemberDTO[];

  it("merges evaluations, offers and members, newest first, without drafts or pending invitations", () => {
    const feed = activityFeed({ attempts: [attempt], evaluations, offers, members });
    expect(feed.map((f) => f.kind)).toEqual(["evaluation", "offer", "member"]);
    expect(feed[0]).toMatchObject({
      title: "Évaluation complétée",
      detail: "Aïcha · Power BI",
      badge: "88%",
    });
    expect(feed[1]).toMatchObject({ detail: "Data Analyst", badge: "5 cand." });
  });

  it("flags attempts that wait for a person and respects the limit", () => {
    const waiting = {
      ...attempt,
      id: "a2",
      status: "SUBMITTED",
      score: null,
      submittedAt: ago(1),
    } as EvaluationAttemptRow;
    const feed = activityFeed({ attempts: [attempt, waiting], evaluations, offers, members, limit: 2 });
    expect(feed).toHaveLength(2);
    expect(feed[0]).toMatchObject({ title: "Évaluation à corriger", badge: null });
  });
});
