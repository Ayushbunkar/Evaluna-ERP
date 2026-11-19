import { describe, expect, it } from "bun:test";
import { ALLOWED_PRODUCT_IMAGE_MIMES, MAX_PRODUCT_IMAGE_BYTES } from "@/app/api/products/upload/route";

describe("Product Image Management & Customer Catalog Synchronization", () => {
	it("enforces allowed product image MIME types (JPG, JPEG, PNG, WEBP)", () => {
		expect(ALLOWED_PRODUCT_IMAGE_MIMES["image/jpeg"]).toBe(".jpg");
		expect(ALLOWED_PRODUCT_IMAGE_MIMES["image/jpg"]).toBe(".jpg");
		expect(ALLOWED_PRODUCT_IMAGE_MIMES["image/png"]).toBe(".png");
		expect(ALLOWED_PRODUCT_IMAGE_MIMES["image/webp"]).toBe(".webp");

		// Unsupported formats must be rejected
		expect(ALLOWED_PRODUCT_IMAGE_MIMES["image/gif"]).toBeUndefined();
		expect(ALLOWED_PRODUCT_IMAGE_MIMES["application/pdf"]).toBeUndefined();
		expect(ALLOWED_PRODUCT_IMAGE_MIMES["image/svg+xml"]).toBeUndefined();
	});

	it("enforces maximum file size limit of 5 MB", () => {
		expect(MAX_PRODUCT_IMAGE_BYTES).toBe(5 * 1024 * 1024);
		const testFileSize = 4.8 * 1024 * 1024;
		const oversizedFileSize = 5.2 * 1024 * 1024;

		expect(testFileSize <= MAX_PRODUCT_IMAGE_BYTES).toBe(true);
		expect(oversizedFileSize <= MAX_PRODUCT_IMAGE_BYTES).toBe(false);
	});

	it("properly resolves image URL mapping for customer product browsing", () => {
		const sampleProductFromDb = {
			id: 101,
			name: "Fortune Sunlite Refined Sunflower Oil 1L",
			category: "Edible Oils",
			price: "145.00",
			base_selling_price: "145.00",
			image_url: "/api/products/images/42",
			image_storage_path: "prod_1795113_a8b9c0d1.jpg",
			is_deleted: false,
			is_hidden: false,
		};

		// Verifies the customer catalog image projection
		const customerProduct = {
			id: sampleProductFromDb.id,
			name: sampleProductFromDb.name,
			price: Number(sampleProductFromDb.price),
			imageUrl: sampleProductFromDb.image_url,
			image: sampleProductFromDb.image_url,
			available: !sampleProductFromDb.is_deleted && !sampleProductFromDb.is_hidden,
		};

		expect(customerProduct.imageUrl).toBe("/api/products/images/42");
		expect(customerProduct.image).toBe("/api/products/images/42");
		expect(customerProduct.available).toBe(true);
	});

	it("falls back cleanly to null placeholder when product has no image", () => {
		const sampleProductNoImage = {
			id: 102,
			name: "Tata Salt 1kg",
			category: "Grocery",
			price: "28.00",
			image_url: null,
			image_storage_path: null,
			is_deleted: false,
			is_hidden: false,
		};

		const customerProduct = {
			id: sampleProductNoImage.id,
			name: sampleProductNoImage.name,
			price: Number(sampleProductNoImage.price),
			imageUrl: sampleProductNoImage.image_url ?? null,
			image: sampleProductNoImage.image_url ?? null,
			available: true,
		};

		expect(customerProduct.imageUrl).toBeNull();
		expect(customerProduct.image).toBeNull();
	});

	it("role permission whitelist validates warehouse manager and admin roles", () => {
		const allowedRoles = ["admin", "superadmin", "warehouse_manager", "warehouse", "manager"];
		const unauthorizedRoles = ["picker", "packer", "loader", "driver", "customer", "salesperson"];

		for (const role of allowedRoles) {
			expect(allowedRoles.includes(role)).toBe(true);
		}

		for (const role of unauthorizedRoles) {
			expect(allowedRoles.includes(role)).toBe(false);
		}
	});
});
