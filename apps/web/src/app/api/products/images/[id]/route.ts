import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { attachments } from "@evaluna/db/schema";
import { and, eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { productImageUploadRoot } from "../../upload/route";

/**
 * Public/Authorized Product Image Serving Route.
 * Serves product catalog images to customers, POS, warehouse, and sales.
 * Uses HTTP caching headers for fast delivery.
 */
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		if (!id || typeof id !== "string") {
			return NextResponse.json({ error: "Invalid image id" }, { status: 400 });
		}

		const attachmentId = Number.parseInt(id, 10);
		const isNumeric = !Number.isNaN(attachmentId) && attachmentId > 0;

		const whereCondition = isNumeric
			? and(
					eq(attachments.id, attachmentId),
					eq(attachments.is_deleted, false),
				)
			: and(
					or(
						eq(attachments.stored_name, id),
						eq(attachments.storage_path, id),
					),
					eq(attachments.is_deleted, false),
				);

		const [row] = await db
			.select()
			.from(attachments)
			.where(whereCondition)
			.limit(1);

		if (!row) {
			return NextResponse.json({ error: "Image not found" }, { status: 404 });
		}

		// If stored on external CDN (Cloudinary / S3 / R2), redirect cleanly
		if (row.storage_path && /^https?:\/\//i.test(row.storage_path)) {
			return NextResponse.redirect(row.storage_path, 302);
		}

		let data: Buffer | null = null;

		// Priority 1: Check filesystem first (Fastest, zero PostgreSQL memory/connection overhead)
		const root = path.resolve(productImageUploadRoot());
		let abs = path.resolve(root, row.storage_path);

		if (!existsSync(abs)) {
			const fallbacks = [
				path.resolve(process.cwd(), "apps", "web", "uploads", "products", row.storage_path),
				path.resolve(process.cwd(), "uploads", "products", row.storage_path),
				path.resolve(process.cwd(), "..", "uploads", "products", row.storage_path),
			];
			for (const fb of fallbacks) {
				if (existsSync(fb)) {
					abs = fb;
					break;
				}
			}
		}

		try {
			if (existsSync(abs)) {
				data = await readFile(abs);
			}
		} catch (fsErr) {
			console.warn("[products/images] Disk read error, checking DB fallback:", fsErr);
		}

		// Priority 2: Fallback to persistent base64 data from PostgreSQL (for Vercel Serverless)
		if (!data && row.file_data) {
			try {
				const base64Str = row.file_data.includes(",")
					? row.file_data.split(",")[1]
					: row.file_data;
				data = Buffer.from(base64Str, "base64");
			} catch (decodeErr) {
				console.error("[products/images] Base64 decode failed:", decodeErr);
			}
		}

		if (!data) {
			return NextResponse.json({ error: "Image file content missing" }, { status: 404 });
		}

		return new NextResponse(new Uint8Array(data), {
			status: 200,
			headers: {
				"Content-Type": row.mime_type || "image/jpeg",
				"Content-Disposition": `inline; filename="${encodeURIComponent(row.file_name)}"`,
				"Content-Length": String(data.length),
				"Cache-Control": "public, max-age=31536000, immutable",
			},
		});
	} catch (error: any) {
		console.error("[products/images] Internal error:", error);
		return NextResponse.json(
			{ error: "Failed to load product image" },
			{ status: 500 },
		);
	}
}
