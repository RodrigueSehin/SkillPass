import { ConflictError, NotFoundError } from "@/lib/errors";
import {
  newRecommendationToken,
  type RecommendationRepository,
} from "@/repositories/recommendation.repository";
import type { ProfileRepository } from "@/repositories/profile.repository";
import type { TalentSkillRepository } from "@/repositories/talent-skill.repository";
import type { RequestRecommendationInput, SubmitRecommendationInput } from "@/schemas/verification";
import type { PublicRecommendation, RecommendationDTO } from "@/types/verification";

export const RECOMMENDATION_LINK_DAYS = 30;
const DAY_MS = 86_400_000;

export type RecommendationLinkState = "open" | "answered" | "expired";

/** What the recommender sees on their link: just enough context, nothing about the holder's data. */
export interface RecommendationInvite {
  holderName: string;
  skillName: string | null;
  authorName: string;
  state: RecommendationLinkState;
}

export class RecommendationService {
  constructor(
    private readonly repo: RecommendationRepository,
    private readonly skills: TalentSkillRepository,
    private readonly profiles: ProfileRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async request(profileId: string, input: RequestRecommendationInput) {
    let skillName: string | undefined;
    if (input.talentSkillId) {
      // The skill must belong to the requester: ownership is checked by the profile-scoped lookup.
      const skill = await this.skills.findById(profileId, input.talentSkillId);
      if (!skill) throw new NotFoundError("Compétence introuvable");
      skillName = skill.name;
    }
    return this.repo.create(profileId, {
      token: newRecommendationToken(),
      talentSkillId: input.talentSkillId,
      skillName,
      authorName: input.authorName,
      authorEmail: input.authorEmail,
      expiresAt: new Date(this.now().getTime() + RECOMMENDATION_LINK_DAYS * DAY_MS).toISOString(),
    });
  }

  list(profileId: string) {
    return this.repo.listByProfile(profileId);
  }

  async listApproved(profileId: string): Promise<PublicRecommendation[]> {
    const all = await this.repo.listByProfile(profileId);
    return all
      .filter((r) => r.status === "APPROVED" && r.content)
      .map((r) => ({
        id: r.id,
        authorName: r.authorName,
        authorTitle: r.authorTitle,
        content: r.content,
        skillName: r.skillName,
        submittedAt: r.submittedAt,
      }));
  }

  /** Whether the recommender link can still be answered, evaluated on the service clock. */
  linkState(r: RecommendationDTO): RecommendationLinkState {
    if (r.status !== "REQUESTED") return "answered";
    return Date.parse(r.expiresAt) <= this.now().getTime() ? "expired" : "open";
  }

  async getInvite(token: string): Promise<RecommendationInvite> {
    const r = await this.repo.findByToken(token);
    if (!r) throw new NotFoundError("Lien introuvable");
    const holder = await this.profiles.findById(r.profileId);
    return {
      holderName: holder?.fullName ?? "Un professionnel",
      skillName: r.skillName,
      authorName: r.authorName,
      state: this.linkState(r),
    };
  }

  async submit(token: string, input: Omit<SubmitRecommendationInput, "keywords"> & { keywords?: string[] }) {
    const saved = await this.repo.submitByToken(
      token,
      {
        content: input.content,
        authorTitle: input.authorTitle,
        relation: input.relation,
        rating: input.rating,
        keywords: input.keywords,
      },
      this.now().toISOString(),
    );
    if (saved) return saved;
    const existing = await this.repo.findByToken(token);
    if (!existing) throw new NotFoundError("Lien introuvable");
    throw new ConflictError(
      this.linkState(existing) === "expired"
        ? "Ce lien a expiré."
        : "Une recommandation a déjà été envoyée avec ce lien.",
    );
  }

  async moderate(profileId: string, id: string, decision: "APPROVED" | "DECLINED") {
    const updated = await this.repo.moderate(profileId, id, decision);
    if (!updated) throw new NotFoundError("Recommandation introuvable ou déjà traitée");
    return updated;
  }

  async remove(profileId: string, id: string) {
    if (!(await this.repo.remove(profileId, id))) throw new NotFoundError("Recommandation introuvable");
  }
}
