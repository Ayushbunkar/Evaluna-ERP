import { db } from "../apps/web/src/lib/db/index.js";
import { appRouter } from "../apps/web/src/lib/trpc/root.js";

async function main() {
	const caller = appRouter.createCaller({
		db,
		user: { id: "1", role: "admin", email: "test@test.com" },
	});

	console.log("Testing scanBarcode...");
	try {
		// Try with a known product SKU or barcode from DB (e.g. from seed data)
		const res = await caller.inventory.scanBarcode({
			barcode: "SKU-312",
			branchId: 1,
		});
		console.log("Scan result:", res);

		if (res.product) {
			console.log("Testing adjustStock...");
			const adjRes = await caller.inventory.adjustStock({
				productId: res.product.id,
				branchId: 1,
				quantity: 1,
				adjustmentType: "Audit",
				notes: "Test adjustment",
			});
			console.log("Adjust result:", adjRes);
		}
	} catch (e) {
		console.error("Test error:", e);
	}
	process.exit(0);
}
main();
