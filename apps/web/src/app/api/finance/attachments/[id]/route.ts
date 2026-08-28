import { readFile } from "node:fs/promises";
import path from "node:path";
import { attachments } from "@evaluna/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";

/**
 * Authorized receipt download. Serves a stored attachment only to an
 * authenticated user whose branch matches the file's branch (superadmin/null
 * branch may read any). The file is resolved through the DB row's storage_path
 * and re-joined under the uploads root, then verified to stay inside it, so a
 * tampered path can never escape the uploads directory.
 */
function uploadRoot(): string {
	return (
		process.env.FINANCE_UPLOAD_DIR ||
		path.join(process.cwd(), "uploads", "finance")
	);
}

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

	// Branch isolation: a scoped user may only read their own branch's files.
	if (user.branchId != null && row.branch_id !== user.branchId)
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });

	const root = path.resolve(uploadRoot());
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
