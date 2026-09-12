import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { IS_DEMO, SUPABASE_KEY, SUPABASE_URL } from "@/lib/constants";

/**
 * Supabase client for Server Components / Route Handlers. Returns null in
 * demo mode. Writing cookies from a Server Component itself is a no-op (and
 * safe to ignore) since the middleware below is what actually refreshes and
 * persists the session cookie on each request.
 */
export async function createClient() {
  if (IS_DEMO) return null;
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — safe to ignore because the
          // middleware refreshes the session on every request.
        }
      },
    },
  });
}
