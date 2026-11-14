import { describe, expect, it, beforeEach } from "bun:test";
import { appRouter } from "../index";
import { createTestDb, makeUser, SCHEMA_DDL } from "./helpers";
import { products, productSlabPricing } from "@/lib/db/schema";
import {
	calculateEffectivePrice,
	findMatchingSlab,
	validateSlabs,
	type PricingSlab,
} from "@/lib/pricing/slab-pricing";

describe("Slab Pricing Engine", () => {
	const standardSlabs: PricingSlab[] = [
		{
			productId: 1,
			minQuantity: 1,
			maxQuantity: 3,
			unitPrice: 9.22,
			isActive: true,
		},
		{
			productId: 1,
			minQuantity: 4,
			maxQuantity: 7,
			unitPrice: 9.10,
			isActive: true,
		},
		{
			productId: 1,
			minQuantity: 8,
			maxQuantity: null, // Unlimited onwards (8+)
			unitPrice: 9.0,
			isActive: true,
		},
	];

	const regularPrice = 10.0;

	it("correctly matches quantity tiers according to specification", () => {
		// Tier 1: 1 - 3 units -> ₹9.22
		expect(calculateEffectivePrice({ regularPrice, slabs: standardSlabs, quantity: 1 }).unitPrice).toBe(9.22);
		expect(calculateEffectivePrice({ regularPrice, slabs: standardSlabs, quantity: 2 }).unitPrice).toBe(9.22);
		expect(calculateEffectivePrice({ regularPrice, slabs: standardSlabs, quantity: 3 }).unitPrice).toBe(9.22);

		// Tier 2: 4 - 7 units -> ₹9.10
		expect(calculateEffectivePrice({ regularPrice, slabs: standardSlabs, quantity: 4 }).unitPrice).toBe(9.10);
		expect(calculateEffectivePrice({ regularPrice, slabs: standardSlabs, quantity: 5 }).unitPrice).toBe(9.10);
		expect(calculateEffectivePrice({ regularPrice, slabs: standardSlabs, quantity: 7 }).unitPrice).toBe(9.10);

		// Tier 3: 8+ units -> ₹9.00
		expect(calculateEffectivePrice({ regularPrice, slabs: standardSlabs, quantity: 8 }).unitPrice).toBe(9.0);
		expect(calculateEffectivePrice({ regularPrice, slabs: standardSlabs, quantity: 15 }).unitPrice).toBe(9.0);
		expect(calculateEffectivePrice({ regularPrice, slabs: standardSlabs, quantity: 100 }).unitPrice).toBe(9.0);
	});

	it("supports decimal quantities accurately", () => {
		// 2.5 kg falls into 1-3 tier
		const res2_5 = calculateEffectivePrice({ regularPrice, slabs: standardSlabs, quantity: 2.5 });
		expect(res2_5.unitPrice).toBe(9.22);
		expect(res2_5.totalPrice).toBeCloseTo(2.5 * 9.22, 2);

		// 5.75 kg falls into 4-7 tier
		const res5_75 = calculateEffectivePrice({ regularPrice, slabs: standardSlabs, quantity: 5.75 });
		expect(res5_75.unitPrice).toBe(9.10);

		// 13.5 kg falls into 8+ tier
		const res13_5 = calculateEffectivePrice({ regularPrice, slabs: standardSlabs, quantity: 13.5 });
		expect(res13_5.unitPrice).toBe(9.0);
	});

	it("calculates unit savings and percentage discount correctly", () => {
		const res = calculateEffectivePrice({ regularPrice: 10.0, slabs: standardSlabs, quantity: 5 });
		expect(res.isSlabApplied).toBe(true);
		expect(res.regularPrice).toBe(10.0);
		expect(res.unitPrice).toBe(9.10);
		expect(res.savingsPerUnit).toBeCloseTo(0.9, 2);
		expect(res.discountPercent).toBe(9);
	});

	it("falls back to regular price when quantity is below minimum tier", () => {
		const res = calculateEffectivePrice({ regularPrice: 10.0, slabs: standardSlabs, quantity: 0.5 });
		expect(res.isSlabApplied).toBe(false);
		expect(res.unitPrice).toBe(10.0);
	});

	it("respects date validity calendar window", () => {
		const pastSlabs: PricingSlab[] = [
			{
				productId: 1,
				minQuantity: 1,
				maxQuantity: null,
				unitPrice: 8.5,
				startDate: "2026-01-01",
				endDate: "2026-01-31", // Expired
				isActive: true,
			},
		];

		// Checked against today (2026-11-14)
		const expiredRes = calculateEffectivePrice({
			regularPrice: 10.0,
			slabs: pastSlabs,
			quantity: 10,
			targetDate: "2026-11-14",
		});
		expect(expiredRes.isSlabApplied).toBe(false);
		expect(expiredRes.unitPrice).toBe(10.0);

		// Checked against valid backdated date (2026-01-15)
		const validRes = calculateEffectivePrice({
			regularPrice: 10.0,
			slabs: pastSlabs,
			quantity: 10,
			targetDate: "2026-01-15",
		});
		expect(validRes.isSlabApplied).toBe(true);
		expect(validRes.unitPrice).toBe(8.5);
	});

	it("validates slab consistency and detects overlapping ranges", () => {
		// Valid consecutive slabs
		const valid = validateSlabs([
			{ minQuantity: 1, maxQuantity: 3, unitPrice: 9.22 },
			{ minQuantity: 4, maxQuantity: 7, unitPrice: 9.1 },
			{ minQuantity: 8, maxQuantity: null, unitPrice: 9.0 },
		]);
		expect(valid.isValid).toBe(true);
		expect(valid.errors).toHaveLength(0);

		// Overlapping slabs
		const overlapping = validateSlabs([
			{ minQuantity: 1, maxQuantity: 5, unitPrice: 9.22 },
			{ minQuantity: 4, maxQuantity: 10, unitPrice: 9.1 },
		]);
		expect(overlapping.isValid).toBe(false);
		expect(overlapping.errors.length).toBeGreaterThan(0);

		// Invalid min >= max
		const invalidRange = validateSlabs([
			{ minQuantity: 10, maxQuantity: 5, unitPrice: 9.0 },
		]);
		expect(invalidRange.isValid).toBe(false);
	});
});

