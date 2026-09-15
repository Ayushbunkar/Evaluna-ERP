import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { invalidateCachedSession } from "@/lib/session-cache";

/**
 * /api/logout (GET & POST)
 *
 * Server-side logout handler that returns 200 OK properly.
 * Clears HttpOnly session cookies, invalidates in-memory session cache,
 * and calls Better Auth server-side signOut.
 *
 * - Returns 200 OK with HTML auto-redirect for browser GET navigations.
 * - Returns 200 OK with JSON for fetch/API calls.
 */

const COOKIE_NAMES = [
	"evaluna.session_token",
	"__Secure-evaluna.session_token",
	"evaluna.session_data",
	"__Secure-evaluna.session_data",
	"evaluna.dont_remember",
	"better-auth.session_token",
	"__Secure-better-auth.session_token",
];

async function handleLogout(request: NextRequest) {
	// 1. Invalidate in-memory session cache if token exists
	try {
		for (const name of COOKIE_NAMES) {
			const token = request.cookies.get(name)?.value;
			if (token) {
				invalidateCachedSession(token);
			}
		}
	} catch (cacheErr) {
		console.warn("[/api/logout] Cache invalidation warning:", cacheErr);
	}

	// 2. Call Better Auth's server-side signOut to invalidate DB session
	try {
		await auth.api.signOut({
			headers: request.headers,
		});
	} catch (err) {
		console.error("[/api/logout] signOut error:", err);
	}

	const acceptsHtml = request.headers.get("accept")?.includes("text/html");
	let response: NextResponse;

	if (acceptsHtml && request.method === "GET") {
		const html = `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta http-equiv="refresh" content="0;url=/login">
	<title>Logging out...</title>
	<script>window.location.replace("/login");</script>
</head>
<body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#f8fafc;">
	<p>Logging out... <a href="/login" style="color:#38bdf8;">Click here to return to login</a></p>
</body>
</html>`;
		response = new NextResponse(html, {
			status: 200,
			headers: {
				"Content-Type": "text/html; charset=utf-8",
			},
		});
	} else {
		response = NextResponse.json(
			{
				success: true,
				message: "Logged out successfully",
				redirectUrl: "/login",
			},
			{ status: 200 },
		);
	}

	// 3. Explicitly expire all known Better Auth cookies as a safety net
	for (const name of COOKIE_NAMES) {
		response.cookies.set(name, "", {
			expires: new Date(0),
			path: "/",
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
		});
	}

	// 4. Prevent caching
	response.headers.set(
		"Cache-Control",
		"no-store, no-cache, must-revalidate, proxy-revalidate",
	);
	response.headers.set("Pragma", "no-cache");
	response.headers.set("Expires", "0");

	return response;
}

export async function GET(request: NextRequest) {
	return handleLogout(request);
}

export async function POST(request: NextRequest) {
	return handleLogout(request);
}
