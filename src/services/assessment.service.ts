import {
  ASSESSMENT_BANK,
  BANK_VERSION,
  findAssessment,
  type BankAssessment,
  type AssessmentDomain,
} from "@/config/assessment-bank";
import { scoreAttempt } from "@/lib/assessment-scoring";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type { AttemptRepository } from "@/repositories/attempt.repository";
import type { ProfileRepository } from "@/repositories/profile.repository";
import type { TalentSkillDTO, TalentSkillRepository } from "@/repositories/talent-skill.repository";
import { REVIEWER_ROLES } from "@/types/profile";
import type { AnswerInput, AttemptDTO, CredentialDTO } from "@/types/verification";
import type { CredentialService } from "./credential.service";

/** Extra seconds tolerated after the deadline for network latency. */
export const SUBMIT_GRACE_SECONDS = 30;
const HOUR_MS = 3_600_000;

export interface AssessmentOverview {
  slug: string;
  title: string;
  skillName: string;
  description: string;
  durationMinutes: number;
  questionCount: number;
  requiresReview: boolean;
  /** The user's matching skill, if they declared it. */
  talentSkillId: string | null;
  activeAttemptId: string | null;
  lastAttempt: AttemptDTO | null;
  /** Why the assessment cannot be started right now, if so. */
  blockedReason: string | null;
}

/** What the browser receives to take an assessment: never the correct answers. */
export interface TakeableAssessment {
  attemptId: string;
  title: string;
  deadlineAt: string;
  questions: { id: string; domain: AssessmentDomain; prompt: string; options: readonly string[] }[];
}

export interface ReviewItem {
  attempt: AttemptDTO;
  holderName: string;
  assessmentTitle: string;
  skillName: string;
}

interface Deps {
  attempts: AttemptRepository;
  skills: TalentSkillRepository;
  profiles: ProfileRepository;
  credentials: CredentialService;
  now?: () => Date;
  /** Waiting time between two attempts at the same assessment. */
  cooldownHours?: number;
}

export class AssessmentService {
  private readonly now: () => Date;
  private readonly cooldownMs: number;

  constructor(private readonly deps: Deps) {
    this.now = deps.now ?? (() => new Date());
    this.cooldownMs = (deps.cooldownHours ?? 24) * HOUR_MS;
  }

  private bank(slug: string) {
    const assessment = findAssessment(slug);
    if (!assessment) throw new NotFoundError("Évaluation introuvable");
    return assessment;
  }

  private findSkill(skills: TalentSkillDTO[], assessment: BankAssessment) {
    return skills.find((s) => s.name.toLowerCase() === assessment.skillName.toLowerCase()) ?? null;
  }

  private cooldownLeftMs(last: AttemptDTO | undefined) {
    if (!last?.submittedAt) return 0;
    return Math.max(0, Date.parse(last.submittedAt) + this.cooldownMs - this.now().getTime());
  }

  async list(profileId: string): Promise<AssessmentOverview[]> {
    const [skills, attempts] = await Promise.all([
      this.deps.skills.list(profileId),
      this.deps.attempts.listByProfile(profileId),
    ]);
    return ASSESSMENT_BANK.map((a) => {
      const skill = this.findSkill(skills, a);
      const mine = attempts.filter((t) => t.assessmentSlug === a.slug);
      const active = mine.find((t) => t.status === "IN_PROGRESS" && !this.isExpired(t));
      const last = mine.find((t) => t.status !== "IN_PROGRESS") ?? null;
      const pending = mine.some((t) => t.status === "PENDING_REVIEW");
      const left = this.cooldownLeftMs(last ?? undefined);

      let blockedReason: string | null = null;
      if (!skill) blockedReason = `Ajoutez d'abord la compétence « ${a.skillName} » à votre profil.`;
      else if (pending) blockedReason = "Votre dernière tentative est en attente de validation.";
      else if (!active && left > 0) blockedReason = `Nouvelle tentative possible dans ${formatWait(left)}.`;

      return {
        slug: a.slug,
        title: a.title,
        skillName: a.skillName,
        description: a.description,
        durationMinutes: a.durationMinutes,
        questionCount: a.questions.length,
        requiresReview: a.requiresReview,
        talentSkillId: skill?.id ?? null,
        activeAttemptId: active?.id ?? null,
        lastAttempt: last,
        blockedReason,
      };
    });
  }

