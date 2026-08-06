import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, orders, customers, salesReturns } from "@/lib/db/schema";
import { auth } from "@evaluna/auth/server";
import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
	try {
		// Mock User ID
		const userUid = "seed-admin";

		// Create a mock customer if none exists
		let customerId = 1;
		const existingCustomers = await db.select().from(customers).limit(1);
		if (existingCustomers.length === 0) {
			const [newCustomer] = await db.insert(customers).values({
				name: "Seed Customer",
				email: "seed_customer@example.com",
				user_uid: userUid,
				customer_code: "CUST-SEED1",
				phone: "1234567890",
			}).returning();
			customerId = newCustomer.id;
		} else {
			customerId = existingCustomers[0].id;
		}

		// 1. Seed Cash Book Transactions
		const txData = [
			{ amount: "1500.00", type: "in" as const, category: "sale", description: "Sale Order #1001", status: "completed", user_uid: userUid, reference_type: "order" },
			{ amount: "200.00", type: "out" as const, category: "expense", description: "Office Supplies", status: "completed", user_uid: userUid, reference_type: "manual" },
			{ amount: "3500.00", type: "in" as const, category: "sale", description: "Bulk Order #1002", status: "completed", user_uid: userUid, reference_type: "order" },
			{ amount: "150.00", type: "out" as const, category: "refund", description: "Refund for Order #999", status: "completed", user_uid: userUid, reference_type: "manual" },
		];
		
		for (const tx of txData) {
			await db.insert(transactions).values(tx);
		}

		// 2. Seed Orders
		const orderData = [
			{ customer_id: customerId, total_amount: "1500.00", status: "completed", user_uid: userUid },
			{ customer_id: customerId, total_amount: "3500.00", status: "completed", user_uid: userUid },
			{ customer_id: customerId, total_amount: "250.00", status: "pending", user_uid: userUid },
		];

		const insertedOrders = [];
		for (const order of orderData) {
			const [insertedOrder] = await db.insert(orders).values(order).returning();
			insertedOrders.push(insertedOrder);
		}

		// 3. Seed Sales Returns
		if (insertedOrders.length > 0) {
			const returnsData = [
				{ order_id: insertedOrders[0].id, customer_id: customerId, total_amount: "150.00", status: "pending", user_uid: userUid },
				{ order_id: insertedOrders[1].id, customer_id: customerId, total_amount: "500.00", status: "processed", user_uid: userUid },
			];
			for (const ret of returnsData) {
				await db.insert(salesReturns).values(ret);
			}
		}

		return NextResponse.json({ success: true, message: "Sales, Returns, and Cashbook seed data generated successfully!" });
	} catch (error: any) {
		console.error("Seed error:", error);
		return NextResponse.json({ success: false, error: error.message }, { status: 500 });
	}
}