describe("Slab Pricing tRPC Router Integration", () => {
	let db: any;
	let caller: any;

	beforeEach(async () => {
		const testDb = createTestDb();
		db = testDb.db;
		await testDb.pg.exec(SCHEMA_DDL);

		// Seed two test products
		await db.insert(products).values([
			{
				id: 1,
				name: "Sugar 1 KG",
				sku: "SUGAR-01",
				price: "50.00",
				base_selling_price: "50.00",
				user_uid: "admin-1",
				is_deleted: false,
			},
			{
				id: 2,
				name: "Rice 5 KG",
				sku: "RICE-05",
				price: "250.00",
				base_selling_price: "250.00",
				user_uid: "admin-1",
				is_deleted: false,
			},
		]);

		const ctx = {
			db,
			user: makeUser("admin-1", { role: "admin" }),
			session: null,
		};
		caller = appRouter.createCaller(ctx);
	});

	it("saves and retrieves independent product slab pricing", async () => {
		// Configure slabs for Product 1 (Sugar)
		await caller.slabPricing.saveProductSlabs({
			productId: 1,
			isEnabled: true,
			slabs: [
				{ minQuantity: 1, maxQuantity: 3, unitPrice: 9.22 },
				{ minQuantity: 4, maxQuantity: 7, unitPrice: 9.1 },
				{ minQuantity: 8, maxQuantity: null, unitPrice: 9.0 },
			],
		});

		// Verify Product 1 configuration
		const prod1Slabs = await caller.slabPricing.getByProductId({ productId: 1 });
		expect(prod1Slabs.isEnabled).toBe(true);
		expect(prod1Slabs.slabs).toHaveLength(3);
		expect(prod1Slabs.slabs[0].unitPrice).toBe(9.22);
		expect(prod1Slabs.slabs[1].unitPrice).toBe(9.1);
		expect(prod1Slabs.slabs[2].unitPrice).toBe(9.0);

		// Verify Product 2 (Rice) remains completely independent without slabs
		const prod2Slabs = await caller.slabPricing.getByProductId({ productId: 2 });
		expect(prod2Slabs.isEnabled).toBe(false);
		expect(prod2Slabs.slabs).toHaveLength(0);
	});

	it("calculates real-time price through the router", async () => {
		await caller.slabPricing.saveProductSlabs({
			productId: 1,
			isEnabled: true,
			slabs: [
				{ minQuantity: 1, maxQuantity: 3, unitPrice: 9.22 },
				{ minQuantity: 4, maxQuantity: 7, unitPrice: 9.1 },
				{ minQuantity: 8, maxQuantity: null, unitPrice: 9.0 },
			],
		});

		const calcResult = await caller.slabPricing.calculatePrice({
			productId: 1,
			quantity: 5,
		});

		expect(calcResult.isSlabApplied).toBe(true);
		expect(calcResult.unitPrice).toBe(9.1);
		expect(calcResult.totalPrice).toBe(45.5);
	});

	it("bulk applies slab pricing to multiple products", async () => {
		await caller.slabPricing.bulkSaveProductSlabs({
			productIds: [1, 2],
			slabs: [
				{ minQuantity: 10, maxQuantity: 50, unitPrice: 40.0 },
				{ minQuantity: 51, maxQuantity: null, unitPrice: 35.0 },
			],
		});

		const p1 = await caller.slabPricing.getByProductId({ productId: 1 });
		const p2 = await caller.slabPricing.getByProductId({ productId: 2 });

		expect(p1.slabs).toHaveLength(2);
		expect(p2.slabs).toHaveLength(2);
		expect(p1.slabs[0].unitPrice).toBe(40.0);
		expect(p2.slabs[0].unitPrice).toBe(40.0);
	});
});
