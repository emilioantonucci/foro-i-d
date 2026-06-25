import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

/**
 * Service-role Supabase client — bypasses RLS. Use ONLY in trusted server paths
 * (notification dispatch, the cron digest, the unsubscribe endpoint) where we
 * must read other users' emails or write notifications for any recipient.
 *
 * The key is server-only and NEVER reaches the browser. The rest of the app
 * keeps using the anon-key client in `server.ts` (RLS-protected).
 */
export class AdminConfigError extends Error {}

export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new AdminConfigError(
      "SUPABASE_SERVICE_ROLE_KEY no está configurada en el servidor.",
    );
  }
  return createSupabaseClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
