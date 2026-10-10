"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { businessAction } from "@/lib/business/action";
import type { BusinessContext } from "@/lib/business/context";
import { matchTalents } from "@/lib/business/matching";
import {
  applyRefinement,
  parseMatchSearch,
  parseRefinement,
  refineOffer,
  runSearch,
  searchQuery,
  searchSubtitle,
  searchTitle,
} from "@/lib/business/matching-view";
import { planHasMatching } from "@/lib/business/plans";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { getTalentDirectoryRepository } from "@/repositories";
import { getJobOfferService, getMatchingService } from "@/services/container";

const DIRECTORY_LIMIT = 500;

/** Matching is part of the Pro plan and above, whatever the member's permissions. */
function requirePlan(ctx: BusinessContext) {
  if (!planHasMatching(ctx.organization.plan))
    throw new ForbiddenError("Le matching n'est pas inclus dans votre plan.");
}

const toRaw = (form: FormData) => {
  const raw: Record<string, string[]> = {};
  for (const [key, value] of form.entries()) if (typeof value === "string") (raw[key] ??= []).push(value);
  return raw;
};

/** Runs the search form: records it in the history, then shows the results as a plain link. */
export async function searchAction(form: FormData) {
  const search = parseMatchSearch(toRaw(form));
  const result = await businessAction("talents.view", async (ctx) => {
    requirePlan(ctx);
    const [records, offers] = await Promise.all([
      getTalentDirectoryRepository().listPublic(DIRECTORY_LIMIT),
      getJobOfferService().list(ctx.organization.id),
    ]);
    const offer = offers.find((o) => o.id === search.offerId);
    const hits = runSearch(records, search, offer);
    const query = searchQuery(search);
    await getMatchingService().record(ctx, {
      type: "SEARCH",
      title: searchTitle(search, offer),
      subtitle: searchSubtitle(search, offer),
      results: hits.length,
      query,
      profileId: null,
    });
    return query;
  });
  revalidatePath("/business/matching");
  redirect(`/business/matching${result.data ? `?${result.data}` : ""}`);
}

/** Re-runs the analysis of one offer with the member's refinements and records it. */
export async function recommendAction(form: FormData) {
  const raw = toRaw(form);
  const offerId = raw.offre?.[0] ?? "";
  const refinement = parseRefinement(raw);
  const params = new URLSearchParams({ tab: "recommandations", offre: offerId });
  if (refinement.minYears) params.set("years", String(refinement.minYears));
  for (const s of refinement.skills) params.append("skill", s);
  if (refinement.location) params.set("location", refinement.location);
  await businessAction("talents.recommendations", async (ctx) => {
    requirePlan(ctx);
    const offer = (await getJobOfferService().list(ctx.organization.id)).find((o) => o.id === offerId);
    if (!offer) throw new NotFoundError("Offre introuvable");
    const records = await getTalentDirectoryRepository().listPublic(DIRECTORY_LIMIT);
    const matches = applyRefinement(matchTalents(refineOffer(offer, refinement), records), refinement);
    await getMatchingService().record(ctx, {
      type: "RECOMMENDATION",
      title: offer.title,
      subtitle: [offer.contract, offer.location].filter(Boolean).join(" · "),
      results: matches.length,
      query: params.toString(),
      profileId: null,
    });
  });
  revalidatePath("/business/matching");
  redirect(`/business/matching?${params.toString()}`);
}

export async function saveMatchAction(username: string, jobOfferId: string | null, match: number | null) {
  const result = await businessAction("talents.shortlist", async (ctx) => {
    requirePlan(ctx);
    await getMatchingService().save(ctx, username, { jobOfferId, match });
  });
  revalidatePath("/business/matching");
  return result.error ? { error: result.error } : {};
}

export async function unsaveMatchAction(username: string) {
  const result = await businessAction("talents.shortlist", async (ctx) => {
    requirePlan(ctx);
    await getMatchingService().removeSavedByUsername(ctx.organization.id, username);
  });
  revalidatePath("/business/matching");
  return result.error ? { error: result.error } : {};
}

export async function setMatchStatusAction(id: string, status: string) {
  const result = await businessAction("talents.shortlist", async (ctx) => {
    requirePlan(ctx);
    await getMatchingService().setStatus(ctx.organization.id, id, status);
  });
  revalidatePath("/business/matching");
  return result.error ? { error: result.error } : {};
}

/** Removes the ticked talents from the saved list (plain form, works without JavaScript). */
export async function removeSavedAction(form: FormData) {
  const ids = form.getAll("id").filter((v): v is string => typeof v === "string");
  await businessAction("talents.shortlist", async (ctx) => {
    requirePlan(ctx);
    await getMatchingService().removeSaved(ctx.organization.id, ids.slice(0, 200));
  });
  revalidatePath("/business/matching");
  redirect("/business/matching?tab=sauvegardes");
}
