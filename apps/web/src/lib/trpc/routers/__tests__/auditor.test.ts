// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { buildDDL, createTestDb, makeUser } from "./helpers";
import * as schema from "@/lib/db/schema";
import { getPermissionsForRole } from "@/lib/permissions";

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const AUDITOR_TABLES = [
	schema.branches,
	schema.staff,
	schema.products,
	schema.productBarcodes,
	schema.upcTasks,
	schema.auditFindings,
	schema.correctiveActions,
	schema.priceChangeHistory,
	schema.receivingInspections,
	schema.placementVerifications,
	schema.auditLogs,
	schema.notifications,
	schema.stockAudits,
	schema.stockAuditItems,
	schema.auditDiscrepancies,
	schema.missingStockQueue,
	schema.deliveryTrips,
];

const { upcRouter } = await import("../upc");
const { auditFindingsRouter } = await import("../audit-findings");
const { productsRouter } = await import("../products");
const { priceAuditRouter } = await import("../price-audit");
const { createCallerFactory } = await import("../../init");

// Actors carry an explicit permissions[] array — requirePermission reads it.
const withPerms = (id: string, role: string) => ({
	...makeUser(id),
	role,
	permissions: getPermissionsForRole(role as any),
});

const auditor = withPerms("aud", "auditor");
const auditor2 = withPerms("aud2", "auditor");
const manager = withPerms("mgr", "manager");
const putter = withPerms("put", "putter");
const biller = withPerms("bil", "biller");

const upcAs = (u: any) => createCallerFactory(upcRouter)({ user: u, db });
const findAs = (u: any) => createCallerFactory(auditFindingsRouter)({ user: u, db });
const prodAs = (u: any) => createCallerFactory(productsRouter)({ user: u, db });
const priceAs = (u: any) => createCallerFactory(priceAuditRouter)({ user: u, db });

beforeAll(async () => {
	await pg.exec(buildDDL(AUDITOR_TABLES, false));
	await pg.exec(`INSERT INTO branches (id, name) VALUES (1, 'Main');`);
	await pg.exec(`
		INSERT INTO staff (id, name, email, role, join_date, salary, branch_id) VALUES
		(1, 'Auditor', 'aud@test.com', 'auditor', NOW(), 40000, 1),
		(2, 'Auditor2', 'aud2@test.com', 'auditor', NOW(), 40000, 1),
		(3, 'Manager', 'mgr@test.com', 'manager', NOW(), 60000, 1),
		(4, 'Putter', 'put@test.com', 'putter', NOW(), 20000, 1);
	`);
	await pg.exec(`
		INSERT INTO products (id, name, sku, price, base_selling_price, base_procurement_price, user_uid) VALUES
		(1, 'Product A', 'SKU-A', '100.00', '100.00', '60.00', 'seed'),
		(2, 'Product B', 'SKU-B', '50.00', '50.00', '30.00', 'seed'),
		(3, 'Product C', 'SKU-C', '75.00', '75.00', '40.00', 'seed');
	`);
});

afterAll(async () => {
	await pg.close();
});

describe("RBAC — auditor domain gating", () => {
	it("allows an auditor to read UPC info", async () => {
		const res = await upcAs(auditor).checkExisting({ productId: 1 });
		expect(res.product.id).toBe(1);
	});

	it("FORBIDS putter from generating a UPC", async () => {
		expect(upcAs(putter).generate({ productId: 1 })).rejects.toThrow(/permission/i);
	});

	it("FORBIDS biller from reading UPC tasks", async () => {
		expect(upcAs(biller).listTasks({})).rejects.toThrow(/permission/i);
	});

	it("FORBIDS auditor from editing a product price (no products.write)", async () => {
		expect(prodAs(auditor).update({ id: 1, price: 999 })).rejects.toThrow(/permission/i);
	});
});

describe("UPC generate + duplicate prevention", () => {
	it("generates a valid internal UPC and logs an audit event", async () => {
		const res = await upcAs(auditor).generate({ productId: 1 });
		expect(res.upc).toMatch(/^\d{12}$/);
		const log = await pg.query(
			`SELECT * FROM audit_logs WHERE action = 'UPC_GENERATE' AND entity_id = 1`,
		);
		expect(log.rows.length).toBe(1);
	});

	it("rejects an externally-supplied UPC already assigned to another product", async () => {
		const first = await upcAs(auditor).generate({ productId: 2 });
		// Re-using product 2's UPC on product 3 must conflict.
		expect(
			upcAs(auditor).generate({ productId: 3, upc: first.upc, source: "external" }),
		).rejects.toThrow(/already assigned/i);
	});

	it("rejects an invalid check-digit UPC", async () => {
		expect(
			upcAs(auditor).generate({ productId: 3, upc: "000000000001", source: "external" }),
		).rejects.toThrow(/Invalid UPC/i);
	});
});

