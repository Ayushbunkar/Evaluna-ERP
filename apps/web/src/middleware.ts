import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isAtLeastRole, ROUTE_ROLE_MAP, type Role } from "@/lib/permissions";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { session as sessionTable } from "@evaluna/db/schema";
import { and, eq, gte, or } from "drizzle-orm";

/**
 * Node.js middleware that protects all routes.
 *
 * Previously used a self-HTTP loopback to /api/auth/get-session to avoid
 * Edge Runtime TCP limits with postgres.js. Now runs in Node.js runtime so
 * it can call auth.api.getSession() directly, eliminating the internal HTTP
 * round-trip (was ~150–300 ms TTFB overhead per navigation).
 *
 * Security is unchanged — Better Auth still validates the session token and
 * returns role/user/permissions via the session.data getter.
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
		pathname.startsWith("/api/logout") ||
		pathname.startsWith("/api/seed-users") ||
		pathname.startsWith("/api/trpc") ||
		pathname.startsWith("/_next") ||
		pathname === "/favicon.ico" ||
		pathname === "/manifest.json" ||
		pathname === "/sw.js" ||
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
		"/product",
		"/pricing",
		"/careers",
		"/blog",
		"/resources",
		"/contact",
		"/privacy",
		"/terms",
		"/status",
		"/docs",
		"/demo",
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

	// Fast-fail: check session token cookie before any DB/auth work
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

	// 3. Validate session directly via Better Auth (no HTTP round-trip)
	//    auth.api.getSession() verifies the session token against the DB and
	//    returns { user, session } with role/permissions from session.data getter.
	//    Better Auth's cookieCache (maxAge: 5 min) avoids a DB hit on most requests.
	//
	//    Role location: Better Auth session getters place the result in session.data.
	//    We resolve role from session.data.role → session.role → user.role in order.
	let sessionData: { user: any; session: any; role: string | null } | null = null;
	try {
		const result = await auth.api.getSession({
			headers: request.headers,
		});
		if (result?.session && result?.user) {
			// Resolve role: Better Auth stores getter data in session.data
			const resolvedRole =
				(result.session as any)?.data?.role ||
				(result.session as any)?.role ||
				(result.user as any)?.role ||
				null;
			sessionData = {
				user: result.user,
				session: result.session,
				role: resolvedRole,
			};
		}
	} catch (err) {
		console.error("[Middleware] session check failed:", err);
	}

	// Direct DB fallback if auth.api.getSession failed or returned null but cookie exists
	if (!sessionData && sessionToken) {
		try {
			const tokenOnly = sessionToken.split(".")[0];
			const dbSession = await db.query.session.findFirst({
				where: and(
					or(eq(sessionTable.token, sessionToken), eq(sessionTable.token, tokenOnly)),
					gte(sessionTable.expiresAt, new Date()),
				),
				with: {
					user: true,
				},
			});
			if (dbSession?.user) {
				const resolvedRole = dbSession.user.role || ((dbSession.user as any)?.is_superadmin ? "super_admin" : "customer");
				sessionData = {
					user: dbSession.user,
					session: dbSession,
					role: resolvedRole,
				};
			}
		} catch (err) {
			console.error("[Middleware] DB session fallback failed:", err);
		}
	}

	if (!sessionData) {
		// If we're already on an auth page, just render it so the user can log in
		if (isAuthPage) {
			return NextResponse.next({ request: { headers: requestHeaders } });
		}

		// Otherwise redirect to login
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		return NextResponse.redirect(url);
	}

	// 4. If logged in and hitting an auth page, always redirect to their dashboard.
	// The user is authenticated — send them home regardless of error/expired params.
	if (isAuthPage) {
		const url = request.nextUrl.clone();
		let rawRole = sessionData.role || "customer";
		if (rawRole) {
			const lower = rawRole.toLowerCase();
			if (
				lower === "salesperson" ||
				lower === "sales" ||
				lower === "sales_person"
			) {
				rawRole = "sales_person";
			} else if (
				lower === "superadmin" ||
				lower === "super_admin" ||
				lower === "super admin"
			) {
				rawRole = "super_admin";
			}
		}
		// Map every known role to its dashboard path
		const roleDashboardMap: Record<string, string> = {
			super_admin: "/superadmin",
			superadmin: "/superadmin",
			admin: "/admin",
			manager: "/manager",
			auditor: "/auditor",
			hr: "/hr",
			finance: "/finance",
			marketing: "/marketing",
			putter: "/putter",
			picker: "/picker",
			driver: "/driver",
			biller: "/sales",
			billing: "/sales",
			cashier: "/sales",
			checker: "/checker",
			packer: "/packer",
			dispatcher: "/packer",
			dispatch: "/packer",
			sales_person: "/sales",
			salesperson: "/sales",
			sales: "/sales",
			delivery_manager: "/manager",
			delivery_boy: "/driver",
			customer: "/customer",
			warehouse: "/warehouse",
			warehouse_supervisor: "/warehouse",
			"Warehouse Operations": "/warehouse",
			procurement: "/procurement",
			Procurement: "/procurement",
		};
		url.pathname = roleDashboardMap[rawRole] ?? "/customer";
		url.search = ""; // clear any leftover query params
		return NextResponse.redirect(url);
	}

	// 5. Coarse-grained Role Checks (for pages)
	const matchedRoute = ROUTE_ROLE_MAP.find((route) =>
		pathname.startsWith(route.path),
	);

	if (matchedRoute) {
		let userRole = (sessionData.role || "customer") as Role;
		console.log("[MIDDLEWARE ROLE CHECK]", {
			email: sessionData.user?.email,
			sessionRole: (sessionData.session as any)?.role,
			userRoleField: sessionData.user?.role,
			resolvedUserRole: userRole,
			matchedRoutePath: matchedRoute.path,
			matchedRouteMinRole: matchedRoute.minRole,
			isAtLeast: isAtLeastRole(userRole, matchedRoute.minRole),
		});
		if (userRole) {
			const lower = (userRole as string).toLowerCase();
			if (
				lower === "salesperson" ||
				lower === "sales" ||
				lower === "sales_person"
			) {
				userRole = "sales_person" as Role;
			}
		}
		if (
			(userRole as string) === "superadmin" ||
			(userRole as string) === "super_admin"
		)
			userRole = "super_admin" as Role;

		const isSuperadmin =
			sessionData.user?.isSuperadmin === true ||
			sessionData.user?.is_superadmin === true ||
			sessionData.role === "superadmin" ||
			sessionData.role === "super_admin";

		if (!isSuperadmin) {
			if (!isAtLeastRole(userRole, matchedRoute.minRole)) {
				// User lacks role for this section
				const url = request.nextUrl.clone();
				url.pathname = "/error/403";
				return NextResponse.rewrite(url);
			}
		}
	}

	// 6. Attach context headers for downstream consumption
	const response = NextResponse.next({ request: { headers: requestHeaders } });
	response.headers.set(
		"X-User-Id",
		sessionData.user?.id || (sessionData.session as any)?.userId || "",
	);
	response.headers.set(
		"X-User-Role",
		sessionData.role || "customer",
	);
	if ((sessionData.user as any)?.branchId) {
		response.headers.set(
			"X-Branch-Id",
			(sessionData.user as any).branchId.toString(),
		);
	}

	// Prevent BFCache / secure page backtracking after logout
	response.headers.set(
		"Cache-Control",
		"no-store, no-cache, must-revalidate, proxy-revalidate",
	);
	response.headers.set("Pragma", "no-cache");
	response.headers.set("Expires", "0");

	return response;
}

export const config = {
	runtime: "nodejs",
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		"/((?!_next/static|_next/image|favicon.ico|public/).*)",
	],
};
