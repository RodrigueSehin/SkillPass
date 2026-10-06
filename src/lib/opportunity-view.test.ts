import { describe, expect, it } from "vitest";
import { buildDemoOpportunities } from "@/config/demo-opportunities";
import type { OpportunityDTO } from "@/types/opportunity";
import {
  alertFilters,
  alertHref,
  companyRanking,
  filterOpportunities,
  matchLabel,
  matchScore,
  relativeDate,
  selectionMatch,
} from "./opportunity-view";

const now = new Date("2026-10-06T12:00:00.000Z");
const all: OpportunityDTO[] = buildDemoOpportunities(now).map((o, i) => ({ ...o, id: String(i) }));
const mine = new Set(["power apps", "power automate", "dataverse"]);

describe("opportunity view", () => {
  it("ships a demo job board that includes the six offers of the mockup", () => {
    expect(all.length).toBeGreaterThanOrEqual(30);
    const first = filterOpportunities(all, {})
      .slice(0, 6)
      .map((o) => o.company);
    expect(new Set(first)).toEqual(
      new Set(["AGL", "Microsoft", "SEHIN GROUP", "Upwork", "Banque Atlantique", "Orange CI"]),
    );
  });

  it("filters by tab, facets, company and text", () => {
    expect(filterOpportunities(all, { tab: "FREELANCE" }).every((o) => o.kind === "FREELANCE")).toBe(true);
    expect(
      filterOpportunities(all, { tab: "remote" }).every(
        (o) => o.region === "REMOTE" || o.workMode === "REMOTE",
      ),
    ).toBe(true);
    expect(
      filterOpportunities(all, { tab: "international" }).every(
        (o) => o.region !== "CI" && o.region !== "REMOTE",
      ),
    ).toBe(true);
    expect(filterOpportunities(all, { company: "AGL" })).toHaveLength(12);
    expect(filterOpportunities(all, { q: "upwork" })).toHaveLength(1);
    expect(
      filterOpportunities(all, { region: ["EUROPE"], level: ["SENIOR"] }).every((o) => o.region === "EUROPE"),
    ).toBe(true);
  });

  it("sorts by date or by match", () => {
    const recent = filterOpportunities(all, {});
    expect(recent[0].publishedAt >= recent[1].publishedAt).toBe(true);
    const oldest = filterOpportunities(all, { sort: "oldest" });
    expect(oldest[0].publishedAt <= oldest[1].publishedAt).toBe(true);
    const best = filterOpportunities(all, { sort: "match" }, mine);
    expect(matchScore(best[0], mine)).toBeGreaterThanOrEqual(matchScore(best[best.length - 1], mine));
  });

  it("scores how well a profile fits", () => {
    expect(matchScore({ skills: ["Power Apps", "SQL"] }, mine)).toBe(50);
    expect(matchScore({ skills: [] }, mine)).toBe(0);
    expect(selectionMatch([], mine)).toBe(0);
    expect(selectionMatch([{ ...all[0] }], mine)).toBe(100);
    expect(matchLabel(78)).toBe("Excellent match !");
    expect(matchLabel(10)).toBe("À renforcer");
  });

  it("ranks the companies that recruit", () => {
    expect(
      companyRanking(all)
        .slice(0, 5)
        .map((c) => [c.name, c.count]),
    ).toEqual([
      ["AGL", 12],
      ["Microsoft", 8],
      ["Orange CI", 6],
      ["SEHIN GROUP", 5],
      ["Banque Atlantique", 4],
    ]);
  });

  it("words the publication date", () => {
    const at = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();
    expect(relativeDate(at(0), now)).toBe("aujourd'hui");
    expect(relativeDate(at(1), now)).toBe("il y a 1 jour");
    expect(relativeDate(at(2), now)).toBe("il y a 2 jours");
    expect(relativeDate(at(7), now)).toBe("il y a 1 semaine");
    expect(relativeDate(at(21), now)).toBe("il y a 3 semaines");
    expect(relativeDate(at(45), now)).toBe("il y a 1 mois");
  });

  it("turns an alert into a URL and back into filters", () => {
    const alert = { query: "power", kind: "EMPLOI", region: null, domain: "Tech & Digital", level: null };
    expect(alertHref(alert)).toBe("/dashboard/opportunities?q=power&kind=EMPLOI&domain=Tech+%26+Digital");
    expect(alertFilters(alert)).toEqual({
      q: "power",
      kind: ["EMPLOI"],
      region: undefined,
      domain: ["Tech & Digital"],
      level: undefined,
    });
  });
});
