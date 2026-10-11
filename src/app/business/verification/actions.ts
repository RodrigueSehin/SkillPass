"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireBusiness } from "@/lib/business/context";
import { AppError, ConflictError, ForbiddenError } from "@/lib/errors";
import { getOrganizationService } from "@/services/container";

type Result = { error?: string };

async function asAdmin(fn: (orgId: string) => Promise<unknown>): Promise<Result> {
  const ctx = await requireBusiness({ allowSuspended: true, allowUnverified: true });
  try {
    if (ctx.member.role !== "ADMIN")
      throw new ForbiddenError("Seul un administrateur peut effectuer cette action.");
    await fn(ctx.organization.id);
    revalidatePath("/business", "layout");
    return {};
  } catch (err) {
    if (err instanceof ZodError) return { error: err.issues[0]?.message ?? "Données invalides" };
    if (err instanceof AppError) return { error: err.message };
    console.error("verification action failed", err);
    return { error: "Une erreur est survenue. Veuillez réessayer." };
  }
}

/** What the company writes to help the administrator check it (registration number, official website…). */
export async function saveVerificationNoteAction(note: unknown): Promise<Result> {
  if (typeof note !== "string") return { error: "Texte invalide" };
  return asAdmin((orgId) => getOrganizationService().saveVerificationNote(orgId, note));
}

/** A refused company can ask for a new review once it has completed its information. */
export async function requestReviewAction(): Promise<Result> {
  return asAdmin(async (orgId) => {
    const org = await getOrganizationService().getOrganization(orgId);
    if (org.verificationStatus !== "REJECTED")
      throw new ConflictError("Votre demande est déjà en cours d'examen.");
    await getOrganizationService().setVerification(orgId, "PENDING");
  });
}
