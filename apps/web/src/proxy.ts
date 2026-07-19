import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "@evaluna/auth/client";
import { ROUTE_ROLE_MAP, isAtLeastRole, type Role } from "@/lib/permissions";

/**
 * Edge middleware that protects all routes.
 * Runs on every request before hitting the Node server.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Clone headers to strip proxy headers that break Next.js CSRF in Codespaces
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-forwarded-host");
  requestHeaders.delete("x-forwarded-proto");
  requestHeaders.delete("x-forwarded-port");
  requestHeaders.delete("x-forwarded-for");

  // 1. Let public assets and auth APIs pass through
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // 2. Public auth pages — redirect to role dashboard if already logged in
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/branch-select";

  // Check session token cookie directly first (fast fail)
  const sessionToken = request.cookies.get("evaluna.session_token")?.value;

  if (!sessionToken && isAuthPage) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  if (!sessionToken && !pathname.startsWith("/api/trpc")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(url);
  }

  // 3. Validate session with Better Auth API
  // Using betterFetch for fast fetch against the auth API
  let sessionData: { session: Session; user: any } | null = null;
  try {
    const res = await betterFetch<{ session: Session; user: any }>(
      "/api/auth/get-session",
      {
        baseURL: request.nextUrl.origin,
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      }
    );
    if (res.data) sessionData = res.data;
  } catch (err) {
    // Session invalid or auth server down
  }

  if (!sessionData) {
    // If it's an API request, return 401
    if (pathname.startsWith("/api/trpc")) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
    
    // If we're already on an auth page, just render it so the user can log in
    if (isAuthPage) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // Otherwise redirect to login
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("expired", "1");
    return NextResponse.redirect(url);
  }

  // 4. If logged in and hitting an auth page, redirect to dashboard
  // BUT: if there's an error/expired param, let them stay on the login page
  // (they were explicitly sent back here after a failed login)
  if (isAuthPage) {
    const hasErrorParam =
      request.nextUrl.searchParams.has("error") ||
      request.nextUrl.searchParams.has("expired");

    if (hasErrorParam) {
      // Let the login page render so the user can see the error message
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    const url = request.nextUrl.clone();
    const role = sessionData.user.role || "sales_person";
    url.pathname = role === "sales_person" ? "/sales" : `/${role}`;
    url.search = ""; // clear any leftover query params
    return NextResponse.redirect(url);
  }

  // 5. Coarse-grained Role Checks (for pages)
  const isDashboardRoute = 
    pathname.startsWith("/admin") ||
    pathname.startsWith("/manager") ||
    pathname.startsWith("/auditor") ||
    pathname.startsWith("/putter") ||
    pathname.startsWith("/picker") ||
    pathname.startsWith("/biller") ||
    pathname.startsWith("/sales");

  const isSharedRoute = 
    pathname.startsWith("/settings") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/sync");

  if (isDashboardRoute || isSharedRoute) {
    const userRole = (sessionData.user.role || "sales_person") as Role;
    const isSuperadmin = sessionData.user.isSuperadmin === true;

    if (!isSuperadmin) {
      // Find the most specific route match
      const matchedRoute = ROUTE_ROLE_MAP.find((route) =>
        pathname.startsWith(route.path)
      );

      if (matchedRoute) {
        if (!isAtLeastRole(userRole, matchedRoute.minRole)) {
          // User lacks role for this section
          const url = request.nextUrl.clone();
          url.pathname = "/error/403";
          return NextResponse.rewrite(url);
        }
      }
    }
  }

  // 6. Attach context headers for downstream consumption
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("X-User-Id", sessionData.user.id);
  response.headers.set("X-User-Role", sessionData.user.role || "sales_person");
  if (sessionData.session.branchId) {
    response.headers.set("X-Branch-Id", sessionData.session.branchId.toString());
  }

  return response;
}

export const config = {
  // Run on all paths except public files
  matcher: ["/((?!.*\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
