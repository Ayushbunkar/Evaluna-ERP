// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { eq } from "drizzle-orm";
import { buildDDL, createTestDb, makeUser } from "./helpers";

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const { warehouseRouter } = await import("../warehouse");
const { pickerRouter } = await import("../picker");
const { ordersRouter } = await import("../orders");
const { createCallerFactory } = await import("../../init");
const schema = await import("@/lib/db/schema");

const callerWarehouse = createCallerFactory(warehouseRouter)({
	user: makeUser("manager-1", { role: "warehouse_manager", email: "manager@test.com" }),
	db,
});

const callerPicker = createCallerFactory(pickerRouter)({
	user: makeUser("picker-1", { role: "picker", email: "picker@test.com" }),
	db,
});

const callerSales = createCallerFactory(ordersRouter)({
	user: makeUser("sales-1", { role: "sales_rep", email: "sales@test.com" }),
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
		schema.branchInventory,
		schema.branchLocations,
		schema.branchDamage,
		schema.stockLedger,
		schema.orderAudits,
		schema.pickLists,
		schema.pickListItems,
		schema.pickingExceptions,
		schema.packages,
		schema.packageItems,
		schema.deliveryRoutes,
		schema.routeStops,
		schema.deliveryTrips,
		schema.tripStops,
		schema.vehicles,
		schema.auditLogs,
		schema.notifications,
	],
	false,
);

let testBranchId: number;
let testCustomerId: number;
let testProductId: number;
let testStaffPickerId: number;
let testStaffManagerId: number;

beforeAll(async () => {
	try {
		await pg.exec(
			`CREATE TYPE vehicle_status AS ENUM ('available', 'in_use', 'maintenance', 'retired');`,
		);
	} catch (e) {
		// Ignore if enum already exists
	}
	await pg.exec(DDL);

	// Seed branch
	const [b] = await db
		.insert(schema.branches)
		.values({
			name: "Main Branch",
			code: "MAIN",
			address: "123 Warehouse Way",
		})
		.returning();
	testBranchId = b.id;

	// Seed staff (picker and manager)
	const [sp] = await db
		.insert(schema.staff)
		.values({
			name: "Test Picker",
			staff_code: "STAFF-PICKER-01",
			email: "picker@test.com",
			role: "picker",
			branch_id: testBranchId,
			active: true,
			join_date: new Date(),
			salary: "20000.00",
		})
		.returning();
	testStaffPickerId = sp.id;

	const [sm] = await db
		.insert(schema.staff)
		.values({
			name: "Test Manager",
			staff_code: "STAFF-MGR-01",
			email: "manager@test.com",
			role: "warehouse_manager",
			branch_id: testBranchId,
			active: true,
			join_date: new Date(),
			salary: "35000.00",
		})
		.returning();
	testStaffManagerId = sm.id;

	// Seed customer
	const [c] = await db
		.insert(schema.customers)
		.values({
			name: "ABC General Store",
			address: "Market Road",
			user_uid: "sales-1",
		})
		.returning();
	testCustomerId = c.id;

	// Seed product: Fortune Oil 1L @ ₹150
	const [p] = await db
		.insert(schema.products)
		.values({
			name: "Fortune Oil 1L",
			sku: "SKU-OIL-1L",
			barcode: "8901234567890",
			price: "150.00",
			user_uid: "admin-uid",
		})
		.returning();
	testProductId = p.id;

	// Seed branch inventory: 100 units
	await db.insert(schema.branchInventory).values({
		branch_id: testBranchId,
		product_id: testProductId,
		in_stock: "100.00",
		reserved_stock: "0.00",
	});
});

afterAll(async () => {
	await pg.close();
});

