"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runAction, type ActionResult } from "@/lib/actions/run";
import { AppError } from "@/lib/errors";
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
