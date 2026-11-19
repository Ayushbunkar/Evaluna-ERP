// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { eq } from "drizzle-orm";
import { buildDDL, createTestDb, makeUser, SCHEMA_DDL } from "./helpers";

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const { loaderRouter } = await import("../loader");
const { createCallerFactory } = await import("../../init");
const schema = await import("@/lib/db/schema");

const callerAsLoader = createCallerFactory(loaderRouter)({
	user: makeUser("loader-1", { role: "loader" }),
	db,
});

const callerAsNonLoader = createCallerFactory(loaderRouter)({
	user: makeUser("customer-1", { role: "customer" }),
	db,
});

const DELIVERY_DDL = buildDDL(
	[
		schema.branches,
		schema.user,
		schema.staff,
		schema.deliveryRoutes,
		schema.routeStops,
		schema.deliveryTrips,
		schema.tripStops,
		schema.deliveryStops,
		schema.customers,
		schema.orders,
		schema.orderItems,
		schema.products,
		schema.vehicles,
		schema.packages,
	],
	false,
);

let testTripId: number;
let testOrderId: number;
let testCustomerId: number;

beforeAll(async () => {
	try {
		await pg.exec(
			`CREATE TYPE vehicle_status AS ENUM ('available', 'in_use', 'maintenance', 'retired');`,
		);
	} catch (e) {
		// Ignore if enum type already exists
	}
	await pg.exec(DELIVERY_DDL);

	// Seed customer
	const [c] = await db
		.insert(schema.customers)
		.values({
			name: "Loader Test Customer",
			address: "Barkheda, Village A",
			user_uid: "test-user-uid",
		})
		.returning();
	testCustomerId = c.id;

	// Seed route
	const [r] = await db
		.insert(schema.deliveryRoutes)
		.values({ name: "Route 1 Test", code: "R1" })
		.returning();

	// Seed driver user & vehicle
	const [drv] = await db
		.insert(schema.user)
		.values({ id: "drv-101", name: "Rahul Driver", email: "rahul@test.com" })
		.returning();

	const [veh] = await db
		.insert(schema.vehicles)
		.values({
			name: "Delivery Van 1",
			registration_number: "MP04AB1234",
			type: "van",
		})
		.returning();

	// Seed delivery trip
	const [tr] = await db
		.insert(schema.deliveryTrips)
		.values({
			route_id: r.id,
			driver_id: drv.id,
			vehicle_id: veh.id,
			status: "ready_for_loading",
		})
		.returning();
	testTripId = tr.id;

	// Seed trip stop
	await db.insert(schema.tripStops).values({
		trip_id: tr.id,
		customer_id: c.id,
		sequence: 1,
	});

	// Seed packed order for this customer
	const [ord] = await db
		.insert(schema.orders)
		.values({
			customer_id: c.id,
			total_amount: "500.00",
			status: "packed",
			user_uid: "sales-1",
		})
		.returning();
	testOrderId = ord.id;
});

afterAll(async () => {
	await pg.close();
});

