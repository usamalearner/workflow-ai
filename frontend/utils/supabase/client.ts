import { createBrowserClient } from "@supabase/ssr";
import { IS_DEMO, SUPABASE_KEY, SUPABASE_URL } from "@/lib/constants";

/**
 * Supabase client for use in the browser (Client Components, hooks).
 * Returns null in demo mode — no NEXT_PUBLIC_SUPABASE_* env vars set — in
 * which case the app falls back to a local demo session (see lib/auth.tsx).
 */
export function createClient() {
  if (IS_DEMO) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
