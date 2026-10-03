import type { UpdateProfileInput } from "@/schemas/profile";
import type { AccountIdentity, ProfileDTO } from "@/types/profile";

export interface ProfileRepository {
  /** Returns the profile, creating it from the auth identity if it does not exist yet. */
  ensure(identity: AccountIdentity): Promise<ProfileDTO>;
  findByUsername(username: string): Promise<ProfileDTO | null>;
  /** Returns "username_taken" when the username belongs to someone else, null if the profile is missing. */
  update(id: string, input: UpdateProfileInput): Promise<ProfileDTO | null | "username_taken">;
}
