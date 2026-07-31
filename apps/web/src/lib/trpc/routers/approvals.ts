import { approvals, staff } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../init";

export const approvalsRouter = router({
	getApprovals: protectedProcedure
		.input(z.object({ status: z.string().optional() }))
		.query(async ({ ctx, input }) => {
			let query = ctx.db
				.select({
					id: approvals.id,
					referenceType: approvals.reference_type,
					referenceId: approvals.reference_id,
					requestedBy: staff.name,
					reason: approvals.comments,
					status: approvals.status,
					date: approvals.created_at,
				})
				.from(approvals)
				.leftJoin(staff, eq(approvals.requested_by, staff.id));

			if (input.status) {
				query = query.where(eq(approvals.status, input.status)) as any;
			}

			const results = await query;

			return results.map((r) => ({
				id: `APP-${r.id}`,
				referenceType: r.referenceType || "Unknown",
				referenceId: `REF-${r.referenceId}`,
				requestedBy: r.requestedBy || "Unknown",
				amount: 0,
				reason: r.reason || "No reason provided",
				status: r.status || "pending",
				date: r.date ? r.date.toISOString() : new Date().toISOString(),
			}));
		}),

	updateStatus: protectedProcedure
		.input(
			z.object({ id: z.string(), status: z.enum(["approved", "rejected"]) }),
		)
		.mutation(async ({ ctx, input }) => {
			const numericId = Number.parseInt(input.id.replace("APP-", ""), 10);
			if (Number.isNaN(numericId)) throw new Error("Invalid ID");

			await ctx.db
				.update(approvals)
				.set({ status: input.status, resolved_at: new Date() })
				.where(eq(approvals.id, numericId));

			return { success: true, id: input.id, status: input.status };
		}),
});
