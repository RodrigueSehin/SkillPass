import { describe, expect, it } from "vitest";
import { wrapIndex } from "./carousel";
import { easeOutCubic, splitStat } from "./count-up";

describe("wrapIndex", () => {
  it("wraps around both ends", () => {
    expect(wrapIndex(3, 3)).toBe(0);
    expect(wrapIndex(4, 3)).toBe(1);
    expect(wrapIndex(-1, 3)).toBe(2);
    expect(wrapIndex(-4, 3)).toBe(2);
    expect(wrapIndex(1, 3)).toBe(1);
  });
});

describe("splitStat", () => {
  it("separates the number from its suffix", () => {
    expect(splitStat("250K+")).toEqual({ target: 250, suffix: "K+" });
    expect(splitStat("85%")).toEqual({ target: 85, suffix: "%" });
    expect(splitStat("12K+")).toEqual({ target: 12, suffix: "K+" });
  });

  it("leaves values without a leading number alone", () => {
    expect(splitStat("Des milliers")).toBeNull();
    expect(splitStat("")).toBeNull();
  });
});

describe("easeOutCubic", () => {
  it("starts at 0, ends at 1 and is monotonic", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    let previous = 0;
    for (let t = 0.1; t <= 1; t += 0.1) {
      const value = easeOutCubic(t);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });
});
