import {
	orders,
	pickListItems,
	pickLists,
	products,
} from "@evaluna/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
	try {
		// Mock Data
		const userUid = "seed-admin";

		// Ensure we have an order and a user to assign to
		let orderId = 1;
		const existingOrders = await db.select().from(orders).limit(1);
		if (existingOrders.length > 0) orderId = existingOrders[0].id;
		else {
			const [newOrder] = await db
				.insert(orders)
				.values({ customer_id: 1, total_amount: "500", user_uid: userUid })
				.returning();
			orderId = newOrder.id;
		}

		const assignedUser = 1; // Needs to be an integer (staff.id)

		let productId = 1;
		const existingProducts = await db.select().from(products).limit(1);
		if (existingProducts.length > 0) productId = existingProducts[0].id;

		// Create Pick Lists
		const pickListData = [
			{
				order_id: orderId,
				reference_type: "sale",
				reference_id: orderId,
				assigned_to: assignedUser,
				status: "pending",
				priority: "High",
			},
			{
				order_id: orderId,
				reference_type: "sale",
				reference_id: orderId,
				assigned_to: assignedUser,
				status: "picking",
				priority: "Normal",
			},
			{
				order_id: orderId,
				reference_type: "sale",
				reference_id: orderId,
				assigned_to: assignedUser,
				status: "completed",
				priority: "High",
			},
		];

		const insertedPickLists = [];
		for (const pl of pickListData) {
			const [inserted] = await db.insert(pickLists).values(pl).returning();
			insertedPickLists.push(inserted);
		}

		// Create Pick List Items
		for (const pl of insertedPickLists) {
			const itemCount = pl.status === "picking" ? 15 : 2; // Generate 15 items for active task

			for (let i = 0; i < itemCount; i++) {
				await db.insert(pickListItems).values({
					pick_list_id: pl.id,
					product_id: productId,
					quantity_ordered: Math.floor(Math.random() * 5) + 1,
					quantity_picked: pl.status === "completed" ? 5 : 0,
					status: pl.status === "completed" ? "picked" : "pending",
				});
			}
		}

		return NextResponse.json({
			success: true,
			message: "Picker seed data generated successfully!",
		});
	} catch (error: any) {
		console.error("Seed error:", error);
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 },
		);
	}
}
