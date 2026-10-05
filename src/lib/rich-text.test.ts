import { describe, expect, it } from "vitest";
import { stripFormatting } from "./rich-text";

describe("stripFormatting", () => {
  it("removes markdown markers and flattens lines", () => {
    expect(
      stripFormatting("## Missions\n- **Power Apps** et *Dataverse*\n1. Voir [la doc](https://x.io)"),
    ).toBe("Missions Power Apps et Dataverse Voir la doc");
  });

  it("leaves plain text alone", () => {
    expect(stripFormatting("Développement d'applications")).toBe("Développement d'applications");
  });
});
