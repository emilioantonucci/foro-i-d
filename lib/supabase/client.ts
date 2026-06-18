import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./env";

/**
 * Supabase client for use in Client Components (browser).
 * Auth state is kept in cookies (set/refreshed by the server + middleware),
 * which is what makes the session survive reloads.
 */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
