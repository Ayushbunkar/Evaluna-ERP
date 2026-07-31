import { config } from "dotenv";

config({ path: "d:/Evaluna ERP/.env" });

import * as fs from "node:fs";
import { products } from "@evaluna/db/schema";
import { db } from "../src/lib/db";

const ocrText = fs.readFileSync(
	"d:/Evaluna ERP/apps/web/scripts/ocr.txt",
	"utf8",
);

async function run() {
	const lines = ocrText.trim().split(/\r?\n/);
	console.log(`Read ${lines.length} lines from OCR`);
	let inserted = 0;

	for (const line of lines) {
		if (!line.trim()) continue;

		const parts = line.trim().split(/\s+/);
		if (parts.length < 3) continue;

		const sellPrice = parts.pop();
		const procPrice = parts.pop();
		const name = parts.join(" ").trim();

		// Check if they are actually numbers
		if (
			Number.isNaN(Number.parseFloat(sellPrice)) ||
			Number.isNaN(Number.parseFloat(procPrice))
		) {
			console.log("Failed to parse line:", line);
			continue;
		}

		let category = "General";
		const family = name.split(" ")[0];
		let visibility = "global";

		const lowerName = name.toLowerCase();
		if (
			lowerName.includes("soap") ||
			lowerName.includes("shampoo") ||
			lowerName.includes("toothpaste") ||
			lowerName.includes("cream")
		)
			category = "Personal Care";
		if (
			lowerName.includes("tea") ||
			lowerName.includes("coffee") ||
			lowerName.includes("frooti") ||
			lowerName.includes("sprite")
		)
			category = "Beverages";
		if (
			lowerName.includes("biscuit") ||
			lowerName.includes("namkeen") ||
			lowerName.includes("chips") ||
			lowerName.includes("chocolate")
		)
			category = "Snacks";
		if (
			lowerName.includes("oil") ||
			lowerName.includes("ghee") ||
			lowerName.includes("dal") ||
			lowerName.includes("rice")
		)
			category = "Grocery";
		if (
			lowerName.includes("cigaret") ||
			lowerName.includes("bidi") ||
			lowerName.includes("zarda")
		)
			category = "Tobacco";

		if (category === "Tobacco") {
			visibility = "admin_only";
		}

		const bp = Number.parseFloat(procPrice) || 0;
		const sp = Number.parseFloat(sellPrice) || 0;

		await db.insert(products).values({
			name: name,
			description: name,
			base_procurement_price: bp.toString(),
			base_selling_price: sp.toString(),
			price: sp.toString(),
			user_uid: "system-import",
			category,
			product_family: family,
			is_pack:
				lowerName.includes("box") ||
				lowerName.includes("crate") ||
				lowerName.includes("sack"),
			visibility_level: visibility,
			is_hidden: false,
		});
		inserted++;
	}
	console.log(`Successfully seeded ${inserted} products from OCR data!`);
	process.exit(0);
}

run().catch(console.error);