describe("loaderRouter", () => {
	it("allows loader role to view dashboard stats", async () => {
		const stats = await callerAsLoader.getDashboardStats();
		expect(stats).toBeDefined();
		expect(typeof stats.readyForLoadingTrips).toBe("number");
	});

	it("prevents unauthorized roles from accessing loader procedures if enforced", async () => {
		expect(callerAsNonLoader.getLoadingQueue()).rejects.toThrow();
	});

	it("returns eligible ready_for_loading trips in queue", async () => {
		const queue = await callerAsLoader.getLoadingQueue({ status: "all" });
		expect(queue.length).toBeGreaterThan(0);
		const found = queue.find((q) => q.tripId === testTripId);
		expect(found).toBeDefined();
		expect(found?.driverName).toBe("Rahul Driver");
	});

	it("does not include unreleased pending trips in loader queue until manager releases them", async () => {
		// Insert an unreleased pending trip
		const [pendingTrip] = await db
			.insert(schema.deliveryTrips)
			.values({
				route_id: 1,
				driver_id: "drv-101",
				status: "pending",
			})
			.returning();

		const queue = await callerAsLoader.getLoadingQueue({ status: "ready_for_loading" });
		const found = queue.find((q) => q.tripId === pendingTrip.id);
		expect(found).toBeUndefined();

		const allQueue = await callerAsLoader.getLoadingQueue({ status: "all" });
		const foundAll = allQueue.find((q) => q.tripId === pendingTrip.id);
		expect(foundAll).toBeUndefined();
	});

	it("transitions trip status to loading when startLoadingTrip is called", async () => {
		const res = await callerAsLoader.startLoadingTrip({ tripId: testTripId });
		expect(res.success).toBe(true);

		const details = await callerAsLoader.getTripLoadingDetails({ tripId: testTripId });
		expect(details.trip.status).toBe("loading");
	});

	it("allows marking order as loaded with idempotency", async () => {
		const markRes = await callerAsLoader.markOrderLoaded({
			tripId: testTripId,
			orderId: testOrderId,
			loaded: true,
		});
		expect(markRes.success).toBe(true);

		// Second call should return success without error
		const markRes2 = await callerAsLoader.markOrderLoaded({
			tripId: testTripId,
			orderId: testOrderId,
			loaded: true,
		});
		expect(markRes2.success).toBe(true);

		const details = await callerAsLoader.getTripLoadingDetails({ tripId: testTripId });
		expect(details.summary.loadedOrders).toBe(1);
	});

	it("does not leak newly created orders for customer into an existing trip", async () => {
		// Create a brand new order for the same customer with status 'confirmed' (as created in POS/sales)
		// created after the trip was created
		const futureDate = new Date(Date.now() + 1_000_000);
		const [newBill] = await db
			.insert(schema.orders)
			.values({
				customer_id: testCustomerId,
				total_amount: "999.00",
				status: "confirmed",
				user_uid: "sales-1",
				created_at: futureDate,
			})
			.returning();

		// Check getTripLoadingDetails for testTripId does NOT include newBill
		const details = await callerAsLoader.getTripLoadingDetails({ tripId: testTripId });
		const orderIdsInDetails = details.stops.flatMap((s: any) => s.orders.map((o: any) => o.orderId));
		expect(orderIdsInDetails).not.toContain(newBill.id);

		// Also check that queue does not count the new bill for this trip
		const queue = await callerAsLoader.getLoadingQueue({ status: "all" });
		const tripInQueue = queue.find((q: any) => q.tripId === testTripId);
		expect(tripInQueue?.ordersCount).toBe(1);
	});

	it("completes trip loading when all orders are loaded", async () => {
		const completeRes = await callerAsLoader.completeTripLoading({
			tripId: testTripId,
		});
		expect(completeRes.success).toBe(true);
		expect(completeRes.status).toBe("loaded");

		const history = await callerAsLoader.getLoadingHistory({});
		const foundHist = history.find((h) => h.tripId === testTripId);
		expect(foundHist).toBeDefined();
	});

	it("returns direct packed orders queue before trip creation and allows marking loaded", async () => {
		// Create a customer without any trip assigned
		const [c2] = await db
			.insert(schema.customers)
			.values({
				name: "Untripped Customer",
				address: "Village B",
				user_uid: "test-user-uid-2",
			})
			.returning();

		// Create a direct packed order not assigned to any trip
		const [packedOrder] = await db
			.insert(schema.orders)
			.values({
				customer_id: c2.id,
				total_amount: "1500.00",
				status: "packed",
				user_uid: "packer-1",
			})
			.returning();

		await db.insert(schema.packages).values({
			order_id: packedOrder.id,
			package_number: `PKG-${packedOrder.id}-1`,
			package_type: "box",
			status: "packed",
			weight: "5.0",
		});

		// 1. Loader sees the packed order in direct queue immediately
		const packedQueue = await callerAsLoader.getPackedOrdersQueue({ status: "all" });
		const foundInQueue = packedQueue.find((o: any) => o.orderId === packedOrder.id);
		expect(foundInQueue).toBeDefined();
		expect(foundInQueue?.status).toBe("packed");
		expect(foundInQueue?.packageCount).toBe(1);
		expect(foundInQueue?.tripId).toBeNull();

		// 2. Loader marks the direct order as loaded
		const markRes = await callerAsLoader.markDirectOrderLoaded({
			orderId: packedOrder.id,
			loaded: true,
		});
		expect(markRes.success).toBe(true);
		expect(markRes.status).toBe("loaded");

		// 3. Verify order & package statuses updated to loaded
		const [updatedOrder] = await db
			.select()
			.from(schema.orders)
			.where(eq(schema.orders.id, packedOrder.id));
		expect(updatedOrder.status).toBe("loaded");

		const [updatedPkg] = await db
			.select()
			.from(schema.packages)
			.where(eq(schema.packages.order_id, packedOrder.id));
		expect(updatedPkg.status).toBe("loaded");

		// 4. Loader can unmark loaded if needed
		const unmarkRes = await callerAsLoader.markDirectOrderLoaded({
			orderId: packedOrder.id,
			loaded: false,
		});
		expect(unmarkRes.success).toBe(true);
		expect(unmarkRes.status).toBe("ready_for_loading");
	});
});
