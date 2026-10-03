"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireUser } from "@/lib/auth/current-user";
import { AppError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { submitAssessmentSchema } from "@/schemas/verification";
import { getAssessmentService } from "@/services/container";

export interface AssessmentActionResult {
  error?: string;
}

function toMessage(err: unknown) {
  if (err instanceof ZodError) return err.issues[0]?.message ?? "Données invalides";
  if (err instanceof AppError) return err.message;
  console.error("assessment action failed", err);
  return "Une erreur est survenue. Veuillez réessayer.";
}

export async function startAssessmentAction(slug: string): Promise<AssessmentActionResult> {
  const user = await requireUser();
  let attemptId: string;
  try {
    rateLimit(`assessment-start:${user.id}`, 10, 60_000);
    attemptId = (await getAssessmentService().start(user.id, slug)).id;
  } catch (err) {
    return { error: toMessage(err) };
  }
  // redirect() throws by design: keep it outside the try/catch.
  redirect(`/dashboard/assessments/take/${attemptId}`);
}

export async function submitAssessmentAction(
  attemptId: string,
  answers: unknown,
): Promise<AssessmentActionResult> {
  const user = await requireUser();
  try {
    const parsed = submitAssessmentSchema.parse({ answers });
    await getAssessmentService().submit(user.id, attemptId, parsed.answers);
  } catch (err) {
    return { error: toMessage(err) };
  }
  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/assessments/result/${attemptId}`);
}
