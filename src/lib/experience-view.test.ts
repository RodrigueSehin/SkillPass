import { describe, expect, it } from "vitest";
import type { ExperienceDTO } from "@/types/portfolio";
import {
  countryOf,
  experiencePeriod,
  experienceStats,
  facetCounts,
  filterExperiences,
  parseList,
  placeOf,
  skillsByUsage,
} from "./experience-view";

const exp = (id: string, over: Partial<ExperienceDTO>): ExperienceDTO => ({
  id,
  title: id,
  company: "Acme",
  location: null,
  description: null,
  contractType: null,
  workMode: null,
  domain: null,
  startDate: "2020-01-01",
  endDate: null,
  skills: [],
  documents: [],
  ...over,
});

const items = [
  exp("a", {
    company: "AGL",
    location: "Abidjan, Côte d'Ivoire",
    contractType: "CDI",
    startDate: "2024-01-01",
    skills: ["Power Apps", "SQL"],
  }),
  exp("b", {
    company: "Sehin",
    location: "Paris, France",
    contractType: "CDD",
    startDate: "2022-01-01",
    endDate: "2023-12-01",
    domain: "Tech & Digital",
    skills: ["SQL"],
  }),
  exp("c", {
    company: "Remote Co",
    location: "Lyon, France",
    workMode: "REMOTE",
    startDate: "2021-01-01",
    endDate: "2021-12-01",
  }),
];

describe("experience view", () => {
  it("extracts the country after the last comma", () => {
    expect(countryOf("Abidjan, Côte d'Ivoire")).toBe("Côte d'Ivoire");
    expect(countryOf("Abidjan")).toBeNull();
    expect(countryOf(null)).toBeNull();
  });

  it("treats remote work as its own place", () => {
    expect(placeOf(items[2])).toBe("Télétravail");
    expect(placeOf(items[0])).toBe("Côte d'Ivoire");
  });

  it("parses comma separated lists", () => {
    expect(parseList("CDI, CDD,")).toEqual(["CDI", "CDD"]);
    expect(parseList(undefined)).toEqual([]);
  });

  it("filters by text, contract, period and place", () => {
    const ids = (r: ExperienceDTO[]) => r.map((e) => e.id);
    expect(ids(filterExperiences(items, { q: "agl" }))).toEqual(["a"]);
    expect(ids(filterExperiences(items, { contract: ["CDI", "CDD"] }))).toEqual(["a", "b"]);
    expect(ids(filterExperiences(items, { period: ["current"] }))).toEqual(["a"]);
    expect(ids(filterExperiences(items, { period: ["past"] }))).toEqual(["b", "c"]);
    expect(ids(filterExperiences(items, { place: ["France"] }))).toEqual(["b"]);
  });

  it("sorts", () => {
    expect(filterExperiences(items, { sort: "oldest" }).map((e) => e.id)).toEqual(["c", "b", "a"]);
    expect(filterExperiences(items, { sort: "company" }).map((e) => e.company)).toEqual([
      "AGL",
      "Remote Co",
      "Sehin",
    ]);
  });

  it("counts facets and stats", () => {
    expect(facetCounts(items, (e) => e.contractType)).toEqual([
      { name: "CDD", count: 1 },
      { name: "CDI", count: 1 },
    ]);
    const stats = experienceStats(items, new Date("2026-01-01T00:00:00Z"));
    expect(stats).toMatchObject({ total: 3, companies: 3, countries: 2, domains: 1 });
  });

  it("ranks skills by usage", () => {
    expect(skillsByUsage(items)).toEqual(["SQL", "Power Apps"]);
  });

  it("formats the period", () => {
    expect(experiencePeriod({ startDate: "2024-01-15", endDate: null })).toBe("Janv 2024 – Aujourd'hui");
  });
});
