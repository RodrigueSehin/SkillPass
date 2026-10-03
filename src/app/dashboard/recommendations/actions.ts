"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/actions/run";
import { requireUser } from "@/lib/auth/current-user";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { appUrl } from "@/lib/utils/app-url";
import { requestRecommendationSchema } from "@/schemas/verification";
import { getRecommendationService } from "@/services/container";

export interface RequestRecommendationResult {
  error?: string;
  link?: string;
}

export async function requestRecommendationAction(values: unknown): Promise<RequestRecommendationResult> {
  const user = await requireUser();
  try {
    rateLimit(`reco-request:${user.id}`, 10, 60_000);
    const created = await getRecommendationService().request(
      user.id,
      requestRecommendationSchema.parse(values),
    );
    revalidatePath("/dashboard/recommendations");
    return { link: `${appUrl()}/recommend/${created.token}` };
  } catch (err) {
    if (err instanceof ZodError) return { error: err.issues[0]?.message ?? "Données invalides" };
    if (err instanceof AppError) return { error: err.message };
    console.error("recommendation request failed", err);
    return { error: "Une erreur est survenue. Veuillez réessayer." };
  }
}

export async function moderateRecommendationAction(id: string, decision: "APPROVED" | "DECLINED") {
  const result = await runAction((userId) => getRecommendationService().moderate(userId, id, decision));
  revalidatePath("/dashboard", "layout");
  return result;
}

export async function deleteRecommendationAction(id: string) {
  const result = await runAction((userId) => getRecommendationService().remove(userId, id));
  revalidatePath("/dashboard", "layout");
  return result;
}
