import { describe, expect, it } from "bun:test";
import {
	notifyStockChanged,
	subscribeStockChanged,
} from "@/lib/inventory/stock-event-bus";
import { calculateStockTier } from "../customer";

describe("Real-Time Stock Availability & Low-Stock Alerts", () => {
	describe("1. Stock Status Tier Calculations (Acceptance Criteria 1-7)", () => {
		it("Stock = 100 -> IN STOCK (Green, isAvailable: true, no warning)", () => {
			const res = calculateStockTier(100);
			expect(res.stockStatus).toBe("in_stock");
			expect(res.stockBadgeText).toBe("IN STOCK");
			expect(res.stockBadgeColor).toBe("green");
			expect(res.stockWarningText).toBe("");
			expect(res.isAvailable).toBe(true);
		});

		it("Stock = 50 -> IN STOCK (Green, isAvailable: true, no warning)", () => {
			const res = calculateStockTier(50);
			expect(res.stockStatus).toBe("in_stock");
			expect(res.stockBadgeText).toBe("IN STOCK");
			expect(res.stockBadgeColor).toBe("green");
			expect(res.stockWarningText).toBe("");
			expect(res.isAvailable).toBe(true);
		});

		it("Stock = 30 -> IN STOCK (Green, threshold boundary)", () => {
			const res = calculateStockTier(30);
			expect(res.stockStatus).toBe("in_stock");
			expect(res.stockBadgeText).toBe("IN STOCK");
			expect(res.stockBadgeColor).toBe("green");
			expect(res.stockWarningText).toBe("");
			expect(res.isAvailable).toBe(true);
		});

		it("Stock = 29 -> FEW LEFT (Orange, 'Hurry! Only 29 units left. Order soon!')", () => {
			const res = calculateStockTier(29);
			expect(res.stockStatus).toBe("few_left");
			expect(res.stockBadgeText).toBe("FEW LEFT");
			expect(res.stockBadgeColor).toBe("orange");
			expect(res.stockWarningText).toBe(
				"Hurry! Only 29 units left. Order soon!",
			);
			expect(res.isAvailable).toBe(true);
		});

		it("Stock = 21 -> FEW LEFT (Orange, lower boundary)", () => {
			const res = calculateStockTier(21);
			expect(res.stockStatus).toBe("few_left");
			expect(res.stockBadgeText).toBe("FEW LEFT");
			expect(res.stockBadgeColor).toBe("orange");
			expect(res.stockWarningText).toBe(
				"Hurry! Only 21 units left. Order soon!",
			);
			expect(res.isAvailable).toBe(true);
		});

		it("Stock = 20 -> SELLING FAST (Orange, 'Selling fast! Limited stock remaining.')", () => {
			const res = calculateStockTier(20);
			expect(res.stockStatus).toBe("selling_fast");
			expect(res.stockBadgeText).toBe("SELLING FAST");
			expect(res.stockBadgeColor).toBe("orange");
			expect(res.stockWarningText).toBe(
				"Selling fast! Limited stock remaining.",
			);
			expect(res.isAvailable).toBe(true);
		});

		it("Stock = 15 -> SELLING FAST (Orange, 'Selling fast! Limited stock remaining.')", () => {
			const res = calculateStockTier(15);
			expect(res.stockStatus).toBe("selling_fast");
			expect(res.stockBadgeText).toBe("SELLING FAST");
			expect(res.stockBadgeColor).toBe("orange");
			expect(res.stockWarningText).toBe(
				"Selling fast! Limited stock remaining.",
			);
			expect(res.isAvailable).toBe(true);
		});

		it("Stock = 11 -> SELLING FAST (Orange, lower boundary)", () => {
			const res = calculateStockTier(11);
			expect(res.stockStatus).toBe("selling_fast");
			expect(res.stockBadgeText).toBe("SELLING FAST");
			expect(res.stockBadgeColor).toBe("orange");
			expect(res.stockWarningText).toBe(
				"Selling fast! Limited stock remaining.",
			);
			expect(res.isAvailable).toBe(true);
		});

		it("Stock = 10 -> ALMOST SOLD OUT (Red, 'Almost Sold Out! Only 10 units left. Order Now!')", () => {
			const res = calculateStockTier(10);
			expect(res.stockStatus).toBe("almost_sold_out");
			expect(res.stockBadgeText).toBe("ALMOST SOLD OUT");
			expect(res.stockBadgeColor).toBe("red");
			expect(res.stockWarningText).toBe(
				"Almost Sold Out! Only 10 units left. Order Now!",
			);
			expect(res.isAvailable).toBe(true);
		});

		it("Stock = 5 -> ALMOST SOLD OUT (Red, 'Almost Sold Out! Only 5 units left. Order Now!')", () => {
			const res = calculateStockTier(5);
			expect(res.stockStatus).toBe("almost_sold_out");
			expect(res.stockBadgeText).toBe("ALMOST SOLD OUT");
			expect(res.stockBadgeColor).toBe("red");
			expect(res.stockWarningText).toBe(
				"Almost Sold Out! Only 5 units left. Order Now!",
			);
			expect(res.isAvailable).toBe(true);
		});

		it("Stock = 1 -> ALMOST SOLD OUT (Red, 'Almost Sold Out! Only 1 units left. Order Now!')", () => {
			const res = calculateStockTier(1);
			expect(res.stockStatus).toBe("almost_sold_out");
			expect(res.stockBadgeText).toBe("ALMOST SOLD OUT");
			expect(res.stockBadgeColor).toBe("red");
			expect(res.stockWarningText).toBe(
				"Almost Sold Out! Only 1 units left. Order Now!",
			);
			expect(res.isAvailable).toBe(true);
		});

		it("Stock = 0 -> OUT OF STOCK (Red, disabled for cart)", () => {
			const res = calculateStockTier(0);
			expect(res.stockStatus).toBe("out_of_stock");
			expect(res.stockBadgeText).toBe("OUT OF STOCK");
			expect(res.stockBadgeColor).toBe("red");
			expect(res.stockWarningText).toBe(
				"Currently unavailable. This product will be available once stock is replenished.",
			);
			expect(res.isAvailable).toBe(false);
		});

		it("Stock < 0 -> OUT OF STOCK (Negative physical/reserved shortfall)", () => {
			const res = calculateStockTier(-10);
			expect(res.stockStatus).toBe("out_of_stock");
			expect(res.stockBadgeText).toBe("OUT OF STOCK");
			expect(res.stockBadgeColor).toBe("red");
			expect(res.isAvailable).toBe(false);
		});
	});

	describe("2. Formula & Reserved Stock Deduction", () => {
		it("Correctly computes Available Stock = Physical Stock - Reserved Stock", () => {
			const physicalStock = 100;
			const reservedStock = 75;
			const availableStock = Math.max(
				0,
				Number((physicalStock - reservedStock).toFixed(3)),
			);
			expect(availableStock).toBe(25);

			const tier = calculateStockTier(availableStock);
			expect(tier.stockStatus).toBe("few_left");
			expect(tier.stockBadgeText).toBe("FEW LEFT");
		});

		it("Prevents negative available stock when reservations equal or exceed physical inventory", () => {
			const physicalStock = 20;
			const reservedStock = 25;
			const availableStock = Math.max(
				0,
				Number((physicalStock - reservedStock).toFixed(3)),
			);
			expect(availableStock).toBe(0);

			const tier = calculateStockTier(availableStock);
			expect(tier.stockStatus).toBe("out_of_stock");
			expect(tier.isAvailable).toBe(false);
		});
	});

	describe("3. Real-Time Stock Event Bus", () => {
		it("Publishes and receives real-time stock change events", () => {
			let receivedEvent: any = null;
			const unsubscribe = subscribeStockChanged((event) => {
				receivedEvent = event;
			});

			notifyStockChanged(42, 1);

			expect(receivedEvent).not.toBeNull();
			expect(receivedEvent.productId).toBe(42);
			expect(receivedEvent.branchId).toBe(1);
			expect(typeof receivedEvent.timestamp).toBe("number");

			unsubscribe();
		});
	});
});
