import { NotFoundError } from "@/lib/errors";
import { newStorageKey, type StorageService } from "@/lib/storage/storage";
import { UploadError, validateUpload, type UploadedFile } from "@/lib/storage/uploads";
import type { OrganizationRepository } from "@/repositories/organization.repository";

const MIME_BY_EXT: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

/** The organization's logo. The caller has already been authorized for this organization. */
export class OrganizationLogoService {
  constructor(
    private readonly repo: OrganizationRepository,
    private readonly storage: () => StorageService,
  ) {}

  async upload(orgId: string, uploaderId: string, file: UploadedFile) {
    const { ext, mimeType } = validateUpload(file);
    if (!mimeType.startsWith("image/"))
      throw new UploadError("Le logo doit être une image (PNG, JPG ou WebP)");
    const key = newStorageKey(uploaderId, ext);
    await this.storage().put(key, file.bytes, mimeType);
    let result: Awaited<ReturnType<OrganizationRepository["setLogo"]>>;
    try {
      result = await this.repo.setLogo(orgId, key);
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
      throw new NotFoundError("Organisation introuvable");
    }
    if (result.previousPath)
      await this.storage()
        .remove(result.previousPath)
        .catch(() => undefined);
  }

  async remove(orgId: string) {
    const result = await this.repo.setLogo(orgId, null);
    if (!result) throw new NotFoundError("Organisation introuvable");
    if (result.previousPath)
      await this.storage()
        .remove(result.previousPath)
        .catch(() => undefined);
  }

  async open(orgId: string) {
    const path = await this.repo.getLogoPath(orgId);
    if (!path) throw new NotFoundError("Logo introuvable");
    return {
      content: await this.storage().read(path),
      mimeType: MIME_BY_EXT[path.split(".").pop() ?? ""] ?? "application/octet-stream",
    };
  }
}
