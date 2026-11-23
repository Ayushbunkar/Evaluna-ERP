// @ts-nocheck
import { describe, expect, it, beforeAll, afterAll, mock } from "bun:test";
import { and, eq } from "drizzle-orm";
import { buildDDL, createTestDb, makeUser } from "./helpers";

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const schema = await import("@/lib/db/schema");
import {
	deductStockForOrder,
	restoreStockForOrder,
	adjustStockForOrderQuantityChange,
} from "@/lib/inventory/inventory-service";

const TABLES_DDL = buildDDL(
	[
		schema.companies,
		schema.branches,
		schema.staff,
		schema.products,
		schema.customers,
		schema.orders,
		schema.orderItems,
		schema.branchInventory,
		schema.stockLedger,
		schema.transactions,
		schema.orderAudits,
		schema.paymentMethods,
		schema.pickLists,
		schema.pickListItems,
		schema.pendingSync,
	],
	false,
);

describe("Sales Invoice Stock Deduction and Cancellation Stock Restoration", () => {
	beforeAll(async () => {
		await pg.exec(TABLES_DDL);

		// Seed branch 1
		await db.insert(schema.branches).values({
			id: 1,
			name: "Bhopal Main Warehouse",
			code: "BPL-MAIN",
		});

		// Seed payment method
		await db.insert(schema.paymentMethods).values({
			id: 1,
			name: "Cash",
			payment_type: "cash",
		});

		// Seed customer
		await db.insert(schema.customers).values({
			id: 1,
			branch_id: 1,
			name: "Test Retailer",
			user_uid: "test-user-uid",
		});
	});

	it("executes all prompt scenarios: BPL Jarda, Product B, C, D, E, F, G accurately", async () => {
		// BPL Jarda (Initial Stock: 100, Sell: 10 -> Expected: 90)
		const [bplJarda] = await db.insert(schema.products).values({
			name: "BPL Jarda",
			sku: "SKU-JARDA",
			price: "120.00",
			base_selling_price: "120.00",
			base_procurement_price: "100.00",
			unit: "packet",
			user_uid: "admin-uid",
		}).returning();

		// Product B (Initial Stock: 200, Sell: 25 -> Expected: 175)
		const [productB] = await db.insert(schema.products).values({
			name: "Product B",
			sku: "SKU-PROD-B",
			price: "50.00",
			base_procurement_price: "35.00",
			unit: "Pcs",
			user_uid: "admin-uid",
		}).returning();

		// Product C (Initial Stock: 50, Sell: 5 -> Expected: 45)
		const [productC] = await db.insert(schema.products).values({
			name: "Product C",
			sku: "SKU-PROD-C",
			price: "20.00",
			base_procurement_price: "15.00",
			unit: "kg",
			user_uid: "admin-uid",
		}).returning();

		// Product D (Initial Stock: 500, Sell: 100 -> Expected: 400)
		const [productD] = await db.insert(schema.products).values({
			name: "Product D",
			sku: "SKU-PROD-D",
			price: "10.00",
			base_procurement_price: "7.50",
			unit: "box",
			user_uid: "admin-uid",
		}).returning();

		// Product E (Initial Stock: 75, Sell: 20 -> Expected: 55)
		const [productE] = await db.insert(schema.products).values({
			name: "Product E",
			sku: "SKU-PROD-E",
			price: "250.00",
			base_procurement_price: "180.00",
			unit: "carton",
			user_uid: "admin-uid",
		}).returning();

		// Product F (Initial Stock: 100, Cancel previously deducted 30 -> Expected: 100)
		const [productF] = await db.insert(schema.products).values({
			name: "Product F",
			sku: "SKU-PROD-F",
			price: "80.00",
			base_procurement_price: "60.00",
			unit: "Pcs",
			user_uid: "admin-uid",
		}).returning();

		// Product G (Initial Stock: 150, Sell: 10 then cancel -> Expected: 150)
		const [productG] = await db.insert(schema.products).values({
			name: "Product G",
			sku: "SKU-PROD-G",
			price: "30.00",
			base_procurement_price: "22.00",
			unit: "packet",
			user_uid: "admin-uid",
		}).returning();

		// Seed initial stock in branch inventory
		await db.insert(schema.branchInventory).values([
			{ branch_id: 1, product_id: bplJarda.id, in_stock: 100 },
			{ branch_id: 1, product_id: productB.id, in_stock: 200 },
			{ branch_id: 1, product_id: productC.id, in_stock: 50 },
			{ branch_id: 1, product_id: productD.id, in_stock: 500 },
			{ branch_id: 1, product_id: productE.id, in_stock: 75 },
			{ branch_id: 1, product_id: productF.id, in_stock: 100 },
			{ branch_id: 1, product_id: productG.id, in_stock: 150 },
		]);

		// Scenario 1: BPL Jarda - Sell 10 -> Expected: 90
		await db.transaction(async (tx: any) => {
			await deductStockForOrder(tx, {
				orderId: 101,
				branchId: 1,
				items: [{ productId: bplJarda.id, quantity: 10, price: 120 }],
			});
		});
		const stockJarda = (await db.select().from(schema.branchInventory).where(eq(schema.branchInventory.product_id, bplJarda.id)))[0];
		expect(Number(stockJarda.in_stock)).toBe(90);

		// Scenario 2: Product B - Sell 25 -> Expected: 175
		await db.transaction(async (tx: any) => {
			await deductStockForOrder(tx, {
				orderId: 102,
				branchId: 1,
				items: [{ productId: productB.id, quantity: 25, price: 50 }],
			});
		});
		const stockB = (await db.select().from(schema.branchInventory).where(eq(schema.branchInventory.product_id, productB.id)))[0];
		expect(Number(stockB.in_stock)).toBe(175);

		// Scenario 3: Product C - Sell 5 -> Expected: 45
		await db.transaction(async (tx: any) => {
			await deductStockForOrder(tx, {
				orderId: 103,
				branchId: 1,
				items: [{ productId: productC.id, quantity: 5, price: 20 }],
			});
		});
		const stockC = (await db.select().from(schema.branchInventory).where(eq(schema.branchInventory.product_id, productC.id)))[0];
		expect(Number(stockC.in_stock)).toBe(45);

		// Scenario 4: Product D - Sell 100 -> Expected: 400
		await db.transaction(async (tx: any) => {
			await deductStockForOrder(tx, {
				orderId: 104,
				branchId: 1,
				items: [{ productId: productD.id, quantity: 100, price: 10 }],
			});
		});
		const stockD = (await db.select().from(schema.branchInventory).where(eq(schema.branchInventory.product_id, productD.id)))[0];
		expect(Number(stockD.in_stock)).toBe(400);

		// Scenario 5: Product E - Sell 20 -> Expected: 55
		await db.transaction(async (tx: any) => {
			await deductStockForOrder(tx, {
				orderId: 105,
				branchId: 1,
				items: [{ productId: productE.id, quantity: 20, price: 250 }],
			});
		});
		const stockE = (await db.select().from(schema.branchInventory).where(eq(schema.branchInventory.product_id, productE.id)))[0];
		expect(Number(stockE.in_stock)).toBe(55);

		// Scenario 6: Product F - Initial 100, deduct 30 -> 70, then cancel -> restores 30 -> 100
		await db.transaction(async (tx: any) => {
			await deductStockForOrder(tx, {
				orderId: 106,
				branchId: 1,
				items: [{ productId: productF.id, quantity: 30, price: 80 }],
			});
		});
		const stockFMid = (await db.select().from(schema.branchInventory).where(eq(schema.branchInventory.product_id, productF.id)))[0];
		expect(Number(stockFMid.in_stock)).toBe(70);

		await db.transaction(async (tx: any) => {
			const res = await restoreStockForOrder(tx, {
				orderId: 106,
				branchId: 1,
				reason: "Customer cancelled invoice",
			});
			expect(res.restored).toBe(true);
			expect(res.itemsRestored).toEqual([{ productId: productF.id, quantity: 30 }]);
		});
		const stockFFinal = (await db.select().from(schema.branchInventory).where(eq(schema.branchInventory.product_id, productF.id)))[0];
		expect(Number(stockFFinal.in_stock)).toBe(100);

		// Scenario 7: Product G - Initial 150, sell 10 -> 140, then cancel -> restores 10 -> 150
		await db.transaction(async (tx: any) => {
			await deductStockForOrder(tx, {
				orderId: 107,
				branchId: 1,
				items: [{ productId: productG.id, quantity: 10, price: 30 }],
			});
		});
		const stockGMid = (await db.select().from(schema.branchInventory).where(eq(schema.branchInventory.product_id, productG.id)))[0];
		expect(Number(stockGMid.in_stock)).toBe(140);

		await db.transaction(async (tx: any) => {
			const res = await restoreStockForOrder(tx, {
				orderId: 107,
				branchId: 1,
				reason: "Cancelled by sales",
			});
			expect(res.restored).toBe(true);
		});
		const stockGFinal = (await db.select().from(schema.branchInventory).where(eq(schema.branchInventory.product_id, productG.id)))[0];
		expect(Number(stockGFinal.in_stock)).toBe(150);
	});

	it("prevents duplicate stock deductions (idempotency)", async () => {
		const [product] = await db.insert(schema.products).values({
			name: "Item Unique",
			sku: "SKU-UNIQ",
			price: "100.00",
			user_uid: "admin-uid",
		}).returning();

		await db.insert(schema.branchInventory).values({
			branch_id: 1,
			product_id: product.id,
			in_stock: 50,
		});

		// First deduction: sells 10 -> stock becomes 40
		await db.transaction(async (tx: any) => {
			const res = await deductStockForOrder(tx, {
				orderId: 201,
				branchId: 1,
				items: [{ productId: product.id, quantity: 10, price: 100 }],
			});
			expect(res.success).toBe(true);
			expect(res.alreadyDeducted).toBe(false);
		});

		let stock = (await db.select().from(schema.branchInventory).where(eq(schema.branchInventory.product_id, product.id)))[0];
		expect(Number(stock.in_stock)).toBe(40);

		// Second duplicate attempt with same orderId -> MUST NOT DEDUCT AGAIN
		await db.transaction(async (tx: any) => {
			const res = await deductStockForOrder(tx, {
				orderId: 201,
				branchId: 1,
				items: [{ productId: product.id, quantity: 10, price: 100 }],
			});
			expect(res.success).toBe(true);
			expect(res.alreadyDeducted).toBe(true);
		});

		stock = (await db.select().from(schema.branchInventory).where(eq(schema.branchInventory.product_id, product.id)))[0];
		expect(Number(stock.in_stock)).toBe(40); // Preserved at 40, not 30!
	});

	it("prevents phantom stock creation when cancelling an unfinalized / draft order", async () => {
		const [product] = await db.insert(schema.products).values({
			name: "Draft Only Product",
			sku: "SKU-DRAFT",
			price: "200.00",
			user_uid: "admin-uid",
		}).returning();

		await db.insert(schema.branchInventory).values({
			branch_id: 1,
			product_id: product.id,
			in_stock: 25,
		});

		// An unfinalized draft order exists (orderId 301), but deductStockForOrder was NEVER run!
		await db.transaction(async (tx: any) => {
			const cancelRes = await restoreStockForOrder(tx, {
				orderId: 301,
				branchId: 1,
				reason: "Customer abandoned draft",
			});
			expect(cancelRes.restored).toBe(false);
			expect(cancelRes.itemsRestored.length).toBe(0);
		});

		// Stock MUST remain exactly 25, never inflated to 25 + draft items
		const stock = (await db.select().from(schema.branchInventory).where(eq(schema.branchInventory.product_id, product.id)))[0];
		expect(Number(stock.in_stock)).toBe(25);
	});

	it("prevents duplicate restoration on repeated cancellation calls", async () => {
		const [product] = await db.insert(schema.products).values({
			name: "Cancel Twice Item",
			sku: "SKU-TWICE",
			price: "100.00",
			user_uid: "admin-uid",
		}).returning();

		await db.insert(schema.branchInventory).values({
			branch_id: 1,
			product_id: product.id,
			in_stock: 50,
		});

		// Sell 15 -> 35
		await db.transaction(async (tx: any) => {
			await deductStockForOrder(tx, {
				orderId: 401,
				branchId: 1,
				items: [{ productId: product.id, quantity: 15, price: 100 }],
			});
		});

		let stock = (await db.select().from(schema.branchInventory).where(eq(schema.branchInventory.product_id, product.id)))[0];
		expect(Number(stock.in_stock)).toBe(35);

		// First cancellation -> restores 15 -> 50
		await db.transaction(async (tx: any) => {
			const res = await restoreStockForOrder(tx, {
				orderId: 401,
				branchId: 1,
				reason: "Cancel 1",
			});
			expect(res.restored).toBe(true);
		});

		stock = (await db.select().from(schema.branchInventory).where(eq(schema.branchInventory.product_id, product.id)))[0];
		expect(Number(stock.in_stock)).toBe(50);

		// Second duplicate cancellation attempt -> MUST NOT restore again!
		await db.transaction(async (tx: any) => {
			const res = await restoreStockForOrder(tx, {
				orderId: 401,
				branchId: 1,
				reason: "Cancel 2 (Retry)",
			});
			expect(res.restored).toBe(false);
			expect(res.itemsRestored.length).toBe(0);
		});

		stock = (await db.select().from(schema.branchInventory).where(eq(schema.branchInventory.product_id, product.id)))[0];
		expect(Number(stock.in_stock)).toBe(50); // Preserved at 50, not 65!
	});

	it("handles multiple occurrences of the same product in a single invoice", async () => {
		const [product] = await db.insert(schema.products).values({
			name: "Repeated Item",
			sku: "SKU-REP",
			price: "100.00",
			user_uid: "admin-uid",
		}).returning();

		await db.insert(schema.branchInventory).values({
			branch_id: 1,
			product_id: product.id,
			in_stock: 100,
		});

		// Invoice with 3 separate lines of the same product: 5 + 3 + 2 = 10 units total
		await db.transaction(async (tx: any) => {
			await deductStockForOrder(tx, {
				orderId: 501,
				branchId: 1,
				items: [
					{ productId: product.id, quantity: 5, price: 100 },
					{ productId: product.id, quantity: 3, price: 100 },
					{ productId: product.id, quantity: 2, price: 100 },
				],
			});
		});

		const stock = (await db.select().from(schema.branchInventory).where(eq(schema.branchInventory.product_id, product.id)))[0];
		expect(Number(stock.in_stock)).toBe(90);

		// Cancel order -> restores exactly 10 units -> back to 100
		await db.transaction(async (tx: any) => {
			const res = await restoreStockForOrder(tx, {
				orderId: 501,
				branchId: 1,
				reason: "Cancelled",
			});
			expect(res.restored).toBe(true);
			expect(res.itemsRestored).toEqual([{ productId: product.id, quantity: 10 }]);
		});

		const stockRestored = (await db.select().from(schema.branchInventory).where(eq(schema.branchInventory.product_id, product.id)))[0];
		expect(Number(stockRestored.in_stock)).toBe(100);
	});

	it("handles fractional / decimal quantities accurately (e.g. 0.5 kg)", async () => {
		const [looseTea] = await db.insert(schema.products).values({
			name: "Assam Loose Tea",
			sku: "SKU-TEA",
			price: "400.00",
			unit: "kg",
			user_uid: "admin-uid",
		}).returning();

		await db.insert(schema.branchInventory).values({
			branch_id: 1,
			product_id: looseTea.id,
			in_stock: 10.5,
		});

		// Sells 0.5 kg
		await db.transaction(async (tx: any) => {
			await deductStockForOrder(tx, {
				orderId: 601,
				branchId: 1,
				items: [{ productId: looseTea.id, quantity: 0.5, price: 400 }],
			});
		});

		const stockAfter = (await db.select().from(schema.branchInventory).where(eq(schema.branchInventory.product_id, looseTea.id)))[0];
		expect(Number(stockAfter.in_stock)).toBe(10);

		// Cancels invoice -> restores 0.5 kg -> back to 10.5
		await db.transaction(async (tx: any) => {
			await restoreStockForOrder(tx, {
				orderId: 601,
				branchId: 1,
				reason: "Returned",
			});
		});

		const stockRestored = (await db.select().from(schema.branchInventory).where(eq(schema.branchInventory.product_id, looseTea.id)))[0];
		expect(Number(stockRestored.in_stock)).toBe(10.5);
	});

	it("adjusts stock correctly when finalized invoice quantity is modified (deltas)", async () => {
		const [product] = await db.insert(schema.products).values({
			name: "Editable Item",
			sku: "SKU-EDIT",
			price: "50.00",
			user_uid: "admin-uid",
		}).returning();

		await db.insert(schema.branchInventory).values({
			branch_id: 1,
			product_id: product.id,
			in_stock: 100,
		});

		// 1. Initial invoice: 10 units -> stock becomes 90
		await db.transaction(async (tx: any) => {
			await deductStockForOrder(tx, {
				orderId: 701,
				branchId: 1,
				items: [{ productId: product.id, quantity: 10, price: 50 }],
			});
		});
		let stock = (await db.select().from(schema.branchInventory).where(eq(schema.branchInventory.product_id, product.id)))[0];
		expect(Number(stock.in_stock)).toBe(90);

		// 2. Sales Person edits quantity from 10 down to 7:
		// Delta = -3 -> restores 3 units -> net stock deduction = 7 -> remaining stock = 93
		await db.transaction(async (tx: any) => {
			const res = await adjustStockForOrderQuantityChange(tx, {
				orderId: 701,
				branchId: 1,
				newItems: [{ productId: product.id, quantity: 7, price: 50 }],
			});
			expect(res.adjusted).toBe(true);
			expect(res.deltas).toEqual([{ productId: product.id, delta: -3 }]);
		});
		stock = (await db.select().from(schema.branchInventory).where(eq(schema.branchInventory.product_id, product.id)))[0];
		expect(Number(stock.in_stock)).toBe(93);

		// 3. Sales Person edits quantity from 7 up to 14:
		// Delta = +7 -> deducts 7 more units -> net stock deduction = 14 -> remaining stock = 86
		await db.transaction(async (tx: any) => {
			const res = await adjustStockForOrderQuantityChange(tx, {
				orderId: 701,
				branchId: 1,
				newItems: [{ productId: product.id, quantity: 14, price: 50 }],
			});
			expect(res.adjusted).toBe(true);
			expect(res.deltas).toEqual([{ productId: product.id, delta: 7 }]);
		});
		stock = (await db.select().from(schema.branchInventory).where(eq(schema.branchInventory.product_id, product.id)))[0];
		expect(Number(stock.in_stock)).toBe(86);
	});

	it("preserves purchase cost and stock valuation distinct from selling price in stock ledger", async () => {
		const [product] = await db.insert(schema.products).values({
			name: "Cost Valuation Item",
			sku: "SKU-VAL",
			price: "150.00", // Selling Price
			base_procurement_price: "90.00", // Purchase Cost
			user_uid: "admin-uid",
		}).returning();

		await db.insert(schema.branchInventory).values({
			branch_id: 1,
			product_id: product.id,
			in_stock: 100,
		});

		// Finalize invoice for 10 units
		await db.transaction(async (tx: any) => {
			await deductStockForOrder(tx, {
				orderId: 801,
				branchId: 1,
				items: [{ productId: product.id, quantity: 10, price: 150 }],
			});
		});

		// Verify stock ledger record has purchase cost as unit_cost and purchase valuation
		const ledgerEntries = await db
			.select()
			.from(schema.stockLedger)
			.where(
				and(
					eq(schema.stockLedger.reference_id, 801),
					eq(schema.stockLedger.reference_type, "sale"),
				),
			);

		expect(ledgerEntries.length).toBe(1);
		expect(Number(ledgerEntries[0].quantity)).toBe(-10);
		expect(Number(ledgerEntries[0].unit_cost)).toBe(90.00); // Purchase Cost (NOT selling price 150)
		expect(Number(ledgerEntries[0].total_cost)).toBe(900.00); // 10 * 90

		// Verify product master was not overwritten
		const prodAfter = (await db.select().from(schema.products).where(eq(schema.products.id, product.id)))[0];
		expect(Number(prodAfter.base_procurement_price)).toBe(90.00);
		expect(Number(prodAfter.price)).toBe(150.00);
	});

	afterAll(async () => {
		try {
			await pg.close();
		} catch {}
	});
});
