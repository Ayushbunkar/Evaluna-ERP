// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { eq } from "drizzle-orm";
import { buildDDL, createTestDb, makeUser } from "./helpers";
import { parseDateFilterRange } from "@/lib/utils";

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const { pickerRouter } = await import("../picker");
const { packerRouter } = await import("../packer");
const { loaderRouter } = await import("../loader");
const { createCallerFactory } = await import("../../init");
const schema = await import("@/lib/db/schema");

const callerPicker = createCallerFactory(pickerRouter)({
	user: makeUser("picker-1", { role: "picker", email: "picker@test.com" }),
	db,
});

const callerPacker = createCallerFactory(packerRouter)({
	user: makeUser("packer-1", { role: "packer", email: "packer@test.com" }),
	db,
});

const callerLoader = createCallerFactory(loaderRouter)({
	user: makeUser("loader-1", { role: "loader", email: "loader@test.com" }),
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
		schema.pickingExceptions,
		schema.packages,
		schema.packageItems,
		schema.deliveryRoutes,
		schema.routeStops,
		schema.deliveryTrips,
		schema.tripStops,
		schema.deliveryStops,
		schema.vehicles,
		schema.auditLogs,
		schema.notifications,
	],
	false,
);

describe("Warehouse History & Date Filtering (Picker, Packer, Loader)", () => {
	beforeAll(async () => {
		try {
			await pg.exec(
				`CREATE TYPE vehicle_status AS ENUM ('available', 'in_use', 'maintenance', 'retired');`,
			);
		} catch {}
		try {
			await pg.exec(
				`CREATE TYPE priority_level AS ENUM ('low', 'normal', 'high', 'urgent');`,
			);
		} catch {}
		try {
			await pg.exec(
				`CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');`,
			);
		} catch {}

		await pg.exec(DDL);

		// Seed initial staff, customer, product
		await db.insert(schema.staff).values({
			id: 1,
			name: "Picker Staff",
			staff_code: "STAFF-P01",
			email: "picker@test.com",
			role: "picker",
			status: "active",
			join_date: new Date(),
			salary: "25000.00",
		});

		await db.insert(schema.customers).values({
			id: 101,
			name: "Test Customer Mart",
			phone: "9876543210",
			user_uid: "test-uid",
		});

		await db.insert(schema.products).values({
			id: 201,
			name: "Test Fortune Oil 1L",
			sku: "SKU-OIL-1",
			price: "150.00",
			user_uid: "test-uid",
		});
	});

	afterAll(async () => {
		await pg.close();
	});

	it("1. parseDateFilterRange covers broad IST & UTC boundaries cleanly", () => {
		const range = parseDateFilterRange("2026-11-19", "2026-11-19");
		expect(range.fromDate).toBeInstanceOf(Date);
		expect(range.toDate).toBeInstanceOf(Date);
		// Start of day should be at or before 19th 00:00:00 (prev day 18:30 in UTC)
		expect(range.fromDate!.getTime()).toBeLessThanOrEqual(
			new Date("2026-11-19T00:00:00Z").getTime(),
		);
		// End of day should be at or after 19th 23:59:59 (in UTC/local)
		expect(range.toDate!.getTime()).toBeGreaterThanOrEqual(
			new Date("2026-11-19T18:29:59Z").getTime(),
		);
	});

	it("2. picker.getCompleted displays completed picklists and packed picklists on Today and Yesterday", async () => {
		const now = new Date();
		const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

		const yest = new Date();
		yest.setDate(yest.getDate() - 1);
		const yestStr = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, "0")}-${String(yest.getDate()).padStart(2, "0")}`;

		// Insert order 1 created 3 days ago, but picked TODAY
		const threeDaysAgo = new Date(Date.now() - 3 * 86400 * 1000);
		const [ord1] = await db
			.insert(schema.orders)
			.values({
				id: 501,
				customer_id: 101,
				total_amount: "1500.00",
				status: "processing",
				created_at: threeDaysAgo,
				user_uid: "test-uid",
			})
			.returning();

		// Picklist 1: status "completed", completed_at = now
		const [pl1] = await db
			.insert(schema.pickLists)
			.values({
				id: 301,
				order_id: ord1.id,
				reference_type: "sale",
				reference_id: ord1.id,
				status: "completed",
				assigned_to: 1,
				created_at: threeDaysAgo,
				completed_at: now,
			})
			.returning();

		await db.insert(schema.pickListItems).values({
			id: 401,
			pick_list_id: pl1.id,
			product_id: 201,
			quantity_ordered: "10",
			quantity_picked: 10,
			status: "picked",
		});

		// Insert order 2: picked and now PACKED by packer (status = 'packed')
		const [ord2] = await db
			.insert(schema.orders)
			.values({
				id: 502,
				customer_id: 101,
				total_amount: "750.00",
				status: "packed",
				created_at: now,
				user_uid: "test-uid",
			})
			.returning();

		const [pl2] = await db
			.insert(schema.pickLists)
			.values({
				id: 302,
				order_id: ord2.id,
				reference_type: "sale",
				reference_id: ord2.id,
				status: "packed", // Packed by packer
				assigned_to: 1,
				created_at: now,
				completed_at: now,
			})
			.returning();

		await db.insert(schema.pickListItems).values({
			id: 402,
			pick_list_id: pl2.id,
			product_id: 201,
			quantity_ordered: "5",
			quantity_picked: 5,
			status: "picked",
		});

		// Query today: BOTH should appear! Even the one created 3 days ago and the one packed!
		const todayPicks = await callerPicker.getCompleted({
			startDate: todayStr,
			endDate: todayStr,
		});

		expect(todayPicks.length).toBeGreaterThanOrEqual(2);
		const ids = todayPicks.map((p) => p.id);
		expect(ids).toContain("PL-301");
		expect(ids).toContain("PL-302");

		// Query yesterday: today's picks should not leak into yesterday
		const yestPicks = await callerPicker.getCompleted({
			startDate: yestStr,
			endDate: yestStr,
		});
		const yestIds = yestPicks.map((p) => p.id);
		expect(yestIds).not.toContain("PL-301");
	});

	it("3. packer.getPackingHistory displays packed packages across workflows", async () => {
		const now = new Date();
		const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

		// Insert package 1: packed today
		await db.insert(schema.packages).values({
			id: 601,
			order_id: 502,
			package_number: "PKG-2026-601",
			status: "packed",
			packed_by: 1,
			packed_at: now,
			created_at: now,
		});

		// Insert package 2: moved to loaded
		await db.insert(schema.packages).values({
			id: 602,
			order_id: 501,
			package_number: "PKG-2026-602",
			status: "loaded",
			packed_by: 1,
			packed_at: now,
			created_at: now,
		});

		const packingHistory = await callerPacker.getPackingHistory({
			startDate: todayStr,
			endDate: todayStr,
		});

		expect(packingHistory.length).toBeGreaterThanOrEqual(2);
		const pkgNumbers = packingHistory.map((p) => p.packageNumber);
		expect(pkgNumbers).toContain("PKG-2026-601");
		expect(pkgNumbers).toContain("PKG-2026-602");
	});

	it("4. loader.getLoadingHistory displays loaded trips in any post-loading status", async () => {
		const now = new Date();
		const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

		// Insert delivery trip: loaded and in_transit
		const [trip1] = await db
			.insert(schema.deliveryTrips)
			.values({
				id: 701,
				driver_id: "driver-1",
				status: "in_transit",
				loaded_at: now,
				created_at: now,
				updated_at: now,
			})
			.returning();

		await db.insert(schema.tripStops).values({
			id: 801,
			trip_id: trip1.id,
			customer_id: 101,
			sequence: 1,
			status: "pending",
		});

		const loadingHistory = await callerLoader.getLoadingHistory({
			startDate: todayStr,
			endDate: todayStr,
		});

		expect(loadingHistory.length).toBeGreaterThanOrEqual(1);
		const tripIds = loadingHistory.map((t) => t.tripId);
		expect(tripIds).toContain(701);
	});
});
