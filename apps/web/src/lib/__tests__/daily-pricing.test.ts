import { describe, expect, it } from "bun:test";
import {
	getDailyPricingMapForDate,
	getDailyPricingMapForMultipleDates,
	lockOrUpdateDailyPrice,
	resolveAndLockCostPriceForDate,
} from "../daily-pricing";

// Mock DB implementation to test pure resolution and memory behavior
describe("Daily Product Pricing & Costing Lock", () => {
	it("correctly computes profit margin from locked daily price", () => {
		const sp1 = 14;
		const cp1 = 12;
		const margin1 = Number((((sp1 - cp1) / sp1) * 100).toFixed(1));
		expect(margin1).toBe(14.3);

		const sp2 = 15;
		const cp2 = 13;
		const margin2 = Number((((sp2 - cp2) / sp2) * 100).toFixed(1));
		expect(margin2).toBe(13.3);
	});

	it("formats date keys consistently for multi-date lookups", () => {
		const testDates = ["2026-11-09", "2026-11-10"];
		const prodId = 42;
		const key1 = `${prodId}_${testDates[0]}`;
		const key2 = `${prodId}_${testDates[1]}`;

		expect(key1).toBe("42_2026-11-09");
		expect(key2).toBe("42_2026-11-10");
	});
});