  private isExpired(attempt: AttemptDTO) {
    return this.now().getTime() > Date.parse(attempt.deadlineAt) + SUBMIT_GRACE_SECONDS * 1000;
  }

  async start(profileId: string, slug: string): Promise<AttemptDTO> {
    const assessment = this.bank(slug);
    const skills = await this.deps.skills.list(profileId);
    const skill = this.findSkill(skills, assessment);
    if (!skill) {
      throw new ConflictError(`Ajoutez d'abord la compétence « ${assessment.skillName} » à votre profil.`);
    }

    const mine = (await this.deps.attempts.listByProfile(profileId)).filter((t) => t.assessmentSlug === slug);

    // Resume a running attempt instead of opening a second one.
    const running = mine.find((t) => t.status === "IN_PROGRESS");
    if (running) {
      if (!this.isExpired(running)) return running;
      // The user walked away: close it as failed so it counts towards the cooldown.
      await this.close(profileId, running, []);
    }

    if (mine.some((t) => t.status === "PENDING_REVIEW")) {
      throw new ConflictError("Votre dernière tentative est en attente de validation.");
    }
    const last = (await this.deps.attempts.listByProfile(profileId)).find(
      (t) => t.assessmentSlug === slug && t.status !== "IN_PROGRESS",
    );
    const left = this.cooldownLeftMs(last);
    if (left > 0) throw new ConflictError(`Nouvelle tentative possible dans ${formatWait(left)}.`);

    return this.deps.attempts.create(profileId, {
      talentSkillId: skill.id,
      assessmentSlug: slug,
      bankVersion: BANK_VERSION,
      deadlineAt: new Date(this.now().getTime() + assessment.durationMinutes * 60_000).toISOString(),
    });
  }

  /** Questions for a running attempt, without correct answers or explanations. */
  async getTakeable(profileId: string, attemptId: string): Promise<TakeableAssessment> {
    const attempt = await this.deps.attempts.findById(profileId, attemptId);
    if (!attempt) throw new NotFoundError("Tentative introuvable");
    if (attempt.status !== "IN_PROGRESS") throw new ConflictError("Cette tentative est terminée.");
    const assessment = this.bank(attempt.assessmentSlug);
    return {
      attemptId: attempt.id,
      title: assessment.title,
      deadlineAt: attempt.deadlineAt,
      questions: assessment.questions.map(({ id, domain, prompt, options }) => ({
        id,
        domain,
        prompt,
        options,
      })),
    };
  }

  /** Marks a finished attempt FAILED with whatever answers were given (used for timeouts). */
  private async close(profileId: string, attempt: AttemptDTO, answers: AnswerInput[]) {
    return this.deps.attempts.submit(profileId, attempt.id, {
      status: "FAILED",
      submittedAt: this.now().toISOString(),
      answers,
      overallScore: 0,
      domainScores: { KNOWLEDGE: 0, PRACTICAL: 0, ARCHITECTURE: 0 },
      level: null,
    });
  }

  async submit(profileId: string, attemptId: string, answers: AnswerInput[]) {
    const attempt = await this.deps.attempts.findById(profileId, attemptId);
    if (!attempt) throw new NotFoundError("Tentative introuvable");
    if (attempt.status !== "IN_PROGRESS") throw new ConflictError("Cette tentative a déjà été soumise.");

    // Time limit is enforced here, not in the browser: late answers are discarded.
    if (this.isExpired(attempt)) {
      const closed = await this.close(profileId, attempt, []);
      if (!closed) throw new ConflictError("Cette tentative a déjà été soumise.");
      return { attempt: closed, credential: null as CredentialDTO | null, timedOut: true };
    }

    const assessment = this.bank(attempt.assessmentSlug);
    const scored = scoreAttempt(assessment, answers);
    const status = !scored.passed ? "FAILED" : assessment.requiresReview ? "PENDING_REVIEW" : "PASSED";

    // Conditional transition: if a concurrent request already submitted, this returns null.
    const saved = await this.deps.attempts.submit(profileId, attempt.id, {
      status,
      submittedAt: this.now().toISOString(),
      answers,
      overallScore: scored.overall,
      domainScores: scored.domainScores,
      level: scored.level,
    });
    if (!saved) throw new ConflictError("Cette tentative a déjà été soumise.");

    let credential: CredentialDTO | null = null;
    if (status === "PASSED") credential = await this.finalizePassed(saved);
    if (status === "PENDING_REVIEW")
      await this.deps.skills.setStatus(profileId, attempt.talentSkillId, "PENDING");
    return { attempt: saved, credential, timedOut: false };
  }

