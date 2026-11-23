import { describe, expect, it } from "bun:test";
import { formatQty } from "../utils";

describe("Quantity Formatting (formatQty)", () => {
	it("preserves double decimal quantities without rounding (e.g. 0.25, 0.75)", () => {
		expect(formatQty(0.25)).toBe("0.25");
		expect(formatQty("0.25")).toBe("0.25");
		expect(formatQty(0.75)).toBe("0.75");
		expect(formatQty("0.75")).toBe("0.75");
		expect(formatQty(1.25)).toBe("1.25");
		expect(formatQty(2.75)).toBe("2.75");
	});

	it("preserves single decimal quantities without trailing zeroes", () => {
		expect(formatQty(0.5)).toBe("0.5");
		expect(formatQty(1.5)).toBe("1.5");
		expect(formatQty("1.50")).toBe("1.5");
	});

	it("preserves three decimal places without trailing zeroes", () => {
		expect(formatQty(0.125)).toBe("0.125");
		expect(formatQty("0.375")).toBe("0.375");
	});

	it("formats integers cleanly without trailing decimals", () => {
		expect(formatQty(1)).toBe("1");
		expect(formatQty("1.000")).toBe("1");
		expect(formatQty(45)).toBe("45");
		expect(formatQty("45.000")).toBe("45");
		expect(formatQty(0)).toBe("0");
		expect(formatQty("0.000")).toBe("0");
	});

	it("handles null, undefined, and empty string safely", () => {
		expect(formatQty(null)).toBe("0");
		expect(formatQty(undefined)).toBe("0");
		expect(formatQty("")).toBe("0");
	});

	it("recovers from old concatenated multi-dot strings", () => {
		expect(formatQty("01.00045.000")).toBe("1");
		expect(formatQty("1.5.2.5")).toBe("4");
	});
});
