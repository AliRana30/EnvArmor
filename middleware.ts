import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options: any;
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  // Use getSession() instead of getUser() here.
  // getSession() reads from the cookie only — no network call, no fetch errors.
  // getUser() makes a network round-trip to Supabase on every request; that belongs
  // in Server Components where you actually need to trust the token.
  let session = null;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    session = data.session;
  } catch (err: any) {
    // If the error contains "<!DOCTYPE" or "Unexpected token <", it means
    // Supabase is returning HTML instead of JSON (common when the project is paused/unreachable).
    const isHtmlError = err?.message?.includes('<!DOCTYPE') || err?.originalError?.message?.includes('<');
    
    if (process.env.NODE_ENV === 'development') {
      if (isHtmlError) {
        console.warn("⚠️ Supabase returned HTML instead of JSON. Your project URL is likely unreachable.");
      } else {
        console.warn("⚠️ Supabase auth error:", err.message);
      }
    }
  }

  const isProtected = request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/projects") ||
    request.nextUrl.pathname.startsWith("/vault") ||
    request.nextUrl.pathname.startsWith("/settings") ||
    request.nextUrl.pathname.startsWith("/scan-history");

  if (!session && isProtected) {
    if (process.env.NODE_ENV === "development") {
      // In dev, allow through so the UI is accessible without Supabase always running
      return response;
    }
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/vault/:path*",
    "/settings/:path*",
    "/scan-history/:path*"
  ]
};
