import type { UpdateProfileInput } from "@/schemas/profile";
import type { AccountIdentity, ProfileDTO } from "@/types/profile";
import type { ProfileSettings } from "@/types/profile-settings";

export interface ProfileRepository {
  /** Returns the profile, creating it from the auth identity if it does not exist yet. */
  ensure(identity: AccountIdentity): Promise<ProfileDTO>;
  findById(id: string): Promise<ProfileDTO | null>;
  findByUsername(username: string): Promise<ProfileDTO | null>;
  /** Returns "username_taken" when the username belongs to someone else, null if the profile is missing. */
  update(id: string, input: UpdateProfileInput): Promise<ProfileDTO | null | "username_taken">;
  /** Replaces the given parts of the preferences; null when the profile is missing. */
  saveSettings(id: string, patch: Partial<ProfileSettings>): Promise<ProfileDTO | null>;
  setPublic(id: string, isPublic: boolean): Promise<ProfileDTO | null>;
}
