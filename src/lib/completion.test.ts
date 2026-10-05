import { describe, expect, it } from "vitest";
import { completionMessage } from "./completion";

const next = {
  key: "certifications",
  label: "Ajoutez une certification",
  done: false,
  href: "/dashboard/certifications",
};

describe("completionMessage", () => {
  it("congratulates a complete profile", () => {
    expect(completionMessage({ percent: 100, next: undefined }).title).toMatch(/complet/);
  });

  it("points to the next step and adapts the tone to the progress", () => {
    const almost = completionMessage({ percent: 86, next });
    expect(almost.title).toMatch(/presque complet/);
    expect(almost.hint).toBe("Ajoutez une certification pour augmenter votre visibilité.");
    expect(almost.href).toBe("/dashboard/certifications");

    const early = completionMessage({ percent: 30, next });
    expect(early.title).toMatch(/prend forme/);
    expect(early.hint).toMatch(/mieux repéré/);
  });
});
