import { describe, expect, it } from "vitest";
import type { ProjectDTO } from "@/types/portfolio";
import {
  countBy,
  filterProjects,
  nextProject,
  paginate,
  projectStats,
  projectStatus,
  topTechnologies,
} from "./project-view";

const today = "2026-10-06";
const project = (name: string, over: Partial<ProjectDTO>): ProjectDTO => ({
  id: name,
  name,
  description: null,
  organization: null,
  role: null,
  startDate: "2025-01-01",
  endDate: "2025-06-01",
  repositoryUrl: null,
  url: null,
  domain: null,
  teamSize: null,
  featured: false,
  coverUrl: null,
  status: null,
  videoUrl: null,
  otherUrl: null,
  isPublic: true,
  skills: [],
  ...over,
});

const items = [
  project("done", { domain: "Tech", skills: ["React", "SQL"], featured: true }),
  project("running", { startDate: "2026-01-01", endDate: null, domain: "Tech", skills: ["React"] }),
  project("planned", { startDate: "2027-01-01", endDate: null, domain: "Data", skills: ["Python"] }),
];

describe("project view", () => {
  it("derives the status from the dates", () => {
    expect(projectStatus(items[0], today)).toBe("COMPLETED");
    expect(projectStatus(items[1], today)).toBe("IN_PROGRESS");
    expect(projectStatus(items[2], today)).toBe("PLANNED");
    expect(projectStatus({ startDate: null, endDate: null }, today)).toBe("COMPLETED");
    expect(projectStatus({ startDate: "2026-01-01", endDate: "2026-12-01" }, today)).toBe("IN_PROGRESS");
    // An explicit status wins over the dates.
    expect(projectStatus({ ...items[2], status: "PAUSED" }, today)).toBe("PAUSED");
    expect(projectStatus({ ...items[0], status: "bogus" }, today)).toBe("COMPLETED");
  });

  it("filters by text, status, domain and technology", () => {
    const names = (r: ProjectDTO[]) => r.map((p) => p.name);
    expect(names(filterProjects(items, { q: "pyth" }, today))).toEqual(["planned"]);
    expect(names(filterProjects(items, { status: ["IN_PROGRESS", "PLANNED"] }, today))).toEqual([
      "planned",
      "running",
    ]);
    expect(names(filterProjects(items, { domain: ["Tech"] }, today))).toEqual(["running", "done"]);
    expect(names(filterProjects(items, { tech: ["SQL"] }, today))).toEqual(["done"]);
  });

  it("sorts", () => {
    expect(filterProjects(items, { sort: "oldest" }, today).map((p) => p.name)).toEqual([
      "done",
      "running",
      "planned",
    ]);
    expect(filterProjects(items, { sort: "name" }, today).map((p) => p.name)).toEqual([
      "done",
      "planned",
      "running",
    ]);
  });

  it("computes stats, technologies and the next project", () => {
    expect(projectStats(items, today)).toEqual({
      total: 3,
      completed: 1,
      inProgress: 1,
      paused: 0,
      planned: 1,
      featured: 1,
    });
    expect(topTechnologies(items)[0]).toEqual({ name: "React", percent: 67 });
    expect(nextProject(items, today)?.name).toBe("planned");
    expect(topTechnologies([])).toEqual([]);
  });

  it("counts values", () => {
    expect(countBy(["a", null, "b", "a"])).toEqual([
      { name: "a", count: 2 },
      { name: "b", count: 1 },
    ]);
  });

  it("paginates and clamps the page", () => {
    const list = Array.from({ length: 13 }, (_, i) => i);
    expect(paginate(list, 1).items).toHaveLength(6);
    expect(paginate(list, 3).items).toEqual([12]);
    expect(paginate(list, 99).page).toBe(3);
    expect(paginate([], 5)).toMatchObject({ page: 1, pages: 1 });
  });
});
