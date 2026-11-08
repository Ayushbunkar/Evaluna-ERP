// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { eq } from "drizzle-orm";
import { buildDDL, createTestDb, makeUser } from "./helpers";

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const { salesReturnsRouter } = await import("../sales-returns");
const { createCallerFactory } = await import("../../init");
const schema = await import("@/lib/db/schema");

const adminCaller = createCallerFactory(salesReturnsRouter)({
	user: makeUser("admin-1", { role: "admin", branchId: 1 }),
	db,
});

const salesCaller = createCallerFactory(salesReturnsRouter)({
	user: makeUser("sales-1", { role: "sales_person", branchId: 1 }),
	db,
});

const RETURNS_DDL = buildDDL(
	[
		schema.branches,
		schema.user,
		schema.customers,
		schema.orders,
		schema.orderItems,
		schema.products,
		schema.branchInventory,
		schema.salesReturns,
		schema.salesReturnItems,
		schema.transactions,
		schema.auditLogs,
	],
	false,
);

describe("Sales Returns Workflow & Error Prevention", () => {
	let orderId: number;
	let customerId: number;
	let product1Id: number;
	let product2Id: number;

	beforeAll(async () => {
		await pg.exec(RETURNS_DDL);

		// Seed branch
		await pg.exec(`
			INSERT INTO branches (id, name, code) VALUES (1, 'Main Branch', 'MB-01');
			INSERT INTO "user" (id, name, email) VALUES ('sales-1', 'Sales Person', 'sales@test.com'), ('admin-1', 'Admin', 'admin@test.com');
		`);

		// Seed customer
		const [cust] = await db
			.insert(schema.customers)
			.values({
				name: "Vinod Goswami",
				phone: "9876543210",
				user_uid: "sales-1",
				branch_id: 1,
			})
			.returning();
		customerId = cust.id;

		// Seed products
		const [p1] = await db
			.insert(schema.products)
			.values({
				name: "Rajshree Rs 10",
				sku: "RAJ-10",
				price: "190.00",
				user_uid: "sales-1",
			})
			.returning();
		product1Id = p1.id;

		const [p2] = await db
			.insert(schema.products)
			.values({
				name: "Rajshree Rs 20",
				sku: "RAJ-20",
				price: "240.00",
				user_uid: "sales-1",
			})
			.returning();
		product2Id = p2.id;

		// Seed initial inventory
		await db.insert(schema.branchInventory).values([
			{
				branch_id: 1,
				product_id: product1Id,
				in_stock: "20.000",
			},
			{
				branch_id: 1,
				product_id: product2Id,
				in_stock: "15.000",
			},
		]);

		// Seed order
		const [ord] = await db
			.insert(schema.orders)
			.values({
				customer_id: customerId,
				total_amount: "620.00",
				bill_number: "INV-2026-001",
				status: "completed",
				user_uid: "sales-1",
				branch_id: 1,
			})
			.returning();
		orderId = ord.id;
	});

	let createdReturnId: number;

	it("creates a single & multi-item return without condition/reason SQL errors", async () => {
		const res = await salesCaller.create({
			orderId,
			customerId,
			items: [
				{
					productId: product1Id,
					quantity: 2,
					price: 190,
					refundAmount: 380,
					condition: "good",
					reason: "Customer Changed Mind",
				},
				{
					productId: product2Id,
					quantity: 1,
					price: 240,
					refundAmount: 240,
					condition: "good",
					reason: "Customer Changed Mind",
				},
			],
			totalAmount: 620,
			reason: "Customer Changed Mind",
			notes: "20 wala Rajshree kam tha isliye return",
		});

		expect(res).toBeDefined();
		expect(res.id).toBeDefined();
		createdReturnId = res.id;
		expect(res.status).toBe("pending");
		expect(res.reason).toBe("Customer Changed Mind");
		expect(res.notes).toBe("20 wala Rajshree kam tha isliye return");

		// Verify items in DB
		const items = await db
			.select()
			.from(schema.salesReturnItems)
			.where(eq(schema.salesReturnItems.return_id, createdReturnId));
		expect(items.length).toBe(2);
		expect(items[0].condition).toBe("good");
		expect(items[0].reason).toBe("Customer Changed Mind");
	});

	it("lists sales returns with customer and item details", async () => {
		const list = await salesCaller.list();
		expect(list.length).toBeGreaterThan(0);
		const found = list.find((r) => r.id === createdReturnId);
		expect(found).toBeDefined();
		expect(found.returnItems.length).toBe(2);
	});

	it("processes return, increments inventory accurately and records transaction", async () => {
		const processed = await adminCaller.process({ id: createdReturnId });
		expect(processed.status).toBe("processed");

		// Check inventory restored: product 1 was 20 + 2 = 22, product 2 was 15 + 1 = 16
		const [inv1] = await db
			.select()
			.from(schema.branchInventory)
			.where(eq(schema.branchInventory.product_id, product1Id));
		expect(parseFloat(inv1.in_stock)).toBe(22);

		const [inv2] = await db
			.select()
			.from(schema.branchInventory)
			.where(eq(schema.branchInventory.product_id, product2Id));
		expect(parseFloat(inv2.in_stock)).toBe(16);

		// Check refund transaction
		const txs = await db
			.select()
			.from(schema.transactions)
			.where(eq(schema.transactions.category, "refund"));
		expect(txs.length).toBeGreaterThan(0);
	});

	it("rejects a pending return with reason notes", async () => {
		const newRet = await salesCaller.create({
			orderId,
			customerId,
			items: [
				{
					productId: product1Id,
					quantity: 1,
					price: 190,
					refundAmount: 190,
					condition: "damaged",
				},
			],
			totalAmount: 190,
		});

		const rejected = await adminCaller.reject({
			id: newRet.id,
			reason: "Packaging opened and damaged",
		});
		expect(rejected.status).toBe("rejected");
		expect(rejected.notes).toContain("Packaging opened and damaged");
	});

	afterAll(async () => {
		try {
			await pg.close();
		} catch (e) {}
	});
});
