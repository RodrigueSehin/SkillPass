import { randomUUID } from "node:crypto";
import { DEMO_EVIDENCE, demoSkillId } from "@/config/demo-data";
import type { NewEvidence } from "@/types/evidence";
import {
  toPublicEvidence,
  type EvidenceCounts,
  type EvidenceRepository,
  type StoredEvidence,
} from "./evidence.repository";

export class InMemoryEvidenceRepository implements EvidenceRepository {
  private rows = new Map<string, StoredEvidence[]>();

  constructor(private readonly seedProfileId?: string) {}

  private forProfile(profileId: string) {
    let list = this.rows.get(profileId);
    if (!list) {
      list =
        profileId === this.seedProfileId
          ? DEMO_EVIDENCE.map((e) => ({
              id: randomUUID(),
              talentSkillId: demoSkillId(e.skill),
              skillName: e.skill,
              projectId: null,
              type: e.type,
              title: e.title,
              description: e.description,
              url: "url" in e ? e.url : null,
              fileName: null,
              mimeType: null,
              sizeBytes: null,
              hasFile: false,
              filePath: null,
              status: e.status,
              createdAt: new Date().toISOString(),
            }))
          : [];
      this.rows.set(profileId, list);
    }
    return list;
  }

  async list(profileId: string, filter?: { talentSkillId?: string }) {
    return this.forProfile(profileId)
      .filter((e) => !filter?.talentSkillId || e.talentSkillId === filter.talentSkillId)
      .map(toPublicEvidence)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findById(profileId: string, id: string) {
    return this.forProfile(profileId).find((e) => e.id === id) ?? null;
  }

  async create(profileId: string, input: NewEvidence, skillName: string) {
    const row: StoredEvidence = {
      id: randomUUID(),
      talentSkillId: input.talentSkillId,
      skillName,
      projectId: input.projectId ?? null,
      type: input.type,
      title: input.title,
      description: input.description ?? null,
      url: input.url ?? null,
      fileName: input.file?.name ?? null,
      mimeType: input.file?.mimeType ?? null,
      sizeBytes: input.file?.sizeBytes ?? null,
      hasFile: Boolean(input.file),
      filePath: input.file?.path ?? null,
      status: "UNVERIFIED",
      createdAt: new Date().toISOString(),
    };
    this.forProfile(profileId).push(row);
    return toPublicEvidence(row);
  }

  async remove(profileId: string, id: string) {
    const list = this.forProfile(profileId);
    const index = list.findIndex((e) => e.id === id);
    if (index === -1) return undefined;
    const [removed] = list.splice(index, 1);
    return { filePath: removed.filePath };
  }

  async countBySkill(profileId: string) {
    const counts: Record<string, EvidenceCounts> = {};
    for (const e of this.forProfile(profileId)) {
      const c = (counts[e.talentSkillId] ??= { total: 0, verified: 0 });
      c.total += 1;
      if (e.status === "VERIFIED") c.verified += 1;
    }
    return counts;
  }
}
