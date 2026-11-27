import { describe, expect, it } from "bun:test";
import {
	compressAuditPayload,
	compressJsonValue,
	decompressAuditRow,
	decompressJsonValue,
	decompressRowFields,
} from "../audit-compression";

describe("audit-compression (lossless archival)", () => {
	it("compresses large audit payloads and restores them identically", () => {
		const oldValues = {
			status: "PENDING",
			amount: "12500.00",
			notes: "Initial wholesale order created for Sharma Kirana Store",
			items: Array.from({ length: 15 }, (_, i) => ({
				sku: `SKU-${i + 1}`,
				qty: 10 + i,
				rate: 240.5,
			})),
		};
		const newValues = {
			...oldValues,
			status: "CONFIRMED",
			_actor: { name: "Rahul", email: "rahul@evaluna.in", role: "manager" },
		};
		const userAgent =
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";

		const result = compressAuditPayload(oldValues, newValues, userAgent);
		expect(result.worthCompressing).toBe(true);
		expect(result.bytesAfter).toBeLessThan(result.bytesBefore);
		expect(typeof result.compressed._gz).toBe("string");

		const compressedRow = {
			id: 42,
			action: "ORDER_CONFIRMED",
			entity_type: "orders",
			old_values: null,
			new_values: result.compressed,
			user_agent: null,
		};

		const restored = decompressAuditRow(compressedRow);
		expect(restored.old_values).toEqual(oldValues);
		expect(restored.new_values).toEqual(newValues);
		expect(restored.user_agent).toBe(userAgent);
	});

	it("returns uncompressed rows untouched", () => {
		const row = {
			id: 7,
			old_values: { price: 100 },
			new_values: { price: 120 },
			user_agent: "TestAgent/1.0",
		};
		expect(decompressAuditRow(row)).toEqual(row);
	});

	it("compresses and transparently restores van-stock / payroll / monitoring JSON fields", () => {
		const checklist = {
			items: Array.from({ length: 12 }, (_, i) => ({
				productId: i + 1,
				checked: true,
				notes: "Verified and loaded onto van MP-04-AB-1234",
			})),
		};
		const { compressed, worthCompressing } = compressJsonValue(checklist);
		expect(worthCompressing).toBe(true);
		expect(decompressJsonValue(compressed)).toEqual(checklist);

		const payrollRow = {
			id: 10,
			oldValues: { net: 15000 },
			newValues: compressed,
		};
		const restored = decompressRowFields(payrollRow, ["oldValues", "newValues"]);
		expect(restored.newValues).toEqual(checklist);
		expect(restored.oldValues).toEqual({ net: 15000 });
	});
});
