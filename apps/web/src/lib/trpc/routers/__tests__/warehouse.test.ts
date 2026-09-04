// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import * as schema from "@/lib/db/schema";
import { buildDDL, createTestDb, makeFinanceUser } from "./helpers";

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const { warehouseRouter } = await import("../warehouse");
const { createCallerFactory } = await import("../../init");

const warehouseTables = [
	schema.branches,
	schema.staff,
	schema.products,
	schema.suppliers,
	schema.customers,
	schema.purchases,
	schema.purchaseItems,
	schema.receivingInspections,
	schema.placementVerifications,
	schema.productBatches,
	schema.branchLocations,
	schema.batchStock,
	schema.branchInventory,
	schema.pickLists,
	schema.pickListItems,
	schema.packages,
	schema.packageItems,
	schema.orders,
	schema.orderItems,
	schema.stockAdjustments,
	schema.auditLogs,
];

const WAREHOUSE_SCHEMA_DDL = buildDDL(warehouseTables, false);

// Actors
const admin = makeFinanceUser({
	id: "admin-1",
	email: "warehouse-admin@test.com",
	role: "admin",
	branchId: 1,
});

const staffWorker = makeFinanceUser({
	id: "worker-1",
	email: "worker@test.com",
	role: "picker",
	branchId: 1,
});

const callAs = (u) => createCallerFactory(warehouseRouter)({ user: u, db });

beforeAll(async () => {
	await pg.exec(WAREHOUSE_SCHEMA_DDL);

	// Seed basic reference data
	await pg.exec(`
		INSERT INTO branches (id, name) VALUES (1, 'Main HQ');
		
		INSERT INTO staff (id, name, email, role, join_date, salary, branch_id) VALUES
		(1, 'Admin User', 'warehouse-admin@test.com', 'admin', NOW(), 50000, 1),
		(2, 'Warehouse Worker', 'worker@test.com', 'picker', NOW(), 30000, 1);
		
		INSERT INTO suppliers (id, name, outstanding_balance) VALUES (1, 'Acme Corp', 0.00);
		
		INSERT INTO customers (id, name, email, phone, status, user_uid) VALUES (1, 'John Doe', 'john@customer.com', '1234567890', 'active', 'customer-1');
		
		INSERT INTO products (id, name, sku, price, user_uid) VALUES 
		(1, 'High-Grade Steel Widget', 'SKU-STEEL-WIDGET', 120.00, 'admin-1'),
		(2, 'Copper Wire Coil', 'SKU-COPPER-COIL', 85.50, 'admin-1');
		
		INSERT INTO branch_locations (id, branch_id, name, section, aisle, shelf, level, capacity, current_stock) VALUES
		(1, 1, 'BIN-A101', 'A', '1', '1', '1', 500, 0),
		(2, 1, 'BIN-B202', 'B', '2', '2', '2', 800, 0);

		INSERT INTO product_batches (id, product_id, batch_number, mrp, selling_price, purchase_price) VALUES
		(1, 1, 'BATCH-STEEL-001', 120.00, 120.00, 100.00),
		(2, 2, 'BATCH-COPPER-001', 85.50, 85.50, 70.00);

		INSERT INTO purchases (id, branch_id, grn_number, supplier_id, total_amount, user_uid, status) VALUES
		(100, 1, 'GRN-2026-0001', 1, 2050.00, 'admin-1', 'pending');

		INSERT INTO purchase_items (id, purchase_id, product_id, quantity, price) VALUES
		(10, 100, 1, 10, 120.00),
		(11, 100, 2, 10, 85.00);

		INSERT INTO orders (id, customer_id, branch_id, total_amount, status, user_uid) VALUES
		(200, 1, 1, 205.50, 'pending', 'admin-1');

		INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES
		(20, 200, 1, 2, 120.00);

		INSERT INTO pick_lists (id, order_id, reference_type, reference_id, status, assigned_to) VALUES
		(300, 200, 'sale', 200, 'pending', NULL);

		INSERT INTO pick_list_items (id, pick_list_id, product_id, quantity_ordered, quantity_picked, status) VALUES
		(30, 300, 1, 2, 0, 'pending');
	`);
});

afterAll(async () => {
	await pg.close();
});

