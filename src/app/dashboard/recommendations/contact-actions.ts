"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/actions/run";
import { requireUser } from "@/lib/auth/current-user";
import { AppError } from "@/lib/errors";
import { createContactSchema } from "@/schemas/contact";
import { getContactService } from "@/services/container";

/** Adds a person to the address book. Returns the new id so the form can select it. */
export async function addContactAction(values: unknown): Promise<{ id?: string; error?: string }> {
  const user = await requireUser();
  try {
    const created = await getContactService().add(user.id, createContactSchema.parse(values));
    revalidatePath("/dashboard/recommendations/new");
    return { id: created.id };
  } catch (err) {
    if (err instanceof AppError) return { error: err.message };
    if (err instanceof Error && err.name === "ZodError") {
      return {
        error:
          (err as unknown as { issues: { message: string }[] }).issues[0]?.message ?? "Données invalides",
      };
    }
    console.error("add contact failed", err);
    return { error: "Une erreur est survenue. Veuillez réessayer." };
  }
}

export async function deleteContactAction(id: string) {
  const result = await runAction((userId) => getContactService().remove(userId, id));
  revalidatePath("/dashboard/recommendations/new");
  return result;
}
