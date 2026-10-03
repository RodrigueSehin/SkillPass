import { describe, expect, it } from "vitest";
import { ASSESSMENT_BANK, BANK_VERSION } from "@/config/assessment-bank";
import { PASS_SCORE, scoreAttempt } from "./assessment-scoring";

const assessment = ASSESSMENT_BANK[0];
const allCorrect = assessment.questions.map((q) => ({ questionId: q.id, selected: q.correctIndex }));

describe("assessment bank integrity", () => {
  it("has unique question ids, valid answer indexes and 3 questions per domain", () => {
    for (const a of ASSESSMENT_BANK) {
      const ids = a.questions.map((q) => q.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const q of a.questions) {
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.options.length);
        expect(new Set(q.options).size).toBe(q.options.length);
      }
      for (const domain of ["KNOWLEDGE", "PRACTICAL", "ARCHITECTURE"] as const) {
        expect(a.questions.filter((q) => q.domain === domain)).toHaveLength(3);
      }
    }
    expect(BANK_VERSION).toBeGreaterThan(0);
  });

  it("does not always put the correct answer in the same position", () => {
    for (const a of ASSESSMENT_BANK) {
      expect(new Set(a.questions.map((q) => q.correctIndex)).size).toBeGreaterThan(2);
    }
  });
});

describe("scoreAttempt", () => {
  it("gives 100% and the Expert level for a perfect attempt", () => {
    const r = scoreAttempt(assessment, allCorrect);
    expect(r).toMatchObject({ overall: 100, passed: true, level: "EXPERT", correctCount: 9 });
    expect(r.domainScores).toEqual({ KNOWLEDGE: 100, PRACTICAL: 100, ARCHITECTURE: 100 });
  });

  it("scores per domain and derives the level from the overall score", () => {
    // Break every ARCHITECTURE answer: 6/9 = 67% overall → Intermediate.
    const answers = assessment.questions.map((q) => ({
      questionId: q.id,
      selected: q.domain === "ARCHITECTURE" ? (q.correctIndex + 1) % q.options.length : q.correctIndex,
    }));
    const r = scoreAttempt(assessment, answers);
    expect(r.overall).toBe(67);
    expect(r.level).toBe("INTERMEDIATE");
    expect(r.domainScores).toEqual({ KNOWLEDGE: 100, PRACTICAL: 100, ARCHITECTURE: 0 });
  });

  it("fails below the pass mark and grants no level", () => {
    const r = scoreAttempt(assessment, allCorrect.slice(0, 4));
    expect(r.overall).toBe(44);
    expect(r.passed).toBe(false);
    expect(r.level).toBeNull();
    expect(PASS_SCORE).toBe(50);
  });

  it("treats blank, out-of-range, fractional and unknown answers as wrong", () => {
    const q = assessment.questions;
    const r = scoreAttempt(assessment, [
      { questionId: q[0].id, selected: null },
      { questionId: q[1].id, selected: 99 },
      { questionId: q[2].id, selected: 1.5 },
      { questionId: "ghost", selected: 0 },
    ]);
    expect(r.correctCount).toBe(0);
  });

  it("only counts the first answer per question, so duplicates cannot add points", () => {
    const q = assessment.questions[0];
    const wrong = (q.correctIndex + 1) % q.options.length;
    const r = scoreAttempt(assessment, [
      { questionId: q.id, selected: wrong },
      { questionId: q.id, selected: q.correctIndex },
    ]);
    expect(r.correctCount).toBe(0);
  });
});
