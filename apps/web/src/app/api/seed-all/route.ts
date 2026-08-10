import {
	branches,
	branchLocations,
	customers,
	orders,
	packageItems,
	packages,
	pickListItems,
	pickLists,
	products,
	purchaseItems,
	purchases,
	staff,
	suppliers,
} from "@evaluna/db/schema";
import { deliveryTrips, tripStops, tripCollections } from "@evaluna/db/schema/delivery";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
	try {
		// 1. Branch
		let branchId = 1;
		const existingBranches = await db.select().from(branches).limit(1);
		if (existingBranches.length > 0) {
			branchId = existingBranches[0].id;
		} else {
			const [newBranch] = await db
				.insert(branches)
				.values({
					name: "Main Warehouse",
					location: "Mumbai",
					manager_id: null,
				})
				.returning();
			branchId = newBranch.id;
		}

		// 2. Staff (50 staff)
		let staffId = 1;
		const existingStaff = await db.select().from(staff).limit(1);
		if (existingStaff.length > 0) {
			staffId = existingStaff[0].id;
		} else {
			const staffData = [];
			for (let i = 1; i <= 50; i++) {
				staffData.push({
					branch_id: branchId,
					staff_code: `EMP00${i}`,
					name: i === 1 ? "Deepak Sharma" : `Staff Member ${i}`,
					email: i === 1 ? "deepak@evaluna.com" : `staff${i}@evaluna.com`,
					role: i % 3 === 0 ? "packer" : i % 3 === 1 ? "picker" : "driver",
					join_date: new Date(),
					salary: "25000",
				});
			}
			const insertedStaff = await db
				.insert(staff)
				.values(staffData)
				.returning();
			staffId = insertedStaff[0].id;
		}

		// 3. Location (50 locations)
		let locId = 1;
		const existingLoc = await db.select().from(branchLocations).limit(1);
		if (existingLoc.length > 0) {
			locId = existingLoc[0].id;
		} else {
			const locData = [];
			for (let i = 1; i <= 50; i++) {
				locData.push({
					branch_id: branchId,
					name: `A1-Bin${i}`,
					type: "bin",
					capacity: 100,
				});
			}
			const insertedLocs = await db
				.insert(branchLocations)
				.values(locData)
				.returning();
			locId = insertedLocs[0].id;
		}

		// 4. Products (50 products)
		let productId = 1;
		const existingProducts = await db.select().from(products).limit(1);
		if (existingProducts.length > 0) {
			productId = existingProducts[0].id;
		} else {
			const prodData = [];
			for (let i = 1; i <= 50; i++) {
				prodData.push({
					name: `Product Item ${i}`,
					sku: `PRD-SKU-${i}`,
					price: `${1500 + i * 10}`,
					cost_price: `${800 + i * 5}`,
					user_uid: "admin",
				});
			}
			const insertedProducts = await db
				.insert(products)
				.values(prodData)
				.returning();
			productId = insertedProducts[0].id;
		}

		// 5. Suppliers (50 suppliers)
		let supplierId = 1;
		const existingSuppliers = await db.select().from(suppliers).limit(1);
		if (existingSuppliers.length > 0) {
			supplierId = existingSuppliers[0].id;
		} else {
			const suppData = [];
			for (let i = 1; i <= 50; i++) {
				suppData.push({
					name: `Supplier Logistics ${i}`,
					email: i === 1 ? "supply@techcorp.com" : `supply${i}@techcorp.com`,
				});
			}
			const insertedSuppliers = await db
				.insert(suppliers)
				.values(suppData)
				.returning();
			supplierId = insertedSuppliers[0].id;
		}

		// 6. Customers (50 customers)
		let customerId = 1;
		const existingCustomers = await db.select().from(customers).limit(1);
		if (existingCustomers.length > 0) {
			customerId = existingCustomers[0].id;
		} else {
			const custData = [];
			for (let i = 1; i <= 50; i++) {
				custData.push({
					name: `Retail Store ${i}`,
					email: `store${i}@retail.com`,
					phone: `98765432${i.toString().padStart(2, "0")}`,
					address: `12${i} Main Market, City`,
					type: "retail",
					branch_id: branchId,
					user_uid: "admin",
				});
			}
			const insertedCusts = await db
				.insert(customers)
				.values(custData)
				.returning();
			customerId = insertedCusts[0].id;
		}

		// 7. Orders (50 orders)
		let orderId = 1;
		const existingOrders = await db.select().from(orders).limit(1);
		if (existingOrders.length > 0) {
			orderId = existingOrders[0].id;
		} else {
			const ordData = [];
			for (let i = 1; i <= 50; i++) {
				ordData.push({
					customer_id: customerId,
					total_amount: `${5000 + i * 100}`,
					user_uid: "admin",
					status: i % 2 === 0 ? "completed" : "processing",
				});
			}
			const insertedOrders = await db
				.insert(orders)
				.values(ordData)
				.returning();
			orderId = insertedOrders[0].id;
		}

		// 8. Pick Lists (50 pick lists)
		const existingPickLists = await db.select().from(pickLists).limit(1);
		const insertedPickLists = [];
		if (existingPickLists.length === 0) {
			const pickListData = [];
			for (let i = 1; i <= 50; i++) {
				pickListData.push({
					order_id: orderId,
					reference_type: "sale",
					reference_id: orderId,
					assigned_to: staffId,
					status:
						i % 3 === 0 ? "completed" : i % 3 === 1 ? "picking" : "pending",
					priority: i % 2 === 0 ? "high" : "normal",
				});
			}
			for (const pl of pickListData) {
				const [inserted] = await db
					.insert(pickLists)
					.values(pl as any)
					.returning();
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
		}

		// 9. Packages (50 packages for Packer/Checker)
		const existingPackages = await db.select().from(packages).limit(1);
		if (existingPackages.length === 0) {
			const packageData = [];
			for (let i = 1; i <= 50; i++) {
				packageData.push({
					order_id: orderId,
					pick_list_id: insertedPickLists[0]?.id || 1,
					package_number: `PKG-2026-${i.toString().padStart(4, "0")}`,
					status:
						i % 4 === 0
							? "checked"
							: i % 4 === 1
								? "packed"
								: i % 4 === 2
									? "packing"
									: "checking",
					packed_by: staffId,
					checked_by: i % 4 === 0 ? staffId : null,
					packed_at: new Date(),
					checked_at: i % 4 === 0 ? new Date() : null,
					weight: `${2.5 + i * 0.1}`,
				});
			}
			const insertedPkgs = await db
				.insert(packages)
				.values(packageData)
				.returning();

			// Package Items
			for (const pkg of insertedPkgs) {
				await db.insert(packageItems).values({
					package_id: pkg.id,
					product_id: productId,
					quantity: Math.floor(Math.random() * 10) + 1,
				});
			}
		}

		// 10. Purchases (50 for Putter)
		const existingPurchases = await db.select().from(purchases).limit(1);
		if (existingPurchases.length === 0) {
			const purchData = [];
			for (let i = 1; i <= 50; i++) {
				purchData.push({
					supplier_id: supplierId,
					branch_id: branchId,
					status: i % 2 === 0 ? "received" : "pending",
					total_amount: `${15000 + i * 200}`,
					grn_number: `GRN-2026-${i.toString().padStart(3, "0")}`,
				});
			}
			const insertedPurchases = await db
				.insert(purchases)
				.values(purchData)
				.returning();

			for (const p of insertedPurchases) {
				await db.insert(purchaseItems).values({
					purchase_id: p.id,
					product_id: productId,
					quantity: 50 + p.id,
					unit_price: "300",
					total_price: `${15000 + p.id * 300}`,
				});
			}
		}

		// 11. Delivery Trips (50 trips for Driver/Dispatcher)
		const existingTrips = await db.select().from(deliveryTrips).limit(1);
		if (existingTrips.length === 0) {
			const tripData = [];
			for (let i = 1; i <= 50; i++) {
				tripData.push({
					branch_id: branchId,
					driver_id: staffId, // Assign to first staff
					vehicle_id: null,
					status:
						i % 3 === 0 ? "completed" : i % 3 === 1 ? "active" : "pending",
					start_time: new Date(),
					end_time: i % 3 === 0 ? new Date() : null,
					start_km: 10000 + i * 50,
					end_km: i % 3 === 0 ? 10050 + i * 50 : null,
				});
			}
			const insertedTrips = await db
				.insert(deliveryTrips)
				.values(tripData)
				.returning();

			// Delivery Stops
			for (const trip of insertedTrips) {
				await db.insert(tripStops).values({
					trip_id: trip.id,
					customer_id: customerId,
					sequence: 1,
					status: trip.status === "completed" ? "delivered" : "pending",
					eta: new Date(),
					notes: "Handle with care",
				});

				if (trip.status === "completed" || trip.status === "active") {
					await db.insert(tripCollections).values({
						trip_id: trip.id,
						payment_method: "cash",
						amount: "2500.00",
						collected_by: staffId,
					});
				}
			}
		}

		return NextResponse.json({
			success: true,
			message: "Comprehensive Seed Data (50 rows each) generated successfully!",
		});
	} catch (error: any) {
		console.error("Seed error:", error);
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 },
		);
	}
}
