import { describe, expect, it } from "vitest";
import { InMemoryTalentDirectoryRepository } from "@/repositories/talent-directory.memory";
import type { MatchEventDTO } from "@/types/matching";
import {
  historyStats,
  parseMatchSearch,
  parseRefinement,
  parseTier,
  runSearch,
  searchQuery,
  tierOf,
} from "./matching-view";

const repo = new InMemoryTalentDirectoryRepository();
const NOW = new Date("2026-10-08T12:00:00.000Z");
const ago = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString();
const event = (type: MatchEventDTO["type"], days: number, results: number | null = null): MatchEventDTO => ({
  id: `${type}-${days}-${results}`,
  type,
  title: "t",
  subtitle: "",
  results,
  query: null,
  profileId: null,
  memberId: null,
  createdAt: ago(days),
});

describe("parseMatchSearch", () => {
  it("drops unknown buckets and availabilities and round-trips through the query string", () => {
    const s = parseMatchSearch({
      skill: ["SQL", "Power BI"],
      exp: ["3-5", "99"],
      dispo: ["IMMEDIATE", "SOON"],
      sort: "recent",
    });
    expect(s.exp).toEqual(["3-5"]);
    expect(s.dispo).toEqual(["IMMEDIATE"]);
    const again = parseMatchSearch(Object.fromEntries(new URLSearchParams(searchQuery(s)).entries()));
    expect(again.sort).toBe("recent");
    expect(again.exp).toEqual(["3-5"]);
  });

  it("falls back to safe defaults", () => {
    expect(parseTier("zzz")).toBe("all");
    expect(parseRefinement({ years: "-3" }).minYears).toBe(0);
    expect(tierOf(90)).toBe("high");
    expect(tierOf(75)).toBe("good");
    expect(tierOf(55)).toBe("consider");
  });
});

describe("runSearch", () => {
  it("filters by experience bucket and availability", async () => {
    const records = await repo.listPublic(100);
    const seasoned = runSearch(records, parseMatchSearch({ exp: "6-10" }), undefined);
    expect(seasoned.every((h) => h.record.yearsOfExperience >= 6 && h.record.yearsOfExperience <= 10)).toBe(
      true,
    );
    const now = runSearch(records, parseMatchSearch({ dispo: "IMMEDIATE" }), undefined);
    expect(now.every((h) => h.record.availability === "IMMEDIATE")).toBe(true);
  });

  it("uses the chosen offer's skills when none are typed", async () => {
    const records = await repo.listPublic(100);
    const hits = runSearch(records, parseMatchSearch({}), {
      skills: ["Power BI"],
      certifications: [],
    } as never);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((h) => h.match !== null)).toBe(true);
  });
});

describe("historyStats", () => {
  it("counts the current period and compares it with the previous one", () => {
    const events = [
      event("SEARCH", 1, 10),
      event("SEARCH", 2, 5),
      event("SEARCH", 12, 4), // previous period
      event("RECOMMENDATION", 3, 7),
      event("SAVE", 40), // outside both
    ];
    const s = historyStats(events, 10, NOW);
    expect(s.searches).toEqual({ value: 2, percent: 100 });
    expect(s.analysed.value).toBe(22);
    expect(s.recommendations).toEqual({ value: 1, percent: null });
    expect(s.saves.value).toBe(0);
    expect(s.chart.days).toHaveLength(10);
    expect(s.chart.searches.reduce((a, b) => a + b, 0)).toBe(2);
  });
});
