import { describe, expect, it } from "vitest";
import { InMemoryTalentDirectoryRepository } from "@/repositories/talent-directory.memory";
import { hasCriteria, matchScore, parseTalentFilters, searchTalents, talentScore } from "./talent-search";

const repo = new InMemoryTalentDirectoryRepository();

describe("parseTalentFilters", () => {
  it("accepts single or repeated values and drops unknown levels", () => {
    const f = parseTalentFilters({
      skill: ["Power BI", "SQL"],
      level: ["EXPERT", "GOD"],
      years: "3",
      available: "1",
    });
    expect(f.skills).toEqual(["Power BI", "SQL"]);
    expect(f.levels).toEqual(["EXPERT"]);
    expect(f.minYears).toBe(3);
    expect(f.availableNow).toBe(true);
    expect(f.sort).toBe("match");
  });

  it("ignores garbage years and sorts", () => {
    const f = parseTalentFilters({ years: "-4", sort: "hax" });
    expect(f.minYears).toBe(0);
    expect(f.sort).toBe("match");
  });
});

describe("searchTalents", () => {
  it("requires at least one requested skill and ranks by match", async () => {
    const records = await repo.listPublic(100);
    const f = parseTalentFilters({ skill: ["Power BI", "SQL"] });
    const hits = searchTalents(records, f);
    expect(hits.length).toBeGreaterThan(0);
    expect(
      hits.every((h) => h.record.skills.some((s) => ["power bi", "sql"].includes(s.name.toLowerCase()))),
    ).toBe(true);
    const matches = hits.map((h) => h.match as number);
    expect([...matches].sort((a, b) => b - a)).toEqual(matches);
    expect(matches[0]).toBe(Math.max(...matches));
  });

  it("filters by level, certification, location and years", async () => {
    const records = await repo.listPublic(100);
    const expert = searchTalents(records, parseTalentFilters({ skill: "Power Apps", level: "EXPERT" }));
    expect(expert.map((h) => h.record.fullName)).toEqual(["Sehin G. Rodrigue"]);
    const certified = searchTalents(records, parseTalentFilters({ cert: "PL-400" }));
    expect(certified.every((h) => h.record.certifications.some((c) => c.name.includes("PL-400")))).toBe(true);
    const dakar = searchTalents(records, parseTalentFilters({ location: "Dakar" }));
    expect(dakar).toHaveLength(1);
    const senior = searchTalents(records, parseTalentFilters({ years: "6" }));
    expect(senior.every((h) => h.record.yearsOfExperience >= 6)).toBe(true);
  });

  it("matches names without accents or case", async () => {
    const records = await repo.listPublic(100);
    expect(searchTalents(records, parseTalentFilters({ q: "aicha kone" }))).toHaveLength(1);
  });

  it("has no match percentage without skill or certification criteria", async () => {
    const [first] = await repo.listPublic(1);
    expect(hasCriteria(parseTalentFilters({ q: "x" }))).toBe(false);
    expect(matchScore(first!, parseTalentFilters({}))).toBeNull();
  });

  it("gives 100 to a talent who has everything verified", async () => {
    const [sehin] = await repo.listPublic(1);
    expect(
      matchScore(sehin!, parseTalentFilters({ skill: ["Power Apps", "Power Automate"], cert: "PL-200" })),
    ).toBe(100);
  });
});

describe("talentScore", () => {
  it("stays within 0-100", async () => {
    const detail = await repo.detail("sehin-g-rodrigue");
    expect(detail).not.toBeNull();
    const { total } = talentScore(detail!);
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThanOrEqual(100);
  });

  it("does not expose private profiles", async () => {
    expect(await repo.detail("nobody")).toBeNull();
  });
});
