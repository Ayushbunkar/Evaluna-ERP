// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { eq } from "drizzle-orm";
import { buildDDL, createTestDb, makeUser } from "./helpers";

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const { customerRouter, ensureCartTables } = await import("../customer");
const { createCallerFactory } = await import("../../init");
const schema = await import("@/lib/db/schema");
const {
	customers,
	products,
	orders,
	orderItems,
	carts,
	cartItems,
	branchInventory,
	pendingSync,
} = schema;

const customerCaller = (uid: string) =>
	createCallerFactory(customerRouter)({ user: makeUser(uid), db: db as any });

const CART_DDL = buildDDL(
	[
		schema.branches,
		schema.staff,
		schema.products,
		schema.customers,
		schema.paymentMethods,
		schema.orders,
		schema.orderItems,
		schema.branchInventory,
		schema.carts,
		schema.cartItems,
		schema.pendingSync,
	],
	false,
);

let custAId: number;
let custBId: number;
let prod1: number;
let prod2: number;

beforeAll(async () => {
	await pg.exec(CART_DDL);
	await ensureCartTables(db);

	const [a] = await db
		.insert(customers)
		.values({
			name: "Cart Customer A",
			email: "cart-cust-a@test.com",
			phone: "9876543210",
			user_uid: "cart-cust-a",
			branch_id: 1,
			customer_code: "CUST-CART-A",
		})
		.returning();
	custAId = a.id;

	const [b] = await db
		.insert(customers)
		.values({
			name: "Cart Customer B",
			email: "cart-cust-b@test.com",
			phone: "9876543211",
			user_uid: "cart-cust-b",
			branch_id: 1,
			customer_code: "CUST-CART-B",
		})
		.returning();
	custBId = b.id;

	const [p1] = await db
		.insert(products)
		.values({
			name: "Fortune Refined Oil 1L",
			price: "150.00",
			base_selling_price: "150.00",
			sku: "SKU-OIL-1L",
			unit: "Pcs",
			user_uid: "sys",
		})
		.returning();
	prod1 = p1.id;

	const [p2] = await db
		.insert(products)
		.values({
			name: "Basmati Rice 5kg",
			price: "450.00",
			base_selling_price: "450.00",
			sku: "SKU-RICE-5K",
			unit: "Bag",
			user_uid: "sys",
		})
		.returning();
	prod2 = p2.id;

	await db.insert(branchInventory).values([
		{ branch_id: 1, product_id: prod1, in_stock: 100, reserved_stock: 0 },
		{ branch_id: 1, product_id: prod2, in_stock: 50, reserved_stock: 0 },
	]);
});

afterAll(async () => {
	await pg.close();
});

