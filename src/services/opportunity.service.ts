import { NotFoundError } from "@/lib/errors";
import type {
  JobAlertRepository,
  OpportunityRepository,
  SavedOpportunityRepository,
} from "@/repositories/opportunity.repository";
import type { CreateJobAlertInput } from "@/schemas/opportunity";
import {
  OPPORTUNITY_KIND_LABELS,
  OPPORTUNITY_LEVEL_LABELS,
  OPPORTUNITY_REGION_LABELS,
} from "@/types/opportunity";

const label = (map: Record<string, string>, key: string | undefined) => (key ? (map[key] ?? key) : undefined);

/** Default name of an alert: what it looks for, e.g. "Emploi · Tech & Digital". */
export function alertName(input: CreateJobAlertInput) {
  const parts = [
    label(OPPORTUNITY_KIND_LABELS, input.kind),
    label(OPPORTUNITY_REGION_LABELS, input.region),
    input.domain,
    label(OPPORTUNITY_LEVEL_LABELS, input.level),
    input.query ? `« ${input.query} »` : undefined,
  ].filter(Boolean);
  return parts.join(" · ") || "Mon alerte";
}

export class OpportunityService {
  constructor(
    private readonly offers: OpportunityRepository,
    private readonly saved: SavedOpportunityRepository,
    private readonly alerts: JobAlertRepository,
  ) {}

  list() {
    return this.offers.list();
  }

  savedIds(profileId: string) {
    return this.saved.listIds(profileId);
  }

  async toggleSave(profileId: string, opportunityId: string) {
    const state = await this.saved.toggle(profileId, opportunityId);
    if (state === null) throw new NotFoundError("Offre introuvable");
    return state;
  }

  listAlerts(profileId: string) {
    return this.alerts.list(profileId);
  }

  createAlert(profileId: string, input: CreateJobAlertInput) {
    return this.alerts.create(profileId, { ...input, name: input.name ?? alertName(input) });
  }

  async removeAlert(profileId: string, id: string) {
    if (!(await this.alerts.remove(profileId, id))) throw new NotFoundError("Alerte introuvable");
  }
}
