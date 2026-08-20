// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { eq } from "drizzle-orm";
import { buildDDL, createTestDb, makeUser } from "./helpers";

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const { ordersRouter } = await import("../orders");
const { createCallerFactory } = await import("../../init");
const schema = await import("@/lib/db/schema");
const {
	customers,
	products,
	paymentMethods,
	transactions,
	orderItems,
	branchInventory,
} = schema;

const caller = createCallerFactory(ordersRouter)({ user: makeUser("user-1") });
const callerAs = (uid: string) =>
	createCallerFactory(ordersRouter)({ user: makeUser(uid) });

let customerId: number;
let productId: number;
let paymentMethodId: number;

// orders.create/delete touch many tables (inventory, audit log, and every
// order-child table cleaned up on delete). Build DDL for all of them (FKs off).
const ORDERS_DDL = buildDDL(
	[
		schema.branches,
		schema.customers,
		schema.products,
		schema.paymentMethods,
		schema.orders,
		schema.orderItems,
		schema.transactions,
		schema.branchInventory,
		schema.auditLogs,
		schema.stockLedger,
		schema.pendingSync,
		schema.eWayBills,
		schema.salesReturns,
		schema.salesReturnItems,
		schema.pickLists,
		schema.pickListItems,
		schema.packLists,
		schema.loyaltyHistory,
		schema.orderAudits,
		schema.proofOfDeliveries,
		schema.deliveryStops,
	],
	false,
);

beforeAll(async () => {
	await pg.exec(ORDERS_DDL);

	const [cust] = await db
		.insert(customers)
		.values({
			name: "Test Customer",
			email: "order-test@t.com",
			user_uid: "user-1",
		})
		.returning();
	customerId = cust.id;

	const [prod] = await db
		.insert(products)
		.values({
			name: "Test Product",
			price: "1000.00",
			user_uid: "user-1",
		})
		.returning();
	productId = prod.id;

	const [pm] = await db
		.insert(paymentMethods)
		.values({ name: "Cash-OrderTest" })
		.returning();
	paymentMethodId = pm.id;

	// create() validates + reserves branch inventory (branch defaults to 1).
	// Seed plenty of stock so repeated orders never exhaust it.
	await db.insert(branchInventory).values({
		branch_id: 1,
		product_id: productId,
		in_stock: 1_000_000,
		reserved_stock: 0,
		reorder_level: 10,
	});
});

afterAll(async () => {
	await pg.close();
});

describe("orders.list", () => {
	it("returns empty array initially", async () => {
		const list = await caller.list();
		expect(list).toEqual([]);
		expect(list.length).toBe(0);
	});

	it("returns order with nested customer after create", async () => {
		await caller.create({
			customerId,
			paymentMethodId,
			products: [{ id: productId, quantity: 2, price: 1000 }],
			total: 2000,
		});

		const list = await caller.list();
		expect(list.length).toBe(1);
		const order = list[0];
		expect(order.customer).toBeDefined();
		expect(order.customer?.name).toBe("Test Customer");
		expect(Number(order.total_amount)).toBe(2000);
		expect(order.user_uid).toBe("user-1");
	});

	it("filters by user_uid — other user sees nothing", async () => {
		const other = callerAs("outsider");
		const otherList = await other.list();
		expect(otherList.length).toBe(0);

		const myList = await caller.list();
		expect(myList.every((o) => o.user_uid === "user-1")).toBe(true);
		expect(myList.length).toBeGreaterThanOrEqual(1);
	});
});

