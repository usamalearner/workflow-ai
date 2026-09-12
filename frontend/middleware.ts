import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

/**
 * Protects /dashboard in live mode (refreshes the Supabase session cookie on
 * every request). In demo mode (no Supabase env) the dashboard is open and
 * route protection happens client-side against the local demo session.
 *
 * A "wf_guest" cookie (set by continueAsGuest() in lib/auth.tsx) always lets
 * a visitor through to /dashboard without a real Supabase session — this is
 * the product's "Explore Demo" path and works even with Supabase configured.
 */
export async function middleware(request: NextRequest) {
  const isGuest = request.cookies.get("wf_guest")?.value === "1";
  const { response, user } = await updateSession(request);

  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isAuthPage = ["/login", "/signup"].includes(request.nextUrl.pathname);

  if (isDashboard && !user && !isGuest && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isAuthPage && (user || isGuest)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
