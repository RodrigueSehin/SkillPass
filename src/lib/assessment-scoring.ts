import { ASSESSMENT_DOMAINS, type BankAssessment, type BankQuestion } from "@/config/assessment-bank";
import { levelFromScore, type SkillLevel } from "@/types/skill";
import type { AnswerInput, DomainScores } from "@/types/verification";

/** Minimum overall score to earn a credential (Intermediate level). */
export const PASS_SCORE = 50;

export interface ScoredAttempt {
  overall: number;
  domainScores: DomainScores;
  correctCount: number;
  total: number;
  passed: boolean;
  /** Level earned, or null when below the pass mark. */
  level: SkillLevel | null;
  perQuestion: { questionId: string; correct: boolean }[];
}

const pct = (correct: number, total: number) => (total === 0 ? 0 : Math.round((correct / total) * 100));

/**
 * Scores an attempt. Unanswered, out-of-range or unknown answers count as wrong; only the first
 * answer given for a question is considered, so a tampered payload cannot gain points.
 */
export function scoreAttempt(assessment: BankAssessment, answers: AnswerInput[]): ScoredAttempt {
  const chosen = new Map<string, number | null>();
  for (const a of answers) if (!chosen.has(a.questionId)) chosen.set(a.questionId, a.selected);

  const isCorrect = (q: BankQuestion) => {
    const selected = chosen.get(q.id);
    return Number.isInteger(selected) && selected === q.correctIndex;
  };

  const perQuestion = assessment.questions.map((q) => ({ questionId: q.id, correct: isCorrect(q) }));
  const correctCount = perQuestion.filter((q) => q.correct).length;
  const total = assessment.questions.length;

  const domainScores = Object.fromEntries(
    ASSESSMENT_DOMAINS.map((domain) => {
      const inDomain = assessment.questions.filter((q) => q.domain === domain);
      const right = inDomain.filter(isCorrect).length;
      return [domain, pct(right, inDomain.length)];
    }),
  ) as DomainScores;

  const overall = pct(correctCount, total);
  const passed = overall >= PASS_SCORE;
  return {
    overall,
    domainScores,
    correctCount,
    total,
    passed,
    level: passed ? levelFromScore(overall) : null,
    perQuestion,
  };
}
