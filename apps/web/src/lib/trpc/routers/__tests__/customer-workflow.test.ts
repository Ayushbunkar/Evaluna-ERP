// @ts-nocheck
// End-to-end verification of the Customer Ordering workflow (plan Phases 6–7):
//   customer submit (NO prices) → salesperson inbox → price + confirm → invoice.
// Also asserts tenant isolation (IDOR), no-price projections, idempotent submit,
// and the concurrent-confirm CONFLICT guarantee (single invoice).
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { eq } from "drizzle-orm";
import { buildDDL, createTestDb, makeUser } from "./helpers";

const { pg, db } = createTestDb();
// orders.ts reads the module-level `db`; customer.ts/customerProcedure read
// ctx.db. Point both at the same PGlite instance.
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const { customerRouter } = await import("../customer");
const { ordersRouter } = await import("../orders");
const { createCallerFactory } = await import("../../init");
const schema = await import("@/lib/db/schema");
const { customers, products, orders, orderItems, transactions, branchInventory } =
	schema;

// Customer callers resolve their `customers` row by ctx.user.email, so the user
// email must match a seeded customer. makeUser(id) → email `${id}@test.com`.
const customerCaller = (uid: string) =>
	createCallerFactory(customerRouter)({ user: makeUser(uid), db: db as any });
// Salesperson caller (makeUser defaults role "admin" — in every allowed list).
const salesCaller = createCallerFactory(ordersRouter)({
	user: makeUser("sales-1"),
	db: db as any,
});

const WORKFLOW_DDL = buildDDL(
	[
		schema.branches,
		schema.staff,
		schema.products,
		schema.customers,
		schema.paymentMethods,
		schema.orders,
		schema.orderItems,
		schema.transactions,
		schema.branchInventory,
		schema.stockLedger,
		schema.orderAudits,
		schema.pendingSync,
	],
	false,
);

let custAId: number;
let custBId: number;
let prod1: number;
let prod2: number;

beforeAll(async () => {
	await pg.exec(WORKFLOW_DDL);

	const [a] = await db
		.insert(customers)
		.values({
			name: "Customer A",
			email: "cust-a@test.com", // matches makeUser("cust-a")
			phone: "1111111111",
			user_uid: "cust-a",
			branch_id: 1,
			customer_code: "CUST-A",
			loyalty_points: 42,
			store_credit: "100.00",
		})
		.returning();
	custAId = a.id;

	const [b] = await db
		.insert(customers)
		.values({
			name: "Customer B",
			email: "cust-b@test.com", // matches makeUser("cust-b")
			phone: "2222222222",
			user_uid: "cust-b",
			branch_id: 1,
			customer_code: "CUST-B",
		})
		.returning();
	custBId = b.id;

	const [p1] = await db
		.insert(products)
		.values({ name: "Widget", price: "150.00", user_uid: "sys" })
		.returning();
	prod1 = p1.id;
	const [p2] = await db
		.insert(products)
		.values({ name: "Gadget", price: "300.00", user_uid: "sys" })
		.returning();
	prod2 = p2.id;

	// Branch stock so confirmOrder's deduction path runs (customers are branch 1).
	await db.insert(branchInventory).values([
		{ branch_id: 1, product_id: prod1, in_stock: 500, reserved_stock: 0 },
		{ branch_id: 1, product_id: prod2, in_stock: 500, reserved_stock: 0 },
	]);
});

afterAll(async () => {
	await pg.close();
});

describe("customerProcedure gate", () => {
	it("rejects a login with no linked customer (FORBIDDEN)", async () => {
		const stranger = customerCaller("nobody"); // nobody@test.com — no customer row
		await expect(stranger.getMyProfile()).rejects.toThrow(/customer account/i);
	});

	it("resolves the caller to their OWN customer row", async () => {
		const profile = await customerCaller("cust-a").getMyProfile();
		expect(profile.id).toBe(custAId);
		expect(profile.name).toBe("Customer A");
		expect(profile.email).toBe("cust-a@test.com");
		// Read-only profile must not leak any photo/avatar/image field (rule 1).
		expect(Object.keys(profile)).not.toContain("image");
		expect(Object.keys(profile)).not.toContain("photo_url");
		expect(Object.keys(profile)).not.toContain("avatar");
	});

	it("portal stats reflect the customer's own loyalty/wallet", async () => {
		const stats = await customerCaller("cust-a").getPortalStats();
		expect(stats.loyaltyPoints).toBe(42);
		expect(stats.walletBalance).toBe(100);
	});
});

