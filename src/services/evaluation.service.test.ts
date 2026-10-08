import { describe, expect, it } from "vitest";
import { EVALUATION_TEMPLATES, templateInput } from "@/config/evaluation-templates";
import {
  evaluationStats,
  filterEvaluations,
  publicQuestions,
  scoreAttempt,
  seededShuffle,
  successBySkill,
  typeDistribution,
} from "@/lib/business/evaluation-view";
import { InMemoryEvaluationRepository } from "@/repositories/evaluation.memory";
import { InMemoryOrganizationRepository } from "@/repositories/organization.memory";
import { evaluationSchema, publishableEvaluationSchema, questionSchema } from "@/schemas/evaluation";
import type { EvaluationInput } from "@/types/evaluation";
import { EvaluationService } from "./evaluation.service";
import { OrganizationService } from "./organization.service";

const NOW = new Date("2026-10-07T10:00:00.000Z");

const input = (over: Partial<EvaluationInput> = {}): EvaluationInput => ({
  ...evaluationSchema.parse(templateInput(EVALUATION_TEMPLATES[0]!, () => crypto.randomUUID())),
  ...over,
});

async function setup() {
  const orgs = new InMemoryOrganizationRepository();
  const repo = new InMemoryEvaluationRepository(undefined, orgs);
  const service = new EvaluationService(repo, () => NOW);
  const organizations = new OrganizationService(orgs, () => NOW);
  const scope = await organizations.create(
    { profileId: "p1", firstName: "Awa", lastName: "Koné", email: "awa@acme.com" },
    { name: "ACME", industry: "Logistique & Transport" },
  );
  const other = await organizations.create(
    { profileId: "p2", firstName: "Bob", lastName: "Aka", email: "bob@beta.com" },
    { name: "Beta", industry: "Banque" },
  );
  return { service, repo, scope, other };
}

describe("question and evaluation schemas", () => {
  it("accepts every template of the library", () => {
    for (const t of EVALUATION_TEMPLATES) {
      const parsed = publishableEvaluationSchema.safeParse(templateInput(t, () => crypto.randomUUID()));
      expect(parsed.success, t.title).toBe(true);
    }
  });

  it("demands a correct answer on choice questions", () => {
    const base = { id: "q1", type: "SINGLE", prompt: "Quelle réponse ?", options: ["A", "B"], correct: [] };
    expect(questionSchema.safeParse(base).success).toBe(false);
    expect(questionSchema.safeParse({ ...base, correct: [0, 1] }).success).toBe(false);
    expect(questionSchema.safeParse({ ...base, correct: [1] }).success).toBe(true);
    expect(questionSchema.safeParse({ ...base, type: "MULTIPLE", correct: [0, 1] }).success).toBe(true);
    expect(questionSchema.safeParse({ ...base, correct: [5] }).success).toBe(false);
    expect(questionSchema.safeParse({ ...base, options: ["A", "a"], correct: [0] }).success).toBe(false);
  });

  it("drops options on open questions and fixes true/false", () => {
    const open = questionSchema.parse({
      id: "q",
      type: "LONG",
      prompt: "Expliquez",
      options: ["x"],
      correct: [0],
    });
    expect(open.options).toEqual([]);
    expect(open.correct).toEqual([]);
    const tf = questionSchema.parse({
      id: "q",
      type: "TRUE_FALSE",
      prompt: "Vrai ?",
      options: ["a"],
      correct: [1],
    });
    expect(tf.options).toEqual(["Vrai", "Faux"]);
  });

  it("needs a description, a skill and questions to publish, but not to save a draft", () => {
    const draft = { title: "Brouillon" };
    expect(evaluationSchema.safeParse(draft).success).toBe(true);
    expect(publishableEvaluationSchema.safeParse(draft).success).toBe(false);
  });

  it("rejects a passage window that ends before it starts and a pass score of 0", () => {
    const settings = { windowStart: "2026-10-10T10:00", windowEnd: "2026-10-09T10:00" };
    expect(evaluationSchema.safeParse({ title: "Test", settings }).success).toBe(false);
    expect(
      evaluationSchema.safeParse({ title: "Test", settings: { windowStart: "2026-10-10T10:00" } }).success,
    ).toBe(false);
    expect(evaluationSchema.safeParse({ title: "Test", settings: { passScore: 0 } }).success).toBe(false);
  });
});

