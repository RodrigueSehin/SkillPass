import { NotFoundError } from "@/lib/errors";
import { newStorageKey, type StorageService } from "@/lib/storage/storage";
import { UploadError, validateUpload, type UploadedFile } from "@/lib/storage/uploads";

export interface ProjectCoverRepository {
  setCover(profileId: string, id: string, path: string): Promise<{ previousPath: string | null } | null>;
  getCoverPath(profileId: string, id: string): Promise<string | null>;
}

const MIME_BY_EXT: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

/** Cover image of a project. Ownership is checked by the repository on every call. */
export class ProjectCoverService {
  constructor(
    private readonly repo: ProjectCoverRepository,
    private readonly storage: () => StorageService,
  ) {}

  async upload(profileId: string, id: string, file: UploadedFile) {
    const { ext, mimeType } = validateUpload(file);
    if (!mimeType.startsWith("image/"))
      throw new UploadError("La couverture doit être une image (PNG, JPG ou WebP)");
    const key = newStorageKey(profileId, ext);
    await this.storage().put(key, file.bytes, mimeType);
    let result: Awaited<ReturnType<ProjectCoverRepository["setCover"]>>;
    try {
      result = await this.repo.setCover(profileId, id, key);
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
      throw new NotFoundError("Projet introuvable");
    }
    if (result.previousPath)
      await this.storage()
        .remove(result.previousPath)
        .catch(() => undefined);
  }

  async open(profileId: string, id: string) {
    const path = await this.repo.getCoverPath(profileId, id);
    if (!path) throw new NotFoundError("Couverture introuvable");
    return {
      content: await this.storage().read(path),
      mimeType: MIME_BY_EXT[path.split(".").pop() ?? ""] ?? "application/octet-stream",
    };
  }
}
