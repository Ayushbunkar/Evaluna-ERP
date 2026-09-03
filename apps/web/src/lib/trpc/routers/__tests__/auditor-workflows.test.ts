// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import * as schema from "@/lib/db/schema";
import { getPermissionsForRole } from "@/lib/permissions";
import { buildDDL, createTestDb, makeUser } from "./helpers";

/**
 * Auditor Phase 6 — workflow coverage that `auditor.test.ts` does not carry:
 * inventory-inspection discrepancy fan-out, the finding + corrective-action
 * state machines, receiving/placement/route finding creation, the unified task
 * feed, cross-router RBAC denials, and audit-trail append-only immutability.
 *
 * Self-contained: its own PGlite instance, its own table list, its own seed.
 */

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const TABLES = [
	schema.branches,
	schema.staff,
	schema.products,
	schema.productBarcodes,
	schema.productBatches,
	schema.stockAdjustments,
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

const { auditRouter } = await import("../audit");
const { auditFindingsRouter } = await import("../audit-findings");
const { auditTasksRouter } = await import("../audit-tasks");
const { receivingInspectionsRouter } = await import("../receiving-inspections");
const { placementRouter } = await import("../placement");
const { routeAuditRouter } = await import("../route-audit");
const { priceAuditRouter } = await import("../price-audit");
const { upcRouter } = await import("../upc");
const { auditorRouter } = await import("../auditor");
const { createCallerFactory } = await import("../../init");

// requirePermission reads ctx.user.permissions, so actors carry the real matrix.
const withPerms = (id: string, role: string) => ({
	...makeUser(id),
	role,
	permissions: getPermissionsForRole(role as any),
});

// staff.id ↔ user mapping (resolveStaffId bridges by email):
//   1 aud, 2 aud2, 3 mgr, 4 put, 5 pick, 6 bil, 7 sal
const auditor = withPerms("aud", "auditor");
const auditor2 = withPerms("aud2", "auditor");
const manager = withPerms("mgr", "manager");
const putter = withPerms("put", "putter");
const picker = withPerms("pick", "picker");
const biller = withPerms("bil", "biller");
const sales = withPerms("sal", "sales_person");

const auditAs = (u: any) => createCallerFactory(auditRouter)({ user: u, db });
const findAs = (u: any) =>
	createCallerFactory(auditFindingsRouter)({ user: u, db });
const tasksAs = (u: any) =>
	createCallerFactory(auditTasksRouter)({ user: u, db });
const recvAs = (u: any) =>
	createCallerFactory(receivingInspectionsRouter)({ user: u, db });
const placeAs = (u: any) =>
	createCallerFactory(placementRouter)({ user: u, db });
const routeAs = (u: any) =>
	createCallerFactory(routeAuditRouter)({ user: u, db });
const priceAs = (u: any) =>
	createCallerFactory(priceAuditRouter)({ user: u, db });
const upcAs = (u: any) => createCallerFactory(upcRouter)({ user: u, db });
const dashAs = (u: any) => createCallerFactory(auditorRouter)({ user: u, db });

const rows = async (sql: string, params: any[] = []) =>
	(await pg.query(sql, params)).rows as any[];

beforeAll(async () => {
	await pg.exec(buildDDL(TABLES, false));
	await pg.exec(`INSERT INTO branches (id, name) VALUES (1, 'Main');`);
	await pg.exec(`
		INSERT INTO staff (id, name, email, role, join_date, salary, branch_id) VALUES
		(1, 'Auditor', 'aud@test.com', 'auditor', NOW(), 40000, 1),
		(2, 'Auditor2', 'aud2@test.com', 'auditor', NOW(), 40000, 1),
		(3, 'Manager', 'mgr@test.com', 'manager', NOW(), 60000, 1),
		(4, 'Putter', 'put@test.com', 'putter', NOW(), 20000, 1),
		(5, 'Picker', 'pick@test.com', 'picker', NOW(), 20000, 1),
		(6, 'Biller', 'bil@test.com', 'biller', NOW(), 20000, 1),
		(7, 'Sales', 'sal@test.com', 'sales_person', NOW(), 20000, 1);
	`);
	await pg.exec(`
		INSERT INTO products (id, name, sku, price, base_selling_price, base_procurement_price, user_uid) VALUES
		(1, 'Product A', 'SKU-A', '100.00', '100.00', '60.00', 'seed'),
		(2, 'Product B', 'SKU-B', '50.00', '50.00', '30.00', 'seed'),
		(3, 'Product C', 'SKU-C', '75.00', '75.00', '40.00', 'seed'),
		(4, 'Product D', 'SKU-D', '20.00', '20.00', '10.00', 'seed'),
		(5, 'Product E', 'SKU-E', '30.00', '30.00', '15.00', 'seed');
	`);
	// Append-only price log row: the auditor may flag it but never mutate it.
	await pg.exec(`
		INSERT INTO price_change_history
			(id, product_id, price_field, old_price, new_price, changed_by, reason, source)
		VALUES (1, 2, 'price', '50.00', '55.00', 3, 'market move', 'manual');
	`);
	// Trip with a planned-vs-actual deviation for the route audit.
	await pg.exec(`
		INSERT INTO delivery_trips
			(id, driver_id, status, expected_stops, completed_stops, expected_cash_collection, actual_cash_collection)
		VALUES (1, 'driver-1', 'completed', 10, 8, '5000.00', '4200.00');
	`);
});

afterAll(async () => {
	await pg.close();
});
describe("Inventory inspection — count fan-out (audit.ts)", () => {
	let auditId: number;
	let shortItemId: number;
	let matchItemId: number;

	it("creates a planned stock audit and logs it", async () => {
		const audit = await auditAs(auditor).create({
			branch_id: 1,
			auditor_id: 1,
		});
		auditId = audit.id;
		expect(audit.status).toBe("planned");
		const log = await rows(
			`SELECT * FROM audit_logs WHERE action = 'STOCK_AUDIT_CREATE' AND entity_id = $1`,
			[auditId],
		);
		expect(log.length).toBe(1);
		expect(log[0].user_id).toBe(1); // resolved from aud@test.com
	});

	it("a short count creates a mismatch item + discrepancy + missing-stock queue row", async () => {
		const item = await auditAs(auditor).addCount({
			audit_id: auditId,
			product_id: 3,
			expected_qty: 10,
			counted_qty: 7,
		});
		shortItemId = item.id;
		expect(item.status).toBe("mismatch");

		const disc = await rows(
			"SELECT * FROM audit_discrepancies WHERE audit_item_id = $1",
			[shortItemId],
		);
		expect(disc.length).toBe(1);
		expect(disc[0].discrepancy_type).toBe("missing");
		expect(disc[0].quantity).toBe(3); // shortfall = expected - counted
		expect(disc[0].resolution_status).toBe("pending");

		const queue = await rows(
			"SELECT * FROM missing_stock_queue WHERE audit_id = $1 AND product_id = 3",
			[auditId],
		);
		expect(queue.length).toBe(1);
		expect(queue[0].quantity).toBe(3);
		expect(queue[0].status).toBe("missing");
	});

	it("a matching count creates neither a discrepancy nor a queue row", async () => {
		const item = await auditAs(auditor).addCount({
			audit_id: auditId,
			product_id: 4,
			expected_qty: 5,
			counted_qty: 5,
		});
		matchItemId = item.id;
		expect(item.status).toBe("match");
		expect(
			(
				await rows(
					"SELECT 1 FROM audit_discrepancies WHERE audit_item_id = $1",
					[matchItemId],
				)
			).length,
		).toBe(0);
		expect(
			(await rows("SELECT 1 FROM missing_stock_queue WHERE product_id = 4"))
				.length,
		).toBe(0);
	});

	it("an over-count is a mismatch but raises no missing-stock queue row", async () => {
		const item = await auditAs(auditor).addCount({
			audit_id: auditId,
			product_id: 5,
			expected_qty: 4,
			counted_qty: 6,
		});
		expect(item.status).toBe("mismatch");
		expect(
			(
				await rows(
					"SELECT 1 FROM audit_discrepancies WHERE audit_item_id = $1",
					[item.id],
				)
			).length,
		).toBe(0);
		expect(
			(await rows("SELECT 1 FROM missing_stock_queue WHERE product_id = 5"))
				.length,
		).toBe(0);
	});

	it("getAudit returns the audit with its counted items; listAudits honours the status filter", async () => {
		const res = await auditAs(auditor).getAudit({ auditId });
		expect(res.audit.id).toBe(auditId);
		expect(res.items.length).toBe(3);

		const planned = await auditAs(auditor).listAudits({ status: "planned" });
		expect(planned.some((a: any) => a.id === auditId)).toBe(true);
		const completed = await auditAs(auditor).listAudits({
			status: "completed",
		});
		expect(completed.some((a: any) => a.id === auditId)).toBe(false);
		const otherBranch = await auditAs(auditor).listAudits({ branchId: 99 });
		expect(otherBranch.length).toBe(0);
	});

	it("reportDamageOrExpiry appends a second discrepancy on the same item", async () => {
		const disc = await auditAs(auditor).reportDamageOrExpiry({
			audit_item_id: matchItemId,
			type: "damage",
			quantity: 2,
			reason: "crushed carton",
		});
		expect(disc.discrepancy_type).toBe("damage");
		expect(disc.resolution_status).toBe("pending");
		expect(
			(
				await rows(
					"SELECT 1 FROM audit_discrepancies WHERE audit_item_id = $1",
					[matchItemId],
				)
			).length,
		).toBe(1);
	});

	it("escalations list pending discrepancies; resolveDiscrepancy clears one and logs it", async () => {
		const before = await auditAs(auditor).listEscalations();
		expect(before.length).toBe(2); // missing + damage
		const target = before.find((d: any) => d.discrepancy_type === "missing");

		const resolved = await auditAs(auditor).resolveDiscrepancy({
			discrepancy_id: target.id,
			status: "approved",
			resolver_id: 2,
		});
		expect(resolved.resolution_status).toBe("approved");
		expect(resolved.resolved_by).toBe(2);
		expect(resolved.resolved_at).not.toBeNull();

		const after = await auditAs(auditor).listEscalations();
		expect(after.length).toBe(before.length - 1);
		expect(after.some((d: any) => d.id === target.id)).toBe(false);

		const log = await rows(
			`SELECT * FROM audit_logs WHERE action = 'DISCREPANCY_RESOLVE' AND entity_id = $1`,
			[target.id],
		);
		expect(log.length).toBe(1);
		expect(log[0].new_values).toEqual({ status: "approved" });
	});
});
describe("Findings status state machine (audit-findings.ts)", () => {
	let findingId: number;

	it("walks the legal path OPEN → UNDER_REVIEW → CORRECTIVE_ACTION_REQUIRED", async () => {
		const created = await findAs(auditor).create({
			branchId: 1,
			findingType: "inventory",
			severity: "MEDIUM",
			title: "Shortfall on product #3",
			description: "counted 7 of 10",
			referenceType: "stock_audits",
			referenceId: 1,
		});
		findingId = created.findingId;
		const { finding } = await findAs(auditor).get({ findingId });
		expect(finding.status).toBe("OPEN");

		const r1 = await findAs(auditor).updateStatus({
			findingId,
			status: "UNDER_REVIEW",
		});
		expect(r1.status).toBe("UNDER_REVIEW");
		const r2 = await findAs(auditor).updateStatus({
			findingId,
			status: "CORRECTIVE_ACTION_REQUIRED",
		});
		expect(r2.status).toBe("CORRECTIVE_ACTION_REQUIRED");
	});

	it("rejects re-entering UNDER_REVIEW from CORRECTIVE_ACTION_REQUIRED (CONFLICT)", async () => {
		await expect(
			findAs(auditor).updateStatus({ findingId, status: "UNDER_REVIEW" }),
		).rejects.toThrow(/Cannot transition finding/i);
	});

	it("rejects verify while the finding is not RESOLVED (CONFLICT)", async () => {
		await expect(findAs(auditor).verify({ findingId })).rejects.toThrow(
			/Cannot transition finding/i,
		);
	});

	it("cannot jump straight to CLOSED — the input schema has no such target", async () => {
		await expect(
			// @ts-expect-error deliberate illegal target status
			findAs(auditor).updateStatus({ findingId, status: "CLOSED" }),
		).rejects.toThrow();
		const [row] = await rows(
			"SELECT status FROM audit_findings WHERE id = $1",
			[findingId],
		);
		expect(row.status).toBe("CORRECTIVE_ACTION_REQUIRED");
	});

	it("resolve (by a second auditor) then verify closes the finding", async () => {
		const resolved = await findAs(auditor2).resolve({
			findingId,
			note: "recount matched",
		});
		expect(resolved.status).toBe("RESOLVED");
		const closed = await findAs(auditor).verify({ findingId });
		expect(closed.status).toBe("CLOSED");
		const [row] = await rows("SELECT * FROM audit_findings WHERE id = $1", [
			findingId,
		]);
		expect(row.status).toBe("CLOSED");
		expect(row.resolved_by).toBe(2);
	});

	it("unauthorized audit verification fails", async () => {
		// Picker does not have audit.approve permission, so it should be rejected.
		await expect(findAs(picker).verify({ findingId })).rejects.toThrow(
			/permission/i,
		);
	});

	it("high-severity finding requires secondary verifier (resolver/creator cannot verify)", async () => {
		// Create a high-severity finding raised by auditor (staffId: 1)
		const created = await findAs(auditor).create({
			branchId: 1,
			findingType: "price",
			severity: "HIGH",
			title: "High risk price mismatch",
			description: "unauthorized price change",
		});
		const highFindingId = created.findingId;

		await findAs(auditor).updateStatus({ findingId: highFindingId, status: "UNDER_REVIEW" });
		await findAs(auditor2).resolve({ findingId: highFindingId, note: "resolved by auditor2" });

		// 1. Resolver (auditor2, staffId: 2) tries to verify their own resolution - must fail!
		await expect(findAs(auditor2).verify({ findingId: highFindingId })).rejects.toThrow(
			/Secondary verification required.*different auditor.*resolved/i,
		);

		// 2. Creator (auditor, staffId: 1) tries to verify - must fail because they raised it!
		await expect(findAs(auditor).verify({ findingId: highFindingId })).rejects.toThrow(
			/Secondary verification required.*different auditor.*raised/i,
		);

		// 3. A completely separate authorized user (manager, staffId: 3) verifies - must succeed!
		const closed = await findAs(manager).verify({ findingId: highFindingId });
		expect(closed.status).toBe("CLOSED");
	});

	it("refuses to re-verify an already CLOSED finding", async () => {
		await expect(findAs(auditor).verify({ findingId })).rejects.toThrow(
			/Cannot transition finding/i,
		);
	});

	it("404s on an unknown finding", async () => {
		await expect(findAs(auditor).get({ findingId: 999999 })).rejects.toThrow(
			/not found/i,
		);
		await expect(
			findAs(auditor).updateStatus({
				findingId: 999999,
				status: "UNDER_REVIEW",
			}),
		).rejects.toThrow(/not found/i);
	});

	it("list filters by status, type and severity", async () => {
		const closed = await findAs(auditor).list({ status: "CLOSED" });
		expect(closed.every((f: any) => f.status === "CLOSED")).toBe(true);
		expect(closed.some((f: any) => f.id === findingId)).toBe(true);
		const inventory = await findAs(auditor).list({
			findingType: "inventory",
			severity: "MEDIUM",
		});
		expect(inventory.some((f: any) => f.id === findingId)).toBe(true);
		const none = await findAs(auditor).list({
			findingType: "route",
			severity: "LOW",
		});
		expect(none.some((f: any) => f.id === findingId)).toBe(false);
	});
});
// PLACEHOLDER_BODY