describe("Complete Warehouse Operations Workflow Unit Tests", () => {
	it("should retrieve overview stats", async () => {
		const stats = await callAs(admin).getOverviewStats({});
		expect(stats.ordersWaiting).toBe(1);
		expect(stats.receivingQueue).toBe(1);
		expect(stats.pickingQueue).toBe(0);
		expect(stats.tasksInProgress).toBe(0);
	});

	it("should list receiving POs and items", async () => {
		const pos = await callAs(admin).getReceivingPOs();
		expect(pos.length).toBeGreaterThan(0);
		expect(pos[0].id).toBe(100);

		const items = await callAs(admin).getPurchaseItems({ purchaseId: 100 });
		expect(items.length).toBe(2);
		expect(items[0].product_name).toBe("High-Grade Steel Widget");
	});

	it("should receive PO and inspection correctly", async () => {
		const res = await callAs(admin).receivePO({
			purchaseId: 100,
			items: [
				{ productId: 1, expectedQty: 10, receivedQty: 10, condition: "good" },
				{ productId: 2, expectedQty: 10, receivedQty: 10, condition: "good" },
			],
		});
		expect(res.success).toBe(true);

		const stats = await callAs(admin).getOverviewStats({});
		expect(stats.receivingQueue).toBe(0); // It has been received
	});

	it("should retrieve put-away queue and support assigning & completing put-away", async () => {
		const queue = await callAs(admin).getPutAwayQueue();
		expect(queue.length).toBeGreaterThan(0);

		const taskId = queue[0].id;
		// Assign Put-Away
		const assignRes = await callAs(admin).assignPutAwayTask({
			placementId: taskId,
			workerId: 2, // Worker staff ID
		});
		expect(assignRes.success).toBe(true);

		// Start Put-Away
		const startRes = await callAs(admin).startPutAwayTask({
			placementId: taskId,
		});
		expect(startRes.success).toBe(true);

		// Complete Put-Away (verifies and adds stock to bin/inventory)
		const completeRes = await callAs(admin).completePutAwayTask({
			placementId: taskId,
			locationId: 1,
			qty: 10,
			notes: "Placed Widget successfully",
		});
		expect(completeRes.success).toBe(true);

		// Verify stock was updated in DB
		const stockRows = await pg.query(
			"SELECT quantity FROM batch_stock WHERE location_id = 1",
		);
		expect(stockRows.rows.length).toBeGreaterThan(0);
		expect(Number(stockRows.rows[0].quantity)).toBe(10);
	});

	it("should retrieve picking queue and support picking workflow", async () => {
		const queue = await callAs(admin).getPickingQueue();
		expect(queue.length).toBeGreaterThan(0);
		expect(queue[0].id).toBe(300);

		// Assign Picking
		const assignRes = await callAs(admin).assignPickingTask({
			pickListId: 300,
			workerId: 2,
		});
		expect(assignRes.success).toBe(true);

		// Start Picking
		const startRes = await callAs(admin).startPickingTask({
			pickListId: 300,
		});
		expect(startRes.success).toBe(true);

		// Get Items
		const items = await callAs(admin).getPickListItems({ pickListId: 300 });
		expect(items.length).toBe(1);
		expect(items[0].id).toBe(30);

		// Pick Item
		const pickRes = await callAs(admin).pickItem({
			itemId: 30,
			qtyPicked: 2,
		});
		expect(pickRes.success).toBe(true);

		// Complete Picking Task
		const completeRes = await callAs(admin).completePickingTask({
			pickListId: 300,
		});
		expect(completeRes.success).toBe(true);
		expect(completeRes.packageId).toBeDefined();
	});

	it("should retrieve packing queue and complete packing", async () => {
		const queue = await callAs(admin).getPackingQueue();
		expect(queue.length).toBeGreaterThan(0);

		const pkgId = queue[0].id;
		const packRes = await callAs(admin).packPackage({
			packageId: pkgId,
			weight: 5.4,
			dimensions: "10x10x10",
			notes: "Securely taped",
		});
		expect(packRes.success).toBe(true);

		// Verify package status is packed
		const pkgRows = await pg.query(
			"SELECT status FROM packages WHERE id = $1",
			[pkgId],
		);
		expect(pkgRows.rows[0].status).toBe("packed");
	});

	it("should allow logging exceptions/damages", async () => {
		const res = await callAs(admin).logException({
			productId: 1,
			qty: 1,
			reason: "Water damage to widgets in rack A",
			type: "damage",
		});
		expect(res.success).toBe(true);
		expect(res.adjustmentId).toBeDefined();

		// Verify in DB
		const adjRows = await pg.query(
			"SELECT adjustment_type, reason FROM stock_adjustments WHERE id = $1",
			[res.adjustmentId],
		);
		expect(adjRows.rows[0].adjustment_type).toBe("damage");
		expect(adjRows.rows[0].reason).toBe("Water damage to widgets in rack A");
	});
});
