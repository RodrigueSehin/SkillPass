import { randomUUID } from "node:crypto";
import type { AttemptDTO } from "@/types/verification";
import type { AttemptRepository, AttemptResultPatch, NewAttempt, ReviewPatch } from "./attempt.repository";

export class InMemoryAttemptRepository implements AttemptRepository {
  private rows: AttemptDTO[] = [];

  async create(profileId: string, input: NewAttempt) {
    const row: AttemptDTO = {
      id: randomUUID(),
      profileId,
      ...input,
      status: "IN_PROGRESS",
      startedAt: new Date().toISOString(),
      submittedAt: null,
      answers: null,
      overallScore: null,
      domainScores: null,
      level: null,
      reviewedById: null,
      reviewedAt: null,
      reviewNote: null,
    };
    this.rows.push(row);
    return { ...row };
  }

  async findById(profileId: string, id: string) {
    const row = this.rows.find((r) => r.id === id && r.profileId === profileId);
    return row ? { ...row } : null;
  }

  async listByProfile(profileId: string) {
    return this.rows
      .filter((r) => r.profileId === profileId)
      .map((r) => ({ ...r }))
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  async submit(profileId: string, id: string, patch: AttemptResultPatch) {
    const row = this.rows.find((r) => r.id === id && r.profileId === profileId && r.status === "IN_PROGRESS");
    if (!row) return null;
    Object.assign(row, {
      ...patch,
      level: patch.level ?? null,
      overallScore: patch.overallScore ?? null,
      domainScores: patch.domainScores ?? null,
      answers: patch.answers ?? null,
    });
    return { ...row };
  }

  async review(id: string, patch: ReviewPatch) {
    const row = this.rows.find((r) => r.id === id && r.status === "PENDING_REVIEW");
    if (!row) return null;
    Object.assign(row, patch);
    return { ...row };
  }

  async findAnyById(id: string) {
    const row = this.rows.find((r) => r.id === id);
    return row ? { ...row } : null;
  }

  async listPendingReview() {
    return this.rows.filter((r) => r.status === "PENDING_REVIEW").map((r) => ({ ...r }));
  }
}
