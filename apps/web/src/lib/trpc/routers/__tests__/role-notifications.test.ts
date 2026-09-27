import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { createCallerFactory } from "../../init";
import { buildDDL, createTestDb, makeUser } from "./helpers";

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const { notificationsRouter } = await import("../notifications");

const TABLES = [
	schema.branches,
	schema.user,
	schema.staff,
	schema.notifications,
];

const DDL = buildDDL(TABLES, false);

beforeAll(async () => {
	await pg.exec(DDL);
	await pg.exec(`
    INSERT INTO branches (id, name) VALUES (1, 'Main Branch');
    INSERT INTO staff (id, name, email, role, join_date, salary, branch_id) VALUES
    (10, 'Sales Staff', 'sales1@example.com', 'sales_person', NOW(), 30000, 1),
    (20, 'Picker Staff', 'picker1@example.com', 'picker', NOW(), 25000, 1),
    (30, 'Packer Staff', 'packer1@example.com', 'packer', NOW(), 25000, 1),
    (40, 'Driver Staff', 'driver1@example.com', 'driver', NOW(), 28000, 1),
    (50, 'Finance Staff', 'finance1@example.com', 'finance', NOW(), 45000, 1),
    (60, 'Admin Staff', 'admin@example.com', 'admin', NOW(), 80000, 1);
  `);
});

afterAll(async () => {
	await pg.close();
});

