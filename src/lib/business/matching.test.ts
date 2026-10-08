import { describe, expect, it } from "vitest";
import { InMemoryTalentDirectoryRepository } from "@/repositories/talent-directory.memory";
import type { JobOfferDTO } from "@/types/job-offer";
import { matchTalents, PROPOSAL_THRESHOLD, proposedTalentCount, requiredYears, scoreOffer } from "./matching";

const repo = new InMemoryTalentDirectoryRepository();

const offer = (over: Partial<JobOfferDTO> = {}): JobOfferDTO => ({
  id: "o1",
  title: "Développeur Power Platform",
  description: "",
  contract: "CDI",
  location: "Dakar",
  workMode: null,
  departmentId: null,
  experience: "1 à 3 ans",
  positions: 1,
  deadline: null,
  salaryMin: null,
  salaryMax: null,
  currency: "FCFA",
  skills: ["Power Apps", "Power BI"],
  softSkills: [],
  certifications: [],
  education: null,
  languages: [],
  otherLanguage: null,
  permit: null,
  mobility: "NONE",
  availability: "ASAP",
  visibility: "PUBLIC",
  publishOn: null,
  durationMonths: 1,
  channels: [],
  applicationMode: "SIMPLE",
  status: "PUBLISHED",
  opportunityId: null,
  createdById: null,
  publishedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

describe("requiredYears", () => {
  it("reads the lower bound of the bracket", () => {
    expect(requiredYears("Moins d'1 an")).toBe(0);
    expect(requiredYears("3 à 5 ans")).toBe(3);
    expect(requiredYears("10 ans et plus")).toBe(10);
    expect(requiredYears("")).toBe(0);
  });
});

describe("matchTalents", () => {
  it("proposes only talents above the threshold, best first, with at least one skill in common", async () => {
    const records = await repo.listPublic(100);
    const matches = matchTalents(offer(), records);
    expect(matches.length).toBeGreaterThan(0);
    const scores = matches.map((m) => m.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    expect(scores.every((s) => s >= PROPOSAL_THRESHOLD && s <= 100)).toBe(true);
    expect(matches.every((m) => m.matchedSkills.length > 0)).toBe(true);
  });

  it("lists matched and missing skills without losing any", async () => {
    const [record] = await repo.listPublic(1);
    const m = scoreOffer(offer({ skills: [record!.skills[0]!.name, "Cobol"] }), record!)!;
    expect(m.matchedSkills).toEqual([record!.skills[0]!.name]);
    expect(m.missingSkills).toEqual(["Cobol"]);
  });

  it("proposes nobody for an offer with no required skill", async () => {
    const records = await repo.listPublic(100);
    expect(matchTalents(offer({ skills: [] }), records)).toEqual([]);
    expect(proposedTalentCount([offer({ skills: [] })], records)).toBe(0);
  });

  it("counts a talent once even when several offers propose them", async () => {
    const records = await repo.listPublic(100);
    const one = proposedTalentCount([offer()], records);
    expect(proposedTalentCount([offer(), offer({ id: "o2" })], records)).toBe(one);
  });
});
