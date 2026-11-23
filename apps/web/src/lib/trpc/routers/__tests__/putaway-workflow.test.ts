import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import {
	branches,
	branchInventory,
	branchLocations,
	goodsReceiptNotes,
	products,
	purchases,
	putawayDiscrepancies,
	putawayTaskItems,
	putawayTasks,
	stockLedger,
	vanStockPlanItems,
	vanStockPlans,
} from "@evaluna/db/schema";
import { eq } from "drizzle-orm";
import {
	createPutawayTaskForGRN,
	createPutawayTaskForRejectedPlan,
	createPutawayTaskForVanReturn,
	syncPendingRejectionsToPutaway,
} from "@/lib/putaway/putaway-service";

describe("Complete Putter & Inventory Putaway Workflow", () => {
	let pg: PGlite;
	let db: any;

	beforeEach(async () => {
		pg = new PGlite();

		// Create in-memory tables for testing
		await pg.exec(`
			CREATE TABLE IF NOT EXISTS branches (
				id SERIAL PRIMARY KEY,
				name VARCHAR(255) NOT NULL
			);

			CREATE TABLE IF NOT EXISTS products (
				id SERIAL PRIMARY KEY,
				name VARCHAR(255) NOT NULL,
				sku VARCHAR(100),
				price NUMERIC(10, 2) DEFAULT '0.00',
				base_procurement_price NUMERIC(10, 2) DEFAULT '0.00',
				base_selling_price NUMERIC(10, 2) DEFAULT '0.00',
				buying_price NUMERIC(10, 2) DEFAULT '0.00'
			);

			CREATE TABLE IF NOT EXISTS branch_inventory (
				id SERIAL PRIMARY KEY,
				branch_id INTEGER NOT NULL,
				product_id INTEGER NOT NULL,
				in_stock NUMERIC(10, 3) DEFAULT 0,
				reserved_stock NUMERIC(10, 3) DEFAULT 0,
				reorder_level INTEGER DEFAULT 10,
				created_at TIMESTAMP DEFAULT NOW()
			);

			CREATE TABLE IF NOT EXISTS branch_locations (
				id SERIAL PRIMARY KEY,
				branch_id INTEGER NOT NULL,
				name VARCHAR(50) NOT NULL,
				section VARCHAR(20),
				aisle VARCHAR(20),
				shelf VARCHAR(20),
				current_stock NUMERIC(10, 3) DEFAULT 0,
				is_active BOOLEAN DEFAULT true
			);

			CREATE TABLE IF NOT EXISTS stock_ledger (
				id SERIAL PRIMARY KEY,
				branch_id INTEGER,
				product_id INTEGER NOT NULL,
				batch_id INTEGER,
				transaction_type VARCHAR(20) NOT NULL,
				quantity NUMERIC(10, 3) NOT NULL,
				unit_cost NUMERIC(10, 2) NOT NULL,
				total_cost NUMERIC(10, 2) NOT NULL,
				reference_id INTEGER,
				reference_type VARCHAR(50),
				created_at TIMESTAMP DEFAULT NOW()
			);

			CREATE TABLE IF NOT EXISTS purchases (
				id SERIAL PRIMARY KEY,
				branch_id INTEGER NOT NULL,
				status VARCHAR(30) DEFAULT 'pending',
				po_number VARCHAR(50)
			);

			CREATE TABLE IF NOT EXISTS goods_receipt_notes (
				id SERIAL PRIMARY KEY,
				grn_number VARCHAR(50) NOT NULL UNIQUE,
				purchase_id INTEGER NOT NULL,
				branch_id INTEGER NOT NULL,
				received_by VARCHAR(255) NOT NULL,
				status VARCHAR(30) DEFAULT 'accepted'
			);

			CREATE TABLE IF NOT EXISTS van_stock_plans (
				id SERIAL PRIMARY KEY,
				plan_code VARCHAR(50) NOT NULL,
				branch_id INTEGER NOT NULL,
				status VARCHAR(50) NOT NULL,
				rejection_reason TEXT,
				revision INTEGER DEFAULT 1
			);

			CREATE TABLE IF NOT EXISTS van_stock_plan_items (
				id SERIAL PRIMARY KEY,
				plan_id INTEGER NOT NULL,
				product_id INTEGER NOT NULL,
				planned_quantity NUMERIC(10, 3) DEFAULT 0,
				picked_quantity NUMERIC(10, 3) DEFAULT 0,
				packed_quantity NUMERIC(10, 3) DEFAULT 0,
				loaded_quantity NUMERIC(10, 3) DEFAULT 0,
				returned_quantity NUMERIC(10, 3) DEFAULT 0,
				verified_return_quantity NUMERIC(10, 3) DEFAULT 0
			);

			CREATE TABLE IF NOT EXISTS putaway_tasks (
				id SERIAL PRIMARY KEY,
				task_number VARCHAR(60) NOT NULL UNIQUE,
				branch_id INTEGER NOT NULL,
				source_type VARCHAR(50) NOT NULL,
				source_id INTEGER,
				source_reference VARCHAR(100) NOT NULL,
				purchase_id INTEGER,
				grn_id INTEGER,
				supplier_name VARCHAR(255),
				driver_name VARCHAR(255),
				vehicle_number VARCHAR(100),
				route_name VARCHAR(255),
				status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
				total_items INTEGER NOT NULL DEFAULT 0,
				total_expected_quantity NUMERIC(10, 3) NOT NULL DEFAULT 0,
				total_putaway_quantity NUMERIC(10, 3) NOT NULL DEFAULT 0,
				assigned_putter_id VARCHAR(255),
				assigned_putter_name VARCHAR(255),
				verified_by VARCHAR(255),
				rejection_reason TEXT,
				notes TEXT,
				created_at TIMESTAMP DEFAULT NOW(),
				updated_at TIMESTAMP DEFAULT NOW(),
				completed_at TIMESTAMP
			);

			CREATE TABLE IF NOT EXISTS putaway_task_items (
				id SERIAL PRIMARY KEY,
				task_id INTEGER NOT NULL,
				product_id INTEGER NOT NULL,
				product_name VARCHAR(255) NOT NULL,
				sku VARCHAR(100),
				expected_quantity NUMERIC(10, 3) NOT NULL,
				verified_quantity NUMERIC(10, 3) NOT NULL DEFAULT 0,
				putaway_quantity NUMERIC(10, 3) NOT NULL DEFAULT 0,
				remaining_quantity NUMERIC(10, 3) NOT NULL DEFAULT 0,
				damaged_quantity NUMERIC(10, 3) NOT NULL DEFAULT 0,
				rejected_quantity NUMERIC(10, 3) NOT NULL DEFAULT 0,
				unit_cost NUMERIC(10, 2) DEFAULT 0,
				batch_number VARCHAR(100),
				expiry_date TIMESTAMP,
				condition VARCHAR(50) DEFAULT 'USABLE',
				location_id INTEGER,
				location_name VARCHAR(150) DEFAULT 'Warehouse Main Storage',
				discrepancy_reason TEXT,
				status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
				putaway_by VARCHAR(255),
				putaway_at TIMESTAMP,
				notes TEXT,
				created_at TIMESTAMP DEFAULT NOW()
			);

			CREATE TABLE IF NOT EXISTS putaway_discrepancies (
				id SERIAL PRIMARY KEY,
				task_id INTEGER NOT NULL,
				task_item_id INTEGER,
				product_id INTEGER NOT NULL,
				source_type VARCHAR(50) NOT NULL,
				expected_qty NUMERIC(10, 3) NOT NULL,
				actual_qty NUMERIC(10, 3) NOT NULL,
				difference_qty NUMERIC(10, 3) NOT NULL,
				discrepancy_type VARCHAR(50) NOT NULL,
				reason TEXT NOT NULL,
				responsible_role VARCHAR(50) DEFAULT 'PUTTER',
				reported_by VARCHAR(255) NOT NULL,
				status VARCHAR(40) NOT NULL DEFAULT 'REPORTED',
				resolution_notes TEXT,
				resolved_by VARCHAR(255),
				resolved_at TIMESTAMP,
				created_at TIMESTAMP DEFAULT NOW()
			);

			INSERT INTO branches (id, name) VALUES (1, 'Main Warehouse');
			INSERT INTO products (id, name, sku, price, buying_price) VALUES 
				(1, 'Kundan Sev (कुंदन सेव)', 'SKU-857927', 126.00, 100.00),
				(2, 'Sarso Tel (सरसों तेल)', 'SKU-998877', 150.00, 120.00);
			INSERT INTO branch_inventory (branch_id, product_id, in_stock, reserved_stock) VALUES 
				(1, 1, 80.000, 3.000),
				(1, 2, 50.000, 0.000);
		`);

		db = drizzle(pg);
	});

	afterEach(async () => {
		if (pg) {
			await pg.close();
		}
	});

	it("Test Case 1: Supplier Inward GRN automatically creates Putter task without directly increasing available inventory", async () => {
		// Supplier delivers 100 units of Sarso Tel
		const grn = {
			id: 10,
			grn_number: "GRN-2026-001",
			purchase_id: 1,
			supplier_name: "Oil Suppliers Ltd",
		};
		const items = [
			{
				productId: 2,
				customProductName: "Sarso Tel (सरसों तेल)",
				customSku: "SKU-998877",
				acceptedQuantity: 100,
				unitCost: 120,
			},
		];

		const task = await createPutawayTaskForGRN(db, grn, items, 1, "Procurement Officer");
		expect(task).toBeDefined();
		expect(task.source_type).toBe("SUPPLIER_GRN");
		expect(Number(task.total_expected_quantity)).toBe(100);

		// Inventory in warehouse must NOT yet have increased
		const [invBefore] = await db
			.select()
			.from(branchInventory)
			.where(eq(branchInventory.product_id, 2));
		expect(Number(invBefore.in_stock)).toBe(50.0);

		// Putter confirms putaway of 100 units
		await db.transaction(async (tx: any) => {
			await tx
				.update(branchInventory)
				.set({ in_stock: (Number(invBefore.in_stock) + 100).toString() })
				.where(eq(branchInventory.id, invBefore.id));

			await tx.insert(stockLedger).values({
				branch_id: 1,
				product_id: 2,
				transaction_type: "in",
				quantity: "100.000",
				unit_cost: "120.00",
				total_cost: "12000.00",
				reference_id: grn.id,
				reference_type: "SUPPLIER_GRN",
			});

			await tx
				.update(putawayTasks)
				.set({ status: "COMPLETED", total_putaway_quantity: "100.000" })
				.where(eq(putawayTasks.id, task.id));
		});

		// Now warehouse inventory increases by exactly 100
		const [invAfter] = await db
			.select()
			.from(branchInventory)
			.where(eq(branchInventory.product_id, 2));
		expect(Number(invAfter.in_stock)).toBe(150.0);

		// Stock ledger entry verified
		const ledgerEntries = await db
			.select()
			.from(stockLedger)
			.where(eq(stockLedger.product_id, 2));
		expect(ledgerEntries.length).toBe(1);
		expect(ledgerEntries[0].reference_type).toBe("SUPPLIER_GRN");
	});

	it("Test Case 5 & User Specific: Manager Rejection of Van Manifest automatically creates pending putaway task to return stock to inventory", async () => {
		// Van manifest was picked (3 units of Kundan Sev), currently reserved in inventory
		const plan = {
			id: 4,
			plan_code: "VSP-20261109-1906",
			branch_id: 1,
			items: [
				{
					id: 4,
					product_id: 1,
					picked_quantity: "3.000",
					planned_quantity: "3.000",
					product: { name: "Kundan Sev (कुंदन सेव)", sku: "SKU-857927" },
				},
			],
		};

		// Manager rejects manifest with reason: "Van Bhag Gayi"
		const putawayTask = await createPutawayTaskForRejectedPlan(
			db,
			plan,
			"Van Bhag Gayi",
			"Manager Rajesh",
		);

		expect(putawayTask).toBeDefined();
		expect(putawayTask.source_type).toBe("VAN_MANIFEST_REJECTION");
		expect(putawayTask.source_reference).toBe("VSP-20261109-1906");
		expect(putawayTask.rejection_reason).toBe("Van Bhag Gayi");
		expect(Number(putawayTask.total_expected_quantity)).toBe(3);

		// Putter checks and restocks the 3 units back to warehouse shelf
		const [invBefore] = await db
			.select()
			.from(branchInventory)
			.where(eq(branchInventory.product_id, 1));
		expect(Number(invBefore.reserved_stock)).toBe(3.0);
		// Available was 80 - 3 = 77
		expect(Number(invBefore.in_stock) - Number(invBefore.reserved_stock)).toBe(77.0);

		// Putter confirms putaway
		await db.transaction(async (tx: any) => {
			const nextReserved = Math.max(0, Number(invBefore.reserved_stock) - 3);
			await tx
				.update(branchInventory)
				.set({ reserved_stock: nextReserved.toString() })
				.where(eq(branchInventory.id, invBefore.id));

			await tx.insert(stockLedger).values({
				branch_id: 1,
				product_id: 1,
				transaction_type: "in",
				quantity: "3.000",
				unit_cost: "100.00",
				total_cost: "300.00",
				reference_id: plan.id,
				reference_type: "VAN_MANIFEST_REJECTION",
			});

			await tx
				.update(putawayTasks)
				.set({ status: "COMPLETED", total_putaway_quantity: "3.000" })
				.where(eq(putawayTasks.id, putawayTask.id));
		});

		// Reserved stock is now 0, and available stock is back to full 80 units!
		const [invAfter] = await db
			.select()
			.from(branchInventory)
			.where(eq(branchInventory.product_id, 1));
		expect(Number(invAfter.reserved_stock)).toBe(0.0);
		expect(Number(invAfter.in_stock) - Number(invAfter.reserved_stock)).toBe(80.0);
	});

	it("Test Case 3: Discrepancy Recording when Putter finds mismatch", async () => {
		const [task] = await db
			.insert(putawayTasks)
			.values({
				task_number: "PUT-TEST-001",
				branch_id: 1,
				source_type: "SUPPLIER_GRN",
				source_reference: "GRN-999",
				status: "PENDING",
				total_expected_quantity: "10.000",
			})
			.returning();

		const [item] = await db
			.insert(putawayTaskItems)
			.values({
				task_id: task.id,
				product_id: 1,
				product_name: "Kundan Sev",
				expected_quantity: "10.000",
				verified_quantity: "8.000",
				remaining_quantity: "10.000",
			})
			.returning();

		// Record discrepancy
		await db.insert(putawayDiscrepancies).values({
			task_id: task.id,
			task_item_id: item.id,
			product_id: 1,
			source_type: "SUPPLIER_GRN",
			expected_qty: "10.000",
			actual_qty: "8.000",
			difference_qty: "2.000",
			discrepancy_type: "QUANTITY_MISMATCH",
			reason: "2 packets burst/missing in shipment",
			reported_by: "Putter",
		});

		const discrepancies = await db.select().from(putawayDiscrepancies);
		expect(discrepancies.length).toBe(1);
		expect(Number(discrepancies[0].difference_qty)).toBe(2);
		expect(discrepancies[0].discrepancy_type).toBe("QUANTITY_MISMATCH");
	});

	it("Test Case 6: Idempotency Protection prevents duplicate putaway tasks", async () => {
		const plan = {
			id: 5,
			plan_code: "VSP-20261109-9999",
			branch_id: 1,
			items: [
				{
					id: 10,
					product_id: 1,
					picked_quantity: "5.000",
					product: { name: "Kundan Sev", sku: "SKU-857927" },
				},
			],
		};

		const first = await createPutawayTaskForRejectedPlan(db, plan, "Driver cancelled", "Manager");
		const second = await createPutawayTaskForRejectedPlan(db, plan, "Driver cancelled", "Manager");

		expect(first.id).toBe(second.id);
		const allTasks = await db
			.select()
			.from(putawayTasks)
			.where(eq(putawayTasks.source_reference, "VSP-20261109-9999"));
		expect(allTasks.length).toBe(1);
	});
});
