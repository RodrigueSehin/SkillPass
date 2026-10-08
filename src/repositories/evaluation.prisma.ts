import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { DEFAULT_SETTINGS } from "@/types/evaluation";
import type {
  AttemptResponse,
  EvaluationAttemptDTO,
  EvaluationAttemptRow,
  EvaluationDTO,
  EvaluationInput,
  EvaluationQuestion,
  EvaluationSettings,
  EvaluationStatus,
} from "@/types/evaluation";
import type { SkillLevel } from "@/types/skill";
import type { AttemptTotals, EvaluationRepository } from "./evaluation.repository";

type Row = Prisma.EvaluationGetPayload<object>;

const toEvaluation = (r: Row): EvaluationDTO => {
  const stored = (r.settings ?? {}) as Partial<EvaluationSettings>;
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    skill: r.skill,
    type: r.type as EvaluationDTO["type"],
    difficulty: r.difficulty as SkillLevel,
    durationMinutes: r.durationMinutes,
    language: r.language,
    questions: (r.questions ?? []) as unknown as EvaluationQuestion[],
    // Settings added later fall back to their defaults for tests saved before.
    settings: { ...DEFAULT_SETTINGS, ...stored, devices: { ...DEFAULT_SETTINGS.devices, ...stored.devices } },
    status: r.status as EvaluationStatus,
    publishAt: r.publishAt ? r.publishAt.toISOString().slice(0, 16) : null,
    shareToken: r.shareToken,
    createdById: r.createdById,
    createdAt: r.createdAt.toISOString(),
  };
};

type AttemptRow = Prisma.EvaluationAttemptGetPayload<object>;
interface StoredAnswers {
  responses?: Record<string, AttemptResponse>;
  review?: Record<string, number>;
  released?: boolean;
}

const toAttempt = (r: AttemptRow): EvaluationAttemptDTO => {
  const stored = (r.answers ?? {}) as StoredAnswers;
  return {
    id: r.id,
    evaluationId: r.evaluationId,
    profileId: r.profileId,
    responses: stored.responses ?? {},
    review: stored.review ?? {},
    released: stored.released ?? false,
    score: r.score,
    passed: r.passed,
    status: r.status as EvaluationAttemptDTO["status"],
    startedAt: r.startedAt.toISOString(),
    submittedAt: r.submittedAt ? r.submittedAt.toISOString() : null,
  };
};
const data = (i: EvaluationInput) => ({
  title: i.title,
  description: i.description,
  skill: i.skill,
  type: i.type,
  difficulty: i.difficulty,
  durationMinutes: i.durationMinutes,
  language: i.language,
  questions: i.questions as unknown as Prisma.InputJsonValue,
  settings: i.settings as unknown as Prisma.InputJsonValue,
  publishAt: i.publishAt ? new Date(`${i.publishAt}:00.000Z`) : null,
});

