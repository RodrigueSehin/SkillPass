import { randomUUID } from "node:crypto";
import { DEMO_EVIDENCE, demoSkillId } from "@/config/demo-data";
import type { EvidenceStatus, NewEvidence } from "@/types/evidence";
import {
  isImageMime,
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
          ? DEMO_EVIDENCE.map((e): StoredEvidence => {
              const id = demoSkillId(e.skill);
              return {
                id: randomUUID(),
                talentSkillId: id,
                skillName: e.skill,
                skills: [{ id, name: e.skill }],
                projectId: null,
                type: e.type,
                title: e.title,
                description: e.description,
                url: "url" in e ? e.url : null,
                organization: null,
                role: null,
                startDate: null,
                endDate: null,
                technologies: [],
                tags: [],
                category: null,
                visibility: "PUBLIC",
                published: true,
                allowContact: true,
                allowRecommendations: false,
                files: [],
                status: e.status,
                verificationNote: null,
                verificationRequestedAt: null,
                createdAt: new Date().toISOString(),
              };
            })
          : [];
      this.rows.set(profileId, list);
    }
    return list;
  }

  async list(profileId: string, filter?: { talentSkillId?: string }) {
    const skillId = filter?.talentSkillId;
    return this.forProfile(profileId)
      .filter((e) => !skillId || e.skills.some((s) => s.id === skillId))
      .map(toPublicEvidence)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findById(profileId: string, id: string) {
    return this.forProfile(profileId).find((e) => e.id === id) ?? null;
  }

  async create(profileId: string, input: NewEvidence, skills: { id: string; name: string }[]) {
    const row: StoredEvidence = {
      id: randomUUID(),
      talentSkillId: input.talentSkillId,
      skillName: skills[0]?.name ?? "",
      skills,
      projectId: input.projectId ?? null,
      type: input.type,
      title: input.title,
      description: input.description ?? null,
      url: input.url ?? null,
      organization: input.organization ?? null,
      role: input.role ?? null,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      technologies: input.technologies,
      tags: input.tags,
      category: input.category ?? null,
      visibility: input.visibility,
      published: input.published,
      allowContact: input.allowContact,
      allowRecommendations: input.allowRecommendations,
      files: input.files.map((f) => ({
        id: randomUUID(),
        name: f.name,
        mimeType: f.mimeType,
        sizeBytes: f.sizeBytes,
        isImage: isImageMime(f.mimeType),
        filePath: f.path,
      })),
      status: "UNVERIFIED",
      verificationNote: null,
      verificationRequestedAt: null,
      createdAt: new Date().toISOString(),
    };
    this.forProfile(profileId).push(row);
    return toPublicEvidence(row);
  }

  async update(
    profileId: string,
    id: string,
    input: NewEvidence,
    skills: { id: string; name: string }[],
    keepFileIds: string[],
  ) {
    const row = this.forProfile(profileId).find((e) => e.id === id);
    if (!row) return undefined;
    const removedPaths = row.files.filter((f) => !keepFileIds.includes(f.id)).map((f) => f.filePath);
    Object.assign(row, {
      talentSkillId: input.talentSkillId,
      skillName: skills[0]?.name ?? "",
      skills,
      projectId: input.projectId ?? null,
      type: input.type,
      title: input.title,
      description: input.description ?? null,
      url: input.url ?? null,
      organization: input.organization ?? null,
      role: input.role ?? null,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      technologies: input.technologies,
      tags: input.tags,
      category: input.category ?? null,
      visibility: input.visibility,
      published: input.published,
      allowContact: input.allowContact,
      allowRecommendations: input.allowRecommendations,
      status: "UNVERIFIED",
      verificationNote: null,
      verificationRequestedAt: null,
      files: [
        ...row.files.filter((f) => keepFileIds.includes(f.id)),
        ...input.files.map((f) => ({
          id: randomUUID(),
          name: f.name,
          mimeType: f.mimeType,
          sizeBytes: f.sizeBytes,
          isImage: isImageMime(f.mimeType),
          filePath: f.path,
        })),
      ],
    });
    return { evidence: toPublicEvidence(row), removedPaths };
  }

  async requestVerification(profileId: string, id: string) {
    const row = this.forProfile(profileId).find((e) => e.id === id);
    if (!row) return false;
    if (row.published && row.status === "UNVERIFIED") {
      row.status = "PENDING";
      row.verificationNote = null;
      row.verificationRequestedAt = new Date().toISOString();
    }
    return true;
  }

  private all() {
    return [...this.rows.entries()].flatMap(([profileId, list]) => list.map((e) => ({ ...e, profileId })));
  }

  async listByStatus(status: EvidenceStatus) {
    return this.all()
      .filter((e) => e.published && e.status === status)
      .map((e) => ({ ...toPublicEvidence(e), profileId: e.profileId }));
  }

  async findAny(id: string) {
    return this.all().find((e) => e.id === id) ?? null;
  }

  async review(id: string, status: "VERIFIED" | "UNVERIFIED", note: string | null) {
    for (const list of this.rows.values()) {
      const row = list.find((e) => e.id === id);
      if (row) {
        Object.assign(row, { status, verificationNote: note, verificationRequestedAt: null });
        return true;
      }
    }
    return false;
  }

  async publish(profileId: string, id: string) {
    const row = this.forProfile(profileId).find((e) => e.id === id);
    if (!row) return false;
    row.published = true;
    return true;
  }

  async remove(profileId: string, id: string) {
    const list = this.forProfile(profileId);
    const index = list.findIndex((e) => e.id === id);
    if (index === -1) return undefined;
    const [removed] = list.splice(index, 1);
    return { filePaths: removed.files.map((f) => f.filePath) };
  }

  async countBySkill(profileId: string) {
    const counts: Record<string, EvidenceCounts> = {};
    for (const e of this.forProfile(profileId).filter((e) => e.published)) {
      const c = (counts[e.talentSkillId] ??= { total: 0, verified: 0 });
      c.total += 1;
      if (e.status === "VERIFIED") c.verified += 1;
    }
    return counts;
  }
}
