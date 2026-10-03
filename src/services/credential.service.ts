import { NotFoundError } from "@/lib/errors";
import {
  CREDENTIAL_ID_PATTERN,
  generateCredentialId,
  type CredentialRepository,
} from "@/repositories/credential.repository";
import type { ProfileRepository } from "@/repositories/profile.repository";
import type { SkillLevel } from "@/types/skill";
import {
  effectiveCredentialStatus,
  type CredentialDTO,
  type CredentialEffectiveStatus,
} from "@/types/verification";

/** A credential stays valid for two years, after which the skill must be re-assessed. */
export const CREDENTIAL_VALIDITY_YEARS = 2;

export interface PublicCredential {
  credentialId: string;
  holderName: string;
  /** Only set when the holder's profile is public: it links to the profile. */
  holderUsername: string | null;
  skillName: string;
  level: SkillLevel;
  issuer: string;
  issuedAt: string;
  expiresAt: string | null;
  status: CredentialEffectiveStatus;
}

export class CredentialService {
  constructor(
    private readonly repo: CredentialRepository,
    private readonly profiles: ProfileRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Idempotent per attempt: issuing twice for the same attempt returns the same credential. */
  async issue(
    profileId: string,
    input: { talentSkillId: string | null; skillName: string; level: SkillLevel; attemptId: string | null },
  ): Promise<CredentialDTO> {
    if (input.attemptId) {
      const existing = await this.repo.findByAttempt(input.attemptId);
      if (existing) return existing;
    }
    const issuedAt = this.now();
    const expiresAt = new Date(issuedAt);
    expiresAt.setUTCFullYear(expiresAt.getUTCFullYear() + CREDENTIAL_VALIDITY_YEARS);

    // A collision on a 32^6 space is very unlikely, but the unique constraint is the arbiter.
    for (let attempt = 0; attempt < 5; attempt++) {
      const created = await this.repo.create(profileId, {
        credentialId: generateCredentialId(),
        talentSkillId: input.talentSkillId,
        skillName: input.skillName,
        level: input.level,
        issuedAt: issuedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        attemptId: input.attemptId,
      });
      if (created) return created;
      // null can also mean "attempt already has one" (concurrent request): return it.
      if (input.attemptId) {
        const raced = await this.repo.findByAttempt(input.attemptId);
        if (raced) return raced;
      }
    }
    throw new Error("Could not allocate a credential id");
  }

  listForProfile(profileId: string) {
    return this.repo.listByProfile(profileId);
  }

  /** Public verification. Unknown or malformed ids look identical to the caller. */
  async verify(rawId: string): Promise<PublicCredential> {
    const id = rawId.trim().toUpperCase();
    if (!CREDENTIAL_ID_PATTERN.test(id)) throw new NotFoundError("Credential introuvable");
    const credential = await this.repo.findByCredentialId(id);
    if (!credential) throw new NotFoundError("Credential introuvable");
    const holder = await this.profiles.findById(credential.profileId);
    if (!holder) throw new NotFoundError("Credential introuvable");

    return {
      credentialId: credential.credentialId,
      holderName: holder.fullName,
      holderUsername: holder.isPublic ? holder.username : null,
      skillName: credential.skillName,
      level: credential.level,
      issuer: credential.issuer,
      issuedAt: credential.issuedAt,
      expiresAt: credential.expiresAt,
      status: effectiveCredentialStatus(credential, this.now()),
    };
  }
}
