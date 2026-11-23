import { user as userTable } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const email = (searchParams.get("email") || "").toLowerCase().trim();

	if (!email || !email.includes("@")) {
		return NextResponse.json(
			{ verified: false, error: "Invalid email" },
			{ status: 400 },
		);
	}

	try {
		const [foundUser] = await db
			.select({
				id: userTable.id,
				email: userTable.email,
				emailVerified: userTable.emailVerified,
				status: userTable.status,
			})
			.from(userTable)
			.where(eq(userTable.email, email))
			.limit(1);

		if (!foundUser) {
			return NextResponse.json(
				{ verified: false, exists: false },
				{ status: 200 },
			);
		}

		const isVerified =
			Boolean(foundUser.emailVerified) || foundUser.status === "ACTIVE";

		if (isVerified && foundUser.status !== "ACTIVE") {
			await db
				.update(userTable)
				.set({ status: "ACTIVE" } as any)
				.where(eq(userTable.id, foundUser.id));
		}

		return NextResponse.json(
			{
				verified: isVerified,
				exists: true,
				status: isVerified ? "ACTIVE" : foundUser.status,
			},
			{ status: 200 },
		);
	} catch (error: any) {
		console.error("[check-verification] Database check error:", error);
		return NextResponse.json(
			{ verified: false, error: error?.message || "Check failed" },
			{ status: 500 },
		);
	}
}
