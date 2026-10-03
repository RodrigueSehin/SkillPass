import { describe, expect, it } from "vitest";
import { CrudService } from "@/lib/crud";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { InMemoryProfileRepository } from "@/repositories/profile.memory";
import {
  createMemoryCertifications,
  createMemoryExperiences,
  createMemoryProjects,
} from "@/repositories/portfolio.memory";
import { InMemoryTalentSkillRepository } from "@/repositories/talent-skill.memory";
import { updateProfileSchema } from "@/schemas/profile";
import { PassportService, yearsFromExperiences } from "./passport.service";
import { ProfileAccountService } from "./profile-account.service";
import { SkillService } from "./skill.service";

const ME = "demo";

const passportService = () =>
  new PassportService(
    new SkillService(new InMemoryTalentSkillRepository(ME)),
    new CrudService(createMemoryProjects(ME), "Projet"),
    new CrudService(createMemoryExperiences(ME), "Expérience"),
    new CrudService(createMemoryCertifications(ME), "Certification"),
  );

const validProfile = {
  fullName: "Sehin G. Rodrigue",
  username: "sehin-rodrigue",
  headline: "",
  profession: "",
  location: "",
  bio: "",
  careerGoal: "",
  yearsOfExperience: "5",
  availability: "IMMEDIATE",
  isPublic: true,
};

describe("PassportService.build", () => {
  it("aggregates the portfolio and explains the score", async () => {
    const passport = await passportService().build(ME, {
      yearsOfExperience: 5,
      updatedAt: new Date().toISOString(),
    });
    expect(passport.stats).toMatchObject({ skills: 7, verifiedSkills: 4, projects: 4, certifications: 3 });
    expect(passport.isVerified).toBe(true);
    expect(passport.score.total).toBe(passport.score.criteria.reduce((s, c) => s + c.points, 0));
    expect(passport.score.total).toBeGreaterThan(40);
  });

  it("flags certifications past their expiration date", async () => {
    const passport = await passportService().build(
      ME,
      { yearsOfExperience: 5, updatedAt: new Date().toISOString() },
      new Date("2027-01-01"),
    );
    expect(passport.certifications.find((c) => c.credentialId === "PL-200")?.expired).toBe(true);
  });

  it("returns an empty passport for a user without data", async () => {
    const passport = await passportService().build("stranger", {
      yearsOfExperience: 0,
      updatedAt: "2020-01-01T00:00:00Z",
    });
    expect(passport.stats.skills).toBe(0);
    expect(passport.isVerified).toBe(false);
  });
});

describe("yearsFromExperiences", () => {
  it("sums dated positions and treats a missing end date as ongoing", () => {
    const years = yearsFromExperiences(
      [
        {
          id: "1",
          title: "A",
          company: "X",
          location: null,
          description: null,
          startDate: "2020-01-01",
          endDate: "2022-01-01",
        },
        {
          id: "2",
          title: "B",
          company: "Y",
          location: null,
          description: null,
          startDate: "2023-01-01",
          endDate: null,
        },
      ],
      new Date("2025-01-01"),
    );
    expect(years).toBe(4);
  });
});

describe("ProfileAccountService", () => {
  const service = () => new ProfileAccountService(new InMemoryProfileRepository(true));

  it("exposes only allow-listed fields on the public profile", async () => {
    const found = await service().getPublic("sehin-rodrigue");
    expect(found?.profile.fullName).toBe("Sehin G. Rodrigue");
    expect(found?.profile).not.toHaveProperty("careerGoal");
    expect(found?.profile).not.toHaveProperty("isPublic");
    expect(found?.profile).not.toHaveProperty("id");
  });

  it("hides private profiles and unknown usernames", async () => {
    const s = service();
    await s.update(ME, updateProfileSchema.parse({ ...validProfile, isPublic: false }));
    expect(await s.getPublic("sehin-rodrigue")).toBeNull();
    expect(await s.getPublic("nobody")).toBeNull();
  });

  it("rejects a username already used by another profile", async () => {
    const s = service();
    await s.get({ id: "other", email: "o@x.com", name: "Other Person" });
    const other = (await s.get({ id: "other", email: "o@x.com", name: "Other Person" })).username;
    await expect(
      s.update(ME, updateProfileSchema.parse({ ...validProfile, username: other })),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(s.update("ghost", updateProfileSchema.parse(validProfile))).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("refuses reserved and malformed usernames", () => {
    expect(updateProfileSchema.safeParse({ ...validProfile, username: "dashboard" }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ ...validProfile, username: "Bad Name!" }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ ...validProfile, username: "ok-name-1" }).success).toBe(true);
  });
});
