import { beforeEach, describe, expect, it } from "vitest";
import type { AccountRemover } from "@/lib/auth/account-remover";
import { ForbiddenError } from "@/lib/errors";
import type { StorageService } from "@/lib/storage/storage";
import { InMemoryOrganizationRepository } from "@/repositories/organization.memory";
import { InMemoryProfileRepository } from "@/repositories/profile.memory";
import { AccountDeletionService, AccountRemovalIncompleteError } from "./account-deletion.service";
import { OrganizationService } from "./organization.service";

class FakeStorage implements StorageService {
  objects = new Map<string, Uint8Array>([
    ["talent-1/a.png", new Uint8Array([1])],
    ["talent-1/b.pdf", new Uint8Array([2])],
    ["talent-2/c.png", new Uint8Array([3])],
  ]);
  async put(key: string, bytes: Uint8Array) {
    this.objects.set(key, bytes);
  }
  async remove(key: string) {
    this.objects.delete(key);
  }
  async removePrefix(prefix: string) {
    for (const key of [...this.objects.keys()]) if (key.startsWith(`${prefix}/`)) this.objects.delete(key);
  }
  async read(key: string) {
    return { bytes: this.objects.get(key)! };
  }
}

let profiles: InMemoryProfileRepository;
let orgs: OrganizationService;
let storage: FakeStorage;
let removed: string[];
let failAuth: boolean;
let service: AccountDeletionService;

beforeEach(async () => {
  profiles = new InMemoryProfileRepository(true);
  orgs = new OrganizationService(new InMemoryOrganizationRepository());
  storage = new FakeStorage();
  removed = [];
  failAuth = false;
  const accounts: AccountRemover = {
    async deleteUser(id) {
      if (failAuth) throw new Error("auth down");
      removed.push(id);
    },
  };
  service = new AccountDeletionService(
    profiles,
    orgs,
    () => storage,
    () => accounts,
  );
  await profiles.ensure({ id: "talent-1", email: "t1@x.com", name: "Awa Koné" });
  await profiles.ensure({ id: "talent-2", email: "t2@x.com", name: "Koffi" });
});

describe("AccountDeletionService", () => {
  it("erases the files, the profile and the sign-in account of that person only", async () => {
    await service.deleteAccount("talent-1");
    expect([...storage.objects.keys()]).toEqual(["talent-2/c.png"]);
    expect(await profiles.findById("talent-1")).toBeNull();
    expect(await profiles.findById("talent-2")).not.toBeNull();
    expect(removed).toEqual(["talent-1"]);
  });

  it("refuses a SkillPass administrator and touches nothing", async () => {
    profiles.setRole("talent-1", "SKILLPASS_ADMIN");
    await expect(service.deleteAccount("talent-1")).rejects.toBeInstanceOf(ForbiddenError);
    expect(storage.objects.size).toBe(3);
    expect(await profiles.findById("talent-1")).not.toBeNull();
    expect(removed).toEqual([]);
  });

  it("refuses the last administrator of an organization, before anything is deleted", async () => {
    await orgs.create(
      { profileId: "talent-1", firstName: "Awa", lastName: "Koné", email: "awa@acme.com" },
      { name: "ACME", industry: "Logistique & Transport", website: "https://acme.example.com" },
    );
    await expect(service.deleteAccount("talent-1")).rejects.toBeInstanceOf(ForbiddenError);
    expect(storage.objects.size).toBe(3);
    expect(await profiles.findById("talent-1")).not.toBeNull();
    expect(removed).toEqual([]);
  });

  it("says so when the sign-in account could not be removed, so the person can retry", async () => {
    failAuth = true;
    await expect(service.deleteAccount("talent-1")).rejects.toBeInstanceOf(AccountRemovalIncompleteError);
    expect(storage.objects.has("talent-1/a.png")).toBe(false);
    expect(await profiles.findById("talent-1")).toBeNull();
  });

  it("does not know a profile that is not there", async () => {
    await expect(service.deleteAccount("nobody")).rejects.toThrow(/introuvable/i);
  });
});
