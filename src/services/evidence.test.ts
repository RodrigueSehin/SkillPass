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
import { createEvidenceSchema, updateEvidenceSchema } from "@/schemas/evidence";
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
  async removePrefix(prefix: string) {
    for (const key of this.objects.keys()) if (key.startsWith(`${prefix}/`)) this.objects.delete(key);
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
    talentSkillIds: ["demo-skill-ui-ux"],
    type: "DOCUMENT",
    title: "Maquettes",
    description: "Maquettes de l'application",
    technologies: ["Figma"],
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
  it("stores each file under a server-generated, user-scoped key and keeps the key private", async () => {
    const skillId = await skillIdFor("UI/UX");
    const created = await service.add(ME, input({ talentSkillIds: [skillId] }), [
      file({ name: "../../evil.pdf" }),
      file({ name: "b.png", type: "image/png", bytes: PNG }),
    ]);
    expect(created.files.map((f) => f.name)).toEqual(["evil.pdf", "b.png"]);
    expect(created.files.map((f) => f.isImage)).toEqual([false, true]);
    expect(JSON.stringify(created)).not.toContain("filePath");
    expect(created).toMatchObject({ status: "UNVERIFIED", published: true });
    const keys = [...storage.objects.keys()];
    expect(keys).toHaveLength(2);
    expect(keys[0]).toMatch(new RegExp(`^${ME}/[0-9a-f-]{36}\.pdf$`));
  });

  it("requires a file to publish a document, but a draft can be saved without one", async () => {
    const skillId = await skillIdFor("UI/UX");
    await expect(service.add(ME, input({ talentSkillIds: [skillId] }))).rejects.toBeInstanceOf(UploadError);
    const draft = await service.add(ME, input({ talentSkillIds: [skillId], publish: false }));
    expect(draft.published).toBe(false);
    expect(storage.objects.size).toBe(0);
  });

  it("requires an image for screenshots", async () => {
    const skillId = await skillIdFor("UI/UX");
    await expect(
      service.add(ME, input({ talentSkillIds: [skillId], type: "SCREENSHOT" }), [file()]),
    ).rejects.toBeInstanceOf(UploadError);
  });

  it("stores nothing when one of the files is invalid, and caps the number of files", async () => {
    const skillId = await skillIdFor("UI/UX");
    await expect(
      service.add(ME, input({ talentSkillIds: [skillId] }), [
        file(),
        file({ bytes: [0x4d, 0x5a, 0x90, 0x00] }),
      ]),
    ).rejects.toBeInstanceOf(UploadError);
    await expect(
      service.add(
        ME,
        input({ talentSkillIds: [skillId] }),
        Array.from({ length: 6 }, () => file()),
      ),
    ).rejects.toBeInstanceOf(UploadError);
    expect(storage.objects.size).toBe(0);
  });

  it("refuses to attach evidence to another user's skill or project", async () => {
    const skillId = await skillIdFor("UI/UX");
    await expect(
      service.add(OTHER, input({ talentSkillIds: [skillId], type: "PROJECT", role: "Dev" })),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      service.add(ME, input({ talentSkillIds: [skillId], type: "PROJECT", role: "Dev", projectId: "nope" })),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("keeps the first skill as the main one and lists evidence under every skill it demonstrates", async () => {
    const [uiux, other] = [
      await skillIdFor("UI/UX"),
      (await skills.list(ME)).items.find((s) => s.name !== "UI/UX")!.id,
    ];
    const created = await service.add(ME, input({ talentSkillIds: [other, uiux], type: "OTHER" }));
    expect(created.talentSkillId).toBe(other);
    expect(created.skills.map((s) => s.id)).toEqual([other, uiux]);
    expect(await service.list(ME, uiux)).toHaveLength(1);
  });

  it("serves files only to their owner and deletes the stored objects with the record", async () => {
    const skillId = await skillIdFor("UI/UX");
    const created = await service.add(ME, input({ talentSkillIds: [skillId] }), [file(), file()]);
    const [first] = created.files;

    const opened = await service.openFile(ME, created.id, first.id);
    expect("bytes" in opened.content).toBe(true);
    await expect(service.openFile(OTHER, created.id, first.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.openFile(ME, created.id, "nope")).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.remove(OTHER, created.id)).rejects.toBeInstanceOf(NotFoundError);

    await service.remove(ME, created.id);
    expect(storage.objects.size).toBe(0);
  });

  it("edits an evidence: fields, skills, kept files removed or added, owner only", async () => {
    const skillId = await skillIdFor("UI/UX");
    const created = await service.add(ME, input({ talentSkillIds: [skillId] }), [file(), file()]);
    const [keep, drop] = created.files;
    const edit = (over: Record<string, unknown> = {}) =>
      updateEvidenceSchema.parse({
        talentSkillIds: [skillId],
        type: "DOCUMENT",
        title: "Titre modifié",
        description: "Nouvelle description",
        technologies: ["Figma"],
        keepFileIds: [keep.id],
        ...over,
      });

    const updated = await service.update(ME, created.id, edit(), [file({ name: "new.pdf" })]);
    expect(updated.id).toBe(created.id);
    expect(updated.title).toBe("Titre modifié");
    expect(updated.files.map((f) => f.name)).toEqual([keep.name, "new.pdf"]);
    expect(updated.files.some((f) => f.id === drop.id)).toBe(false);
    expect(storage.objects.size).toBe(2); // the dropped object is gone, the new one stored

    await expect(service.update(OTHER, created.id, edit())).rejects.toBeInstanceOf(NotFoundError);
    // A published document must keep at least one file.
    await expect(service.update(ME, created.id, edit({ keepFileIds: [] }))).rejects.toBeInstanceOf(
      UploadError,
    );
    // At most five files in total, kept ones included.
    await expect(
      service.update(ME, created.id, edit({ keepFileIds: updated.files.map((f) => f.id) }), [
        file(),
        file(),
        file(),
        file(),
      ]),
    ).rejects.toBeInstanceOf(UploadError);
    expect(storage.objects.size).toBe(2);
  });

  it("publishes a draft only once it is complete", async () => {
    const skillId = await skillIdFor("UI/UX");
    const draft = await service.add(ME, input({ talentSkillIds: [skillId], publish: false }));
    await expect(service.publish(ME, draft.id)).rejects.toBeInstanceOf(UploadError); // document without file
    const note = await service.add(ME, input({ talentSkillIds: [skillId], type: "OTHER", publish: false }));
    await service.publish(ME, note.id);
    expect((await service.list(ME)).find((e) => e.id === note.id)?.published).toBe(true);
    await expect(service.publish(OTHER, note.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("counts published evidence only, derived from the evidence store", async () => {
    const before = (await skills.list(ME)).items.find((s) => s.name === "UI/UX")!;
    expect(before.evidenceCount).toBe(0);
    await service.add(ME, input({ talentSkillIds: [before.id], type: "OTHER", publish: false }));
    expect((await skills.list(ME)).items.find((s) => s.name === "UI/UX")!.evidenceCount).toBe(0);
    await service.add(ME, input({ talentSkillIds: [before.id], type: "OTHER" }));
    const after = (await skills.list(ME)).items.find((s) => s.name === "UI/UX")!;
    expect(after.evidenceCount).toBe(1);
  });
});

describe("createEvidenceSchema", () => {
  const base = { talentSkillIds: ["x"], type: "OTHER", title: "Preuve" };

  it("asks for a description and a technology to publish, but not for a draft", () => {
    expect(createEvidenceSchema.safeParse(base).success).toBe(false);
    expect(createEvidenceSchema.safeParse({ ...base, publish: false }).success).toBe(true);
    expect(
      createEvidenceSchema.safeParse({ ...base, description: "Ok", technologies: ["Power Apps"] }).success,
    ).toBe(true);
  });

  it("requires a role for projects and at least one skill", () => {
    const full = { ...base, description: "Ok", technologies: ["React"] };
    expect(createEvidenceSchema.safeParse({ ...full, type: "PROJECT" }).success).toBe(false);
    expect(createEvidenceSchema.safeParse({ ...full, type: "PROJECT", role: "Dev" }).success).toBe(true);
    expect(createEvidenceSchema.safeParse({ ...full, talentSkillIds: [] }).success).toBe(false);
  });

  it("validates months and de-duplicates technologies and tags", () => {
    const ok = createEvidenceSchema.parse({
      ...base,
      publish: false,
      technologies: ["React", "react", "Azure"],
      startDate: "2024-01",
      endDate: "2024-06",
    });
    expect(ok.technologies).toEqual(["react", "Azure"]);
    expect(createEvidenceSchema.safeParse({ ...base, publish: false, startDate: "2024-13" }).success).toBe(
      false,
    );
    expect(
      createEvidenceSchema.safeParse({ ...base, publish: false, startDate: "2024-06", endDate: "2024-01" })
        .success,
    ).toBe(false);
  });

  it("does not let users create legacy or platform-generated evidence types", () => {
    for (const type of ["ASSESSMENT", "RECOMMENDATION", "LINK"]) {
      expect(createEvidenceSchema.safeParse({ ...base, type, publish: false }).success).toBe(false);
    }
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
