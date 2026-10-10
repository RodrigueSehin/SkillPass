import { describe, expect, it } from "vitest";
import { InMemoryProfileRepository } from "@/repositories/profile.memory";
import { passwordChangeSchema, talentNotificationsSchema } from "@/schemas/profile-settings";
import { DEFAULT_PROFILE_SETTINGS, profileSettingsWithDefaults } from "@/types/profile-settings";
import { ProfileAccountService } from "./profile-account.service";

const setup = () => {
  const repo = new InMemoryProfileRepository(true);
  return { repo, service: new ProfileAccountService(repo) };
};

describe("profileSettingsWithDefaults", () => {
  it("fills holes and ignores unknown notification keys", () => {
    const s = profileSettingsWithDefaults({
      notifications: { matrix: { "skill.verified": { email: false }, nope: { inApp: true } } },
      privacy: { showLocation: false },
    });
    expect(s.notifications.matrix["skill.verified"]).toEqual({ inApp: true, email: false });
    expect(s.notifications.matrix).not.toHaveProperty("nope");
    expect(s.privacy).toEqual({ inDirectory: true, showLocation: false });
    expect(profileSettingsWithDefaults(null)).toEqual(DEFAULT_PROFILE_SETTINGS);
  });
});

describe("ProfileAccountService settings", () => {
  it("keeps the other privacy options when one changes", async () => {
    const { service } = setup();
    const saved = await service.patchPrivacy("demo", { showLocation: false });
    expect(saved.settings.privacy).toEqual({ inDirectory: true, showLocation: false });
    const again = await service.patchPrivacy("demo", { inDirectory: false });
    expect(again.settings.privacy).toEqual({ inDirectory: false, showLocation: false });
  });

  it("hides the city on the public profile when asked, and the whole profile when paused", async () => {
    const { service } = setup();
    expect((await service.getPublic("sehin-rodrigue"))?.profile.location).toContain("Abidjan");
    await service.patchPrivacy("demo", { showLocation: false });
    expect((await service.getPublic("sehin-rodrigue"))?.profile.location).toBeNull();
    await service.setPublic("demo", false);
    expect(await service.getPublic("sehin-rodrigue")).toBeNull();
  });

  it("saves notifications and rejects a missing profile", async () => {
    const { service } = setup();
    const notifications = { ...DEFAULT_PROFILE_SETTINGS.notifications, limitHours: true, start: "09:00" };
    expect((await service.saveNotifications("demo", notifications)).settings.notifications.start).toBe(
      "09:00",
    );
    await expect(service.saveNotifications("ghost", notifications)).rejects.toThrow(/introuvable/i);
  });
});

describe("settings schemas", () => {
  it("rejects unknown notifications and bad hours", () => {
    const ok = talentNotificationsSchema.safeParse(DEFAULT_PROFILE_SETTINGS.notifications);
    expect(ok.success).toBe(true);
    expect(
      talentNotificationsSchema.safeParse({
        ...DEFAULT_PROFILE_SETTINGS.notifications,
        matrix: { hack: { inApp: true, email: true } },
      }).success,
    ).toBe(false);
    expect(
      talentNotificationsSchema.safeParse({ ...DEFAULT_PROFILE_SETTINGS.notifications, start: "25:00" })
        .success,
    ).toBe(false);
  });

  it("checks the new password like registration does", () => {
    const base = { current: "OldPass1", next: "NewPass12", confirm: "NewPass12" };
    expect(passwordChangeSchema.safeParse(base).success).toBe(true);
    expect(passwordChangeSchema.safeParse({ ...base, next: "short", confirm: "short" }).success).toBe(false);
    expect(passwordChangeSchema.safeParse({ ...base, confirm: "Other123" }).success).toBe(false);
    expect(passwordChangeSchema.safeParse({ ...base, next: "OldPass1", confirm: "OldPass1" }).success).toBe(
      false,
    );
  });
});
