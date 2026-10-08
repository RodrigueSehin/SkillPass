import { ConflictError } from "@/lib/errors";
import type { StorageService } from "@/lib/storage/storage";
import type { EvaluationRepository } from "@/repositories/evaluation.repository";
import type { JobOfferRepository } from "@/repositories/job-offer.repository";
import type { JobOfferService } from "./job-offer.service";
import type { OpportunityRepository } from "@/repositories/opportunity.repository";
import type { OrgSkillRepository } from "@/repositories/org-skill.repository";
import type { OrganizationService, OrgScope } from "./organization.service";

/** What leaves with an export: readable data of the organization, never secrets (invitation links, tokens). */
export interface OrganizationExport {
  exportedAt: string;
  organization: Record<string, unknown>;
  members: Record<string, unknown>[];
  sites: unknown[];
  departments: unknown[];
  jobOffers: unknown[];
  evaluations: unknown[];
  evaluationResults: unknown[];
  skills: unknown[];
}

const EXPORT_ATTEMPTS = 100_000;

/** The end of an organization's life, and what it takes with it. */
export class OrganizationLifecycleService {
  constructor(
    private readonly orgs: OrganizationService,
    private readonly offers: JobOfferRepository,
    private readonly offerService: JobOfferService,
    private readonly opportunities: OpportunityRepository,
    private readonly evaluations: EvaluationRepository,
    private readonly skills: OrgSkillRepository,
    private readonly storage: () => StorageService,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Closes the organization to its members and takes its offers off the talent job board. */
  async suspend(scope: OrgScope) {
    await this.orgs.setDeactivated(scope.organization.id, true);
    await this.offerService.takeOffBoard(scope.organization.id);
  }

  /** Reopens the organization and puts its published offers back on the job board. */
  async resume(scope: OrgScope) {
    await this.orgs.setDeactivated(scope.organization.id, false);
    await this.offerService.putBackOnBoard({
      ...scope,
      organization: { ...scope.organization, deactivated: false },
    });
  }

  /** Deletes the organization, takes its offers off the talent job board and removes its logo file. */
  async deleteOrganization(scope: OrgScope, typedName: string) {
    // The same check as the service does, before anything is touched.
    if (typedName.trim() !== scope.organization.name) {
      throw new ConflictError("Le nom saisi ne correspond pas au nom de l'organisation.");
    }
    const offers = await this.offers.list(scope.organization.id);
    for (const offer of offers) await this.opportunities.deactivateFromOffer(offer.id);
    const removed = await this.orgs.deleteOrganization(scope, typedName);
    if (removed.logoPath) {
      await this.storage()
        .remove(removed.logoPath)
        .catch(() => undefined);
    }
  }

  async exportData(scope: OrgScope): Promise<OrganizationExport> {
    const orgId = scope.organization.id;
    const [members, sites, departments, offers, evaluations, attempts, skills] = await Promise.all([
      this.orgs.listMembers(orgId),
      this.orgs.listSites(orgId),
      this.orgs.listDepartments(orgId),
      this.offers.list(orgId),
      this.evaluations.list(orgId),
      this.evaluations.listAttempts(orgId, EXPORT_ATTEMPTS),
      this.skills.list(orgId),
    ]);
    const { logoVersion, ...organization } = scope.organization;
    void logoVersion;
    return {
      exportedAt: this.now().toISOString(),
      organization,
      members: members.map((m) => ({
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        email: m.email,
        phone: m.phone,
        jobTitle: m.jobTitle,
        role: m.role,
        status: m.status,
        permissions: m.permissions,
        createdAt: m.createdAt,
      })),
      sites,
      departments,
      jobOffers: offers,
      evaluations,
      evaluationResults: attempts.map((a) => ({
        id: a.id,
        evaluationId: a.evaluationId,
        candidate: a.candidateName,
        score: a.score,
        passed: a.passed,
        status: a.status,
        submittedAt: a.submittedAt,
      })),
      skills,
    };
  }
}
