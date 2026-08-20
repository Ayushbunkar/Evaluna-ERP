import { receivingInspections } from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { router } from "../init";
import { permProcedure } from "../util/auditor-procedures";
import { assertTransition, logAudit, resolveStaffId } from "../util/audit";
import { createFinding } from "./audit-findings";

export const receivingInspectionsRouter = router({
	// ── Read: receiving inspection queue ──────────────────────────────────────
	list: permProcedure("inventory_audit", "read")
		.input(
			z
				.object({
					status: z.string().optional(),
					branchId: z.number().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const conds = [];
			if (input?.status) conds.push(eq(receivingInspections.status, input.status));
			if (input?.branchId) conds.push(eq(receivingInspections.branch_id, input.branchId));
			return await ctx.db
				.select()
				.from(receivingInspections)
				.where(conds.length ? and(...conds) : undefined)
				.orderBy(desc(receivingInspections.created_at));
		}),

	// ── Write: enqueue an inspection row (idempotent per purchase+product) ────
	create: permProcedure("inventory_audit", "write")
		.input(
			z.object({
				purchaseId: z.number().optional(),
				productId: z.number(),
				branchId: z.number().optional(),
				expectedQty: z.number().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);
			return await ctx.db.transaction(async (tx: any) => {
				const [row] = await tx
					.insert(receivingInspections)
					.values({
						purchase_id: input.purchaseId ?? null,
						product_id: input.productId,
						branch_id: input.branchId ?? null,
						expected_qty: input.expectedQty ?? null,
						status: "PENDING",
					})
					.returning();
				await logAudit(tx, {
					userId: staffId,
					action: "RECEIVING_INSPECTION_CREATE",
					entityType: "receiving_inspections",
					entityId: row.id,
					newValues: { productId: input.productId, purchaseId: input.purchaseId ?? null },
				});
				return { inspectionId: row.id };
			});
		}),

	// ── Write: verify a received line (PENDING → VERIFIED) ────────────────────
	verify: permProcedure("inventory_audit", "write")
		.input(
			z.object({
				inspectionId: z.number(),
				receivedQty: z.number().optional(),
				condition: z.enum(["good", "damaged", "mismatch"]).optional(),
				upcStatus: z.enum(["present", "missing", "invalid"]).optional(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);
			return await ctx.db.transaction(async (tx: any) => {
				const [insp] = await tx
					.select()
					.from(receivingInspections)
					.where(eq(receivingInspections.id, input.inspectionId))
					.limit(1);
				if (!insp)
					throw new TRPCError({ code: "NOT_FOUND", message: "Inspection not found." });
				assertTransition(insp.status, ["PENDING"], "inspection");
				const [row] = await tx
					.update(receivingInspections)
					.set({
						status: "VERIFIED",
						received_qty: input.receivedQty ?? insp.received_qty,
						condition: input.condition ?? insp.condition,
						upc_status: input.upcStatus ?? insp.upc_status,
						notes: input.notes ?? insp.notes,
						inspected_by: staffId,
						verified_at: new Date(),
					})
					.where(and(eq(receivingInspections.id, input.inspectionId), eq(receivingInspections.status, "PENDING")))
					.returning();
				if (!row)
					throw new TRPCError({ code: "CONFLICT", message: "Inspection changed concurrently; refresh." });
				await logAudit(tx, {
					userId: staffId,
					action: "RECEIVING_INSPECTION_VERIFY",
					entityType: "receiving_inspections",
					entityId: input.inspectionId,
					oldValues: { status: "PENDING" },
					newValues: { status: "VERIFIED", receivedQty: input.receivedQty ?? null },
				});
				return { inspectionId: row.id, status: row.status };
			});
		}),

	// ── Write: flag a receiving discrepancy (→ DISCREPANCY + raises finding) ──
	flagDiscrepancy: permProcedure("inventory_audit", "write")
		.input(
			z.object({
				inspectionId: z.number(),
				receivedQty: z.number().optional(),
				condition: z.enum(["good", "damaged", "mismatch"]).optional(),
				severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
				description: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);
			return await ctx.db.transaction(async (tx: any) => {
				const [insp] = await tx
					.select()
					.from(receivingInspections)
					.where(eq(receivingInspections.id, input.inspectionId))
					.limit(1);
				if (!insp)
					throw new TRPCError({ code: "NOT_FOUND", message: "Inspection not found." });
				assertTransition(insp.status, ["PENDING"], "inspection");
				const [row] = await tx
					.update(receivingInspections)
					.set({
						status: "DISCREPANCY",
						received_qty: input.receivedQty ?? insp.received_qty,
						condition: input.condition ?? insp.condition,
						notes: input.description,
						inspected_by: staffId,
						verified_at: new Date(),
					})
					.where(and(eq(receivingInspections.id, input.inspectionId), eq(receivingInspections.status, "PENDING")))
					.returning();
				if (!row)
					throw new TRPCError({ code: "CONFLICT", message: "Inspection changed concurrently; refresh." });
				await createFinding(tx, staffId, {
					branchId: insp.branch_id,
					findingType: "receiving",
					severity: input.severity,
					title: `Receiving discrepancy on product #${insp.product_id}`,
					description: input.description,
					referenceType: "receiving_inspections",
					referenceId: input.inspectionId,
				});
				await logAudit(tx, {
					userId: staffId,
					action: "RECEIVING_INSPECTION_DISCREPANCY",
					entityType: "receiving_inspections",
					entityId: input.inspectionId,
					oldValues: { status: "PENDING" },
					newValues: { status: "DISCREPANCY" },
				});
				return { inspectionId: row.id, status: row.status };
			});
		}),
});
