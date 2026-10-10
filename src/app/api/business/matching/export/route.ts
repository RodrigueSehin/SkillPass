import { withUser } from "@/lib/api/handler";
import { requireBusiness } from "@/lib/business/context";
import { matchingCsv } from "@/lib/business/matching-csv";
import { planHasMatching } from "@/lib/business/plans";
import { ForbiddenError } from "@/lib/errors";
import { getTalentDirectoryRepository } from "@/repositories";
import { getJobOfferService, getMatchingService } from "@/services/container";

/** The saved talents as a CSV file. Public profile data only: no e-mail, no phone. */
export const GET = withUser(async () => {
  const ctx = await requireBusiness();
  if (!ctx.can("talents.export") || !planHasMatching(ctx.organization.plan))
    throw new ForbiddenError("Vous n'avez pas l'autorisation d'exporter les profils.");
  const matching = getMatchingService();
  const [saved, records, offers] = await Promise.all([
    matching.listSaved(ctx.organization.id),
    getTalentDirectoryRepository().listPublic(500),
    getJobOfferService().list(ctx.organization.id),
  ]);
  await matching.record(ctx, {
    type: "EXPORT",
    title: "Export des correspondances sauvegardées",
    subtitle: `${saved.length} talent${saved.length > 1 ? "s" : ""}`,
    results: saved.length,
    query: null,
    profileId: null,
  });
  return new Response(matchingCsv(saved, records, offers), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="talents-${ctx.organization.slug}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
});
