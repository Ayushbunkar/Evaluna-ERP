import "dotenv/config";
import { db } from "@evaluna/db";
import { customers } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";

async function seedTestCustomer() {
	console.log("🌱 Seeding test customer with phone 9993313086...\n");

	try {
		// Check if customer already exists
		const existing = await db
			.select()
			.from(customers)
			.where(eq(customers.phone, "9993313086"))
			.limit(1);

		if (existing.length > 0) {
			console.log("✅ Test customer already exists:");
			console.log(existing[0]);
			return;
		}

		// Create new test customer
		const result = await db
			.insert(customers)
			.values({
				name: "Test Customer",
				phone: "9993313086",
				email: "test@evaluna-erp.com",
				address: "123 Test Street, Test City",
				city: "Test City",
				state: "Test State",
				pincode: "100001",
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		console.log("✅ Test customer created successfully!");
		console.log("\n📱 Customer Details:");
		console.log("────────────────────────────────────────");
		console.log(`Name: ${result[0].name}`);
		console.log(`Phone: ${result[0].phone}`);
		console.log(`Email: ${result[0].email}`);
		console.log(`Address: ${result[0].address}`);
		console.log("────────────────────────────────────────\n");

		console.log("🎯 Use this customer in orders for OTP testing!");
		console.log("   When creating an order, select this customer");
		console.log("   OTP will be sent to: +91 9993313086\n");

		process.exit(0);
	} catch (error) {
		console.error("❌ Error seeding customer:", error);
		process.exit(1);
	}
}

seedTestCustomer();