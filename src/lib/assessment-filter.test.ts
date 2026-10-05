import { describe, expect, it } from "vitest";
import type { AssessmentOverview } from "@/services/assessment.service";
import type { AttemptDTO } from "@/types/verification";
import { filterAssessments, parseTab } from "./assessment-filter";

const base = {
  description: "",
  durationMinutes: 15,
  questionCount: 9,
  requiresReview: false,
  talentSkillId: "s",
  activeAttemptId: null,
  lastAttempt: null,
  blockedReason: null,
};
const attempt = (status: AttemptDTO["status"]) => ({ status }) as AttemptDTO;

const items: AssessmentOverview[] = [
  { ...base, slug: "a", title: "Power Apps", skillName: "Power Apps" },
  { ...base, slug: "b", title: "Dataverse", skillName: "Dataverse", activeAttemptId: "x" },
  {
    ...base,
    slug: "c",
    title: "Power Automate",
    skillName: "Power Automate",
    lastAttempt: attempt("PASSED"),
  },
  { ...base, slug: "d", title: "SQL", skillName: "SQL", blockedReason: "Ajoutez d'abord la compétence" },
];
const slugs = (r: AssessmentOverview[]) => r.map((a) => a.slug);

describe("filterAssessments", () => {
  it("keeps everything by default", () =>
    expect(slugs(filterAssessments(items, {}))).toEqual(["a", "b", "c", "d"]));
  it("available excludes running and blocked ones", () =>
    expect(slugs(filterAssessments(items, { tab: "available" }))).toEqual(["a", "c"]));
  it("in progress", () => expect(slugs(filterAssessments(items, { tab: "inProgress" }))).toEqual(["b"]));
  it("finished and by result", () => {
    expect(slugs(filterAssessments(items, { tab: "finished" }))).toEqual(["c"]);
    expect(slugs(filterAssessments(items, { result: "FAILED" }))).toEqual([]);
  });
  it("searches title and skill, ignoring case", () =>
    expect(slugs(filterAssessments(items, { q: "AUTOMATE" }))).toEqual(["c"]));
  it("ignores an unknown result", () =>
    expect(slugs(filterAssessments(items, { result: "bogus" }))).toEqual(["a", "b", "c", "d"]));
  it("ignores an unknown tab", () => expect(parseTab("nope")).toBe("all"));
});
