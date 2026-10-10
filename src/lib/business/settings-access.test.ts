import { describe, expect, it } from "vitest";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { parseAccountTab, visibleAccountTabs } from "@/components/account/settings-layout";
import { parseSettingsTab, visibleSettingsTabs } from "@/components/business/settings/layout";

describe("platform-level settings", () => {
  it("only the SkillPass administrator counts as platform admin", () => {
    expect(isPlatformAdmin({ role: "SKILLPASS_ADMIN" })).toBe(true);
    for (const role of ["TALENT", "COMPANY_ADMIN", "RECRUITER", "VERIFIER"] as const)
      expect(isPlatformAdmin({ role })).toBe(false);
  });

  it("hides security, integrations and compliance from Business members", () => {
    const keys = visibleSettingsTabs(false).map((t) => t.key);
    expect(keys).toEqual(["general", "notifications", "branding", "danger"]);
    expect(visibleSettingsTabs(true)).toHaveLength(7);
    // A hand-typed address falls back to the general tab instead of showing the section.
    expect(parseSettingsTab("security", false)).toBe("general");
    expect(parseSettingsTab("security", true)).toBe("security");
  });

  it("hides integrations from talents", () => {
    expect(visibleAccountTabs(false).map((t) => t.key)).not.toContain("integrations");
    expect(parseAccountTab("integrations", false)).toBe("general");
    expect(parseAccountTab("integrations", true)).toBe("integrations");
  });
});
