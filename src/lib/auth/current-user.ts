import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase-server";
import { isSupabaseConfigured } from "./env";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
}

/** Returns the authenticated user, or null. Demo user outside production when Supabase is not configured. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") return null;
    return { id: "demo", email: "demo@skillpass.com", name: "Sehin G. Rodrigue" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    name: (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Talent",
  };
}

/** Server-side authorization check for pages and layouts (defense in depth next to proxy.ts). */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
