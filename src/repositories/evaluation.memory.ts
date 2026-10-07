import { randomUUID } from "node:crypto";
import { EVALUATION_TEMPLATES, templateInput } from "@/config/evaluation-templates";
import type {
  EvaluationAttemptRow,
  EvaluationDTO,
  EvaluationInput,
  EvaluationStatus,
} from "@/types/evaluation";
import type { OrganizationRepository } from "./organization.repository";
import type { AttemptTotals, EvaluationRepository } from "./evaluation.repository";

const DAY_MS = 86_400_000;
type Stored = EvaluationDTO & { orgId: string };
type StoredAttempt = EvaluationAttemptRow & { orgId: string };

const CANDIDATES = [
  "Aïcha Koné",
  "Jean Marc Kouakou",
  "Marie K. Yao",
  "Koffi D. N'Guessan",
  "Fatou B. Traoré",
  "Ibrahim Sow",
  "Nadia El Amrani",
  "Yves Aka",
];

/** [template id, status, candidates, success rate %] */
const DEMO: [string, EvaluationStatus, number, number][] = [
  ["power-apps-beginner", "PUBLISHED", 42, 76],
  ["power-automate-intermediate", "PUBLISHED", 38, 82],
  ["dataverse-advanced", "DRAFT", 0, 0],
  ["pl-200-preparation", "PUBLISHED", 36, 79],
  ["it-project-management", "PUBLISHED", 18, 89],
  ["professional-communication", "PUBLISHED", 27, 85],
];

/**
 * In-memory evaluations. The first call fills the demo organization with tests built from the library and
 * a few finished attempts, so the screens have something to show.
 */
export class InMemoryEvaluationRepository implements EvaluationRepository {
  private rows: Stored[] = [];
  private attempts: StoredAttempt[] = [];
  private ready: Promise<void>;

  constructor(
    demoProfileId: string | undefined,
    private readonly orgs: OrganizationRepository,
  ) {
    this.ready = demoProfileId ? this.seed(demoProfileId) : Promise.resolve();
  }

  private async seed(profileId: string) {
    const scope = await this.orgs.findMembershipByProfile(profileId);
    if (!scope) return;
    const now = Date.now();
    DEMO.forEach(([templateId, status, candidates, rate], index) => {
      const template = EVALUATION_TEMPLATES.find((t) => t.id === templateId);
      if (!template) return;
      const evaluation: Stored = {
        ...templateInput(template, randomUUID),
        id: randomUUID(),
        orgId: scope.organization.id,
        status,
        shareToken: randomUUID().replaceAll("-", ""),
        createdById: scope.member.id,
        createdAt: new Date(now - (index + 2) * 6 * DAY_MS).toISOString(),
      };
      this.rows.push(evaluation);
      const passedCount = Math.round((candidates * rate) / 100);
      for (let i = 0; i < candidates; i++) {
        const passed = i < passedCount;
        this.attempts.push({
          id: randomUUID(),
          orgId: scope.organization.id,
          evaluationId: evaluation.id,
          candidateName: CANDIDATES[(i + index) % CANDIDATES.length]!,
          candidateUsername: null,
          score: passed ? 70 + ((i * 7) % 30) : 35 + ((i * 11) % 34),
          passed,
          status: "GRADED",
          submittedAt: new Date(now - ((i % 25) + 1) * DAY_MS).toISOString(),
        });
      }
    });
  }

  private view = ({ orgId, ...evaluation }: Stored): EvaluationDTO => {
    void orgId;
    return structuredClone(evaluation);
  };

  async list(orgId: string) {
    await this.ready;
    return this.rows
      .filter((e) => e.orgId === orgId)
      .map(this.view)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(orgId: string, id: string) {
    await this.ready;
    const row = this.rows.find((e) => e.orgId === orgId && e.id === id);
    return row ? this.view(row) : null;
  }

  async create(orgId: string, input: EvaluationInput, createdById: string | null) {
    await this.ready;
    const row: Stored = {
      ...structuredClone(input),
      id: randomUUID(),
      orgId,
      status: "DRAFT",
      shareToken: randomUUID().replaceAll("-", ""),
      createdById,
      createdAt: new Date().toISOString(),
    };
    this.rows.push(row);
    return this.view(row);
  }

  async update(orgId: string, id: string, input: EvaluationInput) {
    await this.ready;
    const row = this.rows.find((e) => e.orgId === orgId && e.id === id);
    if (!row) return null;
    Object.assign(row, structuredClone(input));
    return this.view(row);
  }

  async setStatus(orgId: string, id: string, status: EvaluationStatus) {
    await this.ready;
    const row = this.rows.find((e) => e.orgId === orgId && e.id === id);
    if (!row) return null;
    row.status = status;
    return this.view(row);
  }

  async delete(orgId: string, id: string) {
    await this.ready;
    const index = this.rows.findIndex((e) => e.orgId === orgId && e.id === id);
    if (index === -1) return false;
    this.rows.splice(index, 1);
    this.attempts = this.attempts.filter((a) => a.evaluationId !== id);
    return true;
  }

  async attemptTotals(orgId: string) {
    await this.ready;
    const totals = new Map<string, AttemptTotals>();
    const people = new Map<string, Set<string>>();
    for (const a of this.attempts.filter((x) => x.orgId === orgId && x.status !== "IN_PROGRESS")) {
      const t = totals.get(a.evaluationId) ?? { candidates: 0, graded: 0, passed: 0 };
      const who = people.get(a.evaluationId) ?? new Set<string>();
      who.add(a.id);
      people.set(a.evaluationId, who);
      t.candidates = who.size;
      if (a.status === "GRADED") {
        t.graded += 1;
        if (a.passed) t.passed += 1;
      }
      totals.set(a.evaluationId, t);
    }
    return totals;
  }

  async listAttempts(orgId: string, limit: number) {
    await this.ready;
    return this.attempts
      .filter((a) => a.orgId === orgId && a.status !== "IN_PROGRESS")
      .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""))
      .slice(0, limit)
      .map(({ orgId: _orgId, ...row }) => {
        void _orgId;
        return row;
      });
  }
}
