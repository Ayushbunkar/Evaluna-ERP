import { ilike } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { staff } from "@/lib/db/schema";

export async function POST() {
	try {
		await db
			.update(staff)
			.set({ is_deleted: true })
			.where(ilike(staff.email, "%seed%"));
		return NextResponse.json({ success: true });
	} catch (err: any) {
		return NextResponse.json(
			{ success: false, error: err.message },
			{ status: 500 },
		);
	}
}

export async function GET() {
	return new Response("Cleanup endpoint disabled for GET", { status: 404 });
}
