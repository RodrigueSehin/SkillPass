import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

/** Removes the sign-in account itself (the Supabase Auth user), once the person\x27s data is gone. */
export interface AccountRemover {
  deleteUser(id: string): Promise<void>;
}

class SupabaseAccountRemover implements AccountRemover {
  async deleteUser(id: string) {
    const client = createClient(supabaseUrl(), process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
    const { error } = await client.auth.admin.deleteUser(id);
    // Already gone is fine: the goal is that nobody can sign in with it any more.
    if (error && error.status !== 404) throw new Error(`auth delete failed: ${error.message}`);
  }
}

export function getAccountRemover(): AccountRemover {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return new SupabaseAccountRemover();
  }
  if (process.env.NODE_ENV === "production") throw new Error("Account removal is not configured");
  // Development without Supabase: there is no sign-in account to remove.
  return { async deleteUser() {} };
}
