"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { isSupabaseConfigured } from "@/lib/auth/env";
import { REMEMBER_COOKIE } from "@/lib/auth/remember";
import { forgotPasswordSchema, loginSchema, registerSchema } from "@/schemas/auth";
import { ensureProfile } from "@/services/profile.service";

export interface ActionState {
  error?: string;
  success?: string;
}

const NOT_CONFIGURED: ActionState = {
  error: "L'authentification n'est pas configurée sur cet environnement.",
};

/** Only same-origin relative paths are allowed, to prevent open redirects. */
function safeNextPath(next: FormDataEntryValue | null | undefined) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

async function appOrigin() {
  const h = await headers();
  return process.env.NEXT_PUBLIC_APP_URL ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };

  // Unticked box = session cookies only. The choice is kept in a cookie so token refreshes honour it.
  const remember = formData.get("remember") === "on";
  const cookieStore = await cookies();
  if (remember) cookieStore.delete(REMEMBER_COOKIE);
  else
    cookieStore.set(REMEMBER_COOKIE, "0", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

  const supabase = await createSupabaseServerClient({ remember });
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "E-mail ou mot de passe incorrect." };

  redirect(safeNextPath(formData.get("next")));
}

export async function registerAction(values: unknown): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const data = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data: signUp, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${await appOrigin()}/auth/callback`,
      data: { full_name: data.fullName },
    },
  });
  if (error || !signUp.user) {
    return { error: "Impossible de créer le compte. Vérifiez vos informations et réessayez." };
  }

  try {
    await ensureProfile({
      id: signUp.user.id,
      email: data.email,
      fullName: data.fullName,
      profession: data.profession,
      location: data.location,
      yearsOfExperience: data.yearsOfExperience,
      careerGoal: data.careerGoal,
      availability: data.availability,
    });
  } catch (err) {
    // The account exists; the profile is re-created on first sign-in (auth callback).
    console.error("registerAction: profile creation failed", err);
  }

  // With "Confirm email" turned off in Supabase, signUp already returns a session: go straight in.
  redirect(signUp.session ? "/dashboard" : "/verify-email");
}

export async function forgotPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Adresse e-mail invalide" };

  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await appOrigin()}/auth/callback?next=/dashboard/settings`,
  });
  // Same answer whether or not the account exists: avoids user enumeration.
  return {
    success: "Si un compte existe pour cette adresse, un lien de réinitialisation vient d'être envoyé.",
  };
}

export type OAuthProvider = "google" | "azure" | "linkedin_oidc";

export async function oauthAction(provider: OAuthProvider): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  if (!["google", "azure", "linkedin_oidc"].includes(provider)) return { error: "Fournisseur inconnu." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${await appOrigin()}/auth/callback`,
      scopes: provider === "azure" ? "email" : undefined,
    },
  });
  if (error || !data.url) return { error: "Connexion impossible avec ce fournisseur." };
  redirect(data.url);
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  (await cookies()).delete(REMEMBER_COOKIE);
  redirect("/login");
}
