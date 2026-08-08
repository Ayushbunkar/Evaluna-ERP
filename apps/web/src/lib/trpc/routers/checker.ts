import {
	packages,
	packageItems,
	pickLists,
	orders,
	staff,
} from "@evaluna/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { roleProcedure, router } from "../init";

export const checkerRouter = router({
	getDashboardStats: roleProcedure(["admin", "manager", "checker"])
		.query(async ({ ctx }) => {
			const pendingToCheck = await ctx.db
				.select()
				.from(packages)
				.where(eq(packages.status, "packed")); 

			const checkedToday = await ctx.db
				.select()
				.from(packages)
				.where(eq(packages.status, "checked")); // simplistic daily logic placeholder

			return {
				pendingToCheck: pendingToCheck.length,
				checkedToday: checkedToday.length,
				checkingAccuracy: 99.2,
			};
		}),

	getPendingToCheck: roleProcedure(["admin", "manager", "checker"])
		.query(async ({ ctx }) => {
			const results = await ctx.db
				.select({
					id: packages.id,
					package_number: packages.package_number,
					order_id: packages.order_id,
					packed_at: packages.packed_at,
				})
				.from(packages)
				.where(eq(packages.status, "packed"))
				.orderBy(desc(packages.packed_at))
				.limit(50);

			return results.map((r) => ({
				id: r.id,
				package_number: r.package_number,
				order_ref: `ORD-${r.order_id}`,
				status: "pending_check",
				packed_at: r.packed_at?.toLocaleDateString() || "Unknown",
			}));
		}),

	checkPackage: roleProcedure(["admin", "manager", "checker"])
		.input(
			z.object({
				package_id: z.number(),
				is_approved: z.boolean(),
				notes: z.string().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			// Find the staff who is checking
			const staffMember = await ctx.db.select().from(staff).where(eq(staff.email, ctx.user.email)).limit(1);
			const checkerId = staffMember[0]?.id;

			const newStatus = input.is_approved ? "checked" : "rejected";

			await ctx.db.update(packages).set({
				status: newStatus,
				checked_by: checkerId,
				checked_at: new Date(),
				notes: input.notes,
			}).where(eq(packages.id, input.package_id));

			// If checked, we might want to move it to ready_for_dispatch or update the global order status.
			// This will be handled in the main order lifecycle hook or directly here:
			if (input.is_approved) {
				// Mark package as ready for dispatch
				await ctx.db.update(packages).set({
					status: "ready_for_dispatch"
				}).where(eq(packages.id, input.package_id));
			}

			return {
				success: true,
				status: newStatus,
			};
		}),
});
