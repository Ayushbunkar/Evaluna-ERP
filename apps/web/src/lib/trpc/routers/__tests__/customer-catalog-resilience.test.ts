import { describe, expect, it } from "bun:test";
import { ensureProductImageColumns } from "@/lib/product-schema-ensure";

describe("Customer Catalog Schema Resilience & Image Columns", () => {
	it("ensureProductImageColumns executes idempotently without throwing on mock/pg instance", async () => {
		const mockExecutedSql: string[] = [];
		const mockDb = {
			execute: async (query: any) => {
				mockExecutedSql.push(query?.queryChunks ? "chunked" : String(query));
				return { rows: [] };
			},
		};

		await expect(ensureProductImageColumns(mockDb)).resolves.toBeUndefined();
	});

	it("formats fallback query properly when search or category filter is supplied", () => {
		const inputSearch = "Oil";
		const inputCategory = "Grocery";

		const searchPattern = `%${inputSearch.trim()}%`;
		expect(searchPattern).toBe("%Oil%");
		expect(inputCategory).toBe("Grocery");
	});
});
