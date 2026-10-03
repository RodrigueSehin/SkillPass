import { beforeEach, describe, expect, it } from "vitest";
import { CrudService } from "@/lib/crud";
import { NotFoundError } from "@/lib/errors";
import { computeCompletion } from "@/lib/completion";
import { rateLimit, RateLimitError, resetRateLimits } from "@/lib/rate-limit";
import type { StorageService } from "@/lib/storage/storage";
import { sanitizeFileName, UploadError, validateUpload, type UploadedFile } from "@/lib/storage/uploads";
import { explainVerification } from "@/lib/verification-explainer";
import { InMemoryEvidenceRepository } from "@/repositories/evidence.memory";
import { createMemoryProjects } from "@/repositories/portfolio.memory";
import { InMemoryTalentSkillRepository } from "@/repositories/talent-skill.memory";
import { createEvidenceSchema } from "@/schemas/evidence";
import { EvidenceService } from "./evidence.service";
import { SkillService } from "./skill.service";

const ME = "me";
const OTHER = "other";

const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a];

const file = (over: Partial<Omit<UploadedFile, "bytes">> & { bytes?: number[] } = {}): UploadedFile => {
  const bytes = new Uint8Array(over.bytes ?? PDF);
  return { name: "preuve.pdf", type: "application/pdf", size: bytes.length, ...over, bytes };
};

class FakeStorage implements StorageService {
  objects = new Map<string, Uint8Array>();
  async put(key: string, bytes: Uint8Array) {
    this.objects.set(key, bytes);
  }
  async remove(key: string) {
    this.objects.delete(key);
  }
  async read(key: string) {
    const bytes = this.objects.get(key);
    if (!bytes) throw new Error("missing");
    return { bytes };
  }
}

let storage: FakeStorage;
let evidenceRepo: InMemoryEvidenceRepository;
let skills: SkillService;
let service: EvidenceService;

beforeEach(() => {
  storage = new FakeStorage();
  evidenceRepo = new InMemoryEvidenceRepository(ME);
  skills = new SkillService(new InMemoryTalentSkillRepository(ME), evidenceRepo);
  service = new EvidenceService(
    evidenceRepo,
    skills,
    new CrudService(createMemoryProjects(ME), "Projet"),
    () => storage,
  );
});

const input = (over: Record<string, unknown> = {}) =>
  createEvidenceSchema.parse({
    talentSkillId: "demo-skill-ui-ux",
    type: "DOCUMENT",
    title: "Maquettes",
    ...over,
  });

// The memory skill repo derives ids from names when seeded for the profile "demo".
async function skillIdFor(name: string) {
  const repo = new InMemoryTalentSkillRepository(ME);
  return (await repo.list(ME)).find((s) => s.name === name)!.id;
}

describe("validateUpload", () => {
  it("accepts a real PDF and PNG", () => {
    expect(validateUpload(file())).toEqual({ ext: "pdf", mimeType: "application/pdf" });
    expect(validateUpload(file({ type: "image/png", bytes: PNG, name: "a.png" })).ext).toBe("png");
  });

  it("rejects a file whose content does not match its declared type", () => {
    expect(() => validateUpload(file({ bytes: [0x4d, 0x5a, 0x90, 0x00] }))).toThrow(UploadError); // EXE as PDF
  });

  it("rejects unsupported types, empty files and oversized files", () => {
    expect(() => validateUpload(file({ type: "text/html" }))).toThrow(UploadError);
    expect(() => validateUpload(file({ bytes: [], size: 0 }))).toThrow(UploadError);
    expect(() => validateUpload(file({ size: 6 * 1024 * 1024 }))).toThrow(UploadError);
  });
});

