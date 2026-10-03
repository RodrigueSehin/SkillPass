"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/actions/run";
import { createExperienceSchema, updateExperienceSchema } from "@/schemas/portfolio";
import { getExperienceService } from "@/services/container";

async function done<T>(result: T) {
  revalidatePath("/dashboard/experiences");
  revalidatePath("/dashboard");
  return result;
}

export async function addExperienceAction(values: unknown) {
  return done(
    await runAction((userId) => getExperienceService().add(userId, createExperienceSchema.parse(values))),
  );
}

export async function updateExperienceAction(id: string, values: unknown) {
  return done(
    await runAction((userId) =>
      getExperienceService().update(userId, id, updateExperienceSchema.parse(values)),
    ),
  );
}

export async function deleteExperienceAction(id: string) {
  return done(await runAction((userId) => getExperienceService().remove(userId, id)));
}
