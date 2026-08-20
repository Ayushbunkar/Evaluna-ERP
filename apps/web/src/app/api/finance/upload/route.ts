import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { attachments } from "@evaluna/db/schema";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";

/**
 * Secure receipt upload for the Finance module.
 *
 * Hardening:
 *  - Requires an authenticated session.
 *  - Whitelists MIME type AND derives the on-disk extension from that whitelist
 *    (never trusts the client filename), eliminating path-traversal / double-ext.
 *  - Generates a random stored name; the original name is kept for display only.
 *  - Enforces a max size. Files live under a private, gitignored uploads root
 *    (FINANCE_UPLOAD_DIR) — never inside /public.
 */
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED: Record<string, string> = {
	"application/pdf": ".pdf",
	"image/jpeg": ".jpg",
	"image/png": ".png",
	"image/webp": ".webp",
};

const ALLOWED_ENTITY = new Set(["payment", "employee_expense"]);

function uploadRoot(): string {
	return (
		process.env.FINANCE_UPLOAD_DIR ||
		path.join(process.cwd(), "uploads", "finance")
	);
}

export async function POST(req: Request) {
	const user = await getAuthUser();
	if (!user)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	let form: FormData;
	try {
		form = await req.formData();
	} catch {
		return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
	}

	const file = form.get("file");
	const entityType = String(form.get("entity_type") || "payment");
	if (!(file instanceof File))
		return NextResponse.json({ error: "No file provided" }, { status: 400 });
	if (!ALLOWED_ENTITY.has(entityType))
		return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });

	const ext = ALLOWED[file.type];
	if (!ext)
		return NextResponse.json(
			{ error: "Unsupported file type. Allowed: PDF, JPG, PNG, WEBP." },
			{ status: 415 },
		);
	if (file.size <= 0 || file.size > MAX_BYTES)
		return NextResponse.json(
			{ error: "File must be between 1 byte and 10 MB" },
			{ status: 413 },
		);

	const buffer = Buffer.from(await file.arrayBuffer());

	// Partition on disk by branch so files are naturally scoped, then a random name.
	const branchSeg = user.branchId != null ? `b${user.branchId}` : "shared";
	const storedName = `${randomUUID()}${ext}`;
	const relDir = path.join(branchSeg, entityType);
	const absDir = path.join(uploadRoot(), relDir);
	await mkdir(absDir, { recursive: true });
	await writeFile(path.join(absDir, storedName), buffer);

	const relPath = path.join(relDir, storedName).split(path.sep).join("/");
	const [row] = await db
		.insert(attachments)
		.values({
			branch_id: user.branchId ?? null,
			entity_type: entityType,
			entity_id: null, // linked when the parent record is saved
			file_name: file.name.slice(0, 255),
			stored_name: storedName,
			mime_type: file.type,
			file_size: file.size,
			storage_path: relPath,
			uploaded_by: user.userId,
		})
		.returning();

	return NextResponse.json({
		id: row.id,
		file_name: row.file_name,
		mime_type: row.mime_type,
		file_size: row.file_size,
	});
}