describe("browseProducts — NO price fields (rule 2)", () => {
	it("returns catalog entries with names but zero pricing keys", async () => {
		const rows = await customerCaller("cust-a").browseProducts({});
		expect(rows.length).toBeGreaterThanOrEqual(2);
		for (const r of rows) {
			const keys = Object.keys(r);
			expect(keys).toContain("name");
			for (const forbidden of [
				"price",
				"base_selling_price",
				"base_procurement_price",
				"total",
			]) {
				expect(keys).not.toContain(forbidden);
			}
		}
	});

	it("supports search by name", async () => {
		const rows = await customerCaller("cust-a").browseProducts({
			search: "widg",
		});
		expect(rows.map((r) => r.name)).toContain("Widget");
		expect(rows.map((r) => r.name)).not.toContain("Gadget");
	});
});

describe("submitOrder — pending_review, NO prices stored/returned", () => {
	it("stores placeholder price/total and hides them from the customer", async () => {
		const key = crypto.randomUUID();
		const res = await customerCaller("cust-a").submitOrder({
			idempotencyKey: key,
			items: [
				{ productId: prod1, quantity: 2 },
				{ productId: prod2, quantity: 1 },
			],
		});
		expect(res.duplicate).toBe(false);
		expect(res.orderId).toBeGreaterThan(0);

		// DB source-of-truth: order stored pending_review with total "0".
		const [row] = await db
			.select()
			.from(orders)
			.where(eq(orders.id, res.orderId));
		expect(row.status).toBe("pending_review");
		expect(Number(row.total_amount)).toBe(0);
		expect(row.customer_id).toBe(custAId);
		const items = await db
			.select()
			.from(orderItems)
			.where(eq(orderItems.order_id, res.orderId));
		expect(items.length).toBe(2);
		expect(items.every((i) => Number(i.price) === 0)).toBe(true);

		// Customer detail projection hides price/total while pending.
		const detail = await customerCaller("cust-a").getMyOrder({
			id: res.orderId,
		});
		expect(detail.priceVisible).toBe(false);
		expect(detail.total).toBeNull();
		expect(detail.items.every((i) => i.price === null)).toBe(true);
		expect(detail.items.every((i) => i.lineTotal === null)).toBe(true);
		expect(detail.items.every((i) => i.quantity > 0)).toBe(true);
	});

	it("is idempotent — repeated key returns the same order, no duplicate", async () => {
		const key = crypto.randomUUID();
		const first = await customerCaller("cust-a").submitOrder({
			idempotencyKey: key,
			items: [{ productId: prod1, quantity: 1 }],
		});
		const second = await customerCaller("cust-a").submitOrder({
			idempotencyKey: key,
			items: [{ productId: prod1, quantity: 1 }],
		});
		expect(second.duplicate).toBe(true);
		expect(second.orderId).toBe(first.orderId);
	});

	it("rejects an order of only invalid products", async () => {
		await expect(
			customerCaller("cust-a").submitOrder({
				idempotencyKey: crypto.randomUUID(),
				items: [{ productId: 999999, quantity: 1 }],
			}),
		).rejects.toThrow();
	});
});

describe("tenant isolation (IDOR — rule 4)", () => {
	it("customer B cannot read customer A's order", async () => {
		const a = await customerCaller("cust-a").submitOrder({
			idempotencyKey: crypto.randomUUID(),
			items: [{ productId: prod1, quantity: 1 }],
		});
		// B asking for A's order id → NOT_FOUND (scoped by customer_id), never data.
		await expect(
			customerCaller("cust-b").getMyOrder({ id: a.orderId }),
		).rejects.toThrow();
		// And A's order never appears in B's list.
		const bList = await customerCaller("cust-b").getMyOrders();
		expect(bList.some((o) => o.id === a.orderId)).toBe(false);
	});

	it("getMyOrders returns only the caller's own orders", async () => {
		const aList = await customerCaller("cust-a").getMyOrders();
		expect(aList.length).toBeGreaterThan(0);
		// Every listed order id belongs to A (verified against the DB).
		for (const o of aList) {
			const [row] = await db
				.select()
				.from(orders)
				.where(eq(orders.id, o.id));
			expect(row.customer_id).toBe(custAId);
		}
	});
});

