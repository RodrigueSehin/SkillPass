/**
 * "Se souvenir de moi". Supabase writes its session cookies with a long Max-Age, which keeps the
 * visitor signed in across browser restarts. When they untick the box we drop that persistence so
 * the cookies live only as long as the browser session. The choice itself travels in a small
 * cookie so that later token refreshes (done in proxy.ts) keep honouring it.
 */
export const REMEMBER_COOKIE = "sp_remember";

/** Anything but an explicit "0" means remember (the default for existing sessions). */
export const isRemembered = (cookieValue: string | undefined) => cookieValue !== "0";

interface CookieOptions {
  maxAge?: number;
  expires?: Date | number | string;
  [key: string]: unknown;
}

/**
 * Removes Max-Age/Expires from a cookie that is being SET, turning it into a session cookie.
 * Deletions (empty value or Max-Age 0) are left untouched, otherwise sign-out would stop working.
 */
export function withRememberPolicy<T extends CookieOptions | undefined>(
  name: string,
  value: string,
  options: T,
  remember: boolean,
): T {
  if (remember || !options || !name.startsWith("sb-")) return options;
  if (value === "" || options.maxAge === 0) return options;
  const session = { ...options };
  delete session.maxAge;
  delete session.expires;
  return session as T;
}