describe("Role-Based Notification Isolation & Security Gating", () => {
	it("enforces strict role-based notification querying and isolation at backend SQL layer", async () => {
		// Clean existing test notifications
		await db.delete(schema.notifications);

		// Seed distinct role-specific notifications
		await db.insert(schema.notifications).values([
			// 1. Sales notification
			{
				id: 1001,
				user_id: null,
				type: "sales",
				title: "🛒 New Customer Order Placed",
				message: "Customer placed ORD-1001. Requires phone review.",
				reference_type: "orders",
				reference_id: 1001,
				is_read: false,
			},
			// 2. Picker notification
			{
				id: 1002,
				user_id: null,
				type: "picking",
				title: "📦 Picklist PL-200 Ready",
				message: "Items ready for picking.",
				reference_type: "pick_lists",
				reference_id: 200,
				is_read: false,
			},
			// 3. Packer notification
			{
				id: 1003,
				user_id: null,
				type: "packing",
				title: "🏷️ Picking Done — Ready for Packing",
				message: "Package PKG-300 queued for packing.",
				reference_type: "packages",
				reference_id: 300,
				is_read: false,
			},
			// 4. Driver notification
			{
				id: 1004,
				user_id: null,
				type: "delivery",
				title: "🚚 Trip #400 Dispatched",
				message: "Route #400 assigned to driver.",
				reference_type: "trips",
				reference_id: 400,
				is_read: false,
			},
			// 5. Finance notification
			{
				id: 1005,
				user_id: null,
				type: "finance",
				title: "💰 ₹5000 Cash Collected by Driver",
				message: "Payment pending reconciliation.",
				reference_type: "payments",
				reference_id: 500,
				is_read: false,
			},
			// 6. Admin system alert
			{
				id: 1006,
				user_id: null,
				type: "system",
				title: "🛡️ Security Exception Detected",
				message: "Admin action required.",
				is_read: false,
			},
		]);

		const createCaller = createCallerFactory(notificationsRouter);

		// 1. Verify Sales Caller receives ONLY sales notifications
		const salesCaller = createCaller({
			db,
			user: {
				...makeUser("sales-uid-1"),
				id: "sales-uid-1",
				email: "sales1@example.com",
				role: "sales_person",
			} as any,
		});

		const salesList = await salesCaller.list({});
		const salesUnread = await salesCaller.unreadCount({});
		expect(salesUnread.count).toBe(1);
		expect(salesList.length).toBe(1);
		expect(salesList[0].id).toBe(1001);
		expect(salesList[0].type).toBe("sales");

		// 2. Verify Picker Caller receives ONLY picker notifications
		const pickerCaller = createCaller({
			db,
			user: {
				...makeUser("picker-uid-1"),
				id: "picker-uid-1",
				email: "picker1@example.com",
				role: "picker",
			} as any,
		});

		const pickerList = await pickerCaller.list({});
		const pickerUnread = await pickerCaller.unreadCount({});
		expect(pickerUnread.count).toBe(1);
		expect(pickerList.length).toBe(1);
		expect(pickerList[0].id).toBe(1002);
		expect(pickerList[0].type).toBe("picking");

		// 3. Verify Packer Caller receives ONLY packer notifications
		const packerCaller = createCaller({
			db,
			user: {
				...makeUser("packer-uid-1"),
				id: "packer-uid-1",
				email: "packer1@example.com",
				role: "packer",
			} as any,
		});

		const packerList = await packerCaller.list({});
		const packerUnread = await packerCaller.unreadCount({});
		expect(packerUnread.count).toBe(1);
		expect(packerList.length).toBe(1);
		expect(packerList[0].id).toBe(1003);
		expect(packerList[0].type).toBe("packing");

		// 4. Verify Driver Caller receives ONLY driver notifications
		const driverCaller = createCaller({
			db,
			user: {
				...makeUser("driver-uid-1"),
				id: "driver-uid-1",
				email: "driver1@example.com",
				role: "driver",
			} as any,
		});

		const driverList = await driverCaller.list({});
		const driverUnread = await driverCaller.unreadCount({});
		expect(driverUnread.count).toBe(1);
		expect(driverList.length).toBe(1);
		expect(driverList[0].id).toBe(1004);
		expect(driverList[0].type).toBe("delivery");

		// 5. Verify Finance Caller receives ONLY finance notifications
		const financeCaller = createCaller({
			db,
			user: {
				...makeUser("finance-uid-1"),
				id: "finance-uid-1",
				email: "finance1@example.com",
				role: "finance",
			} as any,
		});

		const financeList = await financeCaller.list({});
		const financeUnread = await financeCaller.unreadCount({});
		expect(financeUnread.count).toBe(1);
		expect(financeList.length).toBe(1);
		expect(financeList[0].id).toBe(1005);
		expect(financeList[0].type).toBe("finance");

		// 6. Verify Admin Caller sees all system & operational notifications
		const adminCaller = createCaller({
			db,
			user: {
				...makeUser("admin-uid-1"),
				id: "admin-uid-1",
				email: "admin@example.com",
				role: "admin",
				isSuperadmin: true,
			} as any,
		});

		const adminList = await adminCaller.list({});
		const adminUnread = await adminCaller.unreadCount({});
		expect(adminUnread.count).toBe(6);
		expect(adminList.length).toBe(6);
	});

	it("prevents cross-role markAsRead unauthorized tampering", async () => {
		const createCaller = createCallerFactory(notificationsRouter);

		// Sales user trying to mark Finance notification (1005) as read
		const salesCaller = createCaller({
			db,
			user: {
				...makeUser("sales-uid-1"),
				id: "sales-uid-1",
				email: "sales1@example.com",
				role: "sales_person",
			} as any,
		});

		const res = await salesCaller.markAsRead({ id: 1005 });
		// Returning should be empty because the WHERE clause blocked unauthorized role access
		expect(res.length).toBe(0);

		// Verify in DB that notification 1005 is still unread
		const [notif1005] = await db
			.select()
			.from(schema.notifications)
			.where(eq(schema.notifications.id, 1005));
		expect(notif1005.is_read).toBe(false);

		// Sales user marking their OWN notification (1001) as read
		const ownRes = await salesCaller.markAsRead({ id: 1001 });
		expect(ownRes.length).toBe(1);
		expect(ownRes[0].id).toBe(1001);
		expect(ownRes[0].is_read).toBe(true);

		const salesUnreadAfter = await salesCaller.unreadCount({});
		expect(salesUnreadAfter.count).toBe(0);
	});
});
