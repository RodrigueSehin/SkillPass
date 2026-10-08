import { z } from "zod";
import { publicQuestions, scoreAttempt } from "@/lib/business/evaluation-view";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type { EvaluationRepository } from "@/repositories/evaluation.repository";
import type { OrganizationRepository } from "@/repositories/organization.repository";
import type {
  AttemptResponse,
  EvaluationAttemptDTO,
  EvaluationDTO,
  PublicQuestion,
} from "@/types/evaluation";
import type { OrgScope } from "./organization.service";

/** Time after the deadline during which a submission is still accepted (network, slow devices). */
export const SUBMIT_GRACE_MS = 2 * 60_000;
const MAX_TEXT = 5000;

const responsesSchema = z.record(
  z.string().max(64),
  z.object({
    choices: z.array(z.number().int().min(0).max(5)).max(6).optional(),
    text: z.string().max(MAX_TEXT).optional(),
  }),
);

export interface CandidateIntro {
  evaluation: {
    title: string;
    description: string;
    skill: string;
    type: EvaluationDTO["type"];
    difficulty: EvaluationDTO["difficulty"];
    durationMinutes: number;
    language: string;
    questionCount: number;
    passScore: number;
    attemptsAllowed: number;
    hasOpenQuestions: boolean;
    showScore: EvaluationDTO["settings"]["showScore"];
  };
  organization: { name: string; logoVersion: string | null };
  /** Why the test cannot be taken now, or null when it can. */
  blocked: string | null;
  attemptsUsed: number;
  inProgressId: string | null;
  /** Latest finished attempt, with the score only when the organization lets the candidate see it. */
  last: {
    status: EvaluationAttemptDTO["status"];
    score: number | null;
    passed: boolean | null;
    submittedAt: string | null;
  } | null;
}

export interface RunnerData {
  attemptId: string;
  title: string;
  /** ISO time at which the test ends. */
  endsAt: string;
  questions: PublicQuestion[];
  settings: Pick<
    EvaluationDTO["settings"],
    "display" | "navigation" | "timePerQuestion" | "fullscreen" | "limitCopyPaste" | "devices"
  >;
  saved: Record<string, AttemptResponse>;
}

