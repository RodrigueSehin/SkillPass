"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runAction, type ActionResult } from "@/lib/actions/run";
import { AppError, ForbiddenError } from "@/lib/errors";
import { TALENT_PLAN_CODES, type TalentPlanCode } from "@/lib/plans/entitlements";
import { requireUser } from "@/lib/auth/current-user";
import { isSupabaseConfigured } from "@/lib/auth/env";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { updateProfileSchema } from "@/schemas/profile";
import { passwordChangeSchema, talentNotificationsSchema } from "@/schemas/profile-settings";
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

export async function saveNotificationsAction(values: unknown) {
  const result = await runAction((userId) =>
    getProfileAccountService().saveNotifications(userId, talentNotificationsSchema.parse(values)),
  );
  if (!result.error) revalidatePath("/dashboard/settings");
  return result;
}

export async function setDirectoryAction(inDirectory: boolean) {
  const result = await runAction((userId) =>
    getProfileAccountService().patchPrivacy(userId, { inDirectory: Boolean(inDirectory) }),
  );
  if (!result.error) revalidatePath("/dashboard", "layout");
  return result;
}

export async function setShowLocationAction(showLocation: boolean) {
  const result = await runAction((userId) =>
    getProfileAccountService().patchPrivacy(userId, { showLocation: Boolean(showLocation) }),
  );
  if (!result.error) revalidatePath("/dashboard", "layout");
  return result;
}

export async function setPublicAction(isPublic: boolean) {
  const result = await runAction((userId) => getProfileAccountService().setPublic(userId, Boolean(isPublic)));
  if (!result.error) revalidatePath("/dashboard", "layout");
  return result;
}

/** Changes the password after checking the current one, so a stolen session cannot lock the owner out. */
export async function changePasswordAction(values: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = passwordChangeSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  if (!isSupabaseConfigured())
    return { error: "L'authentification n'est pas configurée sur cet environnement." };
  try {
    rateLimit(`password:${user.id}`, 5, 15 * 60_000);
  } catch (err) {
    if (err instanceof AppError) return { error: err.message };
    throw err;
  }

  const supabase = await createSupabaseServerClient();
  const check = await supabase.auth.signInWithPassword({ email: user.email, password: parsed.data.current });
  if (check.error) return { error: "Le mot de passe actuel est incorrect." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.next });
  if (error) return { error: "Impossible de changer le mot de passe. Réessayez." };
  return {};
}

/** Ends every session of the account, on every device, then asks to sign in again. */
export async function signOutEverywhereAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut({ scope: "global" });
  }
  redirect("/login");
}

/**
 * Switches plan without paying. Only outside production, like the Business plans: it exists so the limits
 * can be tried in demo and development, and is closed as soon as real payments are needed.
 */
export async function changeTalentPlanAction(plan: string): Promise<ActionResult> {
  const result = await runAction(async (userId) => {
    if (process.env.NODE_ENV === "production") {
      throw new ForbiddenError(
        "Le paiement en ligne n'est pas encore ouvert : le changement de plan est indisponible.",
      );
    }
    if (!(TALENT_PLAN_CODES as readonly string[]).includes(plan)) throw new ForbiddenError("Plan inconnu.");
    await getProfileAccountService().setPlan(userId, plan as TalentPlanCode);
  });
  if (!result.error) revalidatePath("/dashboard", "layout");
  return result;
}
