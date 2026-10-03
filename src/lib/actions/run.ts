import { ZodError } from "zod";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";

export interface ActionResult {
  error?: string;
}

/** Runs a server action as the authenticated user and converts failures to safe messages. */
export async function runAction(fn: (userId: string) => Promise<unknown>): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await fn(user.id);
    return {};
  } catch (err) {
    if (err instanceof ZodError) return { error: err.issues[0]?.message ?? "Données invalides" };
    if (err instanceof AppError) return { error: err.message };
    console.error("server action failed", err);
    return { error: "Une erreur est survenue. Veuillez réessayer." };
  }
}
