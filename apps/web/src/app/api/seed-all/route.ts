import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
	branches,
	staff,
	suppliers,
	products,
	orders,
	pickLists,
	pickListItems,
	purchases,
	purchaseItems,
	branchLocations,
} from "@evaluna/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
	try {
		// 1. Branch
		let branchId = 1;
		const existingBranches = await db.select().from(branches).limit(1);
		if (existingBranches.length > 0) {
			branchId = existingBranches[0].id;
		} else {
			const [newBranch] = await db.insert(branches).values({
				name: "Main Warehouse",
				location: "Mumbai",
				manager_id: null,
			}).returning();
			branchId = newBranch.id;
		}

		// 2. Staff
		let staffId = 1;
		const existingStaff = await db.select().from(staff).limit(1);
		if (existingStaff.length > 0) {
			staffId = existingStaff[0].id;
		} else {
			const [newStaff] = await db.insert(staff).values({
				branch_id: branchId,
				staff_code: "EMP001",
				name: "Deepak Sharma",
				email: "deepak@evaluna.com",
				role: "picker",
				join_date: new Date(),
				salary: "25000",
			}).returning();
			staffId = newStaff.id;
		}

		// 3. Location
		let locId = 1;
		const existingLoc = await db.select().from(branchLocations).limit(1);
		if (existingLoc.length > 0) {
			locId = existingLoc[0].id;
		} else {
			const [newLoc] = await db.insert(branchLocations).values({
				branch_id: branchId,
				name: "A1-Bin2",
				type: "bin",
				capacity: 100,
			}).returning();
			locId = newLoc.id;
		}

		// 4. Products
		let productId = 1;
		const existingProducts = await db.select().from(products).limit(1);
		if (existingProducts.length > 0) {
			productId = existingProducts[0].id;
		} else {
			const [newProduct] = await db.insert(products).values({
				name: "Wireless Mouse M330",
				sku: "MS-WL-330",
				price: "1500",
				cost_price: "800",
			}).returning();
			productId = newProduct.id;
		}

		// 5. Suppliers
		let supplierId = 1;
		const existingSuppliers = await db.select().from(suppliers).limit(1);
		if (existingSuppliers.length > 0) {
			supplierId = existingSuppliers[0].id;
		} else {
			const [newSupplier] = await db.insert(suppliers).values({
				name: "TechCorp Logistics",
				email: "supply@techcorp.com",
			}).returning();
			supplierId = newSupplier.id;
		}

		// 6. Orders
		let orderId = 1;
		const existingOrders = await db.select().from(orders).limit(1);
		if (existingOrders.length > 0) {
			orderId = existingOrders[0].id;
		} else {
			const [newOrder] = await db.insert(orders).values({
				customer_id: 1, // Assuming customer 1 exists or doesn't strictly fk
				total_amount: "5000",
				user_uid: "admin", // mock user uid
				status: "completed",
			}).returning();
			orderId = newOrder.id;
		}

		// 7. Pick Lists
		const pickListData = [
			{ order_id: orderId, reference_type: "sale", reference_id: orderId, assigned_to: staffId, status: "pending", priority: "high" },
			{ order_id: orderId, reference_type: "sale", reference_id: orderId, assigned_to: staffId, status: "picking", priority: "normal" },
			{ order_id: orderId, reference_type: "sale", reference_id: orderId, assigned_to: staffId, status: "completed", priority: "high" },
		];

		const insertedPickLists = [];
		for (const pl of pickListData) {
			const [inserted] = await db.insert(pickLists).values(pl as any).returning();
			insertedPickLists.push(inserted);
		}

		// Pick List Items
		for (const pl of insertedPickLists) {
			const itemCount = pl.status === "picking" ? 5 : 2;
			for (let i = 0; i < itemCount; i++) {
				await db.insert(pickListItems).values({
					pick_list_id: pl.id,
					product_id: productId,
					quantity_ordered: Math.floor(Math.random() * 5) + 1,
					quantity_picked: pl.status === "completed" ? 5 : 0,
					status: pl.status === "completed" ? "picked" : "pending",
					location_id: locId,
				});
			}
		}

		// 8. Purchases (For Putter)
		const [newPurchase] = await db.insert(purchases).values({
			supplier_id: supplierId,
			branch_id: branchId,
			status: "pending",
			total_amount: "15000",
			grn_number: "GRN-2024-001",
		}).returning();

		await db.insert(purchaseItems).values({
			purchase_id: newPurchase.id,
			product_id: productId,
			quantity: 50,
			unit_price: "300",
			total_price: "15000",
		});

		const [newPurchase2] = await db.insert(purchases).values({
			supplier_id: supplierId,
			branch_id: branchId,
			status: "received",
			total_amount: "25000",
			grn_number: "GRN-2024-002",
		}).returning();

		await db.insert(purchaseItems).values({
			purchase_id: newPurchase2.id,
			product_id: productId,
			quantity: 100,
			unit_price: "250",
			total_price: "25000",
		});

		return NextResponse.json({ success: true, message: "Comprehensive Seed Data generated successfully!" });
	} catch (error: any) {
		console.error("Seed error:", error);
		return NextResponse.json({ success: false, error: error.message }, { status: 500 });
	}
}
