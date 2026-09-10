import { UserManagement } from "@evaluna/db";
import { toNextJsHandler } from "better-auth/next-js";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const handler = toNextJsHandler(auth);

export const POST = handler.POST;

export async function GET(request: NextRequest) {
	// Let the standard Better Auth handler process the request
	const response = await handler.GET(request);

	// If this is a get-session request, intercept and enrich with role & permissions from DB
	const url = new URL(request.url);
	if (url.pathname.endsWith("/get-session") && response.ok) {
		try {
			// Clone the response so we can read its JSON
			const clonedResponse = response.clone();
			const data = await clonedResponse.json();

			if (data?.session?.userId || data?.user?.email) {
				let resolvedRole = data?.user?.role || data?.session?.role;

				try {
					// Fetch complete security profile directly from DB
					if (data?.session?.userId) {
						const profile = await UserManagement.getSecurityProfileByUserId(
							data.session.userId,
						);
						if (profile?.role) {
							resolvedRole = profile.role;
							data.session.permissions = profile.permissions;
							data.session.canonicalDashboard = profile.canonicalDashboard;
						}
					}
				} catch (dbErr) {
					console.warn("[GET /api/auth/get-session Interceptor] DB profile lookup fallback:", dbErr);
				}

				// Email-based role fallback if role is missing or customer
				if (!resolvedRole || resolvedRole === "customer" || resolvedRole === "user") {
					const email = (data?.user?.email || "").toLowerCase();
					if (email.includes("driver")) resolvedRole = "driver";
					else if (email.includes("finance")) resolvedRole = "finance";
					else if (email.includes("manager")) resolvedRole = "manager";
					else if (email.includes("packer")) resolvedRole = "packer";
					else if (email.includes("picker")) resolvedRole = "picker";
					else if (email.includes("putter")) resolvedRole = "putter";
					else if (email.includes("auditor")) resolvedRole = "auditor";
					else if (email.includes("admin")) resolvedRole = "admin";
					else if (email.includes("biller")) resolvedRole = "biller";
				}

				if (resolvedRole) {
					data.session.role = resolvedRole;
					if (data.user) data.user.role = resolvedRole;

					return NextResponse.json(data, {
						status: response.status,
						headers: response.headers,
					});
				}
			}
		} catch (err) {
			console.error(
				"[GET /api/auth/get-session Interceptor] Enrichment failed:",
				err,
			);
		}
	}

	return response;
}
