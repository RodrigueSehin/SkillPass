import { describe, expect, it } from "vitest";
import { parseAvatar, presetStored } from "@/lib/avatars";
import type { StorageService } from "@/lib/storage/storage";
import { InMemoryProfileRepository } from "@/repositories/profile.memory";
import { ProfileAvatarService } from "./profile-avatar.service";

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);

function setup() {
  const files = new Map<string, Uint8Array>();
  const storage: StorageService = {
    async put(key, bytes) {
      files.set(key, bytes);
    },
    async remove(key) {
      files.delete(key);
    },
    async read(key) {
      const bytes = files.get(key);
      if (!bytes) throw new Error("missing");
      return { bytes };
    },
  };
  const profiles = new InMemoryProfileRepository(true);
  return { files, profiles, service: new ProfileAvatarService(profiles, () => storage) };
}

const photo = (over: Partial<{ type: string; bytes: Uint8Array }> = {}) => {
  const bytes = over.bytes ?? PNG;
  return { name: "moi.png", type: over.type ?? "image/png", size: bytes.byteLength, bytes };
};

describe("parseAvatar", () => {
  it("tells avatars, photos and nothing apart", () => {
    expect(parseAvatar(null)).toBeNull();
    expect(parseAvatar(presetStored("orbit"))).toEqual({ kind: "preset", key: "orbit" });
    expect(parseAvatar("preset:nope")).toBeNull();
    const a = parseAvatar("p1/avatar-1.png");
    const b = parseAvatar("p1/avatar-2.png");
    expect(a?.kind).toBe("upload");
    expect(a).not.toEqual(b);
  });
});

describe("ProfileAvatarService", () => {
  it("stores a photo, then replaces it and removes the old file", async () => {
    const { service, files, profiles } = setup();
    await service.upload("demo", photo());
    expect(files.size).toBe(1);
    expect((await profiles.findById("demo"))?.avatar?.kind).toBe("upload");
    await service.upload("demo", photo());
    expect(files.size).toBe(1);
  });

  it("refuses PDFs, wrong content and oversized files", async () => {
    const { service } = setup();
    await expect(service.upload("demo", photo({ type: "application/pdf" }))).rejects.toThrow();
    await expect(service.upload("demo", photo({ bytes: Uint8Array.from([1, 2, 3, 4]) }))).rejects.toThrow(
      /contenu/i,
    );
  });

  it("picks a SkillPass avatar, which owns no file, and drops a previous photo", async () => {
    const { service, files, profiles } = setup();
    await service.upload("demo", photo());
    await service.choosePreset("demo", "spark");
    expect(files.size).toBe(0);
    expect((await profiles.findById("demo"))?.avatar).toEqual({ kind: "preset", key: "spark" });
    await expect(service.choosePreset("demo", "../etc")).rejects.toThrow();
    await service.remove("demo");
    expect((await profiles.findById("demo"))?.avatar).toBeNull();
  });

  it("serves a photo only for a public profile or to its owner", async () => {
    const { service, profiles } = setup();
    await service.upload("demo", photo());
    expect((await service.open("demo", null)).mimeType).toBe("image/png");
    await profiles.setPublic("demo", false);
    await expect(service.open("demo", null)).rejects.toThrow();
    await expect(service.open("demo", "someone-else")).rejects.toThrow();
    expect((await service.open("demo", "demo")).mimeType).toBe("image/png");
  });

  it("has no photo to serve when an avatar is chosen", async () => {
    const { service } = setup();
    await service.choosePreset("demo", "orbit");
    await expect(service.open("demo", "demo")).rejects.toThrow();
  });
});
