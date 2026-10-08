import { displayStatus, toOpportunityInput } from "@/lib/business/job-offer-mapping";
import { PLANS } from "@/lib/business/plans";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type { JobOfferRepository } from "@/repositories/job-offer.repository";
import type { OpportunityRepository } from "@/repositories/opportunity.repository";
import type { OrganizationRepository } from "@/repositories/organization.repository";
import { publishableJobOfferSchema } from "@/schemas/job-offer";
import type { JobOfferDTO, JobOfferInput, JobOfferRow } from "@/types/job-offer";
import type { OrgScope } from "./organization.service";

const asInput = (o: JobOfferDTO): JobOfferInput => {
  const {
    id: _id,
    status: _status,
    opportunityId: _opportunity,
    createdById: _creator,
    publishedAt: _published,
    createdAt: _created,
    ...input
  } = o;
  void [_id, _status, _opportunity, _creator, _published, _created];
  return input;
};

/** Job offers of an organization, and their copy on the talent job board. */
export class JobOfferService {
  constructor(
    private readonly offers: JobOfferRepository,
    private readonly opportunities: OpportunityRepository,
    private readonly orgs: OrganizationRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private today() {
    return this.now().toISOString().slice(0, 10);
  }

  /** Offers with their display status and the views and applicants measured on the talent side. */
  async list(orgId: string): Promise<JobOfferRow[]> {
    const offers = await this.offers.list(orgId);
    const stats = await this.opportunities.statsFor(
      offers.flatMap((o) => (o.opportunityId ? [o.opportunityId] : [])),
    );
    const today = this.today();
    return offers.map((o) => ({
      ...o,
      displayStatus: displayStatus(o, today),
      applicants: (o.opportunityId && stats.get(o.opportunityId)?.applicants) || 0,
      views: (o.opportunityId && stats.get(o.opportunityId)?.views) || 0,
    }));
  }

  async get(orgId: string, id: string) {
    const offer = await this.offers.get(orgId, id);
    if (!offer) throw new NotFoundError("Offre introuvable");
    return offer;
  }

  /** Puts the offer on the talent job board, or takes it off, according to its current state. */
  private async sync(scope: OrgScope, offer: JobOfferDTO) {
    // The board itself hides an offer before its publication date and after its deadline.
    const onBoard =
      offer.status === "PUBLISHED" && offer.visibility === "PUBLIC" && offer.channels.includes("PLATFORM");
    if (!onBoard) {
      await this.opportunities.deactivateFromOffer(offer.id);
      return offer;
    }
    const opportunityId = await this.opportunities.upsertFromOffer(
      offer.id,
      toOpportunityInput(offer, scope.organization, this.now()),
    );
    return offer.opportunityId === opportunityId
      ? offer
      : ((await this.offers.setPublication(scope.organization.id, offer.id, {
          status: offer.status,
          opportunityId,
          publishedAt: offer.publishedAt,
        })) ?? offer);
  }

  private async assertDepartment(orgId: string, departmentId: string | null | undefined) {
    if (!departmentId) return;
    if (!(await this.orgs.getDepartment(orgId, departmentId)))
      throw new NotFoundError("Département introuvable");
  }

  /** Offers that went live this calendar month: what the plan limits. */
  async publishedThisMonth(orgId: string) {
    const prefix = this.now().toISOString().slice(0, 7);
    return (await this.offers.list(orgId)).filter((o) => o.publishedAt?.startsWith(prefix)).length;
  }

  private async assertPlanAllowsPublishing(scope: OrgScope, offer: JobOfferDTO | null) {
    if (offer?.publishedAt) return; // already counted
    const limit = PLANS[scope.organization.plan].maxJobsPerMonth;
    if (limit !== null && (await this.publishedThisMonth(scope.organization.id)) >= limit) {
      throw new ForbiddenError(
        `Votre plan ${PLANS[scope.organization.plan].name} est limité à ${limit} offres publiées par mois.`,
      );
    }
  }

  /**
   * Creates or updates an offer. With `publish` it goes live (the caller has validated it with the publishable
   * schema); without, a draft stays a draft and a published offer stays published.
   */
  async save(
    scope: OrgScope,
    id: string | null,
    input: JobOfferInput,
    publish: boolean,
    createdById: string | null,
  ) {
    const orgId = scope.organization.id;
    await this.assertDepartment(orgId, input.departmentId);
    let offer = id ? await this.get(orgId, id) : null;
    if (publish) await this.assertPlanAllowsPublishing(scope, offer);

    const saved = offer
      ? await this.offers.update(orgId, offer.id, input)
      : await this.offers.create(orgId, input, createdById);
    if (!saved) throw new NotFoundError("Offre introuvable");
    offer = saved;

    if (publish || offer.status === "PUBLISHED") {
      const publishedAt =
        offer.publishedAt ??
        (offer.publishOn
          ? new Date(`${offer.publishOn}T08:00:00.000Z`).toISOString()
          : this.now().toISOString());
      offer =
        (await this.offers.setPublication(orgId, offer.id, {
          status: "PUBLISHED",
          opportunityId: offer.opportunityId,
          publishedAt,
        })) ?? offer;
      return this.sync(scope, offer);
    }
    return offer;
  }

  /** Publishes a draft from the list: it must be complete enough to be read and applied to. */
  async publish(scope: OrgScope, id: string) {
    const offer = await this.get(scope.organization.id, id);
    if (offer.status === "PUBLISHED") throw new ConflictError("Cette offre est déjà publiée.");
    const parsed = publishableJobOfferSchema.parse(asInput(offer));
    return this.save(scope, id, parsed as JobOfferInput, true, offer.createdById);
  }

  async close(scope: OrgScope, id: string) {
    const orgId = scope.organization.id;
    const offer = await this.get(orgId, id);
    await this.opportunities.deactivateFromOffer(offer.id);
    const closed = await this.offers.setPublication(orgId, id, {
      status: "CLOSED",
      opportunityId: offer.opportunityId,
      publishedAt: offer.publishedAt,
    });
    if (!closed) throw new NotFoundError("Offre introuvable");
    return closed;
  }

  async duplicate(scope: OrgScope, id: string, createdById: string | null) {
    const offer = await this.get(scope.organization.id, id);
    const input = asInput(offer);
    return this.offers.create(
      scope.organization.id,
      { ...input, title: `Copie de ${input.title}`.slice(0, 100), deadline: null, publishOn: null },
      createdById,
    );
  }

  async remove(scope: OrgScope, id: string) {
    const removed = await this.offers.delete(scope.organization.id, id);
    if (!removed) throw new NotFoundError("Offre introuvable");
    await this.opportunities.deactivateFromOffer(removed.id);
  }

  /** Hides every offer of the organization from the talent job board, as when it is suspended. */
  async takeOffBoard(orgId: string) {
    for (const offer of await this.offers.list(orgId)) await this.opportunities.deactivateFromOffer(offer.id);
  }

  /** Puts the published offers back on the job board once the organization is reactivated. */
  async putBackOnBoard(scope: OrgScope) {
    for (const offer of await this.offers.list(scope.organization.id)) {
      if (offer.status === "PUBLISHED") await this.sync(scope, offer);
    }
  }
}
