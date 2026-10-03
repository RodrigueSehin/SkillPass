import { describe, expect, it } from "vitest";
import { computeSkillPassScore, type ScoreInput } from "./score";

const empty: ScoreInput = {
  skills: [],
  yearsOfExperience: 0,
  projectCount: 0,
  certifications: [],
  recommendationCount: 0,
  daysSinceActivity: 365,
};

const pointsOf = (r: ReturnType<typeof computeSkillPassScore>, key: string) =>
  r.criteria.find((c) => c.key === key)!.points;

describe("computeSkillPassScore", () => {
  it("weights add up to 100 and an empty profile only earns the activity floor", () => {
    const result = computeSkillPassScore(empty);
    expect(result.criteria.reduce((s, c) => s + c.max, 0)).toBe(100);
    expect(result.total).toBe(1);
  });

  it("caps every criterion at its maximum", () => {
    const result = computeSkillPassScore({
      skills: Array.from({ length: 8 }, () => ({
        score: 100,
        verificationStatus: "VERIFIED" as const,
        evidenceCount: 5,
      })),
      yearsOfExperience: 30,
      projectCount: 50,
      certifications: Array.from({ length: 6 }, () => ({
        verificationStatus: "VERIFIED" as const,
        expired: false,
      })),
      recommendationCount: 20,
      daysSinceActivity: 0,
    });
    expect(result.total).toBe(100);
    result.criteria.forEach((c) => expect(c.points).toBeLessThanOrEqual(c.max));
  });

  it("ignores unverified skills for the evaluated-skills criterion", () => {
    const result = computeSkillPassScore({
      ...empty,
      skills: [{ score: 95, verificationStatus: "UNVERIFIED", evidenceCount: 0 }],
    });
    expect(pointsOf(result, "skills")).toBe(0);
  });

  it("averages the best five verified skills over five slots", () => {
    const result = computeSkillPassScore({
      ...empty,
      skills: [{ score: 100, verificationStatus: "VERIFIED", evidenceCount: 0 }],
    });
    // One verified skill at 100 fills one of five slots: 100/500 * 30 = 6.
    expect(pointsOf(result, "skills")).toBe(6);
  });

  it("counts pending certifications at half value and expired ones at zero", () => {
    const result = computeSkillPassScore({
      ...empty,
      certifications: [
        { verificationStatus: "VERIFIED", expired: false },
        { verificationStatus: "PENDING", expired: false },
        { verificationStatus: "VERIFIED", expired: true },
      ],
    });
    expect(pointsOf(result, "certifications")).toBe(8); // 1.5 / 3 * 15 = 7.5 → 8
  });

  it("rewards recent activity", () => {
    expect(pointsOf(computeSkillPassScore({ ...empty, daysSinceActivity: 10 }), "activity")).toBe(5);
    expect(pointsOf(computeSkillPassScore({ ...empty, daysSinceActivity: 60 }), "activity")).toBe(3);
  });
});
