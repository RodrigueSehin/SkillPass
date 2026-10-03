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

export async function addProjectAction(values: unknown) {
  return done(
    await runAction((userId) => getProjectService().add(userId, createProjectSchema.parse(values))),
  );
}

export async function updateProjectAction(id: string, values: unknown) {
  return done(
    await runAction((userId) => getProjectService().update(userId, id, updateProjectSchema.parse(values))),
  );
}

export async function deleteProjectAction(id: string) {
  return done(await runAction((userId) => getProjectService().remove(userId, id)));
}
