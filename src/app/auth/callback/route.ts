import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { isSupabaseConfigured } from "@/lib/auth/env";
import { ensureProfile } from "@/services/profile.service";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/dashboard";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  if (!isSupabaseConfigured() || !code) return NextResponse.redirect(`${origin}/login?error=auth`);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/login?error=auth`);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email) {
    try {
      await ensureProfile({
        id: user.id,
        email: user.email,
        fullName: (user.user_metadata?.full_name as string | undefined) ?? user.email.split("@")[0],
      });
    } catch (err) {
      console.error("auth callback: ensureProfile failed", err);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