describe("EvaluationService", () => {
  it("saves a draft, then publishes it", async () => {
    const { service, scope } = await setup();
    const draft = await service.save(scope, null, input(), false, scope.member.id);
    expect(draft.status).toBe("DRAFT");
    const published = await service.publish(scope, draft.id);
    expect(published.status).toBe("PUBLISHED");
    await expect(service.publish(scope, draft.id)).rejects.toThrow("déjà publiée");
  });

  it("refuses to publish an empty test from the list", async () => {
    const { service, scope } = await setup();
    const draft = await service.save(
      scope,
      null,
      evaluationSchema.parse({ title: "Vide" }) as EvaluationInput,
      false,
      null,
    );
    await expect(service.publish(scope, draft.id)).rejects.toThrow();
  });

  it("publishes directly and keeps the status on later drafts saves", async () => {
    const { service, scope } = await setup();
    const live = await service.save(scope, null, input(), true, null);
    expect(live.status).toBe("PUBLISHED");
    const again = await service.save(scope, live.id, input({ title: "Renommée" }), false, null);
    expect(again.status).toBe("PUBLISHED");
    expect(again.title).toBe("Renommée");
  });

  it("shows a published test with a future date as scheduled", async () => {
    const { service, scope } = await setup();
    await service.save(scope, null, input({ publishAt: "2026-10-20T09:00" }), true, null);
    const [row] = await service.list(scope.organization.id);
    expect(row!.displayStatus).toBe("SCHEDULED");
    expect(row!.questionCount).toBe(4);
  });

  it("archives, restores as a draft and duplicates with fresh question ids", async () => {
    const { service, scope } = await setup();
    const live = await service.save(scope, null, input(), true, null);
    expect((await service.archive(scope, live.id)).status).toBe("ARCHIVED");
    expect((await service.restore(scope, live.id)).status).toBe("DRAFT");
    await expect(service.restore(scope, live.id)).rejects.toThrow();
    const copy = await service.duplicate(scope, live.id, null);
    expect(copy.status).toBe("DRAFT");
    expect(copy.title.startsWith("Copie de")).toBe(true);
    expect(copy.shareToken).not.toBe(live.shareToken);
    expect(copy.questions.map((q) => q.id)).not.toEqual(live.questions.map((q) => q.id));
  });

  it("never reaches another organization's tests", async () => {
    const { service, scope, other } = await setup();
    const mine = await service.save(scope, null, input(), true, null);
    await expect(service.get(other.organization.id, mine.id)).rejects.toThrow("introuvable");
    await expect(service.archive(other, mine.id)).rejects.toThrow("introuvable");
    await expect(service.remove(other, mine.id)).rejects.toThrow("introuvable");
    await expect(service.save(other, mine.id, input(), false, null)).rejects.toThrow("introuvable");
    expect(await service.list(other.organization.id)).toEqual([]);
    await service.remove(scope, mine.id);
    expect(await service.list(scope.organization.id)).toEqual([]);
  });
});

