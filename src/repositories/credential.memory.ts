import type { CredentialDTO } from "@/types/verification";
import type { CredentialRepository, NewCredential } from "./credential.repository";

export class InMemoryCredentialRepository implements CredentialRepository {
  private rows: CredentialDTO[] = [];

  async create(profileId: string, input: NewCredential) {
    if (this.rows.some((r) => r.credentialId === input.credentialId)) return null;
    if (input.attemptId && this.rows.some((r) => r.attemptId === input.attemptId)) return null;
    const row: CredentialDTO = { ...input, profileId, issuer: "SkillPass", status: "VALID" };
    this.rows.push(row);
    return { ...row };
  }

  async findByCredentialId(credentialId: string) {
    const row = this.rows.find((r) => r.credentialId === credentialId);
    return row ? { ...row } : null;
  }

  async listByProfile(profileId: string) {
    return this.rows
      .filter((r) => r.profileId === profileId)
      .map((r) => ({ ...r }))
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  }

  async findByAttempt(attemptId: string) {
    const row = this.rows.find((r) => r.attemptId === attemptId);
    return row ? { ...row } : null;
  }
}
