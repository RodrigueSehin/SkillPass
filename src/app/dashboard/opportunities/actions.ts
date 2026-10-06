"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/actions/run";
import { requireUser } from "@/lib/auth/current-user";
import { AppError } from "@/lib/errors";
import { createJobAlertSchema } from "@/schemas/opportunity";
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
