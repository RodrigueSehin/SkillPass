import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryTalentSkillRepository } from "@/repositories/talent-skill.memory";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { SkillService } from "./skill.service";

let service: SkillService;
const ME = "me";
const OTHER = "other";

beforeEach(() => {
  service = new SkillService(new InMemoryTalentSkillRepository(ME));
});

describe("SkillService.list", () => {
  it("sorts by score by default and filters by text, level and status", async () => {
    const all = await service.list(ME);
    expect(all.items[0].name).toBe("Power Apps");
    expect(all.categories).toContain("Power Platform");

    expect((await service.list(ME, { q: "power" })).items.every((s) => /power/i.test(s.name))).toBe(true);
    expect((await service.list(ME, { level: "EXPERT" })).items).toHaveLength(1);
    expect((await service.list(ME, { status: "PENDING" })).items.map((s) => s.name)).toEqual([
      "AI & Automation",
    ]);
  });

  it("sorts by name", async () => {
    const names = (await service.list(ME, { sort: "name" })).items.map((s) => s.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});

describe("SkillService.add", () => {
  it("creates an unverified skill with a declared score", async () => {
    const skill = await service.add(OTHER, { name: "SQL", level: "ADVANCED", yearsOfExperience: 3 });
    expect(skill).toMatchObject({ score: 75, verificationStatus: "UNVERIFIED" });
  });

  it("rejects duplicates, case-insensitively", async () => {
    await expect(
      service.add(ME, { name: "power apps", level: "BEGINNER", yearsOfExperience: 0 }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("SkillService.update", () => {
  it("re-derives the declared score when an unverified level changes", async () => {
    const ui = (await service.list(ME)).items.find((s) => s.name === "UI/UX")!;
    const updated = await service.update(ME, ui.id, { level: "ADVANCED" });
    expect(updated).toMatchObject({ level: "ADVANCED", score: 75 });
  });

  it("refuses to hand-edit the level of a verified skill but allows years", async () => {
    const verified = (await service.list(ME)).items.find((s) => s.verificationStatus === "VERIFIED")!;
    await expect(service.update(ME, verified.id, { level: "BEGINNER" })).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(await service.update(ME, verified.id, { yearsOfExperience: 9 })).toMatchObject({
      yearsOfExperience: 9,
    });
  });
});

describe("ownership", () => {
  it("never exposes or mutates another user's skills", async () => {
    const mine = (await service.list(ME)).items[0];
    await expect(service.get(OTHER, mine.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.update(OTHER, mine.id, { yearsOfExperience: 1 })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(service.remove(OTHER, mine.id)).rejects.toBeInstanceOf(NotFoundError);
    expect((await service.list(ME)).total).toBe(7);
  });
});