/** Tests taken by candidates, and the correction of what a machine cannot mark. */
export class EvaluationAttemptService {
  constructor(
    private readonly evaluations: EvaluationRepository,
    private readonly orgs: OrganizationRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async find(token: string) {
    const found = await this.evaluations.findByToken(token);
    // A draft does not exist for candidates.
    if (!found || found.evaluation.status === "DRAFT") throw new NotFoundError("Évaluation introuvable");
    return found;
  }

  /** Reason why a test is closed to candidates right now, or null. */
  private blockedReason(e: EvaluationDTO): string | null {
    const now = this.now();
    if (e.status === "ARCHIVED") return "Cette évaluation n'est plus disponible.";
    const nowLocal = now.toISOString().slice(0, 16);
    if (e.publishAt && e.publishAt > nowLocal) return "Cette évaluation n'est pas encore ouverte.";
    const { windowStart, windowEnd } = e.settings;
    if (windowStart && nowLocal < windowStart) return "Cette évaluation n'est pas encore ouverte.";
    if (windowEnd && nowLocal > windowEnd) return "La période de passage de cette évaluation est terminée.";
    return null;
  }

  private deadline(a: EvaluationAttemptDTO, e: EvaluationDTO) {
    return new Date(Date.parse(a.startedAt) + e.durationMinutes * 60_000);
  }

  private isVisible(a: EvaluationAttemptDTO, e: EvaluationDTO) {
    return a.status === "GRADED" && a.released && e.settings.showScore !== "NEVER";
  }

  async intro(token: string, profileId: string): Promise<CandidateIntro> {
    const { orgId, evaluation: e } = await this.find(token);
    const [org, attempts] = await Promise.all([
      this.orgs.getOrganization(orgId),
      this.evaluations.profileAttempts(e.id, profileId),
    ]);
    const finished = attempts.filter((a) => a.status !== "IN_PROGRESS");
    const open = attempts.find(
      (a) =>
        a.status === "IN_PROGRESS" && this.deadline(a, e).getTime() + SUBMIT_GRACE_MS > this.now().getTime(),
    );
    const last = finished[0];
    return {
      evaluation: {
        title: e.title,
        description: e.description,
        skill: e.skill,
        type: e.type,
        difficulty: e.difficulty,
        durationMinutes: e.durationMinutes,
        language: e.language,
        questionCount: e.questions.length,
        passScore: e.settings.passScore,
        attemptsAllowed: e.settings.attempts,
        hasOpenQuestions: e.questions.some((q) => !["SINGLE", "MULTIPLE", "TRUE_FALSE"].includes(q.type)),
        showScore: e.settings.showScore,
      },
      organization: { name: org?.name ?? "Organisation", logoVersion: org?.logoVersion ?? null },
      blocked: this.blockedReason(e),
      attemptsUsed: attempts.length,
      inProgressId: open?.id ?? null,
      last: last
        ? {
            status: last.status,
            score: this.isVisible(last, e) ? last.score : null,
            passed: this.isVisible(last, e) ? last.passed : null,
            submittedAt: last.submittedAt,
          }
        : null,
    };
  }

  /** Starts an attempt, or resumes the one still running. */
  async start(token: string, profile: { id: string; fullName: string }) {
    const { evaluation: e } = await this.find(token);
    const blocked = this.blockedReason(e);
    if (blocked) throw new ForbiddenError(blocked);
    const attempts = await this.evaluations.profileAttempts(e.id, profile.id);
    const nowMs = this.now().getTime();
    for (const a of attempts.filter((x) => x.status === "IN_PROGRESS")) {
      if (this.deadline(a, e).getTime() + SUBMIT_GRACE_MS > nowMs) return a.id;
      // Time ran out without a submission: close it with what was saved (nothing).
      await this.finalize(a, e, {});
    }
    const used = (await this.evaluations.profileAttempts(e.id, profile.id)).length;
    const limit = e.settings.attempts;
    if (limit > 0 && used >= limit) {
      throw new ForbiddenError("Vous avez atteint le nombre de tentatives autorisées pour cette évaluation.");
    }
    return (await this.evaluations.createAttempt(e.id, profile, this.now().toISOString())).id;
  }

  async load(attemptId: string, profileId: string): Promise<RunnerData | null> {
    const attempt = await this.evaluations.getAttempt(attemptId);
    if (!attempt || attempt.profileId !== profileId) throw new NotFoundError("Tentative introuvable");
    if (attempt.status !== "IN_PROGRESS") return null;
    const found = await this.findById(attempt.evaluationId);
    const endsAt = this.deadline(attempt, found);
    if (endsAt.getTime() + SUBMIT_GRACE_MS <= this.now().getTime()) return null;
    return {
      attemptId: attempt.id,
      title: found.title,
      endsAt: endsAt.toISOString(),
      questions: publicQuestions(found, attempt.id),
      settings: {
        display: found.settings.display,
        navigation: found.settings.navigation,
        timePerQuestion: found.settings.timePerQuestion,
        fullscreen: found.settings.fullscreen,
        limitCopyPaste: found.settings.limitCopyPaste,
        devices: found.settings.devices,
      },
      saved: attempt.responses,
    };
  }

  private async findById(evaluationId: string) {
    // The attempt row carries no organization: go through the token-less lookup of its own test.
    const found = await this.evaluations.getEvaluationById(evaluationId);
    if (!found) throw new NotFoundError("Évaluation introuvable");
    return found;
  }

  private async finalize(
    a: EvaluationAttemptDTO,
    e: EvaluationDTO,
    responses: Record<string, AttemptResponse>,
  ) {
    const result = scoreAttempt(e.questions, responses, {}, e.settings);
    const graded = result.percent !== null;
    return this.evaluations.saveAttempt(a.id, {
      responses,
      status: graded ? "GRADED" : "SUBMITTED",
      score: result.percent,
      passed: result.passed,
      // Immediate: the candidate sees the result at once. Otherwise someone validates it first.
      released: graded && e.settings.showScore === "IMMEDIATE",
      submittedAt: this.now().toISOString(),
    });
  }

  /** Saves the answers, marks the choice questions and closes the attempt. */
  async submit(attemptId: string, profileId: string, raw: unknown) {
    const attempt = await this.evaluations.getAttempt(attemptId);
    if (!attempt || attempt.profileId !== profileId) throw new NotFoundError("Tentative introuvable");
    if (attempt.status !== "IN_PROGRESS") throw new ConflictError("Cette tentative est déjà terminée.");
    const e = await this.findById(attempt.evaluationId);

    const parsed = responsesSchema.parse(raw);
    const known = new Set(e.questions.map((q) => q.id));
    const late = this.deadline(attempt, e).getTime() + SUBMIT_GRACE_MS < this.now().getTime();
    const responses = late ? {} : Object.fromEntries(Object.entries(parsed).filter(([id]) => known.has(id)));
    const saved = await this.finalize(attempt, e, responses);
    if (!saved) throw new NotFoundError("Tentative introuvable");
    return { late, status: saved.status };
  }

  /** An attempt with its test, for the organization that owns the test. */
  async getForReview(scope: OrgScope, attemptId: string) {
    const found = await this.evaluations.getAttemptForOrg(scope.organization.id, attemptId);
    if (!found) throw new NotFoundError("Résultat introuvable");
    return found;
  }

  /**
   * Records the points a person gave to the open questions, finalizes the score and lets the candidate see it.
   * Every open question must be scored.
   */
  async review(scope: OrgScope, attemptId: string, raw: Record<string, number>) {
    const { attempt, evaluation: e } = await this.getForReview(scope, attemptId);
    if (attempt.status === "IN_PROGRESS")
      throw new ConflictError("Le candidat n'a pas encore terminé cette évaluation.");
    const open = e.questions.filter((q) => !["SINGLE", "MULTIPLE", "TRUE_FALSE"].includes(q.type));
    const review: Record<string, number> = {};
    for (const q of open) {
      const points = raw[q.id];
      if (points === undefined || !Number.isFinite(points))
        throw new ConflictError("Notez toutes les questions ouvertes.");
      if (points < 0 || points > q.points) {
        throw new ConflictError(
          `La note de « ${q.prompt.slice(0, 40)} » doit être comprise entre 0 et ${q.points}.`,
        );
      }
      review[q.id] = Math.round(points * 2) / 2;
    }
    const result = scoreAttempt(e.questions, attempt.responses, review, e.settings);
    const saved = await this.evaluations.saveAttempt(attempt.id, {
      review,
      status: "GRADED",
      score: result.percent,
      passed: result.passed,
      released: true,
    });
    if (!saved) throw new NotFoundError("Résultat introuvable");
    return saved;
  }
}
