import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { IS_DEMO, SUPABASE_KEY, SUPABASE_URL } from "@/lib/constants";

/**
 * Refreshes the Supabase auth session cookie on every request and returns the
 * current user (or null). Demo mode (no Supabase env vars) is a no-op — route
 * protection then happens client-side against the local demo session.
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });

  if (IS_DEMO) return { response, user: null };

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
