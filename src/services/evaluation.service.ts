import { randomUUID } from "node:crypto";
import { displayStatus } from "@/lib/business/evaluation-view";
import { ConflictError, NotFoundError } from "@/lib/errors";
import type { EvaluationRepository } from "@/repositories/evaluation.repository";
import { publishableEvaluationSchema } from "@/schemas/evaluation";
import type { EvaluationDTO, EvaluationInput, EvaluationRow } from "@/types/evaluation";
import type { OrgScope } from "./organization.service";

const asInput = (e: EvaluationDTO): EvaluationInput => {
  const { id, status, shareToken, createdById, createdAt, ...input } = e;
  void [id, status, shareToken, createdById, createdAt];
  return input;
};

/** Evaluations of an organization: the tests it builds for candidates. */
export class EvaluationService {
  constructor(
    private readonly evaluations: EvaluationRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Tests with their display status and the results measured on candidates. */
  async list(orgId: string): Promise<EvaluationRow[]> {
    const [all, totals] = await Promise.all([
      this.evaluations.list(orgId),
      this.evaluations.attemptTotals(orgId),
    ]);
    const nowIso = this.now().toISOString();
    return all.map(({ questions, ...e }) => {
      const t = totals.get(e.id);
      return {
        ...e,
        questionCount: questions.length,
        displayStatus: displayStatus(e, nowIso),
        candidates: t?.candidates ?? 0,
        successRate: t && t.graded > 0 ? Math.round((t.passed / t.graded) * 100) : null,
      };
    });
  }

  async get(orgId: string, id: string) {
    const evaluation = await this.evaluations.get(orgId, id);
    if (!evaluation) throw new NotFoundError("Évaluation introuvable");
    return evaluation;
  }

  recentAttempts(orgId: string, limit = 50) {
    return this.evaluations.listAttempts(orgId, limit);
  }

  /**
   * Creates or updates a test. With `publish` it goes live (the caller validated it with the publishable schema);
   * without, a draft stays a draft and a published or archived test keeps its status.
   */
  async save(
    scope: OrgScope,
    id: string | null,
    input: EvaluationInput,
    publish: boolean,
    createdById: string | null,
  ) {
    const orgId = scope.organization.id;
    const existing = id ? await this.get(orgId, id) : null;
    const saved = existing
      ? await this.evaluations.update(orgId, existing.id, input)
      : await this.evaluations.create(orgId, input, createdById);
    if (!saved) throw new NotFoundError("Évaluation introuvable");
    if (publish && saved.status !== "PUBLISHED") {
      return (await this.evaluations.setStatus(orgId, saved.id, "PUBLISHED")) ?? saved;
    }
    return saved;
  }

  /** Publishes a draft from the list: it needs a description, a skill and questions. */
  async publish(scope: OrgScope, id: string) {
    const evaluation = await this.get(scope.organization.id, id);
    if (evaluation.status === "PUBLISHED") throw new ConflictError("Cette évaluation est déjà publiée.");
    publishableEvaluationSchema.parse(asInput(evaluation));
    const published = await this.evaluations.setStatus(scope.organization.id, id, "PUBLISHED");
    if (!published) throw new NotFoundError("Évaluation introuvable");
    return published;
  }

  async archive(scope: OrgScope, id: string) {
    const archived = await this.evaluations.setStatus(scope.organization.id, id, "ARCHIVED");
    if (!archived) throw new NotFoundError("Évaluation introuvable");
    return archived;
  }

  /** Takes an archived test back as a draft, to be reviewed before it goes live again. */
  async restore(scope: OrgScope, id: string) {
    const evaluation = await this.get(scope.organization.id, id);
    if (evaluation.status !== "ARCHIVED") throw new ConflictError("Cette évaluation n'est pas archivée.");
    return (await this.evaluations.setStatus(scope.organization.id, id, "DRAFT")) ?? evaluation;
  }

  async duplicate(scope: OrgScope, id: string, createdById: string | null) {
    const evaluation = await this.get(scope.organization.id, id);
    const input = asInput(evaluation);
    return this.evaluations.create(
      scope.organization.id,
      {
        ...input,
        title: `Copie de ${input.title}`.slice(0, 100),
        publishAt: null,
        questions: input.questions.map((q) => ({ ...q, id: randomUUID() })),
      },
      createdById,
    );
  }

  async remove(scope: OrgScope, id: string) {
    if (!(await this.evaluations.delete(scope.organization.id, id)))
      throw new NotFoundError("Évaluation introuvable");
  }
}
