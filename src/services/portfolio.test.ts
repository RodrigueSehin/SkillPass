import { describe, expect, it } from "vitest";
import { CrudService } from "@/lib/crud";
import { NotFoundError } from "@/lib/errors";
import { createMemoryCertifications, createMemoryProjects } from "@/repositories/portfolio.memory";
import { createCertificationSchema, createExperienceSchema, createProjectSchema } from "@/schemas/portfolio";

const ME = "me";
const OTHER = "other";

describe("project schema", () => {
  it("turns blank form inputs into undefined and defaults skills", () => {
    const parsed = createProjectSchema.parse({ name: "Atlas", description: "", url: "", startDate: "" });
    expect(parsed).toMatchObject({ name: "Atlas", skills: [] });
    expect(parsed.description).toBeUndefined();
    expect(parsed.url).toBeUndefined();
  });

  it("rejects invalid URLs and an end date before the start date", () => {
    expect(createProjectSchema.safeParse({ name: "Atlas", url: "not a url" }).success).toBe(false);
    const result = createProjectSchema.safeParse({
      name: "Atlas",
      startDate: "2024-05-01",
      endDate: "2024-01-01",
    });
    expect(result.success).toBe(false);
    expect(!result.success && result.error.issues[0].path).toEqual(["endDate"]);
  });
});

describe("experience and certification schemas", () => {
  it("requires a start date for experiences", () => {
    expect(createExperienceSchema.safeParse({ title: "Dev", company: "ACME" }).success).toBe(false);
    expect(
      createExperienceSchema.safeParse({ title: "Dev", company: "ACME", startDate: "2020-01-01" }).success,
    ).toBe(true);
  });

  it("rejects an expiration before the issue date", () => {
    expect(
      createCertificationSchema.safeParse({
        name: "PL-200",
        issuer: "Microsoft",
        issueDate: "2025-06-01",
        expirationDate: "2025-01-01",
      }).success,
    ).toBe(false);
  });
});

describe("CrudService with the in-memory repository", () => {
  const service = () => new CrudService(createMemoryProjects(ME), "Projet");

  it("lists the seeded projects for the owner only", async () => {
    const s = service();
    expect(await s.list(ME)).toHaveLength(4);
    expect(await s.list(OTHER)).toHaveLength(0);
  });

  it("replaces a project on update, including clearing optional fields", async () => {
    const s = service();
    const [first] = await s.list(ME);
    const updated = await s.update(
      ME,
      first.id,
      createProjectSchema.parse({ name: "Renamed", skills: ["SQL"] }),
    );
    expect(updated).toMatchObject({ id: first.id, name: "Renamed", description: null, skills: ["SQL"] });
  });

  it("returns NotFound for other users' rows", async () => {
    const s = service();
    const [first] = await s.list(ME);
    await expect(s.get(OTHER, first.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(s.remove(OTHER, first.id)).rejects.toBeInstanceOf(NotFoundError);
    expect(await s.list(ME)).toHaveLength(4);
  });

  it("creates certifications as UNVERIFIED regardless of input", async () => {
    const s = new CrudService(createMemoryCertifications(ME), "Certification");
    const created = await s.add(
      ME,
      createCertificationSchema.parse({ name: "AZ-900", issuer: "Microsoft", issueDate: "2025-01-01" }),
    );
    expect(created.verificationStatus).toBe("UNVERIFIED");
  });
});
