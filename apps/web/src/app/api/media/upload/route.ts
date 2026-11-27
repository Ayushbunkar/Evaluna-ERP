import { randomUUID } from "node:crypto";
import path from "node:path";
import { attachments } from "@evaluna/db/schema";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import {
	isExternalDriver,
	type MediaPreset,
	storeMedia,
} from "@/lib/storage/object-storage";

const ALLOWED_MIMES: Record<string, string> = {
	"image/jpeg": ".jpg",
	"image/jpg": ".jpg",
	"image/png": ".png",
	"image/webp": ".webp",
	"image/gif": ".gif",
	"image/svg+xml": ".svg",
	"video/mp4": ".mp4",
	"video/webm": ".webm",
	"video/quicktime": ".mov",
	"application/pdf": ".pdf",
};

const ALLOWED_FOLDERS = new Set([
	"avatars",
	"products",
	"customers",
	"employees",
	"id_proofs",
	"delivery",
	"picker",
	"finance",
	"attendance",
	"videos",
	"media",
]);

const ALLOWED_PRESETS = new Set<MediaPreset>([
	"avatar",
	"product",
	"document",
	"video",
	"default",
]);

const MAX_IMAGE_DOC_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

/**
 * Universal Media Upload Endpoint for Evaluna ERP.
 * Handles profile avatars, employee/customer ID proofs, delivery PODs,
 * picker damage photos, videos, and general attachments via switchable
 * object storage (Cloudinary by default).
 */
export async function POST(req: Request) {
	try {
		const user = await getAuthUser(req);
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		let form: FormData;
		try {
			form = await req.formData();
		} catch {
			return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
		}

		const file = form.get("file");
		if (!(file instanceof File)) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		const mime = (file.type || "").toLowerCase();
		const ext = ALLOWED_MIMES[mime];
		if (!ext) {
			return NextResponse.json(
				{
					error:
						"Unsupported file type. Allowed: JPG, PNG, WEBP, GIF, SVG, MP4, WEBM, MOV, PDF.",
				},
				{ status: 415 },
			);
		}

		const isVideo = mime.startsWith("video/");
		const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_DOC_BYTES;
		if (file.size <= 0 || file.size > maxBytes) {
			return NextResponse.json(
				{
					error: `File size must be between 1 byte and ${isVideo ? "50 MB" : "10 MB"}.`,
				},
				{ status: 413 },
			);
		}

		const rawFolder = String(form.get("folder") || "media")
			.trim()
			.toLowerCase();
		const folder = ALLOWED_FOLDERS.has(rawFolder) ? rawFolder : "media";

		const rawPreset = String(
			form.get("preset") || (isVideo ? "video" : "default"),
		)
			.trim()
			.toLowerCase() as MediaPreset;
		const preset: MediaPreset = ALLOWED_PRESETS.has(rawPreset)
			? rawPreset
			: "default";

		const entityType = String(form.get("entity_type") || folder)
			.trim()
			.slice(0, 64);
		const entityIdRaw = form.get("entity_id");
		const entityId =
			entityIdRaw != null && !Number.isNaN(Number(entityIdRaw))
				? Number(entityIdRaw)
				: null;

		const buffer = Buffer.from(await file.arrayBuffer());
		const storedName = `${folder}_${Date.now()}_${randomUUID().slice(0, 8)}${ext}`;
		const localRoot = path.join(process.cwd(), "uploads", folder);

		const storageResult = await storeMedia({
			folder,
			fileName: storedName,
			buffer,
			mimeType: mime,
			localRoot,
			preset,
		});

		const isExternal = isExternalDriver(storageResult.driver);
		const isServerless = Boolean(
			process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME,
		);
		const base64Fallback =
			!isExternal && isServerless && !isVideo
				? buffer.toString("base64")
				: null;

		const [row] = await db
			.insert(attachments)
			.values({
				branch_id: user.branchId ?? null,
				entity_type: entityType,
				entity_id: entityId,
				file_name: (file.name || storedName).slice(0, 255),
				stored_name: storedName,
				mime_type: mime,
				file_size: storageResult.size,
				storage_path: storageResult.storagePath,
				file_data: base64Fallback,
				uploaded_by: user.userId,
			})
			.returning();

		const url = isExternal
			? storageResult.publicUrl
			: `/api/products/images/${row.id}`;

		return NextResponse.json({
			success: true,
			id: row.id,
			url,
			storagePath: storageResult.storagePath,
			driver: storageResult.driver,
			mimeType: mime,
			fileSize: storageResult.size,
			fileName: row.file_name,
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "Upload failed";
		console.error("[media/upload] Error:", err);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