describe("orders.create", () => {
	it("creates order + orderItems + transaction atomically", async () => {
		const before = await caller.list();
		const order = await caller.create({
			customerId,
			paymentMethodId,
			products: [{ id: productId, quantity: 3, price: 1000 }],
			total: 3000,
		});

		expect(order.id).toBeGreaterThan(0);
		expect(Number(order.total_amount)).toBe(3000);
		expect(order.status).toBe("completed");
		expect(order.customer?.name).toBe("Test Customer");

		const after = await caller.list();
		expect(after.length).toBe(before.length + 1);

		const items = await db
			.select()
			.from(orderItems)
			.where(eq(orderItems.order_id, order.id));
		expect(items.length).toBe(1);
		expect(items[0].quantity).toBe(3);
		expect(Number(items[0].price)).toBe(1000);
		expect(items[0].product_id).toBe(productId);

		const txns = await db
			.select()
			.from(transactions)
			.where(eq(transactions.order_id, order.id));
		expect(txns.length).toBe(1);
		expect(Number(txns[0].amount)).toBe(3000);
		expect(txns[0].type).toBe("income");
		expect(txns[0].category).toBe("selling");
		expect(txns[0].status).toBe("completed");
		expect(txns[0].user_uid).toBe("user-1");
		expect(txns[0].payment_method_id).toBe(paymentMethodId);
	});

	it("rejects quantity: 0 — no order created", async () => {
		const before = await caller.list();
		await expect(
			caller.create({
				customerId,
				paymentMethodId,
				products: [{ id: productId, quantity: 0, price: 1000 }],
				total: 0,
			}),
		).rejects.toThrow();
		const after = await caller.list();
		expect(after.length).toBe(before.length);
	});
});

describe("orders.update", () => {
	it("updates status and change persists in list()", async () => {
		const order = await caller.create({
			customerId,
			paymentMethodId,
			products: [{ id: productId, quantity: 1, price: 500 }],
			total: 500,
		});
		const updated = await caller.update({ id: order.id, status: "cancelled" });
		expect(updated.status).toBe("cancelled");

		const list = await caller.list();
		const persisted = list.find((o) => o.id === order.id)!;
		expect(persisted.status).toBe("cancelled");
		expect(Number(persisted.total_amount)).toBe(500); // unchanged field preserved
	});

	it("rejects invalid status enum", async () => {
		const order = await caller.create({
			customerId,
			paymentMethodId,
			products: [{ id: productId, quantity: 1, price: 500 }],
			total: 500,
		});
		await expect(
			caller.update({ id: order.id, status: "bogus" as any }),
		).rejects.toThrow();

		const list = await caller.list();
		const persisted = list.find((o) => o.id === order.id)!;
		expect(persisted.status).toBe("completed");
	});
});

describe("orders.delete", () => {
	it("deletes order + orderItems — both gone from DB", async () => {
		const order = await caller.create({
			customerId,
			paymentMethodId,
			products: [{ id: productId, quantity: 1, price: 100 }],
			total: 100,
		});

		const before = await caller.list();
		await caller.delete({ id: order.id });
		const after = await caller.list();

		expect(after.length).toBe(before.length - 1);
		expect(after.some((o) => o.id === order.id)).toBe(false);

		const items = await db
			.select()
			.from(orderItems)
			.where(eq(orderItems.order_id, order.id));
		expect(items.length).toBe(0);
	});

	it("removes the order together with its referencing transaction", async () => {
		const order = await caller.create({
			customerId,
			paymentMethodId,
			products: [{ id: productId, quantity: 1, price: 100 }],
			total: 100,
		});

		const txnBefore = await db
			.select()
			.from(transactions)
			.where(eq(transactions.order_id, order.id));
		expect(txnBefore.length).toBe(1);

		await caller.delete({ id: order.id });

		const list = await caller.list();
		expect(list.some((o) => o.id === order.id)).toBe(false);

		// The delete handler cascades cleanup, so the transaction is gone too.
		const txnAfter = await db
			.select()
			.from(transactions)
			.where(eq(transactions.order_id, order.id));
		expect(txnAfter.length).toBe(0);
	});

	it("is idempotent — deleting non-existent id is no-op", async () => {
		const before = await caller.list();
		const result = await caller.delete({ id: 999999 });
		expect(result.success).toBe(true);
		const after = await caller.list();
		expect(after.length).toBe(before.length);
	});
});
