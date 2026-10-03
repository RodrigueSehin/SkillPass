import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase-server";
import { isSupabaseConfigured } from "./env";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Server-side authorization check used by layouts (defense in depth next to proxy.ts).
 * Without Supabase configured, non-production environments get a demo user so the UI is previewable.
 */
export async function requireUser(): Promise<CurrentUser> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") redirect("/login");
    return { id: "demo", email: "demo@skillpass.com", name: "Sehin G. Rodrigue" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return {
    id: user.id,
    email: user.email ?? "",
    name: (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Talent",
  };
}
