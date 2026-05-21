import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "@/lib/env";

/**
 * Admin client using SERVICE_ROLE_KEY. **Server-only**. Bypasses RLS.
 * Use exclusively in:
 *   - API routes (route handlers under /app/api/*)
 *   - Server Actions that need elevated access (e.g. public booking insert)
 *   - Cron handlers
 * NEVER import from a Client Component.
 */
export function createAdminClient() {
  const { SUPABASE_SERVICE_ROLE_KEY } = serverEnv();
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createSupabaseClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL ?? "",
    SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
