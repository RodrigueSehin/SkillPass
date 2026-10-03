import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseUrl } from "./env";
import { isRemembered, REMEMBER_COOKIE, withRememberPolicy } from "./remember";

export async function createSupabaseServerClient(options: { remember?: boolean } = {}) {
  const cookieStore = await cookies();
  // loginAction passes the fresh choice; everywhere else the stored preference applies.
  const remember = options.remember ?? isRemembered(cookieStore.get(REMEMBER_COOKIE)?.value);

  return createServerClient(supabaseUrl(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, withRememberPolicy(name, value, options, remember)),
          );
        } catch {
          // Called from a Server Component: the proxy refreshes the session instead.
        }
      },
    },
  });
}