describe("Persistent Shopping Cart & Order Confirmation Workflow", () => {
	it("initializes an empty active cart on first query", async () => {
		const caller = customerCaller("cart-cust-a");
		const cart = await caller.getCart();

		expect(cart).toBeDefined();
		expect(cart.itemCount).toBe(0);
		expect(cart.totalQuantity).toBe(0);
		expect(cart.subtotal).toBe(0);
		expect(cart.items).toHaveLength(0);
	});

	it("adds product to cart and computes authoritative line totals", async () => {
		const caller = customerCaller("cart-cust-a");
		const updated = await caller.addToCart({ productId: prod1, quantity: 2 });

		expect(updated.itemCount).toBe(1);
		expect(updated.totalQuantity).toBe(2);
		expect(updated.subtotal).toBe(300); // 2 * 150.00
		expect(updated.items[0].productId).toBe(prod1);
		expect(updated.items[0].productName).toBe("Fortune Refined Oil 1L");
		expect(updated.items[0].quantity).toBe(2);
	});

	it("merges quantities when adding the same product again", async () => {
		const caller = customerCaller("cart-cust-a");
		// Add 3 more units of prod1
		const updated = await caller.addToCart({ productId: prod1, quantity: 3 });

		expect(updated.itemCount).toBe(1); // Still 1 distinct item line
		expect(updated.totalQuantity).toBe(5); // 2 + 3 = 5
		expect(updated.subtotal).toBe(750); // 5 * 150.00
		expect(updated.items[0].quantity).toBe(5);
	});

	it("adds multiple distinct items to cart", async () => {
		const caller = customerCaller("cart-cust-a");
		const updated = await caller.addToCart({ productId: prod2, quantity: 2 });

		expect(updated.itemCount).toBe(2);
		expect(updated.totalQuantity).toBe(7); // 5 oil + 2 rice
		expect(updated.subtotal).toBe(1650); // (5 * 150) + (2 * 450) = 750 + 900 = 1650
	});

	it("updates cart item quantity directly with decimal support", async () => {
		const caller = customerCaller("cart-cust-a");
		const updated = await caller.updateCartItemQuantity({
			productId: prod1,
			quantity: 2.5,
		});

		const oilItem = updated.items.find((i: any) => i.productId === prod1);
		expect(oilItem).toBeDefined();
		expect(oilItem?.quantity).toBe(2.5);
	});

	it("removes item from cart when quantity is updated to 0", async () => {
		const caller = customerCaller("cart-cust-a");
		const updated = await caller.updateCartItemQuantity({
			productId: prod1,
			quantity: 0,
		});

		const oilItem = updated.items.find((i: any) => i.productId === prod1);
		expect(oilItem).toBeUndefined();
		expect(updated.itemCount).toBe(1); // Only prod2 remains
	});

	it("removes a specific item with removeFromCart", async () => {
		const caller = customerCaller("cart-cust-a");
		const updated = await caller.removeFromCart({ productId: prod2 });

		expect(updated.itemCount).toBe(0);
		expect(updated.items).toHaveLength(0);
	});

	it("enforces tenant isolation between different customers' carts", async () => {
		const callerA = customerCaller("cart-cust-a");
		const callerB = customerCaller("cart-cust-b");

		// Customer A adds 1 item
		await callerA.addToCart({ productId: prod1, quantity: 1 });

		// Customer B adds 10 items of prod2
		await callerB.addToCart({ productId: prod2, quantity: 10 });

		const cartA = await callerA.getCart();
		const cartB = await callerB.getCart();

		expect(cartA.itemCount).toBe(1);
		expect(cartA.items[0].productId).toBe(prod1);
		expect(cartA.items[0].quantity).toBe(1);

		expect(cartB.itemCount).toBe(1);
		expect(cartB.items[0].productId).toBe(prod2);
		expect(cartB.items[0].quantity).toBe(10);
	});

	it("clears cart with clearCart", async () => {
		const callerB = customerCaller("cart-cust-b");
		const clearRes = await callerB.clearCart();
		expect(clearRes.success).toBe(true);

		const cartB = await callerB.getCart();
		expect(cartB.itemCount).toBe(0);
		expect(cartB.items).toHaveLength(0);
	});

	it("checkouts cart: creates order in pending_review, creates orderItems, and clears cart", async () => {
		const callerA = customerCaller("cart-cust-a");
		// Cart A already has 1 unit of prod1 (150.00). Add 1 unit of prod2 (450.00)
		await callerA.addToCart({ productId: prod2, quantity: 1 });

		const cartBeforeCheckout = await callerA.getCart();
		expect(cartBeforeCheckout.itemCount).toBe(2);

		const idempotencyKey = crypto.randomUUID();
		const result = await callerA.checkoutCart({
			idempotencyKey,
			notes: "Urgent wholesale morning delivery",
		});

		expect(result.orderId).toBeDefined();
		expect(result.orderRef).toBe(`ORD-${result.orderId}`);
		expect(result.duplicate).toBe(false);
		expect(result.totalAmount).toBe(600); // 150 + 450

		// Verify order in database
		const [orderRow] = await db
			.select()
			.from(orders)
			.where(eq(orders.id, result.orderId));
		expect(orderRow).toBeDefined();
		expect(orderRow.status).toBe("pending_review");
		expect(Number(orderRow.total_amount)).toBe(600);
		expect(orderRow.customer_id).toBe(custAId);

		// Verify orderItems created
		const itemsRows = await db
			.select()
			.from(orderItems)
			.where(eq(orderItems.order_id, result.orderId));
		expect(itemsRows).toHaveLength(2);

		// Verify cart is cleared after checkout
		const cartAfterCheckout = await callerA.getCart();
		expect(cartAfterCheckout.itemCount).toBe(0);
		expect(cartAfterCheckout.items).toHaveLength(0);

		// Verify idempotency: duplicate checkout with same idempotencyKey returns existing order
		const dupResult = await callerA.checkoutCart({
			idempotencyKey,
			notes: "Duplicate attempt",
		});
		expect(dupResult.duplicate).toBe(true);
		expect(dupResult.orderId).toBe(result.orderId);
	});
});