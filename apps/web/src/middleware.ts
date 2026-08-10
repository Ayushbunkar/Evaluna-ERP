import type { Session } from "@evaluna/auth/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isAtLeastRole, ROUTE_ROLE_MAP, type Role } from "@/lib/permissions";

/**
 * Edge middleware that protects all routes.
 * Runs on every request before hitting the Node server.
 */
export default async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Clone headers to strip proxy headers that break Next.js CSRF in Codespaces
	const requestHeaders = new Headers(request.headers);
	requestHeaders.delete("x-forwarded-host");
	requestHeaders.delete("x-forwarded-proto");
	requestHeaders.delete("x-forwarded-port");
	requestHeaders.delete("x-forwarded-for");

	// 1. Let public assets, auth APIs, and TRPC pass through
	// TRPC handles its own authentication via context
	if (
		pathname.startsWith("/api/auth") ||
		pathname.startsWith("/api/seed-users") ||
		pathname.startsWith("/api/trpc") ||
		pathname.startsWith("/_next") ||
		pathname.startsWith("/favicon.ico") ||
		pathname.startsWith("/public")
	) {
		return NextResponse.next({ request: { headers: requestHeaders } });
	}

	// 1.5. Allow public website routes without authentication
	const publicRoutes = [
		"/",
		"/about",
		"/features",
		"/solutions",
		"/pricing",
		"/resources",
		"/contact",
		"/careers",
	];

	if (
		publicRoutes.some(
			(route) => pathname === route || pathname.startsWith(route + "/"),
		)
	) {
		return NextResponse.next({ request: { headers: requestHeaders } });
	}

	// 2. Public auth pages — redirect to role dashboard if already logged in
	const isAuthPage =
		pathname === "/login" ||
		pathname === "/signup" ||
		pathname === "/forgot-password" ||
		pathname === "/reset-password";

	// Check session token cookie directly first (fast fail)
	const sessionToken =
		request.cookies.get("evaluna.session_token")?.value ||
		request.cookies.get("__Secure-evaluna.session_token")?.value ||
		request.cookies.get("better-auth.session_token")?.value ||
		request.cookies.get("__Secure-better-auth.session_token")?.value;

	if (!sessionToken && isAuthPage) {
		return NextResponse.next({ request: { headers: requestHeaders } });
	}
	if (!sessionToken) {
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		url.searchParams.set("callbackUrl", request.url);
		return NextResponse.redirect(url);
	}

	// 3. Validate session via HTTP fetch (to avoid Edge TCP limits with postgres.js)
	let sessionData: any = null;
	try {
		const sessionUrl = new URL("/api/auth/get-session", request.url);
		const response = await fetch(sessionUrl.toString(), {
			headers: {
				cookie: request.headers.get("cookie") || "",
			},
		});
		if (response.ok) {
			const res = await response.json();
			if (res?.session) {
				sessionData = res;
			}
		}
	} catch (_err) {
		console.error("Middleware session check failed:", _err);
	}

	if (!sessionData) {
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

	// 4. If logged in and hitting an auth page, always redirect to their dashboard.
	// The user is authenticated — send them home regardless of error/expired params.
	if (isAuthPage) {
		const url = request.nextUrl.clone();
		let role = sessionData.user.role || "sales_person";
		if (role === "superadmin") role = "admin";
		url.pathname = role === "sales_person" ? "/sales" : `/${role}`;
		url.search = ""; // clear any leftover query params
		return NextResponse.redirect(url);
	}

	// 5. Coarse-grained Role Checks (for pages)
	const isDashboardRoute =
		pathname.startsWith("/admin") ||
		pathname.startsWith("/manager") ||
		pathname.startsWith("/auditor") ||
		pathname.startsWith("/hr") ||
		pathname.startsWith("/marketing") ||
		pathname.startsWith("/putter") ||
		pathname.startsWith("/picker") ||
		pathname.startsWith("/driver") ||
		pathname.startsWith("/biller") ||
		pathname.startsWith("/sales");

	const isSharedRoute =
		pathname.startsWith("/settings") ||
		pathname.startsWith("/profile") ||
		pathname.startsWith("/notifications") ||
		pathname.startsWith("/sync");

	if (isDashboardRoute || isSharedRoute) {
		let userRole = (sessionData.user.role || "sales_person") as Role;
		if ((userRole as string) === "superadmin") userRole = "admin" as Role;

		const isSuperadmin =
			sessionData.user.isSuperadmin === true ||
			sessionData.user.is_superadmin === true ||
			sessionData.user.role === "superadmin";

		if (!isSuperadmin) {
			// Find the most specific route match
			const matchedRoute = ROUTE_ROLE_MAP.find((route) =>
				pathname.startsWith(route.path),
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
	if ((sessionData.user as any).branchId) {
		response.headers.set(
			"X-Branch-Id",
			(sessionData.user as any).branchId.toString(),
		);
	}

	return response;
}

export const config = {
	// Run on all paths except public files
	matcher: ["/((?!.*\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
