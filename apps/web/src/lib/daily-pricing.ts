import {
	dailyProductPricing,
	priceChangeHistory,
	products,
} from "@evaluna/db/schema";
import { and, desc, eq, lte, sql } from "drizzle-orm";

let tableEnsured = false;

/**
 * Idempotently ensure the daily_product_pricing table and index exist.
 */
export async function ensureDailyPricingTable(db: any): Promise<void> {
	if (tableEnsured) return;
	tableEnsured = true;
	try {
		await db.execute(sql`
			CREATE TABLE IF NOT EXISTS daily_product_pricing (
				id serial PRIMARY KEY,
				product_id integer NOT NULL REFERENCES products(id),
				branch_id integer REFERENCES branches(id),
				pricing_date varchar(10) NOT NULL,
				cost_price numeric(10,2) NOT NULL,
				selling_price numeric(10,2) NOT NULL,
				is_locked boolean DEFAULT true,
				locked_at timestamp DEFAULT NOW(),
				notes text,
				created_by_uid varchar(255),
				created_at timestamp DEFAULT NOW(),
				updated_at timestamp DEFAULT NOW()
			)
		`);
	} catch (err) {
		console.warn("[ensureDailyPricingTable] Notice:", err);
	}
}

export interface DayPricingRecord {
	costPrice: number;
	sellingPrice: number;
	isLocked: boolean;
	lockedAt?: string | null;
	notes?: string | null;
}

/**
 * Get map of locked product pricing for a particular date (YYYY-MM-DD).
 */
export async function getDailyPricingMapForDate(
	db: any,
	dateStr: string,
	branchId?: number,
): Promise<Map<number, DayPricingRecord>> {
	await ensureDailyPricingTable(db);
	const resultMap = new Map<number, DayPricingRecord>();

	try {
		const conditions = [eq(dailyProductPricing.pricing_date, dateStr)];
		if (branchId) {
			conditions.push(eq(dailyProductPricing.branch_id, branchId));
		}

		const rows = await db
			.select({
				productId: dailyProductPricing.product_id,
				costPrice: dailyProductPricing.cost_price,
				sellingPrice: dailyProductPricing.selling_price,
				isLocked: dailyProductPricing.is_locked,
				lockedAt: dailyProductPricing.locked_at,
				notes: dailyProductPricing.notes,
			})
			.from(dailyProductPricing)
			.where(and(...conditions));

		for (const r of rows) {
			resultMap.set(r.productId, {
				costPrice: Number(r.costPrice || 0),
				sellingPrice: Number(r.sellingPrice || 0),
				isLocked: Boolean(r.isLocked),
				lockedAt: r.lockedAt ? new Date(r.lockedAt).toISOString() : null,
				notes: r.notes,
			});
		}
	} catch (err) {
		console.warn(`[getDailyPricingMapForDate] Warning for date ${dateStr}:`, err);
	}

	return resultMap;
}

/**
 * Get map of all locked daily pricing across a list of dates.
 * Returns map keyed by `${productId}_${dateStr}`.
 */
export async function getDailyPricingMapForMultipleDates(
	db: any,
	dates: string[],
	branchId?: number,
): Promise<Map<string, DayPricingRecord>> {
	await ensureDailyPricingTable(db);
	const resultMap = new Map<string, DayPricingRecord>();
	if (!dates || dates.length === 0) return resultMap;

	try {
		const rows = await db
			.select({
				productId: dailyProductPricing.product_id,
				pricingDate: dailyProductPricing.pricing_date,
				costPrice: dailyProductPricing.cost_price,
				sellingPrice: dailyProductPricing.selling_price,
				isLocked: dailyProductPricing.is_locked,
				lockedAt: dailyProductPricing.locked_at,
				notes: dailyProductPricing.notes,
			})
			.from(dailyProductPricing)
			.where(
				sql`${dailyProductPricing.pricing_date} IN (${sql.join(
					dates.map((d) => sql`${d}`),
					sql`, `,
				)})`,
			);

		for (const r of rows) {
			const key = `${r.productId}_${r.pricingDate}`;
			resultMap.set(key, {
				costPrice: Number(r.costPrice || 0),
				sellingPrice: Number(r.sellingPrice || 0),
				isLocked: Boolean(r.isLocked),
				lockedAt: r.lockedAt ? new Date(r.lockedAt).toISOString() : null,
				notes: r.notes,
			});
		}
	} catch (err) {
		console.warn("[getDailyPricingMapForMultipleDates] Warning:", err);
	}

	return resultMap;
}

/**
 * Lock or update pricing for a specific product and date.
 * Also appends to priceChangeHistory and updates live product table if today.
 */
