// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { buildDDL, createTestDb, makeUser } from "./helpers";

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const { dashboardRouter } = await import("../dashboard");
const { createCallerFactory } = await import("../../init");
const schema = await import("@/lib/db/schema");

const caller = createCallerFactory(dashboardRouter)({
	user: makeUser("user-1"),
});

// getKpis touches many tables; build DDL for exactly the ones it queries (FKs off).
const DASH_DDL = buildDDL(
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
	],
	false,
);

const now = new Date();

beforeAll(async () => {
	await pg.exec(DASH_DDL);

	await db
		.insert(schema.branches)
		.values([
			{ id: 1, name: "Main" },
			{ id: 2, name: "Other" },
		]);

	await db.insert(schema.products).values([
		{ name: "P1", price: "10.00", user_uid: "seed" },
		{ name: "P2", price: "20.00", user_uid: "seed" },
		{ name: "P3", price: "30.00", user_uid: "seed" },
	]);

	await db.insert(schema.customers).values([
		{ name: "C1", email: "c1@t.com", user_uid: "seed", branch_id: 1 },
		{ name: "C2", email: "c2@t.com", user_uid: "seed", branch_id: 1 },
		{ name: "C3", email: "c3@t.com", user_uid: "seed", branch_id: 2 },
	]);

	// Sales/expense ledger — created "now" so it also counts toward today's KPIs.
	await db.insert(schema.transactions).values([
		{ amount: "1000.00", user_uid: "seed", type: "in", category: "sale", status: "completed", branch_id: 1, created_at: now },
		{ amount: "500.00", user_uid: "seed", type: "in", category: "sale", status: "completed", branch_id: 1, created_at: now },
		{ amount: "300.00", user_uid: "seed", type: "out", category: "expense", status: "completed", branch_id: 1, created_at: now },
		{ amount: "5000.00", user_uid: "seed", type: "in", category: "sale", status: "completed", branch_id: 2, created_at: now },
	]);

	await db.insert(schema.orders).values([
		{ total_amount: "1200.00", user_uid: "seed", status: "completed", branch_id: 1, created_at: now },
		{ total_amount: "800.00", user_uid: "seed", status: "pending", branch_id: 1, created_at: now },
		{ total_amount: "2000.00", user_uid: "seed", status: "completed", branch_id: 2, created_at: now },
	]);
});

afterAll(async () => {
	await pg.close();
});

describe("dashboard.getKpis — branch 1", () => {
	it("aggregates all-time sales/expenses/profit for the branch only", async () => {
		const k = await caller.getKpis({ branch_id: 1 });
		expect(k.totalSales).toBe(1500);
		expect(k.totalExpenses).toBe(300);
		expect(k.totalProfit).toBe(1200);
		expect(k.cashBalance).toBe(1200);
	});

	it("aggregates today's sales/expenses (seeded at now)", async () => {
		const k = await caller.getKpis({ branch_id: 1 });
		expect(k.todaySales).toBe(1500);
		expect(k.todayExpenses).toBe(300);
		expect(k.todayProfit).toBe(1200);
	});

	it("counts completed vs pending orders for the branch", async () => {
		const k = await caller.getKpis({ branch_id: 1 });
		expect(k.totalBills).toBe(1);
		expect(k.pendingDeliveries).toBe(1);
	});

	it("counts customers scoped to the branch, products globally", async () => {
		const k = await caller.getKpis({ branch_id: 1 });
		expect(k.totalCustomers).toBe(2);
		expect(k.totalProducts).toBe(3);
	});
});

describe("dashboard.getKpis — branch isolation", () => {
	it("branch 2 sees only its own sales and customers", async () => {
		const k = await caller.getKpis({ branch_id: 2 });
		expect(k.totalSales).toBe(5000);
		expect(k.totalCustomers).toBe(1);
		expect(k.totalBills).toBe(1);
	});

	it("no branch filter aggregates across all branches", async () => {
		const k = await caller.getKpis({});
		expect(k.totalSales).toBe(6500);
		expect(k.totalCustomers).toBe(3);
		expect(k.totalProducts).toBe(3);
	});
});

describe("dashboard.listBranches", () => {
	it("returns all branches", async () => {
		const branches = await caller.listBranches();
		expect(branches.length).toBe(2);
		expect(branches.some((b) => b.name === "Main")).toBe(true);
		expect(branches.some((b) => b.name === "Other")).toBe(true);
	});
});
