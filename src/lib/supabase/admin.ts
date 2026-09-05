import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only client that uses the service_role key to bypass RLS.
 * NEVER expose to the browser. Only use inside route handlers or server
 * actions, and only for trusted operations (e.g. tracking login geo).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
