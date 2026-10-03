/** True when Supabase credentials are present. Lets the UI be previewed without a backend in dev. */
export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Project origin, e.g. https://abc.supabase.co. The dashboard also shows ".../rest/v1/" next to the
 * project URL; pasting that suffix breaks Auth and Storage ("Invalid path specified"), so only the
 * origin is kept.
 */
export function normalizeSupabaseUrl(raw: string | undefined) {
  if (!raw) return "";
  try {
    return new URL(raw.trim()).origin;
  } catch {
    return raw.trim();
  }
}

export const supabaseUrl = () => normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
