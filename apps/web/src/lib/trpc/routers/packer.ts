import {
	packages,
	packageItems,
	pickLists,
	orders,
	staff,
} from "@evaluna/db/schema";
import { and, desc, eq, notInArray } from "drizzle-orm";
import { z } from "zod";
import { roleProcedure, router } from "../init";

export const packerRouter = router({
	getDashboardStats: roleProcedure(["admin", "manager", "packer"])
		.query(async ({ ctx }) => {
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
		}),

	getPendingToPack: roleProcedure(["admin", "manager", "packer"])
		.query(async ({ ctx }) => {
			// Find pick lists that are completed but not fully packed
			// For simplicity, we just fetch completed pickLists that aren't linked to a package yet.
			const existingPackages = await ctx.db.select({ pick_list_id: packages.pick_list_id }).from(packages);
			const packedPickListIds = existingPackages.map((p) => p.pick_list_id).filter(Boolean) as number[];

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
						? and(eq(pickLists.status, "completed"), notInArray(pickLists.id, packedPickListIds))
						: eq(pickLists.status, "completed")
				)
				.orderBy(desc(pickLists.completed_at))
				.limit(50);

			return results.map((r) => ({
				id: `PL-${r.id}`,
				pick_list_id: r.id,
				order_ref: r.reference_type === "sale" ? `ORD-${r.order_id}` : `REF-${r.order_id}`,
				status: "pending_packing",
				completed_at: r.completed_at?.toLocaleDateString() || "Unknown",
			}));
		}),

	packOrder: roleProcedure(["admin", "manager", "packer"])
		.input(
			z.object({
				pick_list_id: z.number(),
				order_id: z.number(),
				weight: z.number().optional(),
				dimensions: z.string().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			// Find the staff who is packing
			const staffMember = await ctx.db.select().from(staff).where(eq(staff.email, ctx.user.email)).limit(1);
			const packerId = staffMember[0]?.id;

			const packageNumber = `PKG-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

			const [newPackage] = await ctx.db.insert(packages).values({
				order_id: input.order_id,
				pick_list_id: input.pick_list_id,
				package_number: packageNumber,
				status: "packed",
				packed_by: packerId,
				packed_at: new Date(),
				weight: input.weight?.toString(),
				dimensions: input.dimensions,
			}).returning();

			return {
				success: true,
				package_number: newPackage.package_number,
			};
		}),
});
