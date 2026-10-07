import type { TalentDetail, TalentRecord } from "@/types/talent";

/** Read-only view over the public talent profiles, for the Business talent search. */
export interface TalentDirectoryRepository {
  /** Public TALENT profiles only, most recently updated first. */
  listPublic(limit: number): Promise<TalentRecord[]>;
  /** null when the profile does not exist or is not public. */
  detail(username: string): Promise<TalentDetail | null>;
}
