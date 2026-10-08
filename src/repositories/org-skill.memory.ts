import { randomUUID } from "node:crypto";
import type { OrgSkillDTO, OrgSkillInput } from "@/types/org-skill";
import type { OrgSkillRepository } from "./org-skill.repository";

type Stored = OrgSkillDTO & { orgId: string };
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export class InMemoryOrgSkillRepository implements OrgSkillRepository {
  private rows: Stored[] = [];

  private view = ({ orgId, ...skill }: Stored): OrgSkillDTO => {
    void orgId;
    return structuredClone(skill);
  };

  async list(orgId: string) {
    return this.rows
      .filter((s) => s.orgId === orgId)
      .map(this.view)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async get(orgId: string, id: string) {
    const row = this.rows.find((s) => s.orgId === orgId && s.id === id);
    return row ? this.view(row) : null;
  }

  async create(orgId: string, input: OrgSkillInput) {
    if (this.rows.some((s) => s.orgId === orgId && same(s.name, input.name))) return null;
    const row: Stored = {
      ...structuredClone(input),
      id: randomUUID(),
      orgId,
      createdAt: new Date().toISOString(),
    };
    this.rows.push(row);
    return this.view(row);
  }

  async update(orgId: string, id: string, input: OrgSkillInput) {
    const row = this.rows.find((s) => s.orgId === orgId && s.id === id);
    if (!row) return null;
    if (this.rows.some((s) => s.orgId === orgId && s.id !== id && same(s.name, input.name)))
      return "conflict" as const;
    Object.assign(row, structuredClone(input));
    return this.view(row);
  }

  async delete(orgId: string, id: string) {
    const index = this.rows.findIndex((s) => s.orgId === orgId && s.id === id);
    if (index === -1) return false;
    this.rows.splice(index, 1);
    return true;
  }
}
