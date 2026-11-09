// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { buildDDL, createTestDb, makeFinanceUser, makeUser, SCHEMA_DDL } from "./helpers";

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const { inventoryRouter } = await import("../inventory");
const { productsRouter } = await import("../products");
const { createCallerFactory } = await import("../../init");

const warehouseUser = makeFinanceUser({
	id: "wh-user-1",
	email: "warehouse@test.com",
	role: "warehouse_supervisor",
	branchId: 1,
	permissions: ["products.write", "inventory.write"],
});

const invCaller = createCallerFactory(inventoryRouter)({
	user: warehouseUser,
	db,
});

const prodCaller = createCallerFactory(productsRouter)({
	user: {
		...makeUser("prod-user-1"),
		permissions: ["products.write"],
	},
	db,
});

beforeAll(async () => {
	await pg.exec(SCHEMA_DDL);
	await pg.exec(
		buildDDL(
			[
				schema.branches,
				schema.staff,
				schema.products,
				schema.branchInventory,
				schema.stockLedger,
				schema.priceChangeHistory,
				schema.auditLogs,
			],
			false,
		),
	);

	// Insert branch 1
	await db.insert(schema.branches).values({
		id: 1,
		name: "Main Central Warehouse",
		code: "MAIN-01",
	});
});

afterAll(async () => {
	await pg.close();
});

describe("Warehouse Duplicate Item Prevention (Double Entry Guard)", () => {
	it("adds a new item to stock successfully when unique", async () => {
		const res = await invCaller.addItem({
			name: "Amul Gold Milk 500ml",
			sku: "MILK-AG-500",
			price: 34,
			costPrice: 30,
			category: "Dairy",
			unit: "Pcs",
			initialStock: 25,
			reorderLevel: 5,
			branchId: 1,
		});

		expect(res.success).toBe(true);
		expect(res.product.name).toBe("Amul Gold Milk 500ml");
		expect(Number(res.inventory.in_stock)).toBe(25);
	});

	it("blocks duplicate item with the exact same name (case-insensitive)", async () => {
		// Attempt to add "amul gold milk 500ml" with lowercase and spacing
		await expect(
			invCaller.addItem({
				name: "  amul gold milk 500ml  ",
				sku: "DIFF-SKU-999",
				price: 35,
				branchId: 1,
			}),
		).rejects.toThrow(/already exists/i);
	});

	it("blocks duplicate item with the exact same SKU", async () => {
		await expect(
			invCaller.addItem({
				name: "Brand New Milk Product",
				sku: "MILK-AG-500",
				price: 36,
				branchId: 1,
			}),
		).rejects.toThrow(/already exists/i);
	});

	it("checkExistingProduct detects existing product by name or SKU", async () => {
		const checkByName = await invCaller.checkExistingProduct({
			name: "Amul Gold Milk 500ml",
			branchId: 1,
		});

		expect(checkByName.exists).toBe(true);
		expect(checkByName.product).toBeDefined();
		expect(checkByName.product.name).toBe("Amul Gold Milk 500ml");
		expect(Number(checkByName.product.qty_on_hand)).toBe(25);

		const checkBySku = await invCaller.checkExistingProduct({
			sku: "MILK-AG-500",
			branchId: 1,
		});
		expect(checkBySku.exists).toBe(true);

		const checkNonExistent = await invCaller.checkExistingProduct({
			name: "Completely Unique Item 123456",
			sku: "UNQ-9999",
			branchId: 1,
		});
		expect(checkNonExistent.exists).toBe(false);
		expect(checkNonExistent.product).toBeNull();
	});

	it("products.create blocks duplicate item creation", async () => {
		await expect(
			prodCaller.create({
				name: "Amul Gold Milk 500ml",
				price: 34,
			}),
		).rejects.toThrow(/already exists/i);
	});

	it("updateStockAndPrice blocks renaming to another already existing product name", async () => {
		// First add a second item
		const second = await invCaller.addItem({
			name: "Amul Butter 100g",
			sku: "BUTTER-100",
			price: 58,
			branchId: 1,
		});

		// Now attempt to rename second item to first item's name
		await expect(
			invCaller.updateStockAndPrice({
				productId: second.product.id,
				name: "Amul Gold Milk 500ml",
				price: 58,
				qtyOnHand: 10,
				branchId: 1,
			}),
		).rejects.toThrow(/already exists/i);
	});
});
