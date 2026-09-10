import { db } from "../packages/db/src/index";
import { products, orderItems, pickListItems, stockLedger, branchInventory } from "../packages/db/src/schema";
import { inArray, sql } from "drizzle-orm";

async function run() {
	console.log("--- CLEANING UP FAKE ENGLISH PRODUCTS FROM DATABASE ---");

	// We want to target and remove only the Faker-generated products
	const fakeFakerKeywords = [
		"Pants", "Sausages", "Computer", "Salad", "Cheese", "Chair", "Pizza", "Shoes", 
		"Gloves", "Hat", "Shirt", "Keyboard", "Mouse", "Soap"
	];

	// Fetch all products
	const allProducts = await db.select().from(products);
	console.log(`Total products in database: ${allProducts.length}`);

	const fakeProducts = allProducts.filter((p) => {
		// If the name is fully English and contains any typical fake keywords
		const containsFakeKeyword = fakeFakerKeywords.some((keyword) => 
			p.name.toLowerCase().includes(keyword.toLowerCase())
		);
		
		// If the product name contains Hindi translation brackets (like (माजा)), it is 100% real!
		const containsHindi = /[\u0900-\u097F]/.test(p.name);
		
		// Let's also preserve specific known real names from Product Master
		const isKnownReal = [
			"achar", "ajwain", "almonds", "amina", "ariel", "ash ghee", "aunty", "babool", 
			"balaji", "basmati", "batesha", "besan", "bip", "black salt", "boomer", "boroplus", 
			"bpl", "bulb", "bundi", "camel", "camphor", "cashews", "center", "chakki", "chameli", 
			"chana", "chicken", "chik", "chironji", "chuna", "chutki", "clinic", "closeup", 
			"coconut", "colgate", "cotton wicks", "cream", "dabar", "dal", "daliya", "dant", 
			"dates", "dettol", "dhruvraj", "diaper", "dish", "dove", "eclairs", "eveready", 
			"expert", "eye capsule", "fair", "farari", "fast card", "fennel", "figs", "fine sev", 
			"flake", "frooti", "ganesh", "garam", "gathiya", "ghadhi", "gillette", "ginger", 
			"gitte", "godrej", "gold", "goodricke", "goyal", "gram", "gudal", "guru", "hajmola", 
			"happy", "head", "hero", "hindi", "honey", "hunk", "imli", "incense", "jira", 
			"kacha", "kapoor", "kashi", "kashmiri", "katha", "kira", "krack", "kriti", "kross", 
			"kuber", "kundan", "laddu", "lamsa", "large", "liberty", "lifebuoy", "lime", 
			"loban", "lollipop", "lunch", "lux", "maaza", "maggie", "maida", "makhana", 
			"man", "margo", "marker", "masoor", "mastan", "matchbox", "melody", "migland", 
			"milk", "mint", "mirinda", "moong", "mordana", "mustard", "mysore", "nakhrali", 
			"navjyoti", "navratna", "neelam", "neema", "nirma", "nisha", "nita", "no. 2", 
			"nova", "nukti", "online", "open", "paheli", "pan", "panchang", "papad", "parachute", 
			"parle", "parmal", "pasta", "patanjali", "peanuts", "pickle", "poha", "polythene", 
			"ponds", "pooja", "prem", "pujan", "pulse", "punga", "punjab", "raisins", "rajshree", 
			"ratlam", "rava", "richie", "rk", "roli", "round", "ruchi", "sabudana", "sachha", 
			"salt", "sanan", "sanchi", "santoor", "scrap", "sehor", "sela", "setmax", "shankar", 
			"shanti", "siki", "sindoor", "sneaker", "soan", "soni", "soya", "special", "spring", 
			"sprite", "sting", "sugar", "sunsilk", "surf", "sweety", "tanman", "tape", "tasty", 
			"tata", "tea", "tiger", "toast", "tomato", "toor", "toothbrush", "urad", "varalaxmi", 
			"vatika", "vim", "vimal", "water", "wheel", "whole", "wilkinson", "yash", "ayush"
		].some((real) => p.name.toLowerCase().includes(real));

		if (containsHindi || isKnownReal) {
			return false; // Keep it!
		}
		
		return containsFakeKeyword || !isKnownReal; // Filter as fake!
	});

	console.log(`Found ${fakeProducts.length} fake products to remove.`);

	if (fakeProducts.length === 0) {
		console.log("No fake products found. Clean up complete!");
		process.exit(0);
	}

	const fakeIds = fakeProducts.map((p) => p.id);

	// Cascadingly delete from dependent tables before deleting from products
	console.log("Deleting associated records in branch inventory, order items, and picklist items...");
	await db.delete(branchInventory).where(inArray(branchInventory.product_id, fakeIds));
	await db.delete(orderItems).where(inArray(orderItems.product_id, fakeIds));
	await db.delete(pickListItems).where(inArray(pickListItems.product_id, fakeIds));
	await db.delete(stockLedger).where(inArray(stockLedger.product_id, fakeIds));

	console.log("Deleting fake products...");
	await db.delete(products).where(inArray(products.id, fakeIds));

	console.log(`\nPurge Complete! Successfully removed ${fakeIds.length} fake English products from your database!`);
	process.exit(0);
}

run().catch((err) => {
	console.error("Purge failed:", err);
	process.exit(1);
});