describe("sanitizeFileName", () => {
  it("drops path segments and control characters", () => {
    expect(sanitizeFileName("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFileName("C:\\Users\\x\\cv<script>.pdf")).toBe("cvscript.pdf");
    expect(sanitizeFileName("")).toBe("fichier");
  });
});

describe("EvidenceService", () => {
  it("stores the file under a server-generated, user-scoped key and keeps the key private", async () => {
    const skillId = await skillIdFor("UI/UX");
    const created = await service.add(
      ME,
      input({ talentSkillId: skillId }),
      file({ name: "../../evil.pdf" }),
    );
    expect(created).toMatchObject({ hasFile: true, fileName: "evil.pdf", status: "UNVERIFIED" });
    expect(created).not.toHaveProperty("filePath");
    const [key] = [...storage.objects.keys()];
    expect(key).toMatch(new RegExp(`^${ME}/[0-9a-f-]{36}\\.pdf$`));
  });

  it("requires a file for documents and refuses files on link evidence", async () => {
    const skillId = await skillIdFor("UI/UX");
    await expect(service.add(ME, input({ talentSkillId: skillId }))).rejects.toBeInstanceOf(UploadError);
    await expect(
      service.add(ME, input({ talentSkillId: skillId, type: "LINK", url: "https://example.com" }), file()),
    ).rejects.toBeInstanceOf(UploadError);
    expect(storage.objects.size).toBe(0);
  });

  it("requires an image for screenshots", async () => {
    const skillId = await skillIdFor("UI/UX");
    await expect(
      service.add(ME, input({ talentSkillId: skillId, type: "SCREENSHOT" }), file()),
    ).rejects.toBeInstanceOf(UploadError);
  });

  it("refuses to attach evidence to another user's skill or project", async () => {
    const skillId = await skillIdFor("UI/UX");
    await expect(
      service.add(OTHER, input({ talentSkillId: skillId, type: "LINK", url: "https://example.com" })),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      service.add(
        ME,
        input({ talentSkillId: skillId, type: "LINK", url: "https://example.com", projectId: "nope" }),
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("serves files only to their owner and deletes the stored object with the record", async () => {
    const skillId = await skillIdFor("UI/UX");
    const created = await service.add(ME, input({ talentSkillId: skillId }), file());

    const opened = await service.openFile(ME, created.id);
    expect("bytes" in opened.content).toBe(true);
    await expect(service.openFile(OTHER, created.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.remove(OTHER, created.id)).rejects.toBeInstanceOf(NotFoundError);

    await service.remove(ME, created.id);
    expect(storage.objects.size).toBe(0);
  });

  it("derives skill evidence counts from the evidence store", async () => {
    const before = (await skills.list(ME)).items.find((s) => s.name === "UI/UX")!;
    expect(before.evidenceCount).toBe(0);
    await service.add(ME, input({ talentSkillId: before.id, type: "LINK", url: "https://example.com" }));
    const after = (await skills.list(ME)).items.find((s) => s.name === "UI/UX")!;
    expect(after.evidenceCount).toBe(1);
  });
});

describe("createEvidenceSchema", () => {
  it("requires a URL for link-like evidence", () => {
    expect(
      createEvidenceSchema.safeParse({ talentSkillId: "x", type: "REPOSITORY", title: "Repo" }).success,
    ).toBe(false);
    expect(
      createEvidenceSchema.safeParse({
        talentSkillId: "x",
        type: "REPOSITORY",
        title: "Repo",
        url: "https://github.com/a/b",
      }).success,
    ).toBe(true);
  });

  it("does not let users create platform-generated evidence types", () => {
    expect(
      createEvidenceSchema.safeParse({ talentSkillId: "x", type: "ASSESSMENT", title: "Fake" }).success,
    ).toBe(false);
  });
});

describe("explainVerification", () => {
  it("marks each criterion and flags assessments as upcoming", () => {
    const e = explainVerification({
      status: "UNVERIFIED",
      yearsOfExperience: 2,
      evidence: [{ status: "VERIFIED" }, { status: "PENDING" }],
      projectCount: 0,
      assessmentPassed: false,
    });
    const met = Object.fromEntries(e.checks.map((c) => [c.key, c.met]));
    expect(met).toEqual({
      "verified-evidence": true,
      "enough-evidence": true,
      projects: false,
      experience: true,
      assessment: false,
    });
    expect(e.checks.find((c) => c.key === "assessment")?.detail).toMatch(/Passez/);
    expect(e.title).toMatch(/Comment faire vérifier/);
  });
});

describe("computeCompletion", () => {
  it("is 0% for an empty profile and points to the first missing step", () => {
    const c = computeCompletion({
      profile: { headline: null, bio: null, location: null, profession: null },
      counts: { skills: 0, verifiedSkills: 0, projects: 0, experiences: 0, certifications: 0, evidence: 0 },
    });
    expect(c.percent).toBe(0);
    expect(c.next?.key).toBe("headline");
  });

  it("reaches 100% when everything is done", () => {
    const c = computeCompletion({
      profile: { headline: "h", bio: "b", location: "l", profession: "p" },
      counts: { skills: 3, verifiedSkills: 1, projects: 1, experiences: 1, certifications: 1, evidence: 1 },
    });
    expect(c.percent).toBe(100);
    expect(c.next).toBeUndefined();
  });
});

describe("rateLimit", () => {
  it("blocks after the limit within the window and recovers afterwards", () => {
    resetRateLimits();
    for (let i = 0; i < 3; i++) rateLimit("k", 3, 1000, 1000 + i);
    expect(() => rateLimit("k", 3, 1000, 1500)).toThrow(RateLimitError);
    expect(() => rateLimit("k", 3, 1000, 2600)).not.toThrow();
  });
});
