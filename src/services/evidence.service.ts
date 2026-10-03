import { NotFoundError } from "@/lib/errors";
import { newStorageKey, type StorageService } from "@/lib/storage/storage";
import { sanitizeFileName, UploadError, validateUpload, type UploadedFile } from "@/lib/storage/uploads";
import type { EvidenceRepository } from "@/repositories/evidence.repository";
import { requiresFile, type CreateEvidenceInput } from "@/schemas/evidence";
import { URL_EVIDENCE_TYPES, type NewEvidence } from "@/types/evidence";

interface OwnedLookup {
  get(profileId: string, id: string): Promise<{ id: string; name: string }>;
}

/** Projects expose `name`, skills `name`: both only need an ownership-checked lookup. */
interface ProjectLookup {
  get(profileId: string, id: string): Promise<{ id: string }>;
}

export class EvidenceService {
  constructor(
    private readonly repo: EvidenceRepository,
    private readonly skills: OwnedLookup,
    private readonly projects: ProjectLookup,
    private readonly storage: () => StorageService,
  ) {}

  list(profileId: string, talentSkillId?: string) {
    return this.repo.list(profileId, { talentSkillId });
  }

  async add(profileId: string, input: CreateEvidenceInput, file?: UploadedFile) {
    // Ownership checks first: evidence can only attach to the caller's own skills and projects.
    const skill = await this.skills.get(profileId, input.talentSkillId);
    if (input.projectId) await this.projects.get(profileId, input.projectId);

    if (URL_EVIDENCE_TYPES.includes(input.type) && file) {
      throw new UploadError("Ce type de preuve est un lien : aucun fichier n'est attendu");
    }
    if (requiresFile(input.type) && !file) throw new UploadError("Ajoutez un fichier pour ce type de preuve");

    const record: NewEvidence = {
      talentSkillId: skill.id,
      projectId: input.projectId,
      type: input.type,
      title: input.title,
      description: input.description,
      url: input.url,
    };

    let storedKey: string | undefined;
    if (file) {
      const { ext, mimeType } = validateUpload(file);
      if (input.type === "SCREENSHOT" && !mimeType.startsWith("image/")) {
        throw new UploadError("Une capture d'écran doit être une image");
      }
      storedKey = newStorageKey(profileId, ext);
      await this.storage().put(storedKey, file.bytes, mimeType);
      record.file = { path: storedKey, name: sanitizeFileName(file.name), mimeType, sizeBytes: file.size };
    }

    try {
      return await this.repo.create(profileId, record, skill.name);
    } catch (err) {
      // Do not leave an orphan object behind if the database write failed.
      if (storedKey)
        await this.storage()
          .remove(storedKey)
          .catch(() => undefined);
      throw err;
    }
  }

  async remove(profileId: string, id: string) {
    const removed = await this.repo.remove(profileId, id);
    if (!removed) throw new NotFoundError("Preuve introuvable");
    if (removed.filePath) {
      await this.storage()
        .remove(removed.filePath)
        .catch((err) => console.error("evidence file cleanup failed", err));
    }
  }

  /** Authorizes (ownership via profileId) then returns what the route needs to serve the file. */
  async openFile(profileId: string, id: string) {
    const evidence = await this.repo.findById(profileId, id);
    if (!evidence?.filePath) throw new NotFoundError("Fichier introuvable");
    const content = await this.storage().read(evidence.filePath);
    return {
      content,
      fileName: evidence.fileName ?? "preuve",
      mimeType: evidence.mimeType ?? "application/octet-stream",
    };
  }
}