describe("full flow: submit → inbox → price → confirm → invoice", () => {
	let orderId: number;

	it("submitted order appears in the salesperson inbox (offline-safe, DB-backed)", async () => {
		const res = await customerCaller("cust-a").submitOrder({
			idempotencyKey: crypto.randomUUID(),
			items: [
				{ productId: prod1, quantity: 2 },
				{ productId: prod2, quantity: 3 },
			],
		});
		orderId = res.orderId;

		// No salesperson was "online" at submit time — it simply persisted. The
		// inbox reads it straight from the DB whenever staff next log in.
		const inbox = await salesCaller.listPendingReview();
		const row = inbox.find((o) => o.id === orderId);
		expect(row).toBeDefined();
		expect(row!.status).toBe("pending_review");
		expect(row!.customerName).toBe("Customer A");
		expect(row!.customerPhone).toBe("1111111111");
		expect(row!.itemsCount).toBe(2);
	});

	it("salesperson applies ERP pricing (moves to under_review)", async () => {
		const priced = await salesCaller.updateReviewItems({
			id: orderId,
			items: [
				{ productId: prod1, quantity: 2, price: 150 },
				{ productId: prod2, quantity: 3, price: 300 },
			],
			discountAmount: 100,
		});
		expect(priced.subtotal).toBe(2 * 150 + 3 * 300); // 1200
		expect(priced.total).toBe(1200 - 100); // 1100
		const [row] = await db.select().from(orders).where(eq(orders.id, orderId));
		expect(row.status).toBe("under_review");
	});

	it("customer STILL sees no prices while under_review", async () => {
		const detail = await customerCaller("cust-a").getMyOrder({ id: orderId });
		expect(detail.priceVisible).toBe(false);
		expect(detail.total).toBeNull();
		// Invoice must not be available before confirmation.
		await expect(
			customerCaller("cust-a").getMyInvoice({ id: orderId }),
		).rejects.toThrow();
	});

	it("confirm finalizes: locks, deducts stock, writes ONE income transaction", async () => {
		const before = (
			await db.select().from(branchInventory).where(eq(branchInventory.product_id, prod1))
		)[0].in_stock;

		const confirmed = await salesCaller.confirmOrder({ id: orderId });
		expect(confirmed.success).toBe(true);
		expect(confirmed.invoiceNo).toBe(`INV-${orderId}`);
		expect(confirmed.total).toBe(1100);

		const [row] = await db.select().from(orders).where(eq(orders.id, orderId));
		expect(row.status).toBe("confirmed");
		expect(row.locked).toBe(true);

		// Stock deducted by ordered qty (2 of prod1).
		const after = (
			await db.select().from(branchInventory).where(eq(branchInventory.product_id, prod1))
		)[0].in_stock;
		expect(before - after).toBe(2);

		// Exactly one income transaction for this order.
		const txns = await db
			.select()
			.from(transactions)
			.where(eq(transactions.order_id, orderId));
		expect(txns.length).toBe(1);
		expect(txns[0].category).toBe("sale");
		expect(txns[0].status).toBe("completed");
		expect(Number(txns[0].amount)).toBe(1100);
	});

	it("customer now sees prices + a full invoice", async () => {
		const detail = await customerCaller("cust-a").getMyOrder({ id: orderId });
		expect(detail.priceVisible).toBe(true);
		expect(detail.total).toBe(1100);
		expect(detail.items.every((i) => typeof i.price === "number")).toBe(true);

		const inv = await customerCaller("cust-a").getMyInvoice({ id: orderId });
		expect(inv.invoiceNo).toBe(`INV-${orderId}`);
		expect(inv.subtotal).toBe(1200);
		expect(inv.discount).toBe(100);
		expect(inv.total).toBe(1100);
		expect(inv.items.length).toBe(2);
	});

	it("re-confirming a locked order is a CONFLICT (never double-invoices)", async () => {
		await expect(salesCaller.confirmOrder({ id: orderId })).rejects.toThrow(
			/reviewable|confirmed/i,
		);
		// Still exactly one transaction — no double bill.
		const txns = await db
			.select()
			.from(transactions)
			.where(eq(transactions.order_id, orderId));
		expect(txns.length).toBe(1);
	});
});
