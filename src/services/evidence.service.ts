import { NotFoundError } from "@/lib/errors";
import { newStorageKey, type StorageService } from "@/lib/storage/storage";
import { sanitizeFileName, UploadError, validateUpload, type UploadedFile } from "@/lib/storage/uploads";
import type { EvidenceRepository } from "@/repositories/evidence.repository";
import { MAX_EVIDENCE_FILES, requiresFile, type CreateEvidenceInput } from "@/schemas/evidence";
import type { NewEvidence } from "@/types/evidence";

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

  async add(profileId: string, input: CreateEvidenceInput, files: UploadedFile[] = []) {
    // Ownership checks first: evidence can only attach to the caller's own skills and projects.
    const skillIds = [...new Set(input.talentSkillIds)];
    const skills = await Promise.all(skillIds.map((id) => this.skills.get(profileId, id)));
    if (input.projectId) await this.projects.get(profileId, input.projectId);

    if (files.length > MAX_EVIDENCE_FILES) {
      throw new UploadError(`${MAX_EVIDENCE_FILES} fichiers maximum par preuve`);
    }
    if (input.publish && requiresFile(input.type) && files.length === 0) {
      throw new UploadError("Ajoutez un fichier pour ce type de preuve");
    }
    // Validate everything before storing anything, so a bad file leaves nothing behind.
    const checked = files.map((file) => {
      const { ext, mimeType } = validateUpload(file);
      if (input.type === "SCREENSHOT" && !mimeType.startsWith("image/")) {
        throw new UploadError("Une capture d'écran doit être une image");
      }
      return { file, ext, mimeType };
    });

    const record: NewEvidence = {
      talentSkillId: skills[0].id,
      skillIds: skills.map((s) => s.id),
      projectId: input.projectId,
      type: input.type,
      title: input.title,
      description: input.description,
      url: input.url,
      organization: input.organization,
      role: input.role,
      startDate: input.startDate,
      endDate: input.endDate,
      technologies: input.technologies,
      tags: input.tags,
      category: input.category,
      visibility: input.visibility,
      published: input.publish,
      allowContact: input.allowContact,
      allowRecommendations: input.allowRecommendations,
      files: [],
    };

    const storedKeys: string[] = [];
    try {
      for (const { file, ext, mimeType } of checked) {
        const key = newStorageKey(profileId, ext);
        await this.storage().put(key, file.bytes, mimeType);
        storedKeys.push(key);
        record.files.push({ path: key, name: sanitizeFileName(file.name), mimeType, sizeBytes: file.size });
      }
      return await this.repo.create(profileId, record, skills);
    } catch (err) {
      // Do not leave orphan objects behind if an upload or the database write failed.
      await Promise.all(storedKeys.map((key) => this.storage().remove(key).catch(() => undefined)));
      throw err;
    }
  }

  async publish(profileId: string, id: string) {
    const evidence = await this.repo.findById(profileId, id);
    if (!evidence) throw new NotFoundError("Preuve introuvable");
    if (!evidence.description) throw new UploadError("Complétez la description avant de publier");
    if (requiresFile(evidence.type) && evidence.files.length === 0) {
      throw new UploadError("Ajoutez un fichier pour ce type de preuve");
    }
    await this.repo.publish(profileId, id);
  }

  async remove(profileId: string, id: string) {
    const removed = await this.repo.remove(profileId, id);
    if (!removed) throw new NotFoundError("Preuve introuvable");
    for (const key of removed.filePaths) {
      await this.storage()
        .remove(key)
        .catch((err) => console.error("evidence file cleanup failed", err));
    }
  }

  /** Authorizes (ownership via profileId) then returns what the route needs to serve the file. */
  async openFile(profileId: string, id: string, fileId: string) {
    const evidence = await this.repo.findById(profileId, id);
    const file = evidence?.files.find((f) => f.id === fileId);
    if (!file) throw new NotFoundError("Fichier introuvable");
    const content = await this.storage().read(file.filePath);
    return { content, fileName: file.name, mimeType: file.mimeType };
  }
}
