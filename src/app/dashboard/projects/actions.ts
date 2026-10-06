"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/actions/run";
import { createProjectSchema, updateProjectSchema } from "@/schemas/portfolio";
import { getProjectService } from "@/services/container";

async function done<T>(result: T) {
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard");
  return result;
}

export async function addProjectAction(values: unknown): Promise<{ id?: string; error?: string }> {
  let id: string | undefined;
  const result = await runAction(async (userId) => {
    id = (await getProjectService().add(userId, createProjectSchema.parse(values))).id;
  });
  return done({ ...result, id });
}

export async function updateProjectAction(id: string, values: unknown) {
  return done(
    await runAction((userId) => getProjectService().update(userId, id, updateProjectSchema.parse(values))),
  );
}

export async function deleteProjectAction(id: string) {
  return done(await runAction((userId) => getProjectService().remove(userId, id)));
}
