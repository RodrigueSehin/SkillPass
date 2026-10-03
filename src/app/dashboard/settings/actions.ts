"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/actions/run";
import { updateProfileSchema } from "@/schemas/profile";
import { getProfileAccountService } from "@/services/container";

export async function updateProfileAction(values: unknown) {
  const result = await runAction((userId) =>
    getProfileAccountService().update(userId, updateProfileSchema.parse(values)),
  );
  if (!result.error) {
    revalidatePath("/dashboard", "layout");
  }
  return result;
}
