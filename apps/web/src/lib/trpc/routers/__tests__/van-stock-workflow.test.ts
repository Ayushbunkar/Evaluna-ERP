// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { eq } from "drizzle-orm";
import { buildDDL, createTestDb, makeUser } from "./helpers";

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const { vanStockRouter } = await import("../van-stock");
const { createCallerFactory } = await import("../../init");
const schema = await import("@/lib/db/schema");

const managerCaller = createCallerFactory(vanStockRouter)({
	user: makeUser("manager-1", { role: "manager", branchId: 1 }),
	db,
});

const pickerCaller = createCallerFactory(vanStockRouter)({
	user: makeUser("picker-1", { role: "picker", branchId: 1 }),
	db,
});

const packerCaller = createCallerFactory(vanStockRouter)({
	user: makeUser("packer-1", { role: "packer", branchId: 1 }),
	db,
});

const loaderCaller = createCallerFactory(vanStockRouter)({
	user: makeUser("loader-1", { role: "loader", branchId: 1 }),
	db,
});

const driverCaller = createCallerFactory(vanStockRouter)({
	user: makeUser("driver-1", { role: "driver", branchId: 1 }),
	db,
});

const VAN_STOCK_DDL = buildDDL(
	[
		schema.branches,
		schema.user,
		schema.staff,
		schema.vehicles,
		schema.products,
		schema.branchInventory,
		schema.stockLedger,
		schema.vanStockPlans,
		schema.vanStockPlanItems,
		schema.vanStockExceptions,
		schema.vanStockAudits,
	],
	false
);

