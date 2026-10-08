"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/current-user";
import { profileFor } from "@/lib/auth/profile";
import { AppError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { getEvaluationAttemptService } from "@/services/container";
import { ZodError } from "zod";

function message(err: unknown) {
  if (err instanceof ZodError) return "Réponses invalides.";
  if (err instanceof AppError) return err.message;
  console.error("evaluation action failed", err);
  return "Une erreur est survenue. Veuillez réessayer.";
}

/** Starts the attempt of the signed-in candidate, or resumes the one still running. */
export async function startEvaluationAction(token: string): Promise<{ attemptId?: string; error?: string }> {
  const user = await requireUser();
  try {
    rateLimit(`evaluation-start:${user.id}`, 20, 60_000);
    const profile = await profileFor(user);
    const attemptId = await getEvaluationAttemptService().start(token, profile);
    return { attemptId };
  } catch (err) {
    return { error: message(err) };
  }
}

export async function submitEvaluationAction(
  attemptId: string,
  responses: unknown,
): Promise<{ error?: string }> {
  const user = await requireUser();
  try {
    rateLimit(`evaluation-submit:${user.id}`, 20, 60_000);
    await getEvaluationAttemptService().submit(attemptId, user.id, responses);
    revalidatePath("/business/evaluations");
    return {};
  } catch (err) {
    return { error: message(err) };
  }
}
