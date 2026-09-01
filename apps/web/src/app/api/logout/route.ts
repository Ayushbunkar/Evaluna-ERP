import { auth } from "@/lib/auth";
import { type NextRequest, NextResponse } from "next/server";

/**
 * GET /api/logout
 *
 * Server-side logout handler. This is the ONLY reliable way to clear
 * HttpOnly session cookies set by Better Auth. JavaScript cannot clear
 * HttpOnly cookies — only the server can via Set-Cookie headers.
 *
 * Usage: window.location.href = "/api/logout"
 */
export async function GET(request: NextRequest) {
  try {
    // Call Better Auth's server-side signOut to invalidate the session in the DB
    // and get back the Set-Cookie headers that clear the browser cookie.
    await auth.api.signOut({
      headers: request.headers,
    });
  } catch (err) {
    // Even if sign-out fails (e.g. session already expired), we still redirect.
    console.error("[/api/logout] signOut error:", err);
  }

  // Build the redirect response to /login
  const loginUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(loginUrl, { status: 302 });

  // Explicitly expire all known Better Auth cookies as a safety net.
  // This covers cases where auth.api.signOut() didn't set the headers.
  const cookieNames = [
    "evaluna.session_token",
    "__Secure-evaluna.session_token",
    "evaluna.session_data",
    "__Secure-evaluna.session_data",
    "better-auth.session_token",
    "__Secure-better-auth.session_token",
  ];

  for (const name of cookieNames) {
    response.cookies.set(name, "", {
      expires: new Date(0),
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  return response;
}
