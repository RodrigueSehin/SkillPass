"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/actions/run";
import { requireUser } from "@/lib/auth/current-user";
import { AppError } from "@/lib/errors";
import { applyToOpportunitySchema, createJobAlertSchema } from "@/schemas/opportunity";
import { getOpportunityService } from "@/services/container";

export async function toggleSaveOpportunityAction(id: string): Promise<ActionResult & { saved?: boolean }> {
  const user = await requireUser();
  try {
    const saved = await getOpportunityService().toggleSave(user.id, id);
    revalidatePath("/dashboard/opportunities");
    return { saved };
  } catch (err) {
    if (err instanceof AppError) return { error: err.message };
    console.error("toggle save failed", err);
    return { error: "Une erreur est survenue. Veuillez réessayer." };
  }
}

export async function createJobAlertAction(values: unknown) {
  const result = await runAction((userId) =>
    getOpportunityService().createAlert(userId, createJobAlertSchema.parse(values)),
  );
  revalidatePath("/dashboard/opportunities");
  return result;
}

export async function deleteJobAlertAction(id: string) {
  const result = await runAction((userId) => getOpportunityService().removeAlert(userId, id));
  revalidatePath("/dashboard/opportunities");
  return result;
}

/** Applies with the SkillPass profile. */
export async function applyToOpportunityAction(
  id: string,
  values: unknown,
): Promise<ActionResult & { applied?: boolean }> {
  const user = await requireUser();
  try {
    const { message } = applyToOpportunitySchema.parse(values);
    await getOpportunityService().apply(user.id, id, message);
    revalidatePath("/dashboard/opportunities", "layout");
    return { applied: true };
  } catch (err) {
    if (err instanceof AppError) return { error: err.message };
    if (err instanceof Error && err.name === "ZodError") {
      return {
        error:
          (err as unknown as { issues: { message: string }[] }).issues[0]?.message ?? "Données invalides",
      };
    }
    console.error("apply failed", err);
    return { error: "Une erreur est survenue. Veuillez réessayer." };
  }
}