describe("Van Stock & Dispatch Workflow End-to-End", () => {
	let vehicleId: string;
	let productId: number;
	let product2Id: number;

	beforeAll(async () => {
		try {
			await pg.exec(
				`CREATE TYPE vehicle_status AS ENUM ('available', 'in_use', 'maintenance', 'retired');`
			);
		} catch (e) {
			// Ignore if exists
		}
		await pg.exec(VAN_STOCK_DDL);

		// Seed reference data via direct SQL
		await pg.exec(`
			INSERT INTO branches (id, name, code) VALUES (1, 'Main Branch', 'MB-01');

			INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at) VALUES
			('manager-1', 'Amit Manager', 'manager1@test.com', true, NOW(), NOW()),
			('picker-1', 'Pooja Picker', 'picker1@test.com', true, NOW(), NOW()),
			('packer-1', 'Pawan Packer', 'packer1@test.com', true, NOW(), NOW()),
			('loader-1', 'Lalit Loader', 'loader1@test.com', true, NOW(), NOW()),
			('driver-1', 'Rajesh Driver', 'driver1@test.com', true, NOW(), NOW());

			INSERT INTO staff (id, name, email, role, join_date, salary, branch_id) VALUES
			(101, 'Rajesh Driver', 'driver1@test.com', 'driver', NOW(), 25000, 1),
			(102, 'Amit Manager', 'manager1@test.com', 'manager', NOW(), 45000, 1);
		`);

		// Seed vehicle
		const [v] = await db
			.insert(schema.vehicles)
			.values({
				name: "Van Alpha",
				registration_number: "MH-12-AB-1234",
				type: "Delivery Van",
				capacity_kg: "1000.00",
				status: "available",
				branch_id: 1,
			})
			.returning();
		vehicleId = v.id;

		// Seed products
		const [p1] = await db
			.insert(schema.products)
			.values({
				id: 501,
				name: "Wheat Flour 10kg",
				sku: "WF-10KG",
				unit: "bag",
				price: "350.00",
				user_uid: "admin-1",
			})
			.returning();
		productId = p1.id;

		const [p2] = await db
			.insert(schema.products)
			.values({
				id: 502,
				name: "Basmati Rice 5kg",
				sku: "BR-5KG",
				unit: "bag",
				price: "450.00",
				user_uid: "admin-1",
			})
			.returning();
		product2Id = p2.id;

		// Seed inventory
		await db.insert(schema.branchInventory).values([
			{
				branch_id: 1,
				product_id: productId,
				in_stock: "100.000",
				reserved_stock: "0.000",
			},
			{
				branch_id: 1,
				product_id: product2Id,
				in_stock: "80.000",
				reserved_stock: "0.000",
			},
		]);
	});

	let createdPlanId: string;
	let planItem1Id: string;
	let planItem2Id: string;

	it("Step 1: Manager creates Van Stock Plan with standard & exceptional items", async () => {
		const res = await managerCaller.createPlan({
			vehicleId,
			dispatchDate: "2026-10-25",
			notes: "Morning delivery route",
			submitForPicking: true,
			items: [
				{
					productId,
					plannedQty: 20,
					isAdditional: false,
					notes: "Handle with care",
				},
				{
					productId: product2Id,
					plannedQty: 10,
					isAdditional: true,
					additionalReason: "Expected extra orders on route",
				},
			],
		});

		expect(res.success).toBe(true);
		expect(res.status).toBe("PENDING_PICKING");
		expect(res.planId).toBeDefined();
		createdPlanId = res.planId;

		const detail = await managerCaller.getPlanDetail({ planId: createdPlanId });
		expect(detail.status).toBe("PENDING_PICKING");
		expect(detail.items.length).toBe(2);

		planItem1Id = detail.items[0].id;
		planItem2Id = detail.items[1].id;
	});

	it("Step 2: Picker claims and submits picking with shortage notes", async () => {
		// Start picking
		const startRes = await pickerCaller.startPicking({ planId: createdPlanId });
		expect(startRes.success).toBe(true);

		// Submit picking: picked 18 of 20 (shortage 2) for item 1, full 10 for item 2
		const submitRes = await pickerCaller.submitPicking({
			planId: createdPlanId,
			pickerNotes: "Wheat flour bin had minor shortage",
			items: [
				{
					planItemId: planItem1Id,
					pickedQty: 18,
					shortageQty: 2,
					shortageReason: "Insufficient inventory in bin A",
				},
				{
					planItemId: planItem2Id,
					pickedQty: 10,
					shortageQty: 0,
				},
			],
		});

		expect(submitRes.success).toBe(true);
		expect(submitRes.status).toBe("PENDING_PACKING");

		// Verify inventory reservation happened
		const [inv1] = await db
			.select()
			.from(schema.branchInventory)
			.where(eq(schema.branchInventory.product_id, productId));
		expect(parseFloat(inv1.reserved_stock)).toBe(18);
	});

	it("Step 3: Packer claims and submits packing manifest", async () => {
		// Start packing
		const startRes = await packerCaller.startPacking({ planId: createdPlanId });
		expect(startRes.success).toBe(true);

		// Submit packing: 18 packed for item 1, 10 packed for item 2
		const submitRes = await packerCaller.submitPacking({
			planId: createdPlanId,
			packerNotes: "All items boxed and sealed",
			items: [
				{
					planItemId: planItem1Id,
					packedQty: 18,
					damagedQty: 0,
					packingStatus: "PACKED",
				},
				{
					planItemId: planItem2Id,
					packedQty: 10,
					damagedQty: 0,
					packingStatus: "PACKED",
				},
			],
		});

		expect(submitRes.success).toBe(true);
		expect(submitRes.status).toBe("PENDING_MANAGER_VERIFICATION");
	});

	it("Step 4: Manager verifies packing manifest & assigns driver", async () => {
		const verifyRes = await managerCaller.verifyPacking({
			planId: createdPlanId,
			decision: "APPROVE",
			driverId: "driver-1",
			vehicleId,
			notes: "Manifest approved for loading",
			items: [
				{ planItemId: planItem1Id, verifiedQty: 18 },
				{ planItemId: planItem2Id, verifiedQty: 10 },
			],
		});

		expect(verifyRes.success).toBe(true);
		expect(verifyRes.status).toBe("PENDING_LOADING");

		const detail = await managerCaller.getPlanDetail({ planId: createdPlanId });
		expect(detail.driverId).toBe("driver-1");
		expect(detail.driver?.name).toBe("Rajesh Driver");
	});

	let loadingExceptionId: string;

	it("Step 5: Loader starts loading and reports an exception", async () => {
		const startRes = await loaderCaller.startLoading({ planId: createdPlanId });
		expect(startRes.success).toBe(true);

		// Loader reports extra stock found
		const excRes = await loaderCaller.reportLoadingException({
			planId: createdPlanId,
			planItemId: planItem2Id,
			type: "EXTRA_STOCK_FOUND",
			quantity: 2,
			reason: "Found 2 extra bags in packing cart",
		});

		expect(excRes.success).toBe(true);
		expect(excRes.exceptionId).toBeDefined();
		loadingExceptionId = excRes.exceptionId;

		// Submitting loading should fail because exception is unresolved
		let failed = false;
		try {
			await loaderCaller.submitLoading({
				planId: createdPlanId,
				items: [
					{ planItemId: planItem1Id, loadedQty: 18 },
					{ planItemId: planItem2Id, loadedQty: 12 },
				],
			});
		} catch (err) {
			failed = true;
		}
		expect(failed).toBe(true);
	});

	it("Step 6: Manager resolves exception and loader signs off", async () => {
		// Manager approves extra stock
		const resolveRes = await managerCaller.resolveException({
			exceptionId: loadingExceptionId,
			decision: "APPROVE",
			resolutionNotes: "Authorized extra stock for route",
		});
		expect(resolveRes.success).toBe(true);

		// Loader can now sign off
		const loadRes = await loaderCaller.submitLoading({
			planId: createdPlanId,
			loaderNotes: "Vehicle loaded and secured. Seal #4491",
			checklist: {
				vehicleClean: true,
				temperatureOk: true,
				doorsSecure: true,
				strapsTight: true,
			},
			items: [
				{ planItemId: planItem1Id, loadedQty: 18 },
				{ planItemId: planItem2Id, loadedQty: 12 },
			],
		});

		expect(loadRes.success).toBe(true);
		expect(loadRes.status).toBe("PENDING_FINAL_DISPATCH_APPROVAL");
	});

	it("Step 7: Manager gives final dispatch approval (inventory deducted, vehicle marked in_use)", async () => {
		const dispatchRes = await managerCaller.approveFinalDispatch({
			planId: createdPlanId,
			decision: "APPROVE",
			notes: "Gate pass issued. Safe journey.",
		});

		expect(dispatchRes.success).toBe(true);
		expect(dispatchRes.status).toBe("DISPATCHED");

		// Verify vehicle status
		const [veh] = await db
			.select()
			.from(schema.vehicles)
			.where(eq(schema.vehicles.id, vehicleId));
		expect(veh.status).toBe("in_use");

		// Verify inventory deduction (100 - 18 = 82, reserved cleared)
		const [inv1] = await db
			.select()
			.from(schema.branchInventory)
			.where(eq(schema.branchInventory.product_id, productId));
		expect(parseFloat(inv1.in_stock)).toBe(82);
		expect(parseFloat(inv1.reserved_stock)).toBe(0);

		// Verify stock ledger entry
		const ledgers = await db
			.select()
			.from(schema.stockLedger)
			.where(eq(schema.stockLedger.reference_type, "VAN_DISPATCH"));
		expect(ledgers.length).toBeGreaterThan(0);
	});

	it("Step 8: Driver views active dispatches and submits return stock", async () => {
		const myDispatches = await driverCaller.getMyDispatches();
		expect(myDispatches.length).toBe(1);
		expect(myDispatches[0].id).toBe(createdPlanId);

		// Driver delivered 15 of 18 (returns 3) for item 1, delivered 10 of 12 (returns 2) for item 2
		const retRes = await driverCaller.submitReturnStock({
			planId: createdPlanId,
			notes: "Finished route at 5 PM. 5 items unsold.",
			items: [
				{
					planItemId: planItem1Id,
					deliveredQty: 15,
					returnedQty: 3,
					returnReason: "EXCESS_VAN_STOCK",
				},
				{
					planItemId: planItem2Id,
					deliveredQty: 10,
					returnedQty: 2,
					returnReason: "CUSTOMER_NOT_AVAILABLE",
				},
			],
		});

		expect(retRes.success).toBe(true);
		expect(retRes.status).toBe("PENDING_RETURN_VERIFICATION");
	});

	it("Step 9: Manager verifies return stock (inventory credited, vehicle released)", async () => {
		const verifyRetRes = await managerCaller.verifyReturnStock({
			planId: createdPlanId,
			notes: "Returned bags inspected and restocked in bay 3.",
			items: [
				{ planItemId: planItem1Id, verifiedReturnQty: 3 },
				{ planItemId: planItem2Id, verifiedReturnQty: 2 },
			],
		});

		expect(verifyRetRes.success).toBe(true);
		expect(verifyRetRes.status).toBe("RECONCILED");

		// Verify vehicle is released back to available
		const [veh] = await db
			.select()
			.from(schema.vehicles)
			.where(eq(schema.vehicles.id, vehicleId));
		expect(veh.status).toBe("available");

		// Verify inventory was credited (82 + 3 = 85)
		const [inv1] = await db
			.select()
			.from(schema.branchInventory)
			.where(eq(schema.branchInventory.product_id, productId));
		expect(parseFloat(inv1.in_stock)).toBe(85);

		// Verify stock ledger entry for return
		const returnLedgers = await db
			.select()
			.from(schema.stockLedger)
			.where(eq(schema.stockLedger.reference_type, "VAN_RETURN"));
		expect(returnLedgers.length).toBeGreaterThan(0);

		// Verify audit logs were captured
		const audits = await db
			.select()
			.from(schema.vanStockAudits)
			.where(eq(schema.vanStockAudits.plan_id, createdPlanId));
		expect(audits.length).toBeGreaterThan(5);
	});

	afterAll(async () => {
		try {
			await pg.close();
		} catch (e) {
			// ignore
		}
	});
});
