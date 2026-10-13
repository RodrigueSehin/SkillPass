import type { EvidenceDTO, EvidenceFileDTO, EvidenceStatus, NewEvidence } from "@/types/evidence";

/** Internal shape: storage keys never leave the server. */
export type StoredEvidence = Omit<EvidenceDTO, "files"> & {
  files: (EvidenceFileDTO & { filePath: string })[];
};

export interface EvidenceCounts {
  total: number;
  verified: number;
}

/** Every method is scoped by profileId. */
export interface EvidenceRepository {
  /** Drafts included. With a skill filter: evidence that demonstrates that skill (main or additional). */
  list(profileId: string, filter?: { talentSkillId?: string }): Promise<EvidenceDTO[]>;
  findById(profileId: string, id: string): Promise<StoredEvidence | null>;
  /** `skills` are the ownership-checked skills the evidence demonstrates; the first is the main one. */
  create(profileId: string, input: NewEvidence, skills: { id: string; name: string }[]): Promise<EvidenceDTO>;
  /**
   * Replaces the fields and skills of an evidence, removes the stored files not in `keepFileIds` and adds `input.files`.
   * Returns the storage keys of the removed files, or undefined if the evidence does not exist.
   */
  update(
    profileId: string,
    id: string,
    input: NewEvidence,
    skills: { id: string; name: string }[],
    keepFileIds: string[],
  ): Promise<{ evidence: EvidenceDTO; removedPaths: string[] } | undefined>;
  /** Asks the team to verify a published evidence: UNVERIFIED becomes PENDING. False when it does not exist. */
  requestVerification(profileId: string, id: string): Promise<boolean>;
  /** Review queue, for the platform administrator: every evidence in this status, whoever owns it. */
  listByStatus(status: EvidenceStatus): Promise<(EvidenceDTO & { profileId: string })[]>;
  /** Any profile's evidence, with its storage keys: for the administrator only. */
  findAny(id: string): Promise<(StoredEvidence & { profileId: string }) | null>;
  /** Records the team's decision on a pending evidence. False when it does not exist. */
  review(id: string, status: "VERIFIED" | "UNVERIFIED", note: string | null): Promise<boolean>;
  /** Turns a draft into a published evidence. False when it does not exist. */
  publish(profileId: string, id: string): Promise<boolean>;
  /** Returns the removed row's storage keys, or undefined if not found. */
  remove(profileId: string, id: string): Promise<{ filePaths: string[] } | undefined>;
  /** Published evidence counts keyed by main talent skill id. */
  countBySkill(profileId: string): Promise<Record<string, EvidenceCounts>>;
}

export function toPublicEvidence(row: StoredEvidence): EvidenceDTO {
  return {
    ...row,
    files: row.files.map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      sizeBytes: f.sizeBytes,
      isImage: f.isImage,
    })),
  };
}

export const isImageMime = (mimeType: string) => mimeType.startsWith("image/");

/** Date stored as a month ("YYYY-MM") in the form, as the first day of that month in the database. */
export const monthToDate = (m?: string) => (m ? new Date(`${m}-01T00:00:00.000Z`) : null);
export const dateToMonth = (d: Date | null) => (d ? d.toISOString().slice(0, 7) : null);
