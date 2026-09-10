const fs = require("fs");
const path = require("path");

const routePath = path.join(
	__dirname,
	"../apps/web/src/app/api/auth/[...all]/route.ts",
);

const enrichedRouteContent = `import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { UserManagement } from "@evaluna/db";
import { NextResponse, type NextRequest } from "next/server";

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

			if (data?.session?.userId) {
				// Fetch complete security profile directly from DB
				const profile = await UserManagement.getSecurityProfileByUserId(data.session.userId);
				if (profile) {
					// Inject enriched fields into the session and user object
					data.session.role = profile.role;
					data.session.permissions = profile.permissions;
					data.session.canonicalDashboard = profile.canonicalDashboard;

					data.user.role = profile.role; // also inject on user for safety
					
					// Return a new response with the enriched JSON and original headers/status
					const enrichedResponse = NextResponse.json(data, {
						status: response.status,
						headers: response.headers,
					});
					return enrichedResponse;
				}
			}
		} catch (err) {
			console.error("[GET /api/auth/get-session Interceptor] Enrichment failed:", err);
		}
	}

	return response;
}
`;

fs.writeFileSync(routePath, enrichedRouteContent, "utf-8");
console.log(
	"Successfully enriched apps/web/src/app/api/auth/[...all]/route.ts!",
);
