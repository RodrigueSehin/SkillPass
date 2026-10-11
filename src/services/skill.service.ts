import { assertWithinCapacity, type Capacity } from "@/lib/plans/limits";
import { ConflictError, NotFoundError } from "@/lib/errors";
import type { TalentSkillDTO, TalentSkillRepository } from "@/repositories/talent-skill.repository";
import type { CreateTalentSkillInput, ListTalentSkillsQuery, UpdateTalentSkillInput } from "@/schemas/skill";
import { SKILL_LEVELS, type SkillLevel } from "@/types/skill";

/** Declared score until an assessment sets a measured one. */
export const DECLARED_SCORE: Record<SkillLevel, number> = {
  BEGINNER: 30,
  INTERMEDIATE: 55,
  ADVANCED: 75,
  EXPERT: 90,
};

export class SkillService {
  constructor(
    private readonly repo: TalentSkillRepository,
    /** When provided, evidence counts come from the evidence store (single source of truth). */
    private readonly evidence?: {
      countBySkill(profileId: string): Promise<Record<string, { total: number }>>;
    },
    /** The plan's limit on how many skills a profile may hold; none when omitted. */
    private readonly capacity?: Capacity,
  ) {}

  private async withEvidence(profileId: string, skills: TalentSkillDTO[]) {
    if (!this.evidence) return skills;
    const counts = await this.evidence.countBySkill(profileId);
    return skills.map((s) => ({ ...s, evidenceCount: counts[s.id]?.total ?? 0 }));
  }

  async list(profileId: string, query: Partial<ListTalentSkillsQuery> = {}) {
    const all = await this.withEvidence(profileId, await this.repo.list(profileId));
    const q = query.q?.toLowerCase();
    const filtered = all.filter(
      (s) =>
        (!q || s.name.toLowerCase().includes(q)) &&
        (!query.level || s.level === query.level) &&
        (!query.status || s.verificationStatus === query.status) &&
        (!query.category || s.category === query.category),
    );
    return {
      items: sortSkills(filtered, query.sort ?? "score"),
      categories: [...new Set(all.map((s) => s.category).filter((c): c is string => Boolean(c)))].sort(),
      total: all.length,
      /** Unfiltered head-count per level, for the overview chart. */
      levels: Object.fromEntries(
        SKILL_LEVELS.map((l) => [l, all.filter((s) => s.level === l).length]),
      ) as Record<SkillLevel, number>,
    };
  }

  async get(profileId: string, id: string) {
    const skill = await this.repo.findById(profileId, id);
    if (!skill) throw new NotFoundError("Compétence introuvable");
    return (await this.withEvidence(profileId, [skill]))[0];
  }

  async add(profileId: string, input: CreateTalentSkillInput) {
    await assertWithinCapacity(
      this.capacity,
      profileId,
      async () => (await this.repo.list(profileId)).length,
    );
    const created = await this.repo.create(profileId, { ...input, score: DECLARED_SCORE[input.level] });
    if (!created) throw new ConflictError("Cette compétence figure déjà dans votre profil");
    return created;
  }

  async update(profileId: string, id: string, input: UpdateTalentSkillInput) {
    const current = await this.get(profileId, id);
    const changesLevel = input.level !== undefined && input.level !== current.level;
    // A verified level comes from an assessment: it cannot be edited by hand.
    if (changesLevel && current.verificationStatus === "VERIFIED") {
      throw new ConflictError("Le niveau d'une compétence vérifiée provient de son évaluation");
    }
    const patch = changesLevel ? { ...input, score: DECLARED_SCORE[input.level!] } : input;
    const updated = await this.repo.update(profileId, id, patch);
    if (!updated) throw new NotFoundError("Compétence introuvable");
    return updated;
  }

  async remove(profileId: string, id: string) {
    if (!(await this.repo.remove(profileId, id))) throw new NotFoundError("Compétence introuvable");
  }

  searchCatalog(query: string) {
    return query.trim().length < 2 ? Promise.resolve([]) : this.repo.searchCatalog(query.trim());
  }
}

export function sortSkills(skills: TalentSkillDTO[], sort: ListTalentSkillsQuery["sort"]) {
  const copy = [...skills];
  switch (sort) {
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "level":
      return copy.sort(
        (a, b) => SKILL_LEVELS.indexOf(b.level) - SKILL_LEVELS.indexOf(a.level) || b.score - a.score,
      );
    case "experience":
      return copy.sort((a, b) => b.yearsOfExperience - a.yearsOfExperience);
    default:
      return copy.sort((a, b) => b.score - a.score);
  }
}
