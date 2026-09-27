import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { attachments } from "@evaluna/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { attendanceUploadRoot } from "@/lib/attendance-storage";
import { getAuthUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";

/**
 * Authorized attendance selfie photo download / view route.
 * Serves live selfie photos to authenticated users (managers, HR, superadmins).
 */
export async function GET(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await getAuthUser(req);
	if (!user)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { id } = await params;
	const attachmentId = Number(id);
	if (!Number.isInteger(attachmentId) || attachmentId <= 0)
		return NextResponse.json({ error: "Invalid id" }, { status: 400 });

	const [row] = await db
		.select()
		.from(attachments)
		.where(
			and(eq(attachments.id, attachmentId), eq(attachments.is_deleted, false)),
		)
		.limit(1);
	if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

	let data: Buffer | null = null;

	// Priority 1: Instant retrieval from PostgreSQL database (100% reliable on Vercel Serverless)
	if (row.file_data) {
		try {
			const base64Str = row.file_data.includes(",")
				? row.file_data.split(",")[1]
				: row.file_data;
			data = Buffer.from(base64Str, "base64");
		} catch (e) {
			console.error("[attendance/attachments] Failed to decode file_data base64:", e);
		}
	}

	// Priority 2: Fallback to filesystem (works on local development / VPS)
	if (!data) {
		const root = path.resolve(attendanceUploadRoot());
		let abs = path.resolve(root, row.storage_path);

		// Multi-path fallback resolution for dev monorepo vs standalone cwd
		if (!existsSync(abs)) {
			const fallbacks = [
				path.resolve(process.cwd(), "apps", "web", "uploads", "attendance", row.storage_path),
				path.resolve(process.cwd(), "uploads", "attendance", row.storage_path),
				path.resolve(process.cwd(), "..", "uploads", "attendance", row.storage_path),
			];
			for (const fb of fallbacks) {
				if (existsSync(fb)) {
					abs = fb;
					break;
				}
			}
		}

		try {
			data = await readFile(abs);
		} catch {
			return NextResponse.json({ error: "File missing" }, { status: 404 });
		}
	}

	return new NextResponse(new Uint8Array(data), {
		status: 200,
		headers: {
			"Content-Type": row.mime_type || "image/jpeg",
			"Content-Disposition": `inline; filename="${encodeURIComponent(row.file_name)}"`,
			"Content-Length": String(data.length),
			"Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
		},
	});
}
