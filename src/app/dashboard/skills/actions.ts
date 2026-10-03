"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { createTalentSkillSchema, updateTalentSkillSchema } from "@/schemas/skill";
import { getSkillService } from "@/services/container";

export interface SkillActionResult {
  error?: string;
}

async function run(fn: (userId: string) => Promise<unknown>): Promise<SkillActionResult> {
  const user = await requireUser();
  try {
    await fn(user.id);
    revalidatePath("/dashboard/skills");
    revalidatePath("/dashboard");
    return {};
  } catch (err) {
    if (err instanceof ZodError) return { error: err.issues[0]?.message ?? "Données invalides" };
    if (err instanceof AppError) return { error: err.message };
    console.error("skill action failed", err);
    return { error: "Une erreur est survenue. Veuillez réessayer." };
  }
}

export async function addSkillAction(values: unknown) {
  return run((userId) => getSkillService().add(userId, createTalentSkillSchema.parse(values)));
}

export async function updateSkillAction(id: string, values: unknown) {
  return run((userId) => getSkillService().update(userId, id, updateTalentSkillSchema.parse(values)));
}

export async function deleteSkillAction(id: string) {
  return run((userId) => getSkillService().remove(userId, id));
}
