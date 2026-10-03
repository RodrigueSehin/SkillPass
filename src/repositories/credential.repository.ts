import { randomInt } from "node:crypto";
import type { CredentialDTO } from "@/types/verification";
import type { SkillLevel } from "@/types/skill";

export interface NewCredential {
  credentialId: string;
  talentSkillId: string | null;
  skillName: string;
  level: SkillLevel;
  issuedAt: string;
  expiresAt: string | null;
  attemptId: string | null;
}

export interface CredentialRepository {
  /** Returns null when the credential id or the attempt already has a credential. */
  create(profileId: string, input: NewCredential): Promise<CredentialDTO | null>;
  /** Public lookup by the SP-XXXXXX identifier. */
  findByCredentialId(credentialId: string): Promise<CredentialDTO | null>;
  listByProfile(profileId: string): Promise<CredentialDTO[]>;
  findByAttempt(attemptId: string): Promise<CredentialDTO | null>;
}

// No 0/O/1/I: identifiers are read aloud and typed by hand.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Cryptographically random public identifier: `SP-` followed by 6 unambiguous characters. */
export function generateCredentialId() {
  let id = "SP-";
  for (let i = 0; i < 6; i++) id += ALPHABET[randomInt(ALPHABET.length)];
  return id;
}

export const CREDENTIAL_ID_PATTERN = /^SP-[A-HJ-NP-Z2-9]{6}$/;