describe("Partial Picking, Missing Item & Automatic Billing Synchronization", () => {
	it("should handle partial picking confirmation, exception creation, manager approval, and billing recalculation", async () => {
		// 1. Create Sales Order for 10 units @ ₹150 = ₹1,500
		const [order] = await db
			.insert(schema.orders)
			.values({
				customer_id: testCustomerId,
				branch_id: testBranchId,
				total_amount: "1500.00",
				subtotal: "1500.00",
				status: "confirmed",
				user_uid: "sales-1",
			})
			.returning();

		const [orderItem] = await db
			.insert(schema.orderItems)
			.values({
				order_id: order.id,
				product_id: testProductId,
				quantity: 10,
				original_quantity: 10,
				price: "150.00",
			})
			.returning();

		// Reserve stock: 10 units
		await db
			.update(schema.branchInventory)
			.set({
				reserved_stock: "10.00",
			})
			.where(
				eq(schema.branchInventory.product_id, testProductId),
			);

		// Create Pick List assigned to picker
		const [pickList] = await db
			.insert(schema.pickLists)
			.values({
				order_id: order.id,
				reference_type: "sale",
				reference_id: order.id,
				assigned_to: testStaffPickerId,
				status: "in_progress",
				priority: "normal",
			})
			.returning();

		const [pickListItem] = await db
			.insert(schema.pickListItems)
			.values({
				pick_list_id: pickList.id,
				product_id: testProductId,
				quantity_ordered: 10,
				quantity_picked: 0,
				status: "pending",
			})
			.returning();

		// 2. Picker confirms partial quantity: 5 picked, 5 damaged
		const confirmResult = await callerPicker.confirmQuantityWithException({
			item_id: pickListItem.id,
			quantity_picked: 5,
			reason: "Damaged items",
			quantity_damaged: 5,
			quantity_missing: 0,
			remarks: "5 bottles leaking / broken seal",
			photo_url: "https://example.com/photos/damaged_oil.jpg",
		});

		expect(confirmResult.success).toBe(true);
		expect(confirmResult.exception).toBeDefined();
		const exceptionId = confirmResult.exception.id;

		// Verify pickListItem updated
		const [updatedPickItem] = await db
			.select()
			.from(schema.pickListItems)
			.where(eq(schema.pickListItems.id, pickListItem.id));
		expect(Number(updatedPickItem.quantity_picked)).toBe(5);
		expect(updatedPickItem.status).toBe("partial");

		// Verify pickingException created
		const [exception] = await db
			.select()
			.from(schema.pickingExceptions)
			.where(eq(schema.pickingExceptions.id, exceptionId));
		expect(exception).toBeDefined();
		expect(Number(exception.quantity_ordered)).toBe(10);
		expect(Number(exception.quantity_picked)).toBe(5);
		expect(Number(exception.quantity_damaged)).toBe(5);
		expect(exception.status).toBe("PENDING_REVIEW");
		expect(exception.remarks).toBe("5 bottles leaking / broken seal");

		// 3. Complete picking task allowed because exception accounts for missing units
		const completeTaskResult = await callerWarehouse.completePickingTask({
			pickListId: pickList.id,
		});
		expect(completeTaskResult.success).toBe(true);

		// Verify downstream package only contains picked quantity (5)
		const [createdPackage] = await db
			.select()
			.from(schema.packages)
			.where(eq(schema.packages.order_id, order.id));
		expect(createdPackage).toBeDefined();

		const packageItems = await db
			.select()
			.from(schema.packageItems)
			.where(eq(schema.packageItems.package_id, createdPackage.id));
		expect(packageItems.length).toBe(1);
		expect(Number(packageItems[0].quantity)).toBe(5);

		// 4. Warehouse Manager reviews exceptions
		const exceptionsList = await callerWarehouse.getPickerExceptions({
			status: "PENDING_REVIEW",
		});
		expect(exceptionsList.length).toBeGreaterThanOrEqual(1);
		const foundExc = exceptionsList.find((e: any) => e.id === exception.id);
		expect(foundExc).toBeDefined();
		expect(foundExc?.order_id).toBe(order.id);
		expect(Number(foundExc?.quantity_damaged)).toBe(5);

		// 5. Warehouse Manager approves partial fulfilment
		const resolveResult = await callerWarehouse.resolvePickingException({
			exceptionId: exception.id,
			action: "APPROVE_PARTIAL",
			managerNotes: "Physical check verified damaged seals. Approved 5 units for dispatch.",
		});
		expect(resolveResult.success).toBe(true);
		expect(resolveResult.action).toBe("APPROVE_PARTIAL");

		// Verify exception status updated
		const [resolvedException] = await db
			.select()
			.from(schema.pickingExceptions)
			.where(eq(schema.pickingExceptions.id, exception.id));
		expect(resolvedException.status).toBe("APPROVED_PARTIAL");
		expect(resolvedException.manager_notes).toContain("Physical check verified");

		// 6. Verify Sales Order & Customer Bill Synchronized
		const [updatedOrder] = await db
			.select()
			.from(schema.orders)
			.where(eq(schema.orders.id, order.id));

		// Total recalculated: 5 units @ ₹150 = ₹750
		expect(Number(updatedOrder.total_amount)).toBe(750.00);

		// Verify Order Item quantities
		const [updatedOrderItem] = await db
			.select()
			.from(schema.orderItems)
			.where(eq(schema.orderItems.id, orderItem.id));
		expect(Number(updatedOrderItem.quantity)).toBe(5); // Billable quantity synchronized to 5
		expect(Number(updatedOrderItem.original_quantity)).toBe(10); // Original quantity preserved
		expect(Number(updatedOrderItem.picked_quantity)).toBe(5); // Picked quantity recorded

		// 7. Verify Inventory Movement & Stock Quarantine
		// The 5 damaged units moved to branchDamage and stockLedger
		const damagedRecords = await db
			.select()
			.from(schema.branchDamage)
			.where(eq(schema.branchDamage.product_id, testProductId));
		expect(damagedRecords.length).toBeGreaterThanOrEqual(1);
		expect(Number(damagedRecords[0].quantity)).toBe(5);
		expect(damagedRecords[0].reason).toContain("Physical check verified");

		// Verify stock ledger movement
		const ledgerEntries = await db
			.select()
			.from(schema.stockLedger)
			.where(eq(schema.stockLedger.product_id, testProductId));
		const damageEntry = ledgerEntries.find(
			(l: any) => l.transaction_type === "damage" && Math.abs(Number(l.quantity)) === 5,
		);
		expect(damageEntry).toBeDefined();

		// Verify reserved stock released
		const [inv] = await db
			.select()
			.from(schema.branchInventory)
			.where(eq(schema.branchInventory.product_id, testProductId));
		expect(Number(inv.reserved_stock)).toBe(5); // Released 5 unpicked units from reservation
	});

	it("should support manager reassigning replacement picker when stock is missing", async () => {
		// Create an order for 4 units
		const [order] = await db
			.insert(schema.orders)
			.values({
				customer_id: testCustomerId,
				branch_id: testBranchId,
				total_amount: "600.00",
				subtotal: "600.00",
				status: "confirmed",
				user_uid: "sales-1",
			})
			.returning();

		await db.insert(schema.orderItems).values({
			order_id: order.id,
			product_id: testProductId,
			quantity: 4,
			original_quantity: 4,
			price: "150.00",
		});

		const [pickList] = await db
			.insert(schema.pickLists)
			.values({
				order_id: order.id,
				reference_type: "sale",
				reference_id: order.id,
				assigned_to: testStaffPickerId,
				status: "in_progress",
			})
			.returning();

		const [pickListItem] = await db
			.insert(schema.pickListItems)
			.values({
				pick_list_id: pickList.id,
				product_id: testProductId,
				quantity_ordered: 4,
				quantity_picked: 0,
				status: "pending",
			})
			.returning();

		// Picker found only 2 units, reported 2 missing
		const confirm = await callerPicker.confirmQuantityWithException({
			item_id: pickListItem.id,
			quantity_picked: 2,
			reason: "Stock not found",
			quantity_damaged: 0,
			quantity_missing: 2,
			remarks: "Shelf B-2 empty, only 2 found",
		});

		// Manager assigns replacement pick task to search another aisle
		const reassign = await callerWarehouse.resolvePickingException({
			exceptionId: confirm.exception.id,
			action: "ASSIGN_REPLACEMENT",
			replacementPickerId: testStaffPickerId,
			managerNotes: "Check overhead reserve rack R-04",
		});

		expect(reassign.success).toBe(true);
		expect(reassign.replacementPickListId).toBeDefined();

		// Verify new pick list created for remaining 2 units
		const [newPickList] = await db
			.select()
			.from(schema.pickLists)
			.where(eq(schema.pickLists.id, reassign.replacementPickListId));
		expect(newPickList.assigned_to).toBe(testStaffPickerId);

		const newItems = await db
			.select()
			.from(schema.pickListItems)
			.where(eq(schema.pickListItems.pick_list_id, newPickList.id));
		expect(newItems.length).toBe(1);
		expect(Number(newItems[0].quantity_ordered)).toBe(2);
	});

	it("should support manager rejecting exception and returning task to picker", async () => {
		const [order] = await db
			.insert(schema.orders)
			.values({
				customer_id: testCustomerId,
				branch_id: testBranchId,
				total_amount: "300.00",
				status: "confirmed",
				user_uid: "sales-1",
			})
			.returning();

		const [pickList] = await db
			.insert(schema.pickLists)
			.values({
				order_id: order.id,
				reference_type: "sale",
				reference_id: order.id,
				assigned_to: testStaffPickerId,
				status: "in_progress",
			})
			.returning();

		const [pickListItem] = await db
			.insert(schema.pickListItems)
			.values({
				pick_list_id: pickList.id,
				product_id: testProductId,
				quantity_ordered: 2,
				quantity_picked: 0,
				status: "pending",
			})
			.returning();

		const confirm = await callerPicker.confirmQuantityWithException({
			item_id: pickListItem.id,
			quantity_picked: 1,
			reason: "Other",
			quantity_damaged: 0,
			quantity_missing: 1,
			remarks: "Couldn't reach top shelf",
		});

		// Manager rejects exception
		const rejectResult = await callerWarehouse.resolvePickingException({
			exceptionId: confirm.exception.id,
			action: "REJECT",
			managerNotes: "Please use rolling ladder to access top shelf. Stock is present.",
		});

		expect(rejectResult.success).toBe(true);

		// Verify exception marked REJECTED
		const [exc] = await db
			.select()
			.from(schema.pickingExceptions)
			.where(eq(schema.pickingExceptions.id, confirm.exception.id));
		expect(exc.status).toBe("REJECTED");

		// Verify pickListItem returned to pending
		const [item] = await db
			.select()
			.from(schema.pickListItems)
			.where(eq(schema.pickListItems.id, pickListItem.id));
		expect(item.status).toBe("pending");
	});
});
