// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { eq } from "drizzle-orm";
import { buildDDL, createTestDb, makeUser } from "./helpers";

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const { warehouseRouter } = await import("../warehouse");
const { packerRouter } = await import("../packer");
const { createCallerFactory } = await import("../../init");
const schema = await import("@/lib/db/schema");

const callerWarehouse = createCallerFactory(warehouseRouter)({
	user: makeUser("picker-1", { role: "picker", email: "picker@test.com" }),
	db,
});

const callerPacker = createCallerFactory(packerRouter)({
	user: makeUser("packer-1", { role: "packer", email: "packer@test.com" }),
	db,
});

const DDL = buildDDL(
	[
		schema.branches,
		schema.user,
		schema.staff,
		schema.customers,
		schema.orders,
		schema.orderItems,
		schema.products,
		schema.pickLists,
		schema.pickListItems,
		schema.packages,
		schema.packageItems,
		schema.deliveryRoutes,
		schema.routeStops,
		schema.deliveryTrips,
		schema.tripStops,
		schema.vehicles,
		schema.auditLogs,
		schema.notifications,
	],
	false,
);

let testOrderId1: number;
let testOrderId2: number;
let testPickListId1: number;
let testPickListId2: number;
let testProductId1: number;
let testProductId2: number;

beforeAll(async () => {
	try {
		await pg.exec(
			`CREATE TYPE vehicle_status AS ENUM ('available', 'in_use', 'maintenance', 'retired');`,
		);
	} catch (e) {
		// Ignore if enum already exists
	}
	await pg.exec(DDL);

	// Seed customer
	const [c] = await db
		.insert(schema.customers)
		.values({
			name: "Picker Packer Test Customer",
			address: "Test Village",
			user_uid: "test-uid",
		})
		.returning();

	// Seed products
	const [p1] = await db
		.insert(schema.products)
		.values({ name: "Item Alpha", sku: "SKU-A", price: "100.00", user_uid: "test-uid" })
		.returning();
	const [p2] = await db
		.insert(schema.products)
		.values({ name: "Item Beta", sku: "SKU-B", price: "200.00", user_uid: "test-uid" })
		.returning();
	testProductId1 = p1.id;
	testProductId2 = p2.id;

	// Seed Order 1 (2 items)
	const [o1] = await db
		.insert(schema.orders)
		.values({
			customer_id: c.id,
			total_amount: "500.00",
			status: "confirmed",
			user_uid: "test-uid",
		})
		.returning();
	testOrderId1 = o1.id;

	const [pl1] = await db
		.insert(schema.pickLists)
		.values({
			order_id: o1.id,
			reference_type: "sale",
			reference_id: o1.id,
			status: "pending",
			priority: "normal",
		})
		.returning();
	testPickListId1 = pl1.id;

	await db.insert(schema.pickListItems).values([
		{
			pick_list_id: pl1.id,
			product_id: p1.id,
			quantity_ordered: 2,
			quantity_picked: 0,
			status: "pending",
		},
		{
			pick_list_id: pl1.id,
			product_id: p2.id,
			quantity_ordered: 1,
			quantity_picked: 0,
			status: "pending",
		},
	]);

	// Seed Order 2 (1 item)
	const [o2] = await db
		.insert(schema.orders)
		.values({
			customer_id: c.id,
			total_amount: "200.00",
			status: "confirmed",
			user_uid: "test-uid",
		})
		.returning();
	testOrderId2 = o2.id;

	const [pl2] = await db
		.insert(schema.pickLists)
		.values({
			order_id: o2.id,
			reference_type: "sale",
			reference_id: o2.id,
			status: "pending",
			priority: "normal",
		})
		.returning();
	testPickListId2 = pl2.id;

	await db.insert(schema.pickListItems).values([
		{
			pick_list_id: pl2.id,
			product_id: p2.id,
			quantity_ordered: 1,
			quantity_picked: 0,
			status: "pending",
		},
	]);
});

describe("Picker to Packer Strict Handoff Workflow", () => {
	it("1. Confirmed order appears in Picker queue but NOT in Packer queue", async () => {
		const pendingPacks = await callerPacker.getPendingToPack();
		expect(pendingPacks.some((p) => p.order_id === testOrderId1)).toBe(false);
		expect(pendingPacks.some((p) => p.order_id === testOrderId2)).toBe(false);
	});

	it("2. Partially picked order does NOT appear in Packer queue", async () => {
		// Pick only 1 of 2 required items for Order 1
		const items = await db
			.select()
			.from(schema.pickListItems)
			.where(eq(schema.pickListItems.pick_list_id, testPickListId1));
		const item1 = items.find((i) => i.product_id === testProductId1);

		await db
			.update(schema.pickListItems)
			.set({ quantity_picked: 1, status: "partial" })
			.where(eq(schema.pickListItems.id, item1.id));

		const pendingPacks = await callerPacker.getPendingToPack();
		expect(pendingPacks.some((p) => p.order_id === testOrderId1)).toBe(false);
	});

	it("3. Complete picking fails on backend if any item quantity is incomplete", async () => {
		expect(
			callerWarehouse.completePickingTask({ pickListId: testPickListId1 }),
		).rejects.toThrow("Picking cannot be completed");
	});

	it("4. Order becomes eligible for Packer ONLY after ALL items picked and completePickingTask succeeds", async () => {
		// Pick remaining quantity for Order 1
		const items = await db
			.select()
			.from(schema.pickListItems)
			.where(eq(schema.pickListItems.pick_list_id, testPickListId1));

		for (const it of items) {
			await db
				.update(schema.pickListItems)
				.set({ quantity_picked: it.quantity_ordered, status: "picked" })
				.where(eq(schema.pickListItems.id, it.id));
		}

		// Now complete picking
		const res = await callerWarehouse.completePickingTask({
			pickListId: testPickListId1,
		});
		expect(res.success).toBe(true);

		// Now Order 1 MUST appear in Packer queue
		const pendingPacks = await callerPacker.getPendingToPack();
		expect(pendingPacks.some((p) => p.order_id === testOrderId1)).toBe(true);
		// Order 2 (unpicked) MUST STILL NOT appear
		expect(pendingPacks.some((p) => p.order_id === testOrderId2)).toBe(false);
	});

	it("5. Parallel processing: Order 2 stays invisible to Packer while Order 1 is being packed", async () => {
		const pendingPacks = await callerPacker.getPendingToPack();
		const packTask1 = pendingPacks.find((p) => p.order_id === testOrderId1);
		expect(packTask1).toBeDefined();

		// Packer packs Order 1
		const packRes = await callerPacker.packOrder({
			pick_list_id: testPickListId1,
			order_id: testOrderId1,
			weight: 2.5,
			dimensions: "30x20x10 cm",
		});
		expect(packRes.success).toBe(true);

		// Order 1 is packed and removed from pending queue
		const pendingPacksAfter = await callerPacker.getPendingToPack();
		expect(pendingPacksAfter.some((p) => p.order_id === testOrderId1)).toBe(false);
		expect(pendingPacksAfter.some((p) => p.order_id === testOrderId2)).toBe(false);
	});
});
