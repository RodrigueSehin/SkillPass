const DEV_URL = "http://localhost:3000";
const strip = (url: string) => url.replace(/\/$/, "");

export const isLocalUrl = (url: string | undefined) =>
  !url || /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(url);

/**
 * Canonical origin used in share links, QR codes, metadata and e-mails.
 *
 * `NEXT_PUBLIC_APP_URL` wins when it names the real site. A localhost value copied from the development file
 * is ignored in production: the origin then comes from Vercel's own variables, so a link shared from the
 * live site never points at localhost.
 */
export function appUrl(env: NodeJS.ProcessEnv = process.env) {
  const configured = env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured && !(isLocalUrl(configured) && env.NODE_ENV === "production")) return strip(configured);
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL ?? env.VERCEL_URL;
  if (vercel && env.NODE_ENV === "production") return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return strip(configured || DEV_URL);
}
