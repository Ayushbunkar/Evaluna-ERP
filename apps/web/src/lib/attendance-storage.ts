import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { attachments } from "@evaluna/db/schema";
import { eq, lt } from "drizzle-orm";

/**
 * Attendance image storage — mirrors the hardened Finance upload pattern:
 * private, gitignored root (never /public), MIME whitelist that also derives
 * the on-disk extension (no client filename trust), random stored name, size
 * cap. Each check-in / check-out image is a SEPARATE attachment row and is
 * never overwritten.
 *
 * Retention is configurable via ATTENDANCE_IMAGE_RETENTION_DAYS (default 30).
 * `purgeExpiredImages` deletes the image *file* after retention but KEEPS the
 * attachment metadata row for the audit trail (storage_path is cleared).
 */

// biome-ignore lint/suspicious/noExplicitAny: drizzle db/tx handle
type DB = any;

export const ATTENDANCE_MAX_BYTES = 8 * 1024 * 1024; // 8 MB
export const ATTENDANCE_ALLOWED_MIME: Record<string, string> = {
	"image/jpeg": ".jpg",
	"image/png": ".png",
	"image/webp": ".webp",
};
export const ATTENDANCE_ENTITY = {
	checkIn: "attendance_checkin",
	checkOut: "attendance_checkout",
} as const;

export function attendanceUploadRoot(): string {
	return (
		process.env.ATTENDANCE_UPLOAD_DIR ||
		path.join(process.cwd(), "uploads", "attendance")
	);
}

export function retentionDays(): number {
	const n = Number(process.env.ATTENDANCE_IMAGE_RETENTION_DAYS ?? "30");
	return Number.isFinite(n) && n > 0 ? n : 30;
}

/**
 * Persist a live-captured attendance image to disk + attachments. Returns the
 * new attachment id and relative path. Throws on bad MIME / size.
 */
export async function storeAttendanceImage(
	db: DB,
	params: {
		buffer: Buffer;
		mime: string;
		originalName: string;
		branchId: number | null;
		entityType: string;
		uploadedBy: string;
	},
): Promise<{ id: number; storagePath: string }> {
	const ext = ATTENDANCE_ALLOWED_MIME[params.mime];
	if (!ext) {
		throw new Error("Unsupported image type. Allowed: JPG, PNG, WEBP.");
	}
	if (params.buffer.length <= 0 || params.buffer.length > ATTENDANCE_MAX_BYTES) {
		throw new Error("Image must be between 1 byte and 8 MB.");
	}

	const branchSeg = params.branchId != null ? `b${params.branchId}` : "shared";
	const storedName = `${randomUUID()}${ext}`;
	const relDir = path.join(branchSeg, params.entityType);
	const absDir = path.join(attendanceUploadRoot(), relDir);
	await mkdir(absDir, { recursive: true });
	await writeFile(path.join(absDir, storedName), params.buffer);

	const relPath = path.join(relDir, storedName).split(path.sep).join("/");
	const [row] = await db
		.insert(attachments)
		.values({
			branch_id: params.branchId ?? null,
			entity_type: params.entityType,
			entity_id: null,
			file_name: params.originalName.slice(0, 255),
			stored_name: storedName,
			mime_type: params.mime,
			file_size: params.buffer.length,
			storage_path: relPath,
			uploaded_by: params.uploadedBy,
		})
		.returning();
	return { id: row.id, storagePath: relPath };
}

/**
 * Delete attendance image FILES older than the retention window while keeping
 * their attachment metadata rows (audit trail). The row is marked
 * `is_deleted=true` with `deleted_at` set; storage_path is retained for
 * forensic reference but the on-disk file is removed. Idempotent; safe to run
 * on a schedule. Returns the count of files purged.
 */
export async function purgeExpiredImages(db: DB): Promise<number> {
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - retentionDays());

	const rows = await db
		.select({
			id: attachments.id,
			storagePath: attachments.storage_path,
			entityType: attachments.entity_type,
			isDeleted: attachments.is_deleted,
		})
		.from(attachments)
		.where(lt(attachments.created_at, cutoff));

	let purged = 0;
	for (const r of rows) {
		if (
			r.isDeleted === true ||
			r.storagePath == null ||
			!String(r.entityType ?? "").startsWith("attendance_")
		) {
			continue;
		}
		try {
			await unlink(path.join(attendanceUploadRoot(), r.storagePath));
		} catch {
			// file may already be gone; still mark metadata below
		}
		await db
			.update(attachments)
			.set({ is_deleted: true, deleted_at: new Date() })
			.where(eq(attachments.id, r.id));
		purged++;
	}
	return purged;
}
