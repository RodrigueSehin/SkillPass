import { NotFoundError } from "@/lib/errors";
import { newStorageKey, type StorageService } from "@/lib/storage/storage";
import { sanitizeFileName, validateUpload, type UploadedFile } from "@/lib/storage/uploads";

export interface ExperienceDocumentRepository {
  addDocument(
    profileId: string,
    id: string,
    doc: { path: string; name: string; size: number },
  ): Promise<string | null>;
  getDocumentPath(profileId: string, id: string, docId: string): Promise<string | null>;
}

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

/** Attachments of an experience. Ownership is checked by the repository on every call. */
export class ExperienceDocumentService {
  constructor(
    private readonly repo: ExperienceDocumentRepository,
    private readonly storage: () => StorageService,
  ) {}

  async upload(profileId: string, id: string, file: UploadedFile) {
    const { ext, mimeType } = validateUpload(file);
    const key = newStorageKey(profileId, ext);
    await this.storage().put(key, file.bytes, mimeType);
    let docId: string | null;
    try {
      docId = await this.repo.addDocument(profileId, id, {
        path: key,
        name: sanitizeFileName(file.name),
        size: file.size,
      });
    } catch (err) {
      await this.storage()
        .remove(key)
        .catch(() => undefined);
      throw err;
    }
    if (!docId) {
      await this.storage()
        .remove(key)
        .catch(() => undefined);
      throw new NotFoundError("Expérience introuvable");
    }
  }

  async open(profileId: string, id: string, docId: string) {
    const path = await this.repo.getDocumentPath(profileId, id, docId);
    if (!path) throw new NotFoundError("Document introuvable");
    return {
      content: await this.storage().read(path),
      mimeType: MIME_BY_EXT[path.split(".").pop() ?? ""] ?? "application/octet-stream",
    };
  }
}
