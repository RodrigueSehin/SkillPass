import type { OrgSkillDTO, OrgSkillInput } from "@/types/org-skill";

/** An organization's own skills. Every method takes the organization id: no skill can cross tenants. */
export interface OrgSkillRepository {
  list(orgId: string): Promise<OrgSkillDTO[]>;
  get(orgId: string, id: string): Promise<OrgSkillDTO | null>;
  /** Returns null when the organization already has a skill of that name (case-insensitive). */
  create(orgId: string, input: OrgSkillInput): Promise<OrgSkillDTO | null>;
  /** Returns "conflict" when another skill already has that name, null when the skill does not exist. */
  update(orgId: string, id: string, input: OrgSkillInput): Promise<OrgSkillDTO | null | "conflict">;
  delete(orgId: string, id: string): Promise<boolean>;
}
