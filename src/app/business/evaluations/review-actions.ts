"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { businessAction } from "@/lib/business/action";
import { getEvaluationAttemptService } from "@/services/container";

const reviewSchema = z.record(z.string().max(64), z.coerce.number().min(0).max(100));

/** Scores the open questions of a candidate's attempt and releases the result. */
export async function reviewAttemptAction(attemptId: string, points: unknown): Promise<{ error?: string }> {
  const result = await businessAction("evaluations.results", async (ctx) =>
    getEvaluationAttemptService().review(ctx, attemptId, reviewSchema.parse(points)),
  );
  revalidatePath("/business/evaluations", "layout");
  return result.error ? { error: result.error } : {};
}
