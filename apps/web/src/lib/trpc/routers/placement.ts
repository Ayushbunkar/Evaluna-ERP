import { placementVerifications } from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { router } from "../init";
import { permProcedure } from "../util/auditor-procedures";
import { assertTransition, logAudit, resolveStaffId } from "../util/audit";
import { createFinding } from "./audit-findings";

export const placementRouter = router({
	// ── Read: placement verification queue ────────────────────────────────────
	list: permProcedure("placement", "read")
		.input(
			z
				.object({ status: z.string().optional(), branchId: z.number().optional() })
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const conds = [];
			if (input?.status) conds.push(eq(placementVerifications.status, input.status));
			if (input?.branchId) conds.push(eq(placementVerifications.branch_id, input.branchId));
			return await ctx.db
				.select()
				.from(placementVerifications)
				.where(conds.length ? and(...conds) : undefined)
				.orderBy(desc(placementVerifications.created_at));
		}),

	// ── Write: enqueue a placement verification ───────────────────────────────
	create: permProcedure("placement", "write")
		.input(
			z.object({
				productId: z.number(),
				batchId: z.number().optional(),
				locationId: z.number().optional(),
				branchId: z.number().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);
			return await ctx.db.transaction(async (tx: any) => {
				const [row] = await tx
					.insert(placementVerifications)
					.values({
						product_id: input.productId,
						batch_id: input.batchId ?? null,
						location_id: input.locationId ?? null,
						branch_id: input.branchId ?? null,
						status: "AWAITING_PLACEMENT",
					})
					.returning();
				await logAudit(tx, {
					userId: staffId,
					action: "PLACEMENT_CREATE",
					entityType: "placement_verifications",
					entityId: row.id,
					newValues: { productId: input.productId, locationId: input.locationId ?? null },
				});
				return { placementId: row.id };
			});
		}),

	// ── Write: mark item physically placed (AWAITING_PLACEMENT → PLACED) ──────
	markPlaced: permProcedure("placement", "write")
		.input(z.object({ placementId: z.number(), locationId: z.number().optional() }))
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);
			return await ctx.db.transaction(async (tx: any) => {
				const [pv] = await tx
					.select()
					.from(placementVerifications)
					.where(eq(placementVerifications.id, input.placementId))
					.limit(1);
				if (!pv)
					throw new TRPCError({ code: "NOT_FOUND", message: "Placement not found." });
				assertTransition(pv.status, ["AWAITING_PLACEMENT"], "placement");
				const [row] = await tx
					.update(placementVerifications)
					.set({
						status: "VERIFICATION_REQUIRED",
						location_id: input.locationId ?? pv.location_id,
						placed_by: staffId,
					})
					.where(and(eq(placementVerifications.id, input.placementId), eq(placementVerifications.status, "AWAITING_PLACEMENT")))
					.returning();
				if (!row)
					throw new TRPCError({ code: "CONFLICT", message: "Placement changed concurrently; refresh." });
				await logAudit(tx, {
					userId: staffId,
					action: "PLACEMENT_PLACED",
					entityType: "placement_verifications",
					entityId: input.placementId,
					oldValues: { status: "AWAITING_PLACEMENT" },
					newValues: { status: "VERIFICATION_REQUIRED" },
				});
				return { placementId: row.id, status: row.status };
			});
		}),

	// ── Approve: verify placement (VERIFICATION_REQUIRED → VERIFIED) ──────────
	verify: permProcedure("placement", "approve")
		.input(z.object({ placementId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);
			return await ctx.db.transaction(async (tx: any) => {
				const [pv] = await tx
					.select()
					.from(placementVerifications)
					.where(eq(placementVerifications.id, input.placementId))
					.limit(1);
				if (!pv)
					throw new TRPCError({ code: "NOT_FOUND", message: "Placement not found." });
				assertTransition(pv.status, ["VERIFICATION_REQUIRED", "PLACED"], "placement");
				// Separation of duties: verifier cannot be the person who placed it.
				if (staffId && pv.placed_by && staffId === pv.placed_by)
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You cannot verify a placement you performed yourself.",
					});
				const [row] = await tx
					.update(placementVerifications)
					.set({ status: "VERIFIED", verified_by: staffId, verified_at: new Date() })
					.where(and(eq(placementVerifications.id, input.placementId), eq(placementVerifications.status, pv.status)))
					.returning();
				if (!row)
					throw new TRPCError({ code: "CONFLICT", message: "Placement changed concurrently; refresh." });
				await logAudit(tx, {
					userId: staffId,
					action: "PLACEMENT_VERIFY",
					entityType: "placement_verifications",
					entityId: input.placementId,
					oldValues: { status: pv.status },
					newValues: { status: "VERIFIED" },
				});
				return { placementId: row.id, status: row.status };
			});
		}),

	// ── Write: flag a placement exception (→ PLACEMENT_EXCEPTION + finding) ───
	flagException: permProcedure("placement", "write")
		.input(
			z.object({
				placementId: z.number(),
				severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
				description: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);
			return await ctx.db.transaction(async (tx: any) => {
				const [pv] = await tx
					.select()
					.from(placementVerifications)
					.where(eq(placementVerifications.id, input.placementId))
					.limit(1);
				if (!pv)
					throw new TRPCError({ code: "NOT_FOUND", message: "Placement not found." });
				assertTransition(pv.status, ["AWAITING_PLACEMENT", "PLACED", "VERIFICATION_REQUIRED"], "placement");
				const [row] = await tx
					.update(placementVerifications)
					.set({ status: "PLACEMENT_EXCEPTION", notes: input.description })
					.where(and(eq(placementVerifications.id, input.placementId), eq(placementVerifications.status, pv.status)))
					.returning();
				if (!row)
					throw new TRPCError({ code: "CONFLICT", message: "Placement changed concurrently; refresh." });
				await createFinding(tx, staffId, {
					branchId: pv.branch_id,
					findingType: "placement",
					severity: input.severity,
					title: `Placement exception on product #${pv.product_id}`,
					description: input.description,
					referenceType: "placement_verifications",
					referenceId: input.placementId,
				});
				await logAudit(tx, {
					userId: staffId,
					action: "PLACEMENT_EXCEPTION",
					entityType: "placement_verifications",
					entityId: input.placementId,
					oldValues: { status: pv.status },
					newValues: { status: "PLACEMENT_EXCEPTION" },
				});
				return { placementId: row.id, status: row.status };
			});
		}),
});
