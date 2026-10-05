import { NotFoundError } from "@/lib/errors";
import { newStorageKey, type StorageService } from "@/lib/storage/storage";
import { sanitizeFileName, validateUpload, type UploadedFile } from "@/lib/storage/uploads";

export interface CertificationDocumentRepository {
  setDocument(
    profileId: string,
    id: string,
    doc: { path: string; name: string; size: number },
  ): Promise<{ previousPath: string | null } | null>;
  getDocumentPath(profileId: string, id: string): Promise<string | null>;
}

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

/** Proof file of a certification (certificate PDF or image). Ownership is checked by the repository. */
export class CertificationDocumentService {
  constructor(
    private readonly repo: CertificationDocumentRepository,
    private readonly storage: () => StorageService,
  ) {}

  async upload(profileId: string, id: string, file: UploadedFile) {
    const { ext, mimeType } = validateUpload(file);
    const key = newStorageKey(profileId, ext);
    await this.storage().put(key, file.bytes, mimeType);
    let result: Awaited<ReturnType<CertificationDocumentRepository["setDocument"]>>;
    try {
      result = await this.repo.setDocument(profileId, id, {
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
    if (!result) {
      await this.storage()
        .remove(key)
        .catch(() => undefined);
      throw new NotFoundError("Certification introuvable");
    }
    if (result.previousPath)
      await this.storage()
        .remove(result.previousPath)
        .catch(() => undefined);
  }

  async open(profileId: string, id: string) {
    const path = await this.repo.getDocumentPath(profileId, id);
    if (!path) throw new NotFoundError("Document introuvable");
    return {
      content: await this.storage().read(path),
      mimeType: MIME_BY_EXT[path.split(".").pop() ?? ""] ?? "application/octet-stream",
    };
  }
}
