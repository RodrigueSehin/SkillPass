import type {
  MatchEventDTO,
  MatchEventInput,
  MatchStatus,
  SavedMatchDTO,
  SaveMatchInput,
} from "@/types/matching";

/** Saved talents and the matching history of an organization. Every method takes the organization id. */
export interface MatchingRepository {
  listSaved(orgId: string): Promise<SavedMatchDTO[]>;
  /** Saving a talent twice keeps the first save; the existing one is returned. */
  save(orgId: string, input: SaveMatchInput): Promise<SavedMatchDTO>;
  setStatus(orgId: string, id: string, status: MatchStatus): Promise<SavedMatchDTO | null>;
  /** Removes the given saves and returns how many existed. */
  removeSaved(orgId: string, ids: string[]): Promise<number>;
  /** Removes a talent from the list by profile id (the bookmark toggle). */
  removeSavedByProfile(orgId: string, profileId: string): Promise<boolean>;

  addEvent(orgId: string, input: MatchEventInput): Promise<MatchEventDTO>;
  /** Events newer than `since` (ISO), newest first, capped at `limit`. */
  listEvents(orgId: string, since: string, limit: number): Promise<MatchEventDTO[]>;
}
