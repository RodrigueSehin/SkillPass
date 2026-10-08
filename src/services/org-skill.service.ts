import { ConflictError, NotFoundError } from "@/lib/errors";
import type { OrgSkillRepository } from "@/repositories/org-skill.repository";
import type { OrgSkillInput } from "@/types/org-skill";

const TAKEN = "Cette compétence existe déjà dans votre référentiel.";

/** The skills an organization added to its own referential. */
export class OrgSkillService {
  constructor(private readonly skills: OrgSkillRepository) {}

  list(orgId: string) {
    return this.skills.list(orgId);
  }

  async get(orgId: string, id: string) {
    const skill = await this.skills.get(orgId, id);
    if (!skill) throw new NotFoundError("Compétence introuvable");
    return skill;
  }

  async create(orgId: string, input: OrgSkillInput) {
    const created = await this.skills.create(orgId, input);
    if (!created) throw new ConflictError(TAKEN);
    return created;
  }

  async update(orgId: string, id: string, input: OrgSkillInput) {
    const updated = await this.skills.update(orgId, id, input);
    if (updated === "conflict") throw new ConflictError(TAKEN);
    if (!updated) throw new NotFoundError("Compétence introuvable");
    return updated;
  }

  async remove(orgId: string, id: string) {
    if (!(await this.skills.delete(orgId, id))) throw new NotFoundError("Compétence introuvable");
  }
}
