import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeRole } from "@evaluna/db";
import { attachments, products } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { notifyStockChanged } from "@/lib/inventory/stock-event-bus";
import { ensureProductImageColumns } from "@/lib/product-schema-ensure";
import { storeImageBinary } from "@/lib/storage/object-storage";

export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_PRODUCT_IMAGE_MIMES: Record<string, string> = {
	"image/jpeg": ".jpg",
	"image/jpg": ".jpg",
	"image/png": ".png",
	"image/webp": ".webp",
};

export function productImageUploadRoot(): string {
	if (process.env.PRODUCT_IMAGE_UPLOAD_DIR) {
		return process.env.PRODUCT_IMAGE_UPLOAD_DIR;
	}
	if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
		return path.join("/tmp", "uploads", "products");
	}
	if (existsSync(path.join(process.cwd(), "apps", "web"))) {
		return path.join(process.cwd(), "apps", "web", "uploads", "products");
	}
	return path.join(process.cwd(), "uploads", "products");
}

/**
 * Product Image Upload Route
 * Restricted to Warehouse Manager, Manager, and Admin roles.
 * Saves image metadata & persistent base64 data to attachments table,
 * and caches binary on disk for local/VPS setups.
 */
export async function POST(req: Request) {
	try {
		const user = await getAuthUser(req);
		if (!user) {
			return NextResponse.json(
				{ error: "Unauthorized. Please sign in." },
				{ status: 401 },
			);
		}

		// Comprehensive authorized roles for product image management:
		// Warehouse Manager / Supervisor, Admins, Super Admins, Managers, and Inventory roles
		const allowedRoles = new Set([
			"admin",
			"superadmin",
			"super_admin",
			"warehouse_manager",
			"warehouse_supervisor",
			"warehouse",
			"manager",
			"delivery_manager",
			"inventory_manager",
			"procurement",
		]);

		const rawRoles = [
			...(user.roles?.map((r) => r.name) || []),
			user.primaryRole?.name,
			(user as any).role,
			user.staff?.role,
		].filter(Boolean) as string[];

		const normalizedRoles = rawRoles.map((r) => normalizeRole(r).toLowerCase());
		const cleanedRawRoles = rawRoles.map((r) =>
			r.toLowerCase().replace(/[\s_-]+/g, "_"),
		);

		const isAuthorized =
			user.isSuperadmin ||
			normalizedRoles.some((role) => allowedRoles.has(role)) ||
			cleanedRawRoles.some(
				(role) =>
					allowedRoles.has(role) ||
					role.includes("warehouse") ||
					role.includes("admin") ||
					role.includes("manager") ||
					role.includes("inventory"),
			) ||
			Boolean(
				user.canonicalDashboardRoute &&
					(user.canonicalDashboardRoute.includes("warehouse") ||
						user.canonicalDashboardRoute.includes("admin") ||
						user.canonicalDashboardRoute.includes("manager")),
			) ||
			Boolean(
				user.permissions?.some(
					(p) =>
						p.includes("inventory") ||
						p.includes("product") ||
						p.includes("warehouse") ||
						p === "*",
				),
			);

		if (!isAuthorized) {
			return NextResponse.json(
				{
					error:
						"Forbidden: Only Warehouse Managers and Admins can upload product images.",
				},
				{ status: 403 },
			);
		}

		const formData = await req.formData();
		const file = formData.get("file") as File | null;
		const productIdStr = formData.get("productId") as string | null;
		const productId = productIdStr ? Number.parseInt(productIdStr, 10) : null;

		if (!file) {
			return NextResponse.json(
				{ error: "No image file provided." },
				{ status: 400 },
			);
		}

		// Validate MIME type
		const ext = ALLOWED_PRODUCT_IMAGE_MIMES[file.type.toLowerCase()];
		if (!ext) {
			return NextResponse.json(
				{
					error:
						"Unsupported file type. Only JPG, JPEG, PNG, and WEBP formats are allowed.",
				},
				{ status: 400 },
			);
		}

		// Validate file size (max 5MB)
		if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
			return NextResponse.json(
				{
					error: `File size exceeds 5 MB limit (file is ${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
				},
				{ status: 400 },
			);
		}

		const buffer = Buffer.from(await file.arrayBuffer());
		const storedName = `prod_${Date.now()}_${randomUUID().slice(0, 8)}${ext}`;

		// Store via Object Storage (Cloudflare R2 / AWS S3 if configured, or local persistent disk)
		let storageResult = null;
		let uploadSucceeded = false;
		try {
			const root = productImageUploadRoot();
			storageResult = await storeImageBinary(storedName, buffer, file.type.toLowerCase(), root);
			uploadSucceeded = true;
		} catch (storageErr) {
			console.warn("[products/upload] Storage write error, will use DB fallback:", storageErr);
		}

		// Prevent PostgreSQL Base64 Bloat:
		// If Cloudflare R2 / S3 or local persistent disk write succeeded, DO NOT duplicate the binary in DB!
		// Only store base64 as an emergency fallback on ephemeral serverless (Vercel) when no external storage is configured.
		const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
		const isExternalStorage = storageResult?.driver === "s3_r2";
		const base64Data =
			!uploadSucceeded || (isServerless && !isExternalStorage)
				? buffer.toString("base64")
				: null;

		const [attachment] = await db
			.insert(attachments)
			.values({
				branch_id: user.branchId || null,
				entity_type: "product_image",
				entity_id: productId && !Number.isNaN(productId) ? productId : null,
				file_name: file.name,
				stored_name: storedName,
				mime_type: file.type.toLowerCase(),
				file_size: file.size,
				storage_path: storedName,
				file_data: base64Data,
				uploaded_by: user.name || user.email || "manager",
			})
			.returning();

		const imageUrl =
			storageResult?.driver === "s3_r2"
				? storageResult.publicUrl
				: `/api/products/images/${attachment.id}`;

		// If a valid productId was provided, update the products table directly
		if (productId && !Number.isNaN(productId) && productId > 0) {
			await ensureProductImageColumns(db);
			await db
				.update(products)
				.set({
					image_url: imageUrl,
					image_storage_path: storedName,
					image_updated_at: new Date(),
					image_updated_by: user.name || user.email || "manager",
				})
				.where(eq(products.id, productId));

			try {
				notifyStockChanged(productId, user.branchId || 1);
			} catch (_) {}
		}

		return NextResponse.json({
			success: true,
			attachmentId: attachment.id,
			imageUrl,
			storagePath: storedName,
			fileName: file.name,
			fileSize: file.size,
		});
	} catch (error: any) {
		console.error("[products/upload] Error uploading product image:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to upload image." },
			{ status: 500 },
		);
	}
}
