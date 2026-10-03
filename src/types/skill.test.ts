import { describe, expect, it } from "vitest";
import { levelFromScore } from "./skill";

describe("levelFromScore", () => {
  it.each([
    [0, "BEGINNER"],
    [49, "BEGINNER"],
    [50, "INTERMEDIATE"],
    [74, "INTERMEDIATE"],
    [75, "ADVANCED"],
    [89, "ADVANCED"],
    [90, "EXPERT"],
    [100, "EXPERT"],
  ])("maps %i to %s", (score, level) => {
    expect(levelFromScore(score)).toBe(level);
  });
});