  /** Applies a passed attempt to the skill and issues its credential. Safe to run twice. */
  async finalizePassed(attempt: AttemptDTO) {
    if (attempt.overallScore === null || !attempt.level)
      throw new Error("finalizePassed: attempt has no result");
    const assessment = this.bank(attempt.assessmentSlug);
    await this.deps.skills.applyVerification(attempt.profileId, attempt.talentSkillId, {
      level: attempt.level,
      score: attempt.overallScore,
      status: "VERIFIED",
    });
    return this.deps.credentials.issue(attempt.profileId, {
      talentSkillId: attempt.talentSkillId,
      skillName: assessment.skillName,
      level: attempt.level,
      attemptId: attempt.id,
    });
  }

  async getResult(profileId: string, attemptId: string) {
    const attempt = await this.deps.attempts.findById(profileId, attemptId);
    if (!attempt) throw new NotFoundError("Tentative introuvable");
    if (attempt.status === "IN_PROGRESS") throw new ConflictError("Cette tentative n'est pas terminée.");
    const assessment = this.bank(attempt.assessmentSlug);
    // Self-heal: a passed attempt whose follow-up writes failed gets completed on read.
    const credential = attempt.status === "PASSED" ? await this.finalizePassed(attempt) : null;
    return { attempt, assessment: { title: assessment.title, skillName: assessment.skillName }, credential };
  }

  listAttempts(profileId: string) {
    return this.deps.attempts.listByProfile(profileId);
  }

  // ---------- Human validation of critical assessments ----------

  private async requireReviewer(reviewerId: string) {
    const reviewer = await this.deps.profiles.findById(reviewerId);
    if (!reviewer || !REVIEWER_ROLES.includes(reviewer.role)) throw new ForbiddenError();
    return reviewer;
  }

  async listPendingReview(reviewerId: string): Promise<ReviewItem[]> {
    await this.requireReviewer(reviewerId);
    const pending = await this.deps.attempts.listPendingReview();
    return Promise.all(
      pending.map(async (attempt) => {
        const holder = await this.deps.profiles.findById(attempt.profileId);
        const assessment = this.bank(attempt.assessmentSlug);
        return {
          attempt,
          holderName: holder?.fullName ?? "Utilisateur",
          assessmentTitle: assessment.title,
          skillName: assessment.skillName,
        };
      }),
    );
  }

  async review(reviewerId: string, attemptId: string, decision: "approve" | "reject", note?: string) {
    const reviewer = await this.requireReviewer(reviewerId);
    const attempt = await this.deps.attempts.findAnyById(attemptId);
    if (!attempt) throw new NotFoundError("Tentative introuvable");
    // Nobody validates their own result.
    if (attempt.profileId === reviewer.id)
      throw new ForbiddenError("Vous ne pouvez pas valider votre propre évaluation");
    if (attempt.status !== "PENDING_REVIEW")
      throw new ConflictError("Cette tentative n'est pas en attente de validation.");

    const reviewed = await this.deps.attempts.review(attempt.id, {
      status: decision === "approve" ? "PASSED" : "REJECTED",
      reviewedById: reviewer.id,
      reviewedAt: this.now().toISOString(),
      reviewNote: note?.trim() || null,
    });
    if (!reviewed) throw new ConflictError("Cette tentative a déjà été traitée.");

    if (decision === "approve") {
      const credential = await this.finalizePassed(reviewed);
      return { attempt: reviewed, credential };
    }
    await this.deps.skills.setStatus(attempt.profileId, attempt.talentSkillId, "UNVERIFIED");
    return { attempt: reviewed, credential: null };
  }
}

function formatWait(ms: number) {
  const hours = Math.floor(ms / HOUR_MS);
  const minutes = Math.ceil((ms % HOUR_MS) / 60_000);
  if (hours >= 1) return `${hours} h ${minutes > 0 && minutes < 60 ? `${minutes} min` : ""}`.trim();
  return `${Math.max(1, minutes)} min`;
}
