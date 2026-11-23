import { describe, expect, it } from "bun:test";
import { appRouter } from "../index";

describe("Real-Time Multi-Warehouse Batch / Lot & FEFO Expiry Tracking", () => {
	it("batches procedures are registered on appRouter", () => {
		const procedures = appRouter._def.procedures;
		expect(procedures["batches.getStats"]).toBeDefined();
		expect(procedures["batches.list"]).toBeDefined();
		expect(procedures["batches.getFEFORecommendations"]).toBeDefined();
		expect(procedures["batches.create"]).toBeDefined();
		expect(procedures["batches.update"]).toBeDefined();
		expect(procedures["batches.getById"]).toBeDefined();
		expect(procedures["batches.listByProduct"]).toBeDefined();
	});
});
