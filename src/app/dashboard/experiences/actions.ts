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

/** Used by the full "add" page: returns the new id so attachments can be uploaded afterwards. */
export async function createExperienceAction(values: unknown): Promise<{ id?: string; error?: string }> {
  let id: string | undefined;
  const result = await runAction(async (userId) => {
    id = (await getExperienceService().add(userId, createExperienceSchema.parse(values))).id;
  });
  return done({ ...result, id });
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
