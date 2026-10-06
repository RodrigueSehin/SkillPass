import { describe, expect, it } from "vitest";
import type { RecommendationDTO } from "@/types/verification";
import {
  credibilityLabel,
  filterRecommendations,
  initialsOf,
  ratingDistribution,
  recommendationStats,
  topKeywords,
} from "./recommendation-view";

const reco = (id: string, over: Partial<RecommendationDTO>): RecommendationDTO => ({
  id,
  profileId: "p",
  talentSkillId: null,
  skillName: null,
  projectId: null,
  token: id,
  authorName: id,
  authorEmail: null,
  authorTitle: null,
  relation: null,
  rating: null,
  keywords: [],
  requestSubject: null,
  requestMessage: null,
  requestAspects: [],
  content: "texte",
  status: "APPROVED",
  createdAt: "2026-01-01T00:00:00.000Z",
  submittedAt: "2026-01-05T00:00:00.000Z",
  expiresAt: "2026-02-01T00:00:00.000Z",
  ...over,
});

const items = [
  reco("Awa", { relation: "MANAGER", rating: 5, keywords: ["Power Platform", "Leadership"] }),
  reco("Jean", {
    relation: "COLLEAGUE",
    rating: 4,
    keywords: ["Power Platform"],
    submittedAt: "2025-03-01T00:00:00.000Z",
  }),
  reco("Fatou", { relation: "CLIENT", rating: 3, keywords: [], status: "SUBMITTED" }),
  reco("Aïcha", { status: "REQUESTED", content: null, submittedAt: null }),
];

describe("recommendation view", () => {
  it("counts only published recommendations in the figures", () => {
    expect(recommendationStats(items)).toEqual({
      received: 2,
      recommenders: 2,
      average: 4.5,
      recommendPercent: 100,
      ratedCount: 2,
    });
    expect(recommendationStats([]).average).toBeNull();
  });

  it("builds the rating distribution and the keyword ranking", () => {
    expect(ratingDistribution(items)).toEqual([
      { stars: 5, count: 1 },
      { stars: 4, count: 1 },
      { stars: 3, count: 0 },
      { stars: 2, count: 0 },
      { stars: 1, count: 0 },
    ]);
    expect(topKeywords(items)[0]).toEqual({ name: "Power Platform", count: 2 });
  });

  it("filters by text, status, relation, keyword and year", () => {
    const ids = (r: RecommendationDTO[]) => r.map((x) => x.id);
    expect(ids(filterRecommendations(items, { q: "awa" }))).toEqual(["Awa"]);
    expect(ids(filterRecommendations(items, { status: ["SUBMITTED"] }))).toEqual(["Fatou"]);
    expect(ids(filterRecommendations(items, { relation: ["MANAGER", "CLIENT"] }))).toEqual(["Awa", "Fatou"]);
    expect(ids(filterRecommendations(items, { keyword: ["Leadership"] }))).toEqual(["Awa"]);
    expect(ids(filterRecommendations(items, { year: ["2025"] }))).toEqual(["Jean"]);
  });

  it("sorts by date or rating", () => {
    expect(filterRecommendations(items, { sort: "oldest" }).map((r) => r.id)[0]).toBe("Jean");
    expect(
      filterRecommendations(items, { sort: "rating" })
        .map((r) => r.id)
        .slice(0, 2),
    ).toEqual(["Awa", "Jean"]);
  });

  it("labels the credibility and builds initials", () => {
    expect(credibilityLabel(4.8)).toBe("Excellent !");
    expect(credibilityLabel(3.6)).toBe("Très bien");
    expect(credibilityLabel(null)).toBe("Pas encore de note");
    expect(initialsOf("Marie Koffi")).toBe("MK");
  });
});
