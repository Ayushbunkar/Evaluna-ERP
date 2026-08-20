import {
	customers,
	orders,
	packageItems,
	packages,
	pickListItems,
	pickLists,
	products,
	staff,
} from "@evaluna/db/schema";
import { and, desc, eq, gte, inArray, lte, notInArray } from "drizzle-orm";
import { z } from "zod";
import { roleProcedure, router } from "../init";

export const packerRouter = router({
	getDashboardStats: roleProcedure(["admin", "manager", "packer"]).query(
		async ({ ctx }) => {
			const pendingToPack = await ctx.db
				.select()
				.from(pickLists)
				.where(eq(pickLists.status, "completed")); // picking is completed, waiting for packing

			const packedToday = await ctx.db
				.select()
				.from(packages)
				.where(eq(packages.status, "packed")); // simplistic daily logic placeholder

			return {
				pendingToPack: pendingToPack.length,
				packedToday: packedToday.length,
				packingEfficiency: 95.5,
			};
		},
	),

	getPendingToPack: roleProcedure(["admin", "manager", "packer"]).query(
		async ({ ctx }) => {
			// Find pick lists that are completed but not fully packed
			// For simplicity, we just fetch completed pickLists that aren't linked to a package yet.
			const existingPackages = await ctx.db
				.select({ pick_list_id: packages.pick_list_id })
				.from(packages);
			const packedPickListIds = existingPackages
				.map((p) => p.pick_list_id)
				.filter(Boolean) as number[];

			const results = await ctx.db
				.select({
					id: pickLists.id,
					order_id: pickLists.order_id,
					reference_type: pickLists.reference_type,
					completed_at: pickLists.completed_at,
				})
				.from(pickLists)
				.where(
					packedPickListIds.length > 0
						? and(
								eq(pickLists.status, "completed"),
								notInArray(pickLists.id, packedPickListIds),
							)
						: eq(pickLists.status, "completed"),
				)
				.orderBy(desc(pickLists.completed_at))
				.limit(50);

			return results.map((r) => ({
				id: `PL-${r.id}`,
				pick_list_id: r.id,
				order_ref:
					r.reference_type === "sale"
						? `ORD-${r.order_id}`
						: `REF-${r.order_id}`,
				status: "pending_packing",
				completed_at: r.completed_at?.toLocaleDateString() || "Unknown",
			}));
		},
	),

	getPendingOrders: roleProcedure(["admin", "manager", "packer"]).query(
		async ({ ctx }) => {
			// Completed pick lists that have not yet been packed
			const existingPackages = await ctx.db
				.select({ pick_list_id: packages.pick_list_id })
				.from(packages);
			const packedPickListIds = existingPackages
				.map((p) => p.pick_list_id)
				.filter(Boolean) as number[];

			const pending = await ctx.db
				.select({
					pick_list_id: pickLists.id,
					order_id: pickLists.order_id,
					status: pickLists.status,
					customerName: customers.name,
				})
				.from(pickLists)
				.leftJoin(orders, eq(pickLists.order_id, orders.id))
				.leftJoin(customers, eq(orders.customer_id, customers.id))
				.where(
					packedPickListIds.length > 0
						? and(
								eq(pickLists.status, "completed"),
								notInArray(pickLists.id, packedPickListIds),
							)
						: eq(pickLists.status, "completed"),
				)
				.orderBy(desc(pickLists.completed_at))
				.limit(50);

			if (pending.length === 0) return [];

			const pickListIds = pending.map((p) => p.pick_list_id);
			const items = await ctx.db
				.select({
					id: pickListItems.id,
					pick_list_id: pickListItems.pick_list_id,
					productName: products.name,
					barcode: products.barcode,
					status: pickListItems.status,
				})
				.from(pickListItems)
				.leftJoin(products, eq(pickListItems.product_id, products.id))
				.where(inArray(pickListItems.pick_list_id, pickListIds));

			return pending.map((pl) => ({
				id: `PL-${pl.pick_list_id}`,
				customerName: pl.customerName ?? "Walk-in Customer",
				status: pl.status ?? "pending_packing",
				items: items
					.filter((it) => it.pick_list_id === pl.pick_list_id)
					.map((it) => ({
						id: it.id,
						productName: it.productName ?? "Unknown Product",
						barcode: it.barcode ?? "",
						status: it.status ?? "pending",
					})),
			}));
		},
	),

	packOrder: roleProcedure(["admin", "manager", "packer"])
		.input(
			z.object({
				pick_list_id: z.number(),
				order_id: z.number(),
				weight: z.number().optional(),
				dimensions: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Find the staff who is packing
			const staffMember = await ctx.db
				.select()
				.from(staff)
				.where(eq(staff.email, ctx.user.email))
				.limit(1);
			const packerId = staffMember[0]?.id;

			const packageNumber = `PKG-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

			const [newPackage] = await ctx.db
				.insert(packages)
				.values({
					order_id: input.order_id,
					pick_list_id: input.pick_list_id,
					package_number: packageNumber,
					status: "packed",
					packed_by: packerId,
					packed_at: new Date(),
					weight: input.weight?.toString(),
					dimensions: input.dimensions,
				})
				.returning();

			return {
				success: true,
				package_number: newPackage.package_number,
			};
		}),

	getPackingHistory: roleProcedure(["admin", "manager", "packer"])
		.input(
			z.object({
				startDate: z.date(),
				endDate: z.date(),
				status: z.string().optional(),
				search: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			// Build the base query for packages with proper joins
			let query = ctx.db
				.select({
					orderId: packages.order_id,
					packedBy: staff.name,
					status: packages.status,
					packedAt: packages.packed_at,
				})
				.from(packages)
				.leftJoin(staff, eq(packages.packed_by, staff.id))
				.where(
					and(
						input.startDate && input.endDate
							? and(
									gte(packages.packed_at, input.startDate),
									lte(packages.packed_at, input.endDate),
								)
							: undefined,
						input.status
							? eq(packages.status, input.status)
							: undefined,
					),
				)
				.orderBy(desc(packages.packed_at));

			// Execute the query
			const results = await query;

			// Transform the results to match the expected format
			return results.map((item) => ({
				orderId: `ORD-${item.orderId}`,
				customerName: "Customer Name", // Placeholder for now
				itemsCount: 1, // Default value since we don't have items_count in packages table
				packedBy: item.packedBy || "Unknown",
				status: item.status || "completed",
				packedAt: item.packedAt || new Date(),
			}));
		}),

	getReports: roleProcedure(["admin", "manager", "packer"])
		.input(
			z.object({
				startDate: z.date(),
				endDate: z.date(),
				reportType: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const packed = await ctx.db
				.select({ id: packages.id })
				.from(packages)
				.where(
					and(
						eq(packages.status, "packed"),
						gte(packages.packed_at, input.startDate),
						lte(packages.packed_at, input.endDate),
					),
				);

			const packageIds = packed.map((p) => p.id);
			const items =
				packageIds.length > 0
					? await ctx.db
							.select({ id: packageItems.id })
							.from(packageItems)
							.where(inArray(packageItems.package_id, packageIds))
					: [];

			const totalOrders = packed.length;
			const totalItems = items.length;

			return {
				totalOrders,
				totalItems,
				period: input.reportType ?? "summary",
				avgPackingTime: 0,
				errorRate: 0,
				itemsTrend: 0,
				accuracy: 100,
				accuracyTrend: 0,
				totalErrors: 0,
				errorsTrend: 0,
			};
		}),
});