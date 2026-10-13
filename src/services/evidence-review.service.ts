import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type { StorageService } from "@/lib/storage/storage";
import type { EvidenceRepository } from "@/repositories/evidence.repository";
import type { PlatformRepository } from "@/repositories/platform.repository";
import type { ProfileRepository } from "@/repositories/profile.repository";
import type { EvidenceDTO } from "@/types/evidence";

export interface EvidenceReviewItem extends EvidenceDTO {
  profileId: string;
  talentName: string;
  talentUsername: string;
}

/**
 * The team's side of evidence verification. Like the rest of the console, every method re-checks the
 * administrator role from the database.
 */
export class EvidenceReviewService {
  constructor(
    private readonly evidence: EvidenceRepository,
    private readonly profiles: ProfileRepository,
    private readonly platform: PlatformRepository,
    private readonly storage: () => StorageService,
  ) {}

  private async admin(userId: string) {
    const profile = await this.profiles.findById(userId);
    if (!profile || profile.role !== "SKILLPASS_ADMIN") throw new ForbiddenError();
    return profile;
  }

  /** Pending requests, oldest first. */
  async listPending(userId: string): Promise<EvidenceReviewItem[]> {
    await this.admin(userId);
    const rows = await this.evidence.listByStatus("PENDING");
    const items = await Promise.all(
      rows.map(async (row) => {
        const owner = await this.profiles.findById(row.profileId);
        return {
          ...row,
          talentName: owner?.fullName ?? "Talent supprimé",
          talentUsername: owner?.username ?? "",
        };
      }),
    );
    return items.sort((a, b) =>
      (a.verificationRequestedAt ?? "").localeCompare(b.verificationRequestedAt ?? ""),
    );
  }

  async countPending(userId: string) {
    await this.admin(userId);
    return (await this.evidence.listByStatus("PENDING")).length;
  }

  /** Verifies the evidence, or refuses it with a reason the talent will read. */
  async decide(userId: string, id: string, decision: "VERIFIED" | "REJECTED", note = "") {
    const actor = await this.admin(userId);
    const evidence = await this.evidence.findAny(id);
    if (!evidence) throw new NotFoundError("Preuve introuvable");
    if (evidence.status !== "PENDING")
      throw new ConflictError("Cette preuve n'est plus en attente de vérification.");
    const reason = note.trim().slice(0, 500);
    if (decision === "REJECTED" && !reason)
      throw new ConflictError("Indiquez la raison du refus : le talent la lira.");

    await this.evidence.review(
      id,
      decision === "VERIFIED" ? "VERIFIED" : "UNVERIFIED",
      decision === "VERIFIED" ? null : reason,
    );
    const owner = await this.profiles.findById(evidence.profileId);
    await this.platform.addAudit({
      actorId: actor.id,
      actorName: actor.fullName,
      action: decision === "VERIFIED" ? "EVIDENCE_VERIFIED" : "EVIDENCE_REJECTED",
      targetType: "PROFILE",
      targetId: evidence.profileId,
      targetLabel: `${evidence.title} (${owner?.fullName ?? "talent"})`,
      detail: decision === "VERIFIED" ? "" : reason,
    });
  }

  /** A file of any evidence waiting for review, for the administrator's eyes only. */
  async openFile(userId: string, id: string, fileId: string) {
    await this.admin(userId);
    const evidence = await this.evidence.findAny(id);
    const file = evidence?.files.find((f) => f.id === fileId);
    if (!file) throw new NotFoundError("Fichier introuvable");
    return {
      content: await this.storage().read(file.filePath),
      fileName: file.name,
      mimeType: file.mimeType,
    };
  }
}
