import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { createCallerFactory } from "../../init";
import { buildDDL, createTestDb, makeUser } from "./helpers";

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const { purchasesRouter } = await import("../purchases");
const { notificationsRouter } = await import("../notifications");
const { warehouseRouter } = await import("../warehouse");

const TABLES = [
	schema.branches,
	schema.user,
	schema.staff,
	schema.suppliers,
	schema.purchases,
	schema.purchaseItems,
	schema.receivingInspections,
	schema.branchInventory,
	schema.products,
	schema.notifications,
	schema.orders,
	schema.eWayBills,
];

const DDL = buildDDL(TABLES, false);

beforeAll(async () => {
	await pg.exec(DDL);
	await pg.exec(`
    INSERT INTO branches (id, name) VALUES (1, 'Main Branch');
    INSERT INTO staff (id, name, email, role, join_date, salary, branch_id) VALUES
    (10, 'John Doe', 'john@test.com', 'manager', NOW(), 50000, 1);
  `);
});

afterAll(async () => {
	await pg.close();
});

describe("Production Readiness Integration Tests", () => {
	const caller = createCallerFactory(purchasesRouter)({
		user: {
			...makeUser("john-uid"),
			id: "john-uid",
			email: "john@test.com",
			role: "manager",
		},
		db,
	});

	const notifCaller = createCallerFactory(notificationsRouter)({
		user: {
			...makeUser("john-uid"),
			id: "john-uid",
			email: "john@test.com",
			role: "manager",
		},
		db,
	});

	const whCaller = createCallerFactory(warehouseRouter)({
		user: {
			...makeUser("john-uid"),
			id: "john-uid",
			email: "john@test.com",
			role: "manager",
		},
		db,
	});

	describe("Procurement Analytics Database Integration", () => {
		it("uses real DB data, not mock data", async () => {
			// Seed a supplier
			await db.insert(schema.suppliers).values({
				id: 101,
				name: "Acme Logistics",
				contact_name: "Roadrunner",
				email: "acme@test.com",
				phone: "12345678",
			});

			// Seed real purchases in the database
			await db.insert(schema.purchases).values([
				{
					id: 501,
					supplier_id: 101,
					total_amount: "15500.50",
					user_uid: "john-uid",
					grn_number: "GRN-001",
					status: "pending",
				},
				{
					id: 502,
					supplier_id: 101,
					total_amount: "34500.00",
					user_uid: "john-uid",
					grn_number: "GRN-002",
					status: "pending",
				},
			]);

			const analytics = await caller.getAnalytics();

			// Verify that totalSpend aggregates the real seeded records: 15500.50 + 34500.00 = 50000.50
			expect(analytics.totalSpend).toBe(50000.5);
			expect(analytics.activeSuppliersCount).toBe(1);
			expect(analytics.openPOsCount).toBe(2);
		});
	});

	describe("Notifications Database Persistence & Scoping", () => {
		it("mark-all-read and individual read persists after refresh", async () => {
			// Seed notifications targeted specifically to John Doe (staffId: 10)
			await db.insert(schema.notifications).values([
				{
					id: 901,
					user_id: 10,
					title: "Low Stock Warning",
					message: "Product A is low",
					type: "low_stock",
					channel: "in_app",
					is_read: false,
				},
				{
					id: 902,
					user_id: 10,
					title: "Inbound Delivery",
					message: "PO ready",
					type: "info",
					channel: "in_app",
					is_read: false,
				},
			]);

			// Count unread initially
			const initialCount = await notifCaller.unreadCount({});
			expect(initialCount.count).toBe(2);

			// Mark individual notification as read
			await notifCaller.markAsRead({ id: 901 });

			// Verify individual read persists
			const middleCount = await notifCaller.unreadCount({});
			expect(middleCount.count).toBe(1);

			// Verify in DB directly
			const [notif901] = await db
				.select()
				.from(schema.notifications)
				.where(eq(schema.notifications.id, 901));
			expect(notif901.is_read).toBe(true);

			// Mark all remaining targeted notifications as read
			await notifCaller.markAllAsRead({});

			// Verify all are read and count is 0
			const finalCount = await notifCaller.unreadCount({});
			expect(finalCount.count).toBe(0);

			// Verify in DB directly
			const [notif902] = await db
				.select()
				.from(schema.notifications)
				.where(eq(schema.notifications.id, 902));
			expect(notif902.is_read).toBe(true);
		});
	});

	describe("E-Way Bill Boundary Gating", () => {
		it("reports integration not configured and blocks fake success when env credentials are absent", async () => {
			// Confirm that the configuration endpoint returns false
			const isConfigured = await whCaller.isEWayBillConfigured();
			expect(isConfigured).toBe(false);

			// Create an order to attempt generation
			await db.insert(schema.orders).values({
				id: 701,
				total_amount: "55000.00", // Mandatory range (>50,000)
				user_uid: "john-uid",
				status: "pending",
				branch_id: 1,
			});

			// Attempt to generate E-Way bill
			const result = await whCaller.generateEWayBill({
				orderId: 701,
				vehicleNo: "MP-04-HE-1234",
				modeOfTransport: "road",
				approxDistanceKm: 150,
			});

			// Verify that it gracefully returns a structured error and does not report a fake success or create a fake number
			expect(result.success).toBe(false);
			expect(result.error).toContain("E-Way Bill integration not configured");

			// Verify that the order's e_way_bill_no remains NULL in the DB
			const [orderRow] = await db
				.select()
				.from(schema.orders)
				.where(eq(schema.orders.id, 701));
			expect(orderRow.e_way_bill_no).toBeNull();
		});
	});
});
