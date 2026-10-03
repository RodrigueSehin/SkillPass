import { randomUUID } from "node:crypto";
import type { RecommendationDTO } from "@/types/verification";
import type { NewRecommendationRequest, RecommendationRepository } from "./recommendation.repository";

export class InMemoryRecommendationRepository implements RecommendationRepository {
  private rows: RecommendationDTO[] = [];

  async create(profileId: string, input: NewRecommendationRequest) {
    const row: RecommendationDTO = {
      id: randomUUID(),
      profileId,
      talentSkillId: input.talentSkillId ?? null,
      skillName: input.skillName ?? null,
      projectId: input.projectId ?? null,
      token: input.token,
      authorName: input.authorName,
      authorEmail: input.authorEmail ?? null,
      authorTitle: null,
      content: null,
      status: "REQUESTED",
      createdAt: new Date().toISOString(),
      submittedAt: null,
      expiresAt: input.expiresAt,
    };
    this.rows.push(row);
    return { ...row };
  }

  async findByToken(token: string) {
    const row = this.rows.find((r) => r.token === token);
    return row ? { ...row } : null;
  }

  async listByProfile(profileId: string) {
    return this.rows
      .filter((r) => r.profileId === profileId)
      .map((r) => ({ ...r }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async submitByToken(token: string, answer: { content: string; authorTitle?: string }, now: string) {
    const row = this.rows.find((r) => r.token === token && r.status === "REQUESTED" && r.expiresAt > now);
    if (!row) return null;
    Object.assign(row, {
      status: "SUBMITTED",
      content: answer.content,
      authorTitle: answer.authorTitle ?? null,
      submittedAt: now,
    });
    return { ...row };
  }

  async moderate(profileId: string, id: string, status: "APPROVED" | "DECLINED") {
    const row = this.rows.find((r) => r.id === id && r.profileId === profileId && r.status === "SUBMITTED");
    if (!row) return null;
    row.status = status;
    return { ...row };
  }

  async remove(profileId: string, id: string) {
    const index = this.rows.findIndex((r) => r.id === id && r.profileId === profileId);
    if (index === -1) return false;
    this.rows.splice(index, 1);
    return true;
  }
}