export class PrismaEvaluationRepository implements EvaluationRepository {
  async list(orgId: string) {
    const rows = await prisma.evaluation.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toEvaluation);
  }

  async get(orgId: string, id: string) {
    const row = await prisma.evaluation.findFirst({ where: { id, organizationId: orgId } });
    return row ? toEvaluation(row) : null;
  }

  async create(orgId: string, input: EvaluationInput, createdById: string | null) {
    const row = await prisma.evaluation.create({
      data: { organizationId: orgId, createdById, status: "DRAFT", ...data(input) },
    });
    return toEvaluation(row);
  }

  async update(orgId: string, id: string, input: EvaluationInput) {
    const { count } = await prisma.evaluation.updateMany({
      where: { id, organizationId: orgId },
      data: data(input),
    });
    return count === 0 ? null : this.get(orgId, id);
  }

  async setStatus(orgId: string, id: string, status: EvaluationStatus) {
    const { count } = await prisma.evaluation.updateMany({
      where: { id, organizationId: orgId },
      data: { status },
    });
    return count === 0 ? null : this.get(orgId, id);
  }

  async delete(orgId: string, id: string) {
    const { count } = await prisma.evaluation.deleteMany({ where: { id, organizationId: orgId } });
    return count > 0;
  }

  async attemptTotals(orgId: string) {
    const rows = await prisma.evaluationAttempt.findMany({
      where: { evaluation: { organizationId: orgId }, status: { not: "IN_PROGRESS" } },
      select: { evaluationId: true, profileId: true, status: true, passed: true },
    });
    const totals = new Map<string, AttemptTotals>();
    const people = new Map<string, Set<string>>();
    for (const a of rows) {
      const t = totals.get(a.evaluationId) ?? { candidates: 0, graded: 0, passed: 0 };
      const who = people.get(a.evaluationId) ?? new Set<string>();
      who.add(a.profileId);
      people.set(a.evaluationId, who);
      t.candidates = who.size;
      if (a.status === "GRADED") {
        t.graded += 1;
        if (a.passed) t.passed += 1;
      }
      totals.set(a.evaluationId, t);
    }
    return totals;
  }

  async listAttempts(orgId: string, limit: number): Promise<EvaluationAttemptRow[]> {
    const rows = await prisma.evaluationAttempt.findMany({
      where: { evaluation: { organizationId: orgId }, status: { not: "IN_PROGRESS" } },
      orderBy: { submittedAt: "desc" },
      take: limit,
      include: { profile: { select: { fullName: true, username: true, isPublic: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      evaluationId: r.evaluationId,
      candidateName: r.profile.fullName,
      candidateUsername: r.profile.isPublic ? r.profile.username : null,
      score: r.score,
      passed: r.passed,
      status: r.status as EvaluationAttemptRow["status"],
      submittedAt: r.submittedAt ? r.submittedAt.toISOString() : null,
    }));
  }

  async findByToken(token: string) {
    const row = await prisma.evaluation.findUnique({ where: { shareToken: token } });
    return row ? { orgId: row.organizationId, evaluation: toEvaluation(row) } : null;
  }

  async getEvaluationById(id: string) {
    const row = await prisma.evaluation.findUnique({ where: { id } });
    return row ? toEvaluation(row) : null;
  }

  async profileAttempts(evaluationId: string, profileId: string) {
    const rows = await prisma.evaluationAttempt.findMany({
      where: { evaluationId, profileId },
      orderBy: { startedAt: "desc" },
    });
    return rows.map(toAttempt);
  }

  async createAttempt(evaluationId: string, profile: { id: string }, startedAt: string) {
    const row = await prisma.evaluationAttempt.create({
      data: {
        evaluationId,
        profileId: profile.id,
        status: "IN_PROGRESS",
        startedAt: new Date(startedAt),
        answers: {},
      },
    });
    return toAttempt(row);
  }

  async getAttempt(id: string) {
    const row = await prisma.evaluationAttempt.findUnique({ where: { id } });
    return row ? toAttempt(row) : null;
  }

  async saveAttempt(id: string, patch: Parameters<EvaluationRepository["saveAttempt"]>[1]) {
    const current = await this.getAttempt(id);
    if (!current) return null;
    const next = { ...current, ...patch };
    const row = await prisma.evaluationAttempt.update({
      where: { id },
      data: {
        answers: {
          responses: next.responses,
          review: next.review,
          released: next.released,
        } as unknown as Prisma.InputJsonValue,
        score: next.score,
        passed: next.passed,
        status: next.status,
        submittedAt: next.submittedAt ? new Date(next.submittedAt) : null,
      },
    });
    return toAttempt(row);
  }

  async getAttemptForOrg(orgId: string, attemptId: string) {
    const row = await prisma.evaluationAttempt.findFirst({
      where: { id: attemptId, evaluation: { organizationId: orgId } },
      include: { evaluation: true, profile: { select: { fullName: true, username: true, isPublic: true } } },
    });
    if (!row) return null;
    return {
      attempt: toAttempt(row),
      evaluation: toEvaluation(row.evaluation),
      candidate: { name: row.profile.fullName, username: row.profile.isPublic ? row.profile.username : null },
    };
  }
}
