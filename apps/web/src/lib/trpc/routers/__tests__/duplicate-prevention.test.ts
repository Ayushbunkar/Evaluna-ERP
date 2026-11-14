// @ts-nocheck
import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
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
				schema.user,
				schema.branches,
				schema.staff,
				schema.products,
				schema.branchInventory,
				schema.stockLedger,
				schema.priceChangeHistory,
				schema.auditLogs,
				schema.dailyProductPricing,
				schema.dailyProductDiscounts,
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

	// Insert staff 1 for warehouseUser
	await db.insert(schema.staff).values({
		id: 1,
		name: "Warehouse Supervisor",
		staff_code: "STAFF-WH01",
		email: "warehouse@test.com",
		role: "warehouse_supervisor",
		join_date: new Date(),
		salary: "40000.00",
		branch_id: 1,
	});
});

beforeEach(async () => {
	try {
		await pg.exec("ROLLBACK;");
	} catch (e) {}
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
		expect(res.product.name).toContain("Amul Gold Milk 500ml");
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
		expect(checkByName.product.name).toContain("Amul Gold Milk 500ml");
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

	it("updateStockAndPrice allows updating when another soft-deleted product has the same name", async () => {
		const second = await invCaller.addItem({
			name: "Sample Snack 50g",
			sku: "SNACK-50G",
			price: 20,
			branchId: 1,
		});

		// Mark it deleted in DB
		await db
			.update(schema.products)
			.set({ is_deleted: true })
			.where(eq(schema.products.id, second.product.id));

		const activeProduct = await invCaller.addItem({
			name: "Active Snack 100g",
			sku: "SNACK-ACTIVE-100G",
			price: 40,
			branchId: 1,
		});

		// Renaming activeProduct to the soft-deleted item's name should NOT throw conflict
		const updated = await invCaller.updateStockAndPrice({
			productId: activeProduct.product.id,
			name: "Sample Snack 50g",
			price: 25,
			qtyOnHand: 50,
			branchId: 1,
		});

		expect(updated).toBeDefined();
	});

	it("supports decimal/fractional stock quantities (e.g. 13.5 kg) in addItem and updateStockAndPrice", async () => {
		// 1. Add item with decimal initial stock: 13.5
		const created = await invCaller.addItem({
			name: "Chana Prasad Special",
			sku: "CHANA-135",
			price: 110,
			costPrice: 98,
			unit: "kg",
			initialStock: 13.5,
			branchId: 1,
		});

		expect(created.product.id).toBeDefined();

		// Check branch inventory stock
		const [inv] = await db
			.select()
			.from(schema.branchInventory)
			.where(eq(schema.branchInventory.product_id, created.product.id));

		expect(Number(inv.in_stock)).toBe(13.5);

		// Check stock ledger quantity
		const [ledger] = await db
			.select()
			.from(schema.stockLedger)
			.where(eq(schema.stockLedger.product_id, created.product.id));

		expect(Number(ledger.quantity)).toBe(13.5);

		// 2. Update stock to another decimal: 25.75
		await invCaller.updateStockAndPrice({
			productId: created.product.id,
			qtyOnHand: 25.75,
			price: 115,
			branchId: 1,
		});

		const [invUpdated] = await db
			.select()
			.from(schema.branchInventory)
			.where(eq(schema.branchInventory.product_id, created.product.id));

		expect(Number(invUpdated.in_stock)).toBe(25.75);

		// 3. Verify inventory.list returns 25.75
		const listRes = await invCaller.list({
			search: "Chana Prasad Special",
			branchId: 1,
		});
		const found = listRes.items.find((i) => i.productId === created.product.id);
		expect(found).toBeDefined();
		expect(found?.qty_on_hand).toBe(25.75);
	});
});
