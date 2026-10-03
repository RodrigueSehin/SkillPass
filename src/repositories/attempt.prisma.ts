import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { AnswerInput, AttemptDTO, DomainScores } from "@/types/verification";
import type { AttemptRepository, AttemptResultPatch, NewAttempt, ReviewPatch } from "./attempt.repository";

type Row = Prisma.AssessmentAttemptGetPayload<object>;

const iso = (d: Date | null) => (d ? d.toISOString() : null);

const toDTO = (r: Row): AttemptDTO => ({
  id: r.id,
  profileId: r.profileId,
  talentSkillId: r.talentSkillId,
  assessmentSlug: r.assessmentSlug,
  bankVersion: r.bankVersion,
  status: r.status,
  startedAt: r.startedAt.toISOString(),
  deadlineAt: r.deadlineAt.toISOString(),
  submittedAt: iso(r.submittedAt),
  answers: r.answers as AnswerInput[] | null,
  overallScore: r.overallScore,
  domainScores: r.domainScores as DomainScores | null,
  level: r.level,
  reviewedById: r.reviewedById,
  reviewedAt: iso(r.reviewedAt),
  reviewNote: r.reviewNote,
});

export class PrismaAttemptRepository implements AttemptRepository {
  async create(profileId: string, input: NewAttempt) {
    const row = await prisma.assessmentAttempt.create({
      data: {
        profileId,
        talentSkillId: input.talentSkillId,
        assessmentSlug: input.assessmentSlug,
        bankVersion: input.bankVersion,
        deadlineAt: new Date(input.deadlineAt),
      },
    });
    return toDTO(row);
  }

  async findById(profileId: string, id: string) {
    const row = await prisma.assessmentAttempt.findFirst({ where: { id, profileId } });
    return row ? toDTO(row) : null;
  }

  async listByProfile(profileId: string) {
    const rows = await prisma.assessmentAttempt.findMany({
      where: { profileId },
      orderBy: { startedAt: "desc" },
    });
    return rows.map(toDTO);
  }

  async submit(profileId: string, id: string, patch: AttemptResultPatch) {
    // The status filter makes the transition atomic: a second submission matches no row.
    const { count } = await prisma.assessmentAttempt.updateMany({
      where: { id, profileId, status: "IN_PROGRESS" },
      data: {
        status: patch.status,
        submittedAt: patch.submittedAt ? new Date(patch.submittedAt) : undefined,
        answers: patch.answers as unknown as Prisma.InputJsonValue | undefined,
        overallScore: patch.overallScore,
        domainScores: patch.domainScores as unknown as Prisma.InputJsonValue | undefined,
        level: patch.level ?? null,
      },
    });
    return count === 0 ? null : this.findById(profileId, id);
  }

  async review(id: string, patch: ReviewPatch) {
    const { count } = await prisma.assessmentAttempt.updateMany({
      where: { id, status: "PENDING_REVIEW" },
      data: {
        status: patch.status,
        reviewedById: patch.reviewedById,
        reviewedAt: new Date(patch.reviewedAt),
        reviewNote: patch.reviewNote,
      },
    });
    return count === 0 ? null : this.findAnyById(id);
  }

  async findAnyById(id: string) {
    const row = await prisma.assessmentAttempt.findUnique({ where: { id } });
    return row ? toDTO(row) : null;
  }

  async listPendingReview() {
    const rows = await prisma.assessmentAttempt.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { submittedAt: "asc" },
    });
    return rows.map(toDTO);
  }
}
