import { ZodError } from "zod";
import { AppError, ForbiddenError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { requireBusiness, type BusinessContext } from "./context";

export type BizResult<T = undefined> = { error: string; data?: undefined } | { error?: undefined; data: T };

/**
 * Runs a Business server action as the signed-in member: checks the permission, maps failures to safe
 * messages and rate-limits writes per person.
 */
export async function businessAction<T>(
  permission: string | null,
  fn: (ctx: BusinessContext) => Promise<T>,
): Promise<BizResult<T>> {
  const ctx = await requireBusiness();
  try {
    rateLimit(`business:${ctx.user.id}`, 60, 60_000);
    if (ctx.member.status !== "ACTIVE") throw new ForbiddenError("Votre compte est désactivé.");
    if (permission && !ctx.can(permission))
      throw new ForbiddenError("Vous n'avez pas l'autorisation d'effectuer cette action.");
    return { data: await fn(ctx) };
  } catch (err) {
    if (err instanceof ZodError) return { error: err.issues[0]?.message ?? "Données invalides" };
    if (err instanceof AppError) return { error: err.message };
    console.error("business action failed", err);
    return { error: "Une erreur est survenue. Veuillez réessayer." };
  }
}
