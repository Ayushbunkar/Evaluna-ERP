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
});
