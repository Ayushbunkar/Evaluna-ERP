import { user } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const USERS_TO_SEED = [
	{ name: "Super Admin", email: "admin@evaluna.com", role: "superadmin" },
	{ name: "Sales Manager", email: "sales@evaluna.com", role: "sales_person" },
	{ name: "Auditor Desk", email: "auditor@evaluna.com", role: "auditor" },
	{ name: "HR Manager", email: "hr@evaluna.com", role: "hr" },
	{ name: "Warehouse Picker", email: "picker@evaluna.com", role: "picker" },
	{ name: "Warehouse Putter", email: "putter@evaluna.com", role: "putter" },
	{ name: "Driver / Delivery", email: "driver@evaluna.com", role: "driver" },
	{ name: "Marketing Exec", email: "marketing@evaluna.com", role: "marketing" },
];

export async function POST() {
	try {
		const password = "Password@123";
		const created = [];

		for (const u of USERS_TO_SEED) {
			// Check if exists
			const existing = await db
				.select({ id: user.id })
				.from(user)
				.where(eq(user.email, u.email))
				.limit(1);

			if (existing.length === 0) {
				// Create via better-auth
				const result = await auth.api.signUpEmail({
					body: {
						email: u.email,
						password: password,
						name: u.name,
					},
				});

				if (result) {
					// Update role
					await db
						.update(user)
						.set({ role: u.role } as any)
						.where(eq(user.email, u.email));
						
					created.push(u.email);
				}
			}
		}

		return NextResponse.json({
			success: true,
			message: "Test users seeded successfully!",
			created,
			password_for_all: password,
			users: USERS_TO_SEED
		});
	} catch (error: any) {
		console.error("Seed users error:", error);
		return NextResponse.json(
			{ success: false, error: error?.message ?? "Unknown error" },
			{ status: 500 },
		);
	}
}

export async function GET() {
	return NextResponse.json({
		message: "Make a POST request to this endpoint to create test accounts for all roles.",
		users_that_will_be_created: USERS_TO_SEED,
		password_for_all: "Password@123"
	});
}
