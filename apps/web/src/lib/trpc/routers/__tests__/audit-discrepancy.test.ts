// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { buildDDL, createTestDb, makeFinanceUser } from "./helpers";

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const { auditRouter, normalizeDiscrepancyType } = await import("../audit");
const { createCallerFactory } = await import("../../init");

const auditTables = [
	schema.branches,
	schema.staff,
	schema.user,
	schema.roles,
	schema.userRoles,
	schema.products,
	schema.productCategories,
	schema.productCategoryMapping,
	schema.branchInventory,
	schema.stockAudits,
	schema.stockAuditItems,
	schema.auditDiscrepancies,
	schema.missingStockQueue,
	schema.stockAdjustments,
	schema.stockLedger,
	schema.auditLogs,
	schema.notifications,
];

const AUDIT_SCHEMA_DDL = buildDDL(auditTables, false);

const warehouseManager = makeFinanceUser({
	id: "wh-mgr-101",
	email: "manager@evaluna.test",
	role: "warehouse_supervisor",
	branchId: 1,
	permissions: [
		"inventory_audit.read",
		"inventory_audit.write",
		"inventory_audit.approve",
	],
});

const warehouseCounter = makeFinanceUser({
	id: "wh-counter-101",
	email: "counter@evaluna.test",
	role: "auditor",
	branchId: 1,
	permissions: ["inventory_audit.read", "inventory_audit.write"],
});

const callerFactory = createCallerFactory(auditRouter);

