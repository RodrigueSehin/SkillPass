import { describe, expect, it } from "vitest";
import type { EvaluationAttemptRow, EvaluationRow } from "@/types/evaluation";
import type { JobOfferRow } from "@/types/job-offer";
import { computeAnalytics, parseRange } from "./analytics";

const NOW = new Date("2026-10-07T10:00:00.000Z");
const ago = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString();

const evaluation = (id: string, over: Partial<EvaluationRow> = {}) =>
  ({ id, title: id, skill: "Power Apps", type: "TECHNICAL", createdAt: ago(10), ...over }) as EvaluationRow;
const attempt = (
  id: string,
  person: string,
  score: number | null,
  days: number,
  over: Partial<EvaluationAttemptRow> = {},
): EvaluationAttemptRow => ({
  id,
  evaluationId: "e1",
  candidateId: person,
  candidateName: person,
  candidateUsername: null,
  score,
  passed: score === null ? null : score >= 70,
  status: score === null ? "SUBMITTED" : "GRADED",
  submittedAt: ago(days),
  ...over,
});

const base = {
  evaluations: [
    evaluation("e1"),
    evaluation("e2", { type: "TRANSVERSAL", skill: "Communication", createdAt: ago(100) }),
  ],
  offers: [] as JobOfferRow[],
  now: NOW,
};

describe("computeAnalytics", () => {
  it("counts distinct people and compares with the previous period", () => {
    const a = computeAnalytics({
      ...base,
      days: 30,
      attempts: [
        attempt("1", "ana", 90, 3),
        attempt("2", "ana", 50, 5),
        attempt("3", "bob", 80, 8),
        attempt("4", "cy", 60, 40),
      ],
    });
    expect(a.kpis.candidates).toMatchObject({ value: 2, previous: 1, delta: 100 });
    expect(a.kpis.created).toMatchObject({ value: 1, previous: 0, delta: null });
    expect(a.evaluatedCount).toBe(3);
  });

  it("splits graded attempts into result bands", () => {
    const a = computeAnalytics({
      ...base,
      days: 30,
      attempts: [
        attempt("1", "a", 100, 1),
        attempt("2", "b", 85, 1),
        attempt("3", "c", 84, 1),
        attempt("4", "d", 55, 1),
        attempt("5", "e", 49, 1),
        attempt("6", "f", null, 1),
      ],
    });
    expect(a.bands.map((b) => b.count)).toEqual([2, 1, 1, 1]);
    expect(a.gradedCount).toBe(5);
    expect(a.bands.reduce((n, b) => n + b.percent, 0)).toBe(100);
  });

  it("success rate ignores attempts still waiting for a person", () => {
    const a = computeAnalytics({
      ...base,
      days: 30,
      attempts: [attempt("1", "a", 90, 1), attempt("2", "b", 40, 1), attempt("3", "c", null, 1)],
    });
    expect(a.kpis.successRate.value).toBe(50);
  });

  it("ranks talents by average score and skills by attempts", () => {
    const a = computeAnalytics({
      ...base,
      days: 90,
      attempts: [
        attempt("1", "ana", 90, 3),
        attempt("2", "ana", 70, 4),
        attempt("3", "bob", 95, 5),
        attempt("4", "cy", 60, 6, { evaluationId: "e2" }),
      ],
    });
    expect(a.topTalents.map((t) => [t.name, t.average])).toEqual([
      ["bob", 95],
      ["ana", 80],
      ["cy", 60],
    ]);
    expect(a.topSkills[0]).toEqual({ skill: "Power Apps", count: 3 });
    expect(a.byType.find((t) => t.type === "TRANSVERSAL")).toMatchObject({ count: 1, rate: 0 });
  });

  it("buckets the trend by month for long periods and by days for a month", () => {
    const long = computeAnalytics({ ...base, days: 180, attempts: [attempt("1", "a", 90, 3)] });
    expect(long.trend.labels.length).toBeGreaterThanOrEqual(6);
    expect(long.trend.evaluated.reduce((n, v) => n + v, 0)).toBe(1);
    expect(long.trend.created.reduce((n, v) => n + v, 0)).toBe(2);
    const short = computeAnalytics({ ...base, days: 30, attempts: [attempt("1", "a", 90, 3)] });
    expect(short.trend.labels).toHaveLength(6);
    expect(short.trend.created.reduce((n, v) => n + v, 0)).toBe(1);
  });

  it("works with nothing at all", () => {
    const a = computeAnalytics({ ...base, evaluations: [], days: 30, attempts: [] });
    expect(a.kpis.candidates.value).toBe(0);
    expect(a.kpis.successRate.value).toBeNull();
    expect(a.topTalents).toEqual([]);
    expect(a.bands.every((b) => b.count === 0)).toBe(true);
  });

  it("falls back to six months for an unknown range", () => {
    expect(parseRange("7")).toBe("180");
    expect(parseRange("90")).toBe("90");
  });
});
