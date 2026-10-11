import { randomUUID } from "node:crypto";
import { isPresetKey, parseAvatar, presetStored } from "@/lib/avatars";
import { NotFoundError } from "@/lib/errors";
import type { StorageService } from "@/lib/storage/storage";
import { UploadError, validateUpload, type UploadedFile } from "@/lib/storage/uploads";
import type { ProfileRepository } from "@/repositories/profile.repository";

const MIME_BY_EXT: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };
const PHOTO_TYPES = Object.keys(MIME_BY_EXT);

/** The profile picture: a photo to upload, or one of the SkillPass avatars. */
export class ProfileAvatarService {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly storage: () => StorageService,
  ) {}

  private async dropFile(stored: string | null) {
    // Avatars are drawn inline; only an uploaded photo owns a file.
    if (stored && parseAvatar(stored)?.kind === "upload")
      await this.storage()
        .remove(stored)
        .catch(() => undefined);
  }

  async upload(profileId: string, file: UploadedFile) {
    const { ext, mimeType } = validateUpload(file);
    if (!PHOTO_TYPES.includes(ext) || !mimeType.startsWith("image/"))
      throw new UploadError("La photo doit être une image (PNG, JPG ou WebP)");
    const key = `${profileId}/avatar-${randomUUID()}.${ext}`;
    await this.storage().put(key, file.bytes, mimeType);
    let result: Awaited<ReturnType<ProfileRepository["setAvatarStored"]>>;
    try {
      result = await this.profiles.setAvatarStored(profileId, key);
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
      throw new NotFoundError("Profil introuvable");
    }
    await this.dropFile(result.previous);
  }

  async choosePreset(profileId: string, key: string) {
    if (!isPresetKey(key)) throw new NotFoundError("Avatar inconnu");
    const result = await this.profiles.setAvatarStored(profileId, presetStored(key));
    if (!result) throw new NotFoundError("Profil introuvable");
    await this.dropFile(result.previous);
  }

  async remove(profileId: string) {
    const result = await this.profiles.setAvatarStored(profileId, null);
    if (!result) throw new NotFoundError("Profil introuvable");
    await this.dropFile(result.previous);
  }

  /**
   * The bytes of an uploaded photo. A private profile's picture is shown to its owner only: whoever is not
   * the owner gets the same "not found" as for a missing picture.
   */
  async open(profileId: string, viewerId: string | null) {
    const profile = await this.profiles.findById(profileId);
    if (!profile || (!profile.isPublic && viewerId !== profileId))
      throw new NotFoundError("Photo introuvable");
    const stored = await this.profiles.getAvatarStored(profileId);
    if (!stored || parseAvatar(stored)?.kind !== "upload") throw new NotFoundError("Photo introuvable");
    return {
      content: await this.storage().read(stored),
      mimeType: MIME_BY_EXT[stored.split(".").pop() ?? ""] ?? "application/octet-stream",
    };
  }
}
