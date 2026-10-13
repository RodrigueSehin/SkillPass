import type { AccountRemover } from "@/lib/auth/account-remover";
import { AppError, ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type { StorageService } from "@/lib/storage/storage";
import type { ProfileRepository } from "@/repositories/profile.repository";
import type { OrganizationService } from "./organization.service";

/** The sign-in account is gone, or could not be removed after the data was: the person must try again. */
export class AccountRemovalIncompleteError extends AppError {
  constructor() {
    super(
      "Vos données ont été supprimées, mais votre compte de connexion n'a pas pu être retiré. Reconnectez-vous et recommencez.",
      500,
      "ACCOUNT_REMOVAL_INCOMPLETE",
    );
  }
}

/**
 * Permanent deletion of a talent account: files in storage, the profile with everything attached to it,
 * then the sign-in account. Refused when it would leave something unmanaged behind.
 */
export class AccountDeletionService {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly orgs: Pick<OrganizationService, "scopeFor" | "leave">,
    private readonly storage: () => StorageService,
    private readonly accounts: () => AccountRemover,
  ) {}

  async deleteAccount(profileId: string) {
    const profile = await this.profiles.findById(profileId);
    if (!profile) throw new NotFoundError("Profil introuvable");
    if (profile.role === "SKILLPASS_ADMIN") {
      throw new ForbiddenError(
        "Un administrateur SkillPass ne peut pas supprimer son compte ici : retirez d'abord ce rôle.",
      );
    }

    // Leaving an organization is refused when this person is its last administrator: nothing is touched then.
    const membership = await this.orgs.scopeFor(profileId);
    if (membership) await this.orgs.leave(membership);

    // Storage first: it is keyed by the profile id, which is gone with the profile row.
    await this.storage().removePrefix(profileId);
    if (!(await this.profiles.delete(profileId))) throw new ConflictError("Le profil a déjà été supprimé.");

    try {
      await this.accounts().deleteUser(profileId);
    } catch (err) {
      console.error("sign-in account removal failed", err);
      throw new AccountRemovalIncompleteError();
    }
  }
}
