"use server";

import { revalidatePath } from "next/cache";
import { businessAction } from "@/lib/business/action";
import { ForbiddenError } from "@/lib/errors";
import { jobOfferSchema, publishableJobOfferSchema } from "@/schemas/job-offer";
import { getJobOfferService } from "@/services/container";
import type { JobOfferInput } from "@/types/job-offer";

const refresh = () => {
  revalidatePath("/business", "layout");
  // The talent job board shows the published offers.
  revalidatePath("/dashboard/opportunities", "layout");
};

/** Creating or editing an offer needs the right to create offers or to modify them. */
const canWrite = (can: (p: string) => boolean) => can("jobs.create") || can("jobs.edit");

/** Saves an offer as a draft, or publishes it. Publishing needs a complete offer. */
export async function saveJobOfferAction(
  id: string | null,
  values: unknown,
  publish: boolean,
): Promise<{ id?: string; error?: string }> {
  const result = await businessAction(null, async (ctx) => {
    if (!canWrite(ctx.can) || (publish && !ctx.can("jobs.create"))) {
      throw new ForbiddenError("Vous n'avez pas l'autorisation de publier des offres.");
    }
    const input = (publish ? publishableJobOfferSchema : jobOfferSchema).parse(values) as JobOfferInput;
    const offer = await getJobOfferService().save(ctx, id, input, publish, ctx.member.id);
    return offer.id;
  });
  refresh();
  return result.error ? { error: result.error } : { id: result.data };
}

export async function publishJobOfferAction(id: string) {
  const result = await businessAction("jobs.create", (ctx) => getJobOfferService().publish(ctx, id));
  refresh();
  return result.error ? { error: result.error } : {};
}

export async function closeJobOfferAction(id: string) {
  const result = await businessAction(null, async (ctx) => {
    if (!canWrite(ctx.can))
      throw new ForbiddenError("Vous n'avez pas l'autorisation de modifier des offres.");
    return getJobOfferService().close(ctx, id);
  });
  refresh();
  return result.error ? { error: result.error } : {};
}

export async function duplicateJobOfferAction(id: string) {
  const result = await businessAction("jobs.create", (ctx) =>
    getJobOfferService().duplicate(ctx, id, ctx.member.id),
  );
  refresh();
  return result.error !== undefined ? { error: result.error } : { id: result.data.id };
}

export async function deleteJobOfferAction(id: string) {
  const result = await businessAction("jobs.delete", (ctx) => getJobOfferService().remove(ctx, id));
  refresh();
  return result.error ? { error: result.error } : {};
}
