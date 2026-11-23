import { describe, expect, it } from "bun:test";
import { calculateBillTotals } from "@/components/pos/SaleCompletionScreen";

describe("Invoice & Bill Calculation Engine (Subtotal, Discount, & Grand Total)", () => {
	it("correctly calculates Order #407: gross subtotal before discount and grand total subtracting discount", () => {
		// Boroline Rs 10: 36 * 9.00 = 324.00
		// Parle G Rs 10 Box: 1 * 645.00 = 645.00
		// Rajshree Rs 20: 6 * 240.00 = 1440.00
		// Gross Sum = 2409.00
		// Discount = 645.00 (Parle G Rs 10 Discount)
		// Grand Total = 1764.00
		const order = {
			id: 407,
			createdAt: new Date().toISOString(),
			items: [
				{ id: 1500, price: "9.00", qty: 36 },
				{ id: 1501, price: "645.00", qty: 1 },
				{ id: 1502, price: "240.00", qty: 6 },
			],
			total: 1764,
			subtotal: 1764, // Old buggy caller passed discounted total as subtotal
			discount: 645,
			discountReason: "Parle G Rs 10 Discount",
			payments: [],
		};

		const totals = calculateBillTotals(order);

		// Subtotal must show actual price without discount (2409.00)
		expect(totals.orderSubtotal).toBe(2409);
		// Discount must be 645.00
		expect(totals.orderDiscount).toBe(645);
		// Grand Total must mathematically be Subtotal - Discount = 1764.00
		expect(totals.grandTotal).toBe(1764);
		expect(totals.orderSubtotal - totals.orderDiscount).toBe(totals.grandTotal);
		// With 0 payment, full amount is due
		expect(totals.balanceDue).toBe(1764);
	});

	it("handles orders without discounts: subtotal equals grand total", () => {
		const order = {
			id: 408,
			createdAt: new Date().toISOString(),
			items: [
				{ id: 1, price: "50.00", qty: 10 },
				{ id: 2, price: "25.00", qty: 4 },
			],
			total: 600,
			subtotal: 600,
			discount: 0,
			payments: [{ methodId: 1, amount: "600.00" }],
		};

		const totals = calculateBillTotals(order);

		expect(totals.orderSubtotal).toBe(600);
		expect(totals.orderDiscount).toBe(0);
		expect(totals.grandTotal).toBe(600);
		expect(totals.balanceDue).toBe(0);
	});

	it("reconstructs gross subtotal when items array is empty but discount exists", () => {
		const order = {
			id: 409,
			createdAt: new Date().toISOString(),
			items: [],
			total: 1764,
			subtotal: 1764,
			discount: 645,
			payments: [],
		};

		const totals = calculateBillTotals(order);

		// Gross subtotal = total + discount = 2409
		expect(totals.orderSubtotal).toBe(2409);
		expect(totals.orderDiscount).toBe(645);
		expect(totals.grandTotal).toBe(1764);
	});

	it("correctly includes extra charges and round-off", () => {
		const order = {
			id: 410,
			createdAt: new Date().toISOString(),
			items: [{ id: 1, price: "100.40", qty: 10 }], // 1004.00
			total: 954,
			subtotal: 1004,
			discount: 100, // 1004 - 100 = 904
			otherCharges: 50, // 904 + 50 = 954
			payments: [],
		};

		const totals = calculateBillTotals(order);

		expect(totals.orderSubtotal).toBe(1004);
		expect(totals.orderDiscount).toBe(100);
		expect(totals.orderOtherCharges).toBe(50);
		expect(totals.grandTotal).toBe(954);
		expect(
			totals.orderSubtotal - totals.orderDiscount + totals.orderOtherCharges,
		).toBe(totals.grandTotal);
	});

	it("handles decimal quantities accurately", () => {
		const order = {
			id: 411,
			createdAt: new Date().toISOString(),
			items: [
				{ id: 1, price: "120.00", qty: 0.25 }, // 30.00
				{ id: 2, price: "200.00", qty: 1.5 }, // 300.00
			],
			total: 310,
			subtotal: 330,
			discount: 20,
			payments: [],
		};

		const totals = calculateBillTotals(order);

		expect(totals.orderSubtotal).toBe(330);
		expect(totals.orderDiscount).toBe(20);
		expect(totals.grandTotal).toBe(310);
	});
});