describe("UPC task state machine + idempotency", () => {
	let taskId: number;

	it("creates an assigned task", async () => {
		const res = await upcAs(auditor).assignTask({
			productId: 3,
			taskType: "generate",
			assignedTo: 4,
			branchId: 1,
		});
		taskId = res.taskId;
		expect(res.status).toBe("ASSIGNED");
	});

	it("refuses a second OPEN task for the same product+type (idempotent)", async () => {
		expect(
			upcAs(auditor).assignTask({ productId: 3, taskType: "generate" }),
		).rejects.toThrow(/already exists/i);
	});

	it("rejects an illegal jump (verify while not VERIFICATION_REQUIRED)", async () => {
		expect(upcAs(auditor).verifyTask({ taskId })).rejects.toThrow(/Cannot transition/i);
	});

	it("runs the legal path start → complete → verify (by a different auditor)", async () => {
		await upcAs(putter).startTask({ taskId }); // assignee (staff 4 = putter) may progress
		// A fresh, unique valid UPC for product 3.
		const gen = await upcAs(auditor).generate({ productId: 3 });
		// Free that barcode row so completeTask can re-submit the same value for the task.
		await pg.query(`DELETE FROM product_barcodes WHERE barcode = $1`, [gen.upc]);
		await upcAs(putter).completeTask({ taskId, upcValue: gen.upc, upcSource: "internal" });
		const verified = await upcAs(auditor).verifyTask({ taskId });
		expect(verified.status).toBe("VERIFIED");
	});
});

describe("Separation of duties", () => {
	it("blocks the submitter from verifying their own UPC task", async () => {
		const { taskId } = await upcAs(auditor).assignTask({
			productId: 1,
			taskType: "verify",
			assignedTo: 1, // staff 1 == auditor (the same actor who will try to verify)
		});
		await upcAs(auditor).startTask({ taskId });
		const gen = await upcAs(auditor).generate({ productId: 1 });
		await pg.query(`DELETE FROM product_barcodes WHERE barcode = $1`, [gen.upc]);
		await upcAs(auditor).completeTask({ taskId, upcValue: gen.upc });
		expect(upcAs(auditor).verifyTask({ taskId })).rejects.toThrow(/cannot verify/i);
	});

	it("blocks resolving a finding you raised yourself", async () => {
		const { findingId } = await findAs(auditor).create({
			findingType: "inventory",
			severity: "HIGH",
			title: "Test finding",
		});
		expect(findAs(auditor).resolve({ findingId })).rejects.toThrow(/cannot resolve/i);
	});

	it("allows a different auditor to resolve the finding", async () => {
		const { findingId } = await findAs(auditor).create({
			findingType: "inventory",
			severity: "LOW",
			title: "Resolvable finding",
		});
		const res = await findAs(auditor2).resolve({ findingId });
		expect(res.status).toBe("RESOLVED");
	});
});

describe("Price-change immutability", () => {
	it("manager price change appends price_change_history + audit_logs", async () => {
		await prodAs(manager).update({ id: 2, price: 55, priceChangeReason: "market" });
		const hist = await pg.query(
			`SELECT * FROM price_change_history WHERE product_id = 2`,
		);
		expect(hist.rows.length).toBe(1);
		expect(String(hist.rows[0].new_price)).toBe("55.00");
		const log = await pg.query(
			`SELECT * FROM audit_logs WHERE action = 'PRODUCT_PRICE_CHANGE' AND entity_id = 2`,
		);
		expect(log.rows.length).toBe(1);
	});

	it("auditor review of a price change creates a finding, never edits the price", async () => {
		const [row] = (await pg.query(`SELECT id FROM price_change_history WHERE product_id = 2 LIMIT 1`)).rows;
		const res = await priceAs(auditor).reviewChange({
			priceChangeId: row.id,
			severity: "MEDIUM",
			description: "Unusual jump",
		});
		expect(res.findingId).toBeGreaterThan(0);
		// Price row untouched by the review.
		const p = await pg.query(`SELECT price FROM products WHERE id = 2`);
		expect(String(p.rows[0].price)).toBe("55.00");
	});
});
