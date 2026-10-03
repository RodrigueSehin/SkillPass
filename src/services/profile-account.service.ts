import { ConflictError, NotFoundError } from "@/lib/errors";
import type { ProfileRepository } from "@/repositories/profile.repository";
import type { UpdateProfileInput } from "@/schemas/profile";
import type { AccountIdentity, PublicProfileDTO } from "@/types/profile";

export class ProfileAccountService {
  constructor(private readonly repo: ProfileRepository) {}

  get(identity: AccountIdentity) {
    return this.repo.ensure(identity);
  }

  async update(id: string, input: UpdateProfileInput) {
    const result = await this.repo.update(id, input);
    if (result === "username_taken") throw new ConflictError("Ce nom d'utilisateur est déjà pris");
    if (!result) throw new NotFoundError("Profil introuvable");
    return result;
  }

  /** Returns the public view of a profile, or null if it does not exist or is private. */
  async getPublic(
    username: string,
  ): Promise<{ id: string; updatedAt: string; profile: PublicProfileDTO } | null> {
    const found = await this.repo.findByUsername(username);
    if (!found?.isPublic) return null;
    // Allow-list: a field added to ProfileDTO later stays private until it is listed here.
    const profile: PublicProfileDTO = {
      username: found.username,
      fullName: found.fullName,
      headline: found.headline,
      bio: found.bio,
      location: found.location,
      profession: found.profession,
      yearsOfExperience: found.yearsOfExperience,
      availability: found.availability,
    };
    return { id: found.id, updatedAt: found.updatedAt, profile };
  }
}
