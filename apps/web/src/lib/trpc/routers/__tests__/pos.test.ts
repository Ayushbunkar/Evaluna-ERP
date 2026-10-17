// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import * as schema from "@/lib/db/schema";
import { buildDDL, createTestDb, makeUser, SCHEMA_DDL } from "./helpers";

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const { posRouter } = await import("../pos");
const { createCallerFactory } = await import("../../init");

const caller = createCallerFactory(posRouter)({
	user: makeUser("salesperson-1"),
	db,
});

beforeAll(async () => {
	await pg.exec(SCHEMA_DDL);
	await pg.exec(
		buildDDL(
			[
				schema.staff,
				schema.products,
				schema.dailyProductDiscounts,
				schema.orders,
				schema.orderItems,
				schema.paymentMethods,
				schema.transactions,
				schema.branchInventory,
				schema.stockLedger,
				schema.pickLists,
				schema.pickListItems,
				schema.pendingSync,
				schema.coupons,
			],
			false,
		),
	);
});

afterAll(async () => {
	await pg.close();
});

describe("posRouter", () => {
	it("catalog returns products including those where is_deleted or is_hidden is NULL", async () => {
		// Insert test products with various is_deleted and is_hidden states
		await db.insert(schema.products).values([
			{
				id: 501,
				name: "Product A",
				price: "100.00",
				category: "Snacks",
				user_uid: "salesperson-1",
				is_deleted: false,
				is_hidden: false,
			},
			{
				id: 502,
				name: "Product B",
				price: "200.00",
				base_selling_price: "200.00",
				category: "Beverages",
				user_uid: "salesperson-1",
				is_deleted: null,
				is_hidden: null,
			},
			{
				id: 503,
				name: "Deleted Product",
				price: "50.00",
				user_uid: "salesperson-1",
				is_deleted: true,
			},
		]);

		const catalog = await caller.catalog();
		expect(catalog.length).toBeGreaterThanOrEqual(2);

		const prodA = catalog.find((p) => p.id === 501);
		const prodB = catalog.find((p) => p.id === 502);
		const prodDeleted = catalog.find((p) => p.id === 503);

		expect(prodA).toBeDefined();
		expect(prodB).toBeDefined();
		expect(prodDeleted).toBeUndefined();
		expect(prodB.price).toBe("200.00");
	});

	it("checkout deducts stock from branch inventory and creates stock ledger entry", async () => {
		// 1. Seed initial stock in branch inventory (100 units for Product A)
		await db.insert(schema.branchInventory).values({
			branch_id: 1,
			product_id: 501,
			in_stock: 100,
			reserved_stock: 0,
			reorder_level: 10,
		});

		// 2. Perform POS checkout selling 5 units of Product A
		const order = await caller.checkout({
			items: [
				{
					productId: 501,
					quantity: 5,
					price: "100.00",
				},
			],
			payments: [
				{
					methodId: 1,
					amount: "500.00",
				},
			],
		});

		expect(order).toBeDefined();
		expect(order.id).toBeDefined();

		// 3. Verify branch inventory is decremented: 100 - 5 = 95
		const inv = await db.query.branchInventory.findFirst({
			where: (t, { and, eq }) =>
				and(eq(t.branch_id, 1), eq(t.product_id, 501)),
		});
		expect(inv).toBeDefined();
		expect(Number(inv!.in_stock)).toBe(95);

		// 4. Verify stock ledger entry was created
		const ledger = await db.query.stockLedger.findFirst({
			where: (t, { and, eq }) =>
				and(eq(t.product_id, 501), eq(t.reference_id, order.id)),
		});
		expect(ledger).toBeDefined();
		expect(Number(ledger!.quantity)).toBe(-5);
		expect(ledger!.transaction_type).toBe("out");
	});
});
