import { describe, expect, it } from "vitest";
import { InMemoryTalentDirectoryRepository } from "@/repositories/talent-directory.memory";
import type { OrgSkillDTO } from "@/types/org-skill";
import {
  buildSkillRows,
  categoryShare,
  demandLevel,
  demandTrend,
  filterSkillRows,
  skillKindOf,
  skillStats,
  topDemanded,
} from "./skill-insights";

const NOW = new Date("2026-10-07T10:00:00.000Z");
const talents = await new InMemoryTalentDirectoryRepository().listPublic(100);
const offer = (skills: string[], publishedAt = "2026-10-01T00:00:00.000Z") => ({ skills, publishedAt });
const orgSkill = (over: Partial<OrgSkillDTO> = {}): OrgSkillDTO => ({
  id: "o1",
  name: "Power Apps",
  category: "Développement",
  kind: "TECHNICAL",
  description: "Applications métier",
  keywords: ["power platform"],
  synonyms: [],
  createdAt: NOW.toISOString(),
  ...over,
});

describe("demandLevel", () => {
  it("is relative to the most asked-for skill", () => {
    expect(demandLevel(10, 10)).toBe("VERY_HIGH");
    expect(demandLevel(5, 10)).toBe("HIGH");
    expect(demandLevel(2, 10)).toBe("MEDIUM");
    expect(demandLevel(1, 10)).toBe("LOW");
    expect(demandLevel(0, 10)).toBe("NONE");
    expect(demandLevel(3, 0)).toBe("NONE");
  });
});

describe("buildSkillRows", () => {
  it("counts talents, average level and offers per skill, ignoring case and accents", () => {
    const rows = buildSkillRows(
      talents,
      [offer(["power apps", "Power BI"]), offer(["POWER APPS"]), offer(["Power Apps", "Power Apps"])],
      [],
    );
    const apps = rows.find((r) => r.name === "Power Apps")!;
    expect(apps.talents).toBeGreaterThan(1);
    expect(apps.offers).toBe(3);
    expect(apps.demand).toBe("VERY_HIGH");
    expect(apps.averageLevel).toBeGreaterThan(0);
    expect(apps.averageLevel).toBeLessThanOrEqual(5);
    expect(rows.filter((r) => r.name.toLowerCase() === "power apps")).toHaveLength(1);
  });

  it("keeps skills only an offer asks for, with nobody holding them", () => {
    const row = buildSkillRows(talents, [offer(["Cobol"])], []).find((r) => r.name === "Cobol")!;
    expect(row).toMatchObject({ talents: 0, averageLevel: null, offers: 1, category: "Autres" });
  });

  it("lets the organization's own definition win", () => {
    const rows = buildSkillRows(
      talents,
      [],
      [
        orgSkill({ id: "x", category: "Collaboration" }),
        orgSkill({ id: "y", name: "Écoute active", kind: "TRANSVERSAL", category: "Communication" }),
      ],
    );
    expect(rows.find((r) => r.name === "Power Apps")).toMatchObject({
      category: "Collaboration",
      orgSkillId: "x",
    });
    expect(rows.find((r) => r.name === "Écoute active")).toMatchObject({
      kind: "TRANSVERSAL",
      talents: 0,
      orgSkillId: "y",
    });
  });

  it("tells soft skills from hard skills", () => {
    expect(skillKindOf("Communication", null)).toBe("TRANSVERSAL");
    expect(skillKindOf("Écoute", "Communication")).toBe("TRANSVERSAL");
    expect(skillKindOf("Power BI", "Data & Analytics")).toBe("TECHNICAL");
  });
});

describe("filters and aggregates", () => {
  const rows = buildSkillRows(
    talents,
    [offer(["Power Apps"]), offer(["Power Apps"]), offer(["SQL"])],
    [orgSkill({ id: "x", name: "Écoute active", kind: "TRANSVERSAL", category: "Communication" })],
  );

  it("filters by tab, text, category and demand", () => {
    expect(filterSkillRows(rows, { tab: "referential" }).map((r) => r.name)).toEqual(["Écoute active"]);
    expect(filterSkillRows(rows, { tab: "transversal" }).every((r) => r.kind === "TRANSVERSAL")).toBe(true);
    expect(filterSkillRows(rows, { q: "power" }).every((r) => r.name.toLowerCase().includes("power"))).toBe(
      true,
    );
    expect(filterSkillRows(rows, { category: "Cloud" }).every((r) => r.category === "Cloud")).toBe(true);
    expect(filterSkillRows(rows, { demand: "VERY_HIGH" }).map((r) => r.name)).toEqual(["Power Apps"]);
  });

  it("summarizes the catalog", () => {
    const stats = skillStats(rows, talents);
    expect(stats.unique).toBe(rows.length);
    expect(stats.technical + stats.transversal).toBe(rows.length);
    expect(stats.veryDemanded).toBe(1);
    expect(stats.averageLevel).toBeGreaterThan(0);
  });

  it("shares skills by category with the small ones grouped", () => {
    const share = categoryShare(rows, 2);
    expect(share).toHaveLength(3);
    expect(share.at(-1)?.category).toBe("Autres");
    expect(share.reduce((n, s) => n + s.count, 0)).toBe(rows.length);
  });

  it("never lists the same category twice when Autres is already one of them", () => {
    const share = categoryShare(rows, 1);
    expect(new Set(share.map((s) => s.category)).size).toBe(share.length);
    expect(share.reduce((n, s) => n + s.count, 0)).toBe(rows.length);
  });

  it("ranks the most asked-for skills", () => {
    expect(topDemanded(rows, 2).map((r) => r.name)).toEqual(["Power Apps", "SQL"]);
  });
});

describe("demandTrend", () => {
  it("counts offers per month over the last six months", () => {
    const offers = [
      offer(["Power Apps"], "2026-10-02T00:00:00.000Z"),
      offer(["Power Apps"], "2026-10-05T00:00:00.000Z"),
      offer(["Power Apps"], "2026-07-15T00:00:00.000Z"),
      offer(["Power Apps"], "2025-01-01T00:00:00.000Z"),
    ];
    const trend = demandTrend(offers, ["Power Apps"], NOW);
    expect(trend.labels).toHaveLength(6);
    expect(trend.series[0]!.values).toEqual([0, 0, 1, 0, 0, 2]);
  });
});
