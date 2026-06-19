import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./env";

// Public routes that an unauthenticated user may reach.
const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];
// A signed-in user landing on these is bounced to the app. (Password-recovery
// routes are intentionally excluded: the recovery link creates a transient
// session and the user must stay to set a new password.)
const REDIRECT_IF_AUTHED = ["/login", "/register"];

/**
 * Refreshes the Supabase session cookie on every request AND enforces route
 * protection:
 *  - unauthenticated user on a protected route  -> redirect to /login
 *  - authenticated user on an auth route        -> redirect to /radar
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));
  const redirectIfAuthed = REDIRECT_IF_AUTHED.some((p) => path.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && redirectIfAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = "/radar";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