describe("evaluation view", () => {
  const row = (over: Record<string, unknown>) =>
    ({
      id: "x",
      title: "Test",
      description: "",
      skill: "Power Apps",
      type: "TECHNICAL",
      displayStatus: "PUBLISHED",
      candidates: 10,
      successRate: 80,
      createdAt: NOW.toISOString(),
      ...over,
    }) as never;

  it("averages success weighted by candidates and ignores tests without results", () => {
    const rows = [
      row({ candidates: 10, successRate: 80 }),
      row({ candidates: 30, successRate: 40 }),
      row({ candidates: 0, successRate: null }),
    ];
    const stats = evaluationStats(rows);
    expect(stats.successRate).toBe(50);
    expect(stats.candidates).toBe(40);
    expect(evaluationStats([row({ successRate: null, candidates: 0 })]).successRate).toBeNull();
  });

  it("filters by text without accents, type, status and age", () => {
    const rows = [
      row({ id: "1", title: "Évaluation Dataverse" }),
      row({ id: "2", type: "TRANSVERSAL", displayStatus: "DRAFT" }),
      row({ id: "3", createdAt: "2026-01-01T00:00:00.000Z" }),
    ];
    expect(filterEvaluations(rows, { q: "evaluation dataverse" }, NOW).map((r) => r.id)).toEqual(["1"]);
    expect(filterEvaluations(rows, { type: "TRANSVERSAL" }, NOW).map((r) => r.id)).toEqual(["2"]);
    expect(filterEvaluations(rows, { status: "DRAFT" }, NOW).map((r) => r.id)).toEqual(["2"]);
    expect(filterEvaluations(rows, { range: "30" }, NOW).map((r) => r.id)).toEqual(["1", "2"]);
  });

  it("splits tests by type and success by skill", () => {
    const rows = [
      row({ type: "TECHNICAL" }),
      row({ type: "TECHNICAL" }),
      row({ type: "CERTIFICATION", skill: "PL" }),
      row({ displayStatus: "ARCHIVED" }),
    ];
    expect(typeDistribution(rows).find((d) => d.type === "TECHNICAL")?.percent).toBe(67);
    expect(successBySkill(rows).map((s) => s.skill)).toEqual(["Power Apps", "PL"]);
  });

  const projectTest = () => {
    const [template] = EVALUATION_TEMPLATES.filter((x) => x.id === "it-project-management");
    // q0 single (2 pts), q1 true/false (1 pt), q2 short (4 pts), q3 scenario (6 pts)
    return template!.questions.map((q, i) => ({ ...q, id: `q${i}` }));
  };
  const rules = { weighting: "EQUAL", passScore: 70 } as const;

  it("waits for a person to score open questions", () => {
    const result = scoreAttempt(projectTest(), { q0: { choices: [0] }, q1: { choices: [0] } }, {}, rules);
    expect(result).toEqual({ percent: null, pending: 2, passed: null });
  });

  it("weighs questions equally or by points, and caps a review at the question's points", () => {
    const answers = { q0: { choices: [0] }, q1: { choices: [1] } };
    const review = { q2: 4, q3: 0 };
    expect(scoreAttempt(projectTest(), answers, review, rules)).toMatchObject({ percent: 50, passed: false });
    expect(
      scoreAttempt(projectTest(), answers, review, { weighting: "BY_POINTS", passScore: 40 }),
    ).toMatchObject({ percent: 46, passed: true });
    expect(
      scoreAttempt(projectTest(), { q0: { choices: [0] }, q1: { choices: [0] } }, { q2: 99, q3: 99 }, rules)
        .percent,
    ).toBe(100);
  });

  it("scores a choice-only test at once and an empty one at zero", () => {
    const [t] = EVALUATION_TEMPLATES.filter((x) => x.id === "power-apps-beginner");
    const questions = t!.questions.map((q, i) => ({ ...q, id: `q${i}` }));
    expect(scoreAttempt(questions, {}, {}, rules)).toEqual({ percent: 0, pending: 0, passed: false });
    const right = Object.fromEntries(questions.map((q) => [q.id, { choices: q.correct }]));
    expect(scoreAttempt(questions, right, {}, rules)).toMatchObject({ percent: 100, passed: true });
    expect(scoreAttempt([], {}, {}, rules).percent).toBeNull();
  });

  it("shuffles the same way for the same attempt, and never leaks the right answers", () => {
    expect(seededShuffle([1, 2, 3, 4, 5, 6], "a")).toEqual(seededShuffle([1, 2, 3, 4, 5, 6], "a"));
    expect(seededShuffle([1, 2, 3, 4, 5, 6], "a")).not.toEqual(seededShuffle([1, 2, 3, 4, 5, 6], "b"));
    const evaluation = {
      ...templateInput(EVALUATION_TEMPLATES[0]!, () => crypto.randomUUID()),
      id: "e",
      status: "PUBLISHED",
      shareToken: "t",
      createdById: null,
      createdAt: "",
    } as never;
    const shown = publicQuestions(evaluation, "attempt-1");
    expect(JSON.stringify(shown)).not.toContain("correct");
    // Whatever the display order, `index` points back to the stored option.
    for (const q of shown) {
      const stored = (evaluation as { questions: { id: string; options: string[] }[] }).questions.find(
        (x) => x.id === q.id,
      )!;
      for (const option of q.options) expect(stored.options[option.index]).toBe(option.label);
    }
  });
});
