import { describe, expect, it } from "vitest";
import type { JobOfferRow } from "@/types/job-offer";
import { filterOffers, offersCsv, offerStats, recentOffers, tabCounts, topOffers } from "./job-offer-view";

const now = new Date("2026-10-07T10:00:00.000Z");
const DAY = 86_400_000;

const offer = (id: string, over: Partial<JobOfferRow> = {}): JobOfferRow => ({
  id,
  title: id,
  description: "",
  contract: "CDI",
  location: "Abidjan",
  workMode: "HYBRID",
  departmentId: null,
  experience: "3 à 5 ans",
  positions: 1,
  deadline: null,
  salaryMin: null,
  salaryMax: null,
  currency: "FCFA",
  skills: [],
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
  durationMonths: 2,
  channels: ["PLATFORM"],
  applicationMode: "SIMPLE",
  status: "PUBLISHED",
  opportunityId: null,
  createdById: null,
  publishedAt: new Date(now.getTime() - 5 * DAY).toISOString(),
  createdAt: new Date(now.getTime() - 5 * DAY).toISOString(),
  displayStatus: "PUBLISHED",
  applicants: 0,
  views: 0,
  ...over,
});

const all = [
  offer("a", { applicants: 48, views: 100, skills: ["Power Apps"] }),
  offer("b", { applicants: 32, views: 50, contract: "STAGE", departmentId: "it" }),
  offer("c", { status: "DRAFT", displayStatus: "DRAFT", publishedAt: null }),
  offer("d", {
    displayStatus: "EXPIRED",
    applicants: 18,
    publishedAt: new Date(now.getTime() - 45 * DAY).toISOString(),
  }),
];

describe("job offer view", () => {
  it("counts and filters by tab, text, contract and department", () => {
    expect(tabCounts(all)).toEqual({ all: 4, PUBLISHED: 2, DRAFT: 1, EXPIRED: 1 });
    expect(filterOffers(all, { tab: "DRAFT" }).map((o) => o.id)).toEqual(["c"]);
    expect(filterOffers(all, { q: "power" }).map((o) => o.id)).toEqual(["a"]);
    expect(filterOffers(all, { contract: "STAGE" }).map((o) => o.id)).toEqual(["b"]);
    expect(filterOffers(all, { department: "it" }).map((o) => o.id)).toEqual(["b"]);
  });

  it("sums applicants and views, and compares publications with the month before", () => {
    expect(offerStats(all, now)).toEqual({ published: 2, applicants: 98, views: 150, deltaPercent: 100 });
    expect(offerStats([all[0]], now).deltaPercent).toBeNull();
  });

  it("ranks the offers by applicants and lists the most recent ones", () => {
    expect(topOffers(all).map((o) => o.id)).toEqual(["a", "b", "d"]);
    expect(recentOffers(all, 2).map((o) => o.id)).toEqual(["a", "b"]);
  });

  it("exports a CSV that a spreadsheet cannot turn into a formula", () => {
    const csv = offersCsv(
      [offer("=CMD()", { applicants: 3 })],
      (s) => s,
      (c) => c,
    );
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain(`"'=CMD()"`);
    expect(csv.split("\r\n")[0]).toContain("Candidatures");
  });
});
