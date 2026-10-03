import type { EvidenceDTO, NewEvidence } from "@/types/evidence";

/** Internal shape: the storage key never leaves the server. */
export type StoredEvidence = EvidenceDTO & { filePath: string | null };

export interface EvidenceCounts {
  total: number;
  verified: number;
}

/** Every method is scoped by profileId. */
export interface EvidenceRepository {
  list(profileId: string, filter?: { talentSkillId?: string }): Promise<EvidenceDTO[]>;
  findById(profileId: string, id: string): Promise<StoredEvidence | null>;
  create(profileId: string, input: NewEvidence, skillName: string): Promise<EvidenceDTO>;
  /** Returns the removed row's storage key (null when it had no file), or undefined if not found. */
  remove(profileId: string, id: string): Promise<{ filePath: string | null } | undefined>;
  /** Evidence counts keyed by talent skill id. */
  countBySkill(profileId: string): Promise<Record<string, EvidenceCounts>>;
}

export function toPublicEvidence(row: StoredEvidence): EvidenceDTO {
  const dto: Partial<StoredEvidence> = { ...row };
  delete dto.filePath;
  return dto as EvidenceDTO;
}
