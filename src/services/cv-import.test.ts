import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AIClient } from "@/lib/ai/ai-client";
import { cleanCv, normalizeDate, type RawCv } from "@/lib/ai/cv";
import { CrudService } from "@/lib/crud";
import { UploadError, type UploadedFile } from "@/lib/storage/uploads";
import { InMemoryEvidenceRepository } from "@/repositories/evidence.memory";
import { createMemoryCertifications, createMemoryExperiences } from "@/repositories/portfolio.memory";
import { InMemoryTalentSkillRepository } from "@/repositories/talent-skill.memory";
import { AIService } from "./ai.service";
import { CvImportService } from "./cv-import.service";
import { SkillService } from "./skill.service";

const ME = "me";
const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34];
const pdf = (over: Partial<UploadedFile> = {}): UploadedFile => ({
  name: "cv.pdf",
  type: "application/pdf",
  size: PDF.length,
  bytes: new Uint8Array(PDF),
  ...over,
});

const raw: RawCv = {
  skills: [
    { name: "Power Apps", level: "ADVANCED", yearsOfExperience: 4.4 },
    { name: "power apps", level: "BEGINNER", yearsOfExperience: 0 },
    { name: "Azure", level: "INTERMEDIATE", yearsOfExperience: 99 },
    { name: "x", level: "BEGINNER", yearsOfExperience: 0 },
  ],
  experiences: [
    {
      title: "Développeur Power Platform",
      company: "ACME",
      location: null,
      description: "  Applications métier.  ",
      contractType: "CDI",
      startDate: "2022-03",
      endDate: null,
      skills: ["Power Apps", "Inconnue"],
    },
    {
      title: "Sans date",
      company: "ACME",
      location: null,
      description: null,
      contractType: null,
      startDate: "récemment",
      endDate: null,
      skills: [],
    },
    {
      title: "Fin avant début",
      company: "Beta",
      location: null,
      description: null,
      contractType: null,
      startDate: "2020-05-10",
      endDate: "2019-01-01",
      skills: [],
    },
  ],
  certifications: [
    { name: "PL-200", issuer: "Microsoft", issueDate: "2024-06", expirationDate: "2020-01-01" },
    { name: "Fantôme", issuer: "X", issueDate: "1800-01-01", expirationDate: null },
  ],
};

describe("normalizeDate", () => {
  const now = new Date("2026-10-13T00:00:00Z");
  it("accepts real dates, completes months and refuses the rest", () => {
    expect(normalizeDate("2024-03", now)).toBe("2024-03-01");
    expect(normalizeDate("2024-03-15", now)).toBe("2024-03-15");
    expect(normalizeDate("2024-02-31", now)).toBeNull();
    expect(normalizeDate("2024-13", now)).toBeNull();
    expect(normalizeDate("1900-01-01", now)).toBeNull();
    expect(normalizeDate("2031-01-01", now)).toBeNull();
    expect(normalizeDate("hier", now)).toBeNull();
    expect(normalizeDate(null, now)).toBeNull();
  });
});

describe("cleanCv", () => {
  const cv = cleanCv(raw, new Date("2026-10-13T00:00:00Z"));

  it("de-duplicates and bounds skills, and drops the unusable ones", () => {
    expect(cv.skills).toEqual([
      { name: "Power Apps", level: "ADVANCED", yearsOfExperience: 4 },
      { name: "Azure", level: "INTERMEDIATE", yearsOfExperience: 60 },
    ]);
  });

  it("keeps only experiences with a real start date, and only skills that were extracted", () => {
    expect(cv.experiences.map((e) => e.title)).toEqual(["Développeur Power Platform", "Fin avant début"]);
    expect(cv.experiences[0]).toMatchObject({
      startDate: "2022-03-01",
      description: "Applications métier.",
      skills: ["Power Apps"],
    });
    expect(cv.experiences[1].endDate).toBeNull();
  });

  it("drops a certification without a believable date and an expiry before the issue date", () => {
    expect(cv.certifications).toEqual([
      { name: "PL-200", issuer: "Microsoft", issueDate: "2024-06-01", expirationDate: null },
    ]);
  });
});

describe("CvImportService", () => {
  let service: CvImportService;
  let extract: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    extract = vi.fn(async () => raw);
    const ai = new AIService({ complete: extract } as unknown as AIClient);
    const skills = new SkillService(
      new InMemoryTalentSkillRepository(ME),
      new InMemoryEvidenceRepository(ME),
    );
    service = new CvImportService(
      ai,
      skills,
      new CrudService(createMemoryExperiences("nobody"), "Expérience") as never,
      new CrudService(createMemoryCertifications("nobody"), "Certification") as never,
    );
  });

  it("reads a PDF, sends it to the model, and flags what the profile already has", async () => {
    const proposal = await service.analyze(ME, pdf());
    expect(extract).toHaveBeenCalledWith(expect.objectContaining({ pdf: expect.any(Uint8Array) }));
    expect(proposal.skills.map((s) => s.name)).toContain("Power Apps");
    expect(proposal.experiences).toHaveLength(2);
  });

  it("refuses anything but a real PDF before calling the model", async () => {
    await expect(
      service.analyze(
        ME,
        pdf({ type: "image/png", bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47]), size: 4 }),
      ),
    ).rejects.toBeInstanceOf(UploadError);
    await expect(
      service.analyze(ME, pdf({ bytes: new Uint8Array([0x4d, 0x5a, 0x90, 0x00]), size: 4 })),
    ).rejects.toBeInstanceOf(UploadError);
    expect(extract).not.toHaveBeenCalled();
  });

  it("imports what was ticked, one item at a time, and reports what it refused and why", async () => {
    const result = await service.importSelection("new-user", {
      skills: [
        { name: "Azure", level: "INTERMEDIATE", yearsOfExperience: 3 },
        { name: "Azure", level: "INTERMEDIATE", yearsOfExperience: 3 }, // duplicate
        { name: "Z", level: "WIZARD", yearsOfExperience: 1 }, // invalid
      ],
      experiences: [{ title: "Dev", company: "ACME", startDate: "2022-03-01", skills: [] }],
      certifications: [{ name: "PL-200", issuer: "Microsoft", issueDate: "2024-06-01" }],
    });
    expect(result.imported).toEqual({ skills: 1, experiences: 1, certifications: 1 });
    expect(result.skipped.map((s) => s.label)).toEqual(["Azure", "Z"]);
  });

  it("never throws on malformed selections", async () => {
    const result = await service.importSelection("new-user", { skills: [null, "x", 3], experiences: [{}] });
    expect(result.imported).toEqual({ skills: 0, experiences: 0, certifications: 0 });
    expect(result.skipped).toHaveLength(4);
  });
});
