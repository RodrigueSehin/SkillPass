import { randomUUID } from "node:crypto";
import type {
  MatchEventDTO,
  MatchEventInput,
  MatchStatus,
  SavedMatchDTO,
  SaveMatchInput,
} from "@/types/matching";
import type { MatchingRepository } from "./matching.repository";

export class InMemoryMatchingRepository implements MatchingRepository {
  private saved: (SavedMatchDTO & { orgId: string })[] = [];
  private events: (MatchEventDTO & { orgId: string })[] = [];

  private static strip<T extends { orgId: string }>({ orgId, ...rest }: T) {
    void orgId;
    return structuredClone(rest);
  }

  async listSaved(orgId: string) {
    return this.saved
      .filter((s) => s.orgId === orgId)
      .map((s) => InMemoryMatchingRepository.strip(s))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async save(orgId: string, input: SaveMatchInput) {
    const existing = this.saved.find((s) => s.orgId === orgId && s.profileId === input.profileId);
    if (existing) return InMemoryMatchingRepository.strip(existing);
    const row = {
      id: randomUUID(),
      orgId,
      status: "TO_CONTACT" as MatchStatus,
      createdAt: new Date().toISOString(),
      ...input,
    };
    this.saved.push(row);
    return InMemoryMatchingRepository.strip(row);
  }

  async setStatus(orgId: string, id: string, status: MatchStatus) {
    const row = this.saved.find((s) => s.orgId === orgId && s.id === id);
    if (!row) return null;
    row.status = status;
    return InMemoryMatchingRepository.strip(row);
  }

  async removeSaved(orgId: string, ids: string[]) {
    const before = this.saved.length;
    this.saved = this.saved.filter((s) => !(s.orgId === orgId && ids.includes(s.id)));
    return before - this.saved.length;
  }

  async removeSavedByProfile(orgId: string, profileId: string) {
    const before = this.saved.length;
    this.saved = this.saved.filter((s) => !(s.orgId === orgId && s.profileId === profileId));
    return this.saved.length < before;
  }

  async addEvent(orgId: string, input: MatchEventInput) {
    const row = { id: randomUUID(), orgId, createdAt: new Date().toISOString(), ...input };
    this.events.push(row);
    return InMemoryMatchingRepository.strip(row);
  }

  async listEvents(orgId: string, since: string, limit: number) {
    return this.events
      .filter((e) => e.orgId === orgId && e.createdAt >= since)
      .map((e) => InMemoryMatchingRepository.strip(e))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }
}
