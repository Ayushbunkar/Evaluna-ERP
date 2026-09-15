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
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await getAuthUser();
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

	const root = path.resolve(attendanceUploadRoot());
	const abs = path.resolve(root, row.storage_path);
	if (abs !== root && !abs.startsWith(root + path.sep))
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });

	let data: Buffer;
	try {
		data = await readFile(abs);
	} catch {
		return NextResponse.json({ error: "File missing" }, { status: 404 });
	}

	return new NextResponse(new Uint8Array(data), {
		status: 200,
		headers: {
			"Content-Type": row.mime_type,
			"Content-Disposition": `inline; filename="${encodeURIComponent(row.file_name)}"`,
			"Content-Length": String(data.length),
			"Cache-Control": "private, no-store",
		},
	});
}
