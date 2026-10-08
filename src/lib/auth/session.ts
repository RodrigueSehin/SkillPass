import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseUrl } from "./env";
import { isRemembered, REMEMBER_COOKIE, withRememberPolicy } from "./remember";

const PROTECTED_PREFIXES = ["/dashboard", "/business", "/admin", "/e/"];
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

/** Refreshes the Supabase session cookie and enforces route protection. Used by proxy.ts. */
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isSupabaseConfigured()) {
    // Never fail open in production: a missing config must not expose protected routes.
    if (isProtected && process.env.NODE_ENV === "production") {
      return new NextResponse("Service unavailable", { status: 503 });
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const remember = isRemembered(request.cookies.get(REMEMBER_COOKIE)?.value);

  const supabase = createServerClient(supabaseUrl(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, withRememberPolicy(name, value, options, remember)),
        );
      },
    },
  });

  // getUser() validates the JWT with Supabase; never trust getSession() on the server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && AUTH_ROUTES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
