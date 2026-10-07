import { withUser } from "@/lib/api/handler";
import { requireBusiness } from "@/lib/business/context";
import { offersCsv } from "@/lib/business/job-offer-view";
import { ForbiddenError } from "@/lib/errors";
import { getJobOfferService } from "@/services/container";
import { JOB_CONTRACT_LABELS, JOB_STATUS_LABELS, type JobContract } from "@/types/job-offer";

/** The organization's offers as a CSV file, for the people allowed to follow the applications. */
export const GET = withUser(async () => {
  const ctx = await requireBusiness();
  if (!(ctx.can("jobs.applications") || ctx.can("jobs.create") || ctx.can("jobs.edit"))) {
    throw new ForbiddenError("Vous n'avez pas l'autorisation d'exporter les offres.");
  }
  const rows = await getJobOfferService().list(ctx.organization.id);
  const csv = offersCsv(
    rows,
    (s) => JOB_STATUS_LABELS[s],
    (c) => JOB_CONTRACT_LABELS[c as JobContract] ?? c,
  );
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="offres-${ctx.organization.slug}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
});
