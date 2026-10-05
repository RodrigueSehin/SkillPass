"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/actions/run";
import { createCertificationSchema, updateCertificationSchema } from "@/schemas/portfolio";
import { getCertificationService } from "@/services/container";

async function done<T>(result: T) {
  revalidatePath("/dashboard/certifications");
  revalidatePath("/dashboard");
  return result;
}

export async function addCertificationAction(values: unknown) {
  return done(
    await runAction((userId) =>
      getCertificationService().add(userId, createCertificationSchema.parse(values)),
    ),
  );
}

export async function updateCertificationAction(id: string, values: unknown) {
  return done(
    await runAction((userId) =>
      getCertificationService().update(userId, id, updateCertificationSchema.parse(values)),
    ),
  );
}

/** Used by the full "add" page: returns the new id so the proof file can be attached afterwards. */
export async function createCertificationAction(values: unknown): Promise<{ id?: string; error?: string }> {
  let id: string | undefined;
  const result = await runAction(async (userId) => {
    id = (await getCertificationService().add(userId, createCertificationSchema.parse(values))).id;
  });
  return done({ ...result, id });
}

export async function deleteCertificationAction(id: string) {
  return done(await runAction((userId) => getCertificationService().remove(userId, id)));
}