export async function lockOrUpdateDailyPrice(
	db: any,
	params: {
		productId: number;
		pricingDate: string; // 'YYYY-MM-DD'
		costPrice: number;
		sellingPrice: number;
		branchId?: number;
		notes?: string;
		userUid?: string;
		staffId?: number;
		source?: string;
	},
): Promise<{ success: boolean; id?: number }> {
	await ensureDailyPricingTable(db);

	const bId = params.branchId || 1;
	const cpStr = params.costPrice.toFixed(2);
	const spStr = params.sellingPrice.toFixed(2);
	const todayStr = new Date().toISOString().split("T")[0];

	try {
		// 1. Check if daily pricing record exists for this product and date
		const [existing] = await db
			.select()
			.from(dailyProductPricing)
			.where(
				and(
					eq(dailyProductPricing.product_id, params.productId),
					eq(dailyProductPricing.pricing_date, params.pricingDate),
					bId ? eq(dailyProductPricing.branch_id, bId) : undefined,
				),
			)
			.limit(1);

		let recordId: number | undefined;

		if (existing) {
			const [updated] = await db
				.update(dailyProductPricing)
				.set({
					cost_price: cpStr,
					selling_price: spStr,
					is_locked: true,
					locked_at: new Date(),
					notes: params.notes ?? existing.notes,
					created_by_uid: params.userUid ?? existing.created_by_uid,
					updated_at: new Date(),
				})
				.where(eq(dailyProductPricing.id, existing.id))
				.returning({ id: dailyProductPricing.id });
			recordId = updated?.id;
		} else {
			const [inserted] = await db
				.insert(dailyProductPricing)
				.values({
					product_id: params.productId,
					branch_id: bId,
					pricing_date: params.pricingDate,
					cost_price: cpStr,
					selling_price: spStr,
					is_locked: true,
					locked_at: new Date(),
					notes: params.notes,
					created_by_uid: params.userUid,
				})
				.returning({ id: dailyProductPricing.id });
			recordId = inserted?.id;
		}

		// 2. Append to priceChangeHistory for audit log
		try {
			await db.insert(priceChangeHistory).values([
				{
					product_id: params.productId,
					price_field: "base_procurement_price",
					old_price: existing?.cost_price ?? null,
					new_price: cpStr,
					changed_by: params.staffId,
					changed_by_uid: params.userUid,
					reason: params.notes || `Day rate lock for ${params.pricingDate}`,
					source: params.source || "warehouse_day_pricing",
					created_at: new Date(),
				},
				{
					product_id: params.productId,
					price_field: "price",
					old_price: existing?.selling_price ?? null,
					new_price: spStr,
					changed_by: params.staffId,
					changed_by_uid: params.userUid,
					reason: params.notes || `Day rate lock for ${params.pricingDate}`,
					source: params.source || "warehouse_day_pricing",
					created_at: new Date(),
				},
			]);
		} catch (auditErr) {
			console.warn("[lockOrUpdateDailyPrice] Failed to log priceChangeHistory:", auditErr);
		}

		// 3. If pricingDate is today or future, synchronize the live product record
		if (params.pricingDate >= todayStr) {
			await db
				.update(products)
				.set({
					price: spStr,
					base_selling_price: spStr,
					base_procurement_price: cpStr,
				})
				.where(eq(products.id, params.productId));
		}

		return { success: true, id: recordId };
	} catch (err) {
		console.error("[lockOrUpdateDailyPrice] Error locking price:", err);
		throw err;
	}
}

/**
 * Resolve the locked cost price for a specific product on a given date.
 * If no record exists for that date, checks priceChangeHistory or falls back,
 * and then automatically locks the rate for that date so it remains static forever.
 */
export async function resolveAndLockCostPriceForDate(
	db: any,
	productId: number,
	pricingDate: string,
	fallbackCost: number,
	fallbackSelling: number,
	branchId?: number,
): Promise<number> {
	await ensureDailyPricingTable(db);
	const bId = branchId || 1;

	try {
		// 1. Direct daily lock check
		const [locked] = await db
			.select({ costPrice: dailyProductPricing.cost_price })
			.from(dailyProductPricing)
			.where(
				and(
					eq(dailyProductPricing.product_id, productId),
					eq(dailyProductPricing.pricing_date, pricingDate),
					bId ? eq(dailyProductPricing.branch_id, bId) : undefined,
				),
			)
			.limit(1);

		if (locked && Number(locked.costPrice || 0) > 0) {
			return Number(locked.costPrice);
		}

		// 2. Check priceChangeHistory on or before pricingDate
		const dateEnd = new Date(`${pricingDate}T23:59:59.999Z`);
		const [hist] = await db
			.select({ newPrice: priceChangeHistory.new_price })
			.from(priceChangeHistory)
			.where(
				and(
					eq(priceChangeHistory.product_id, productId),
					eq(priceChangeHistory.price_field, "base_procurement_price"),
					lte(priceChangeHistory.created_at, dateEnd),
				),
			)
			.orderBy(desc(priceChangeHistory.created_at))
			.limit(1);

		const resolvedCost = hist?.newPrice
			? Number(hist.newPrice)
			: fallbackCost > 0
				? fallbackCost
				: fallbackSelling * 0.8;

		// 3. Persist and lock this resolved rate for this date so future changes never alter it!
		try {
			await db.insert(dailyProductPricing).values({
				product_id: productId,
				branch_id: bId,
				pricing_date: pricingDate,
				cost_price: resolvedCost.toFixed(2),
				selling_price: fallbackSelling.toFixed(2),
				is_locked: true,
				notes: `Auto-locked from historical order on ${pricingDate}`,
			});
		} catch (lockErr) {
			// Ignore conflict if another process locked it
		}

		return resolvedCost;
	} catch (err) {
		console.warn(`[resolveAndLockCostPriceForDate] Fallback for prod ${productId}:`, err);
		return fallbackCost > 0 ? fallbackCost : fallbackSelling * 0.8;
	}
}