describe("Audit Discrepancy Tracking (Theft, Damage, Missing) & Monthly Loss Report", () => {
	let testBranchId: number;
	let managerStaffId: number;
	let counterStaffId: number;
	let product1Id: number;
	let product2Id: number;
	let testAuditId: number;
	let auditItem1Id: number;
	let auditItem2Id: number;

	beforeAll(async () => {
		await pg.exec(AUDIT_SCHEMA_DDL);

		// Seed Branch
		const [branch] = await db
			.insert(schema.branches)
			.values({
				name: "Main Distribution Center",
				code: "MDC-01",
				address: "Plot 42, Logistics Park",
			})
			.returning();
		testBranchId = branch.id;

		// Seed Staff
		const [mgr] = await db
			.insert(schema.staff)
			.values({
				staff_code: "STF-MGR-01",
				email: "manager@evaluna.test",
				name: "Rajesh Sharma",
				role: "warehouse_supervisor",
				branch_id: testBranchId,
				salary: "50000.00",
				join_date: new Date(),
			})
			.returning();
		managerStaffId = mgr.id;

		const [counter] = await db
			.insert(schema.staff)
			.values({
				staff_code: "STF-CNT-01",
				email: "counter@evaluna.test",
				name: "Vikas Kumar",
				role: "auditor",
				branch_id: testBranchId,
				salary: "30000.00",
				join_date: new Date(),
			})
			.returning();
		counterStaffId = counter.id;

		// Seed Category
		const [cat] = await db
			.insert(schema.productCategories)
			.values({
				name: "Snacks & Confectionery",
				slug: "snacks-confectionery",
			})
			.returning();

		// Seed Products
		const [p1] = await db
			.insert(schema.products)
			.values({
				name: "Cadbury Dairy Milk 12.5g",
				sku: "CDM-12G",
				barcode: "8901234567890",
				price: "10.00",
				base_procurement_price: "8.00",
				user_uid: "test-system",
				category: "Snacks & Confectionery",
			})
			.returning();
		product1Id = p1.id;

		const [p2] = await db
			.insert(schema.products)
			.values({
				name: "Aunty Rs 5 Wafers",
				sku: "ANT-05W",
				barcode: "8909876543210",
				price: "5.00",
				base_procurement_price: "4.00",
				user_uid: "test-system",
				category: "Snacks & Confectionery",
			})
			.returning();
		product2Id = p2.id;
	});

	it("normalizeDiscrepancyType identifies discrepancy categories accurately", () => {
		expect(normalizeDiscrepancyType("theft")).toBe("theft");
		expect(normalizeDiscrepancyType("Suspected theft from aisle B")).toBe("theft");
		expect(normalizeDiscrepancyType("chori ho gaya")).toBe("theft");
		expect(normalizeDiscrepancyType("damage")).toBe("damage");
		expect(normalizeDiscrepancyType("Damaged packaging")).toBe("damage");
		expect(normalizeDiscrepancyType("packet toot gaya")).toBe("damage");
		expect(normalizeDiscrepancyType("expired goods")).toBe("expiry");
		expect(normalizeDiscrepancyType("misplaced on rack 4")).toBe("wrong_location");
		expect(normalizeDiscrepancyType("counting_error")).toBe("counting_error");
		expect(normalizeDiscrepancyType("", 5)).toBe("excess");
		expect(normalizeDiscrepancyType("", -2)).toBe("missing");
	});

	it("submitting counts with 'theft' and 'damage' reasons properly records discrepancy_type and variance_value", async () => {
		const managerCaller = callerFactory({
			user: warehouseManager,
			db,
		});
		const counterCaller = callerFactory({
			user: warehouseCounter,
			db,
		});

		// Create Audit Plan
		const plan = await managerCaller.createAuditPlan({
			branch_id: testBranchId,
			title: "October Bi-Weekly Stock Verification",
			audit_type: "cycle_count",
			counting_method: "assisted",
			scope_mode: "custom",
			auditor_id: counterStaffId,
			product_ids: [product1Id, product2Id],
		});
		expect(plan).toBeDefined();
		testAuditId = plan.id;

		// Fetch Audit Detail to retrieve item IDs
		const auditDetail = await counterCaller.getAudit({ auditId: testAuditId });
		expect(auditDetail.items.length).toBe(2);

		const item1 = auditDetail.items.find((i) => i.product_id === product1Id)!;
		const item2 = auditDetail.items.find((i) => i.product_id === product2Id)!;
		auditItem1Id = item1.id;
		auditItem2Id = item2.id;

		// Update expected snapshot for testing
		await db
			.update(schema.stockAuditItems)
			.set({ expected_qty: 20 })
			.where(eq(schema.stockAuditItems.id, auditItem1Id));
		await db
			.update(schema.stockAuditItems)
			.set({ expected_qty: 15 })
			.where(eq(schema.stockAuditItems.id, auditItem2Id));

		// Counter starts audit
		await counterCaller.startAudit({ audit_id: testAuditId });

		// Counter submits counts:
		// Item 1: Expected 20, Counted 16 (-4 variance) -> Reason: "theft"
		// Item 2: Expected 15, Counted 12 (-3 variance) -> Reason: "damage"
		const submitRes = await counterCaller.submitCountLines({
			audit_id: testAuditId,
			items: [
				{
					item_id: auditItem1Id,
					counted_qty: 16,
					discrepancy_reason: "theft",
					remarks: "4 packets stolen from shelf",
				},
				{
					item_id: auditItem2Id,
					counted_qty: 12,
					discrepancy_reason: "damage",
					remarks: "3 packets crushed during transit",
				},
			],
		});

		expect(submitRes.success).toBe(true);
		expect(submitRes.discrepancyCount).toBe(2);
		expect(submitRes.status).toBe("discrepancy_review");

		// Verify auditDiscrepancies table
		const discrepancies = await db
			.select()
			.from(schema.auditDiscrepancies)
			.where(eq(schema.auditDiscrepancies.audit_item_id, auditItem1Id));

		expect(discrepancies.length).toBe(1);
		expect(discrepancies[0].discrepancy_type).toBe("theft");
		expect(discrepancies[0].quantity).toBe(4);
		// 4 units * 8.00 procurement price = 32.00
		expect(Number(discrepancies[0].variance_value)).toBe(32);

		const disc2 = await db
			.select()
			.from(schema.auditDiscrepancies)
			.where(eq(schema.auditDiscrepancies.audit_item_id, auditItem2Id));

		expect(disc2.length).toBe(1);
		expect(disc2[0].discrepancy_type).toBe("damage");
		expect(disc2[0].quantity).toBe(3);
		// 3 units * 4.00 procurement price = 12.00
		expect(Number(disc2[0].variance_value)).toBe(12);
	});

	it("updateDiscrepancyReason mutation allows manager to reclassify a line", async () => {
		const managerCaller = callerFactory({
			user: warehouseManager,
			db,
		});

		// Reclassify item 2 from damage to expiry
		const updateRes = await managerCaller.updateDiscrepancyReason({
			audit_item_id: auditItem2Id,
			discrepancy_reason: "expiry",
			remarks: "Best before date exceeded",
		});

		expect(updateRes.success).toBe(true);
		expect(updateRes.discrepancy_type).toBe("expiry");

		const disc = await db
			.select()
			.from(schema.auditDiscrepancies)
			.where(eq(schema.auditDiscrepancies.audit_item_id, auditItem2Id));

		expect(disc[0].discrepancy_type).toBe("expiry");
	});

	it("getMonthlyDiscrepancyReport aggregates theft, damage/expiry losses and itemized records", async () => {
		const managerCaller = callerFactory({
			user: warehouseManager,
			db,
		});

		const currentMonth = new Date().getMonth() + 1;
		const currentYear = new Date().getFullYear();

		const report = await managerCaller.getMonthlyDiscrepancyReport({
			month: currentMonth,
			year: currentYear,
			branchId: testBranchId,
		});

		expect(report).toBeDefined();
		expect(report.summary.theftCount).toBe(4);
		expect(report.summary.theftLossValue).toBe(32);
		expect(report.summary.expiryCount).toBe(3);
		expect(report.summary.expiryLossValue).toBe(12);
		expect(report.summary.totalLossValue).toBe(44);
		expect(report.summary.totalVarianceUnits).toBe(7);
		expect(report.summary.auditsWithDiscrepancyCount).toBe(1);

		// Check itemized rows
		expect(report.items.length).toBe(2);
		const theftRow = report.items.find((i) => i.discrepancyType === "theft");
		expect(theftRow).toBeDefined();
		expect(theftRow?.productName).toContain("Cadbury");
		expect(theftRow?.expectedQty).toBe(20);
		expect(theftRow?.countedQty).toBe(16);
		expect(theftRow?.varianceQty).toBe(-4);
		expect(theftRow?.lossValue).toBe(32);

		// Category breakdown
		expect(report.byCategory.length).toBeGreaterThan(0);
		expect(report.byCategory[0].category).toBe("Snacks & Confectionery");
		expect(report.byCategory[0].lossValue).toBe(44);
	});
});
