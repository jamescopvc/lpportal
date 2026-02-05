import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session cookies
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Root always redirects to login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // /auth/callback is the magic-link landing -- always open
  if (pathname === "/auth/callback") {
    return response;
  }

  // Password setup/reset pages require an active session
  if (pathname === "/auth/setup-password" || pathname === "/auth/reset-password") {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  // /login: if already fully set up, skip ahead
  if (pathname === "/login") {
    if (user) {
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (userData) {
        return NextResponse.redirect(
          new URL(userData.role === "admin" ? "/admin" : "/portal", request.url)
        );
      }
      // Session exists but no Users row → still in first-time setup
      return NextResponse.redirect(
        new URL("/auth/setup-password", request.url)
      );
    }
    return response;
  }

  // /portal/* and /admin/* require authentication + Users record
  if (pathname.startsWith("/portal") || pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    // Authenticated but no Users row → finish setup first
    if (!userData) {
      return NextResponse.redirect(
        new URL("/auth/setup-password", request.url)
      );
    }

    // /admin/* is restricted to admin role
    if (pathname.startsWith("/admin") && userData.role !== "admin") {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
