import { describe, expect, it } from "vitest";
import { Bot, Database, Sparkles, Workflow } from "lucide-react";
import { skillVisual } from "./skill-visuals";

describe("skillVisual", () => {
  it("recognises the Power Platform skills by name", () => {
    expect(skillVisual("Dataverse").icon).toBe(Database);
    expect(skillVisual("Power Automate").icon).toBe(Workflow);
  });

  it("does not mistake Power Automate for the generic automation rule", () => {
    expect(skillVisual("Power Automate").icon).not.toBe(Bot);
    expect(skillVisual("AI & Automation").icon).toBe(Bot);
  });

  it("falls back to a neutral icon for unknown skills", () => {
    expect(skillVisual("Cuisine moléculaire").icon).toBe(Sparkles);
  });
});

describe("skillVisual word boundaries", () => {
  it("does not match short patterns inside longer words", () => {
    expect(skillVisual("Cuisine").icon).toBe(Sparkles);
    expect(skillVisual("UI/UX").icon).not.toBe(Sparkles);
    expect(skillVisual("Design thinking").icon).not.toBe(Sparkles);
  });
});
