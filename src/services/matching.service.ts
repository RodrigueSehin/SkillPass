import { NotFoundError } from "@/lib/errors";
import type { JobOfferRepository } from "@/repositories/job-offer.repository";
import type { MatchingRepository } from "@/repositories/matching.repository";
import type { TalentDirectoryRepository } from "@/repositories/talent-directory.repository";
import type { OrgScope } from "./organization.service";
import { MATCH_STATUSES, type MatchEventInput, type MatchStatus } from "@/types/matching";

const clip = (s: string, n: number) => s.trim().slice(0, n);

/** Saved talents and history of one organization. Only public talent profiles can be saved. */
export class MatchingService {
  constructor(
    private readonly repo: MatchingRepository,
    private readonly directory: TalentDirectoryRepository,
    private readonly offers: JobOfferRepository,
  ) {}

  listSaved(orgId: string) {
    return this.repo.listSaved(orgId);
  }

  /** Saves the talent (by public username) for the organization; saving twice keeps the first save. */
  async save(scope: OrgScope, username: string, input: { jobOfferId: string | null; match: number | null }) {
    const orgId = scope.organization.id;
    const detail = await this.directory.detail(username);
    if (!detail) throw new NotFoundError("Profil introuvable ou non public");
    const offer = input.jobOfferId ? await this.offers.get(orgId, input.jobOfferId) : null;
    const match =
      input.match === null || !Number.isFinite(input.match)
        ? null
        : Math.max(0, Math.min(100, Math.round(input.match)));
    const saved = await this.repo.save(orgId, {
      profileId: detail.record.id,
      jobOfferId: offer?.id ?? null,
      match,
      savedById: scope.member.id,
    });
    await this.record(scope, {
      type: "SAVE",
      title: detail.record.fullName,
      subtitle: detail.record.profession ?? detail.record.headline ?? "",
      results: null,
      query: null,
      profileId: detail.record.id,
    });
    return saved;
  }

  async setStatus(orgId: string, id: string, status: string) {
    if (!(MATCH_STATUSES as readonly string[]).includes(status)) throw new NotFoundError("Statut inconnu");
    const updated = await this.repo.setStatus(orgId, id, status as MatchStatus);
    if (!updated) throw new NotFoundError("Correspondance introuvable");
    return updated;
  }

  removeSaved(orgId: string, ids: string[]) {
    return this.repo.removeSaved(orgId, ids);
  }

  removeSavedByUsername = async (orgId: string, username: string) => {
    const detail = await this.directory.detail(username);
    if (!detail) return false;
    return this.repo.removeSavedByProfile(orgId, detail.record.id);
  };

  /** Writes one line of the history. Free text is clipped so a crafted search cannot bloat the table. */
  record(scope: OrgScope, event: Omit<MatchEventInput, "memberId">) {
    return this.repo.addEvent(scope.organization.id, {
      ...event,
      title: clip(event.title, 160) || "—",
      subtitle: clip(event.subtitle, 200),
      query: event.query ? clip(event.query, 600) : null,
      memberId: scope.member.id,
    });
  }

  listEvents(orgId: string, since: string, limit = 500) {
    return this.repo.listEvents(orgId, since, limit);
  }
}
