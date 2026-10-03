import { randomUUID } from "node:crypto";
import { DEMO_SKILL_ROWS, demoSkillId } from "@/config/demo-data";
import type {
  NewTalentSkill,
  TalentSkillDTO,
  TalentSkillPatch,
  TalentSkillRepository,
} from "./talent-skill.repository";

/** In-memory implementation for tests and for local previews without a database. */
export class InMemoryTalentSkillRepository implements TalentSkillRepository {
  private rows = new Map<string, (TalentSkillDTO & { profileId: string })[]>();

  constructor(private readonly seedProfileId?: string) {}

  private forProfile(profileId: string) {
    let list = this.rows.get(profileId);
    if (!list) {
      list =
        profileId === this.seedProfileId
          ? DEMO_SKILL_ROWS.map((r) => ({ ...r, id: demoSkillId(r.name), skillId: randomUUID(), profileId }))
          : [];
      this.rows.set(profileId, list);
    }
    return list;
  }

  async list(profileId: string) {
    return this.forProfile(profileId).map(strip);
  }

  async findById(profileId: string, id: string) {
    const row = this.forProfile(profileId).find((r) => r.id === id);
    return row ? strip(row) : null;
  }

  async create(profileId: string, input: NewTalentSkill) {
    const list = this.forProfile(profileId);
    if (list.some((r) => r.name.toLowerCase() === input.name.toLowerCase())) return null;
    const row = {
      id: randomUUID(),
      skillId: randomUUID(),
      profileId,
      name: input.name,
      category: input.category ?? null,
      level: input.level,
      score: input.score,
      yearsOfExperience: input.yearsOfExperience,
      verificationStatus: "UNVERIFIED" as const,
      evidenceCount: 0,
      recommendationCount: 0,
    };
    list.push(row);
    return strip(row);
  }

  async update(profileId: string, id: string, patch: TalentSkillPatch) {
    const row = this.forProfile(profileId).find((r) => r.id === id);
    if (!row) return null;
    Object.assign(row, patch);
    return strip(row);
  }

  async remove(profileId: string, id: string) {
    const list = this.forProfile(profileId);
    const index = list.findIndex((r) => r.id === id);
    if (index === -1) return false;
    list.splice(index, 1);
    return true;
  }

  async searchCatalog(query: string, limit = 8) {
    const q = query.toLowerCase();
    const all = new Map<string, { id: string; name: string; category: string | null }>();
    for (const r of DEMO_SKILL_ROWS) all.set(r.name, { id: r.name, name: r.name, category: r.category });
    return [...all.values()].filter((s) => s.name.toLowerCase().includes(q)).slice(0, limit);
  }
}

function strip(row: TalentSkillDTO & { profileId: string }): TalentSkillDTO {
  const dto: Partial<typeof row> = { ...row };
  delete dto.profileId;
  return dto as TalentSkillDTO;
}
