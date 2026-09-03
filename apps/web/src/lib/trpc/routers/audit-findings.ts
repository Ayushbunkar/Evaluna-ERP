import { auditFindings, correctiveActions } from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { router } from "../init";
import {
	assertTransition,
	logAudit,
	notify,
	resolveStaffId,
} from "../util/audit";
import { permProcedure } from "../util/auditor-procedures";

const FINDING_TYPES = [
	"receiving",
	"upc",
	"placement",
	"inventory",
	"price",
	"route",
	"discrepancy",
] as const;

const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

/**
 * Reusable transaction helper so other routers (receiving/placement/price/route)
 * can raise a finding inside their own transaction without duplicating logic.
 */
export async function createFinding(
	tx: any,
	staffId: number | null,
	input: {
		branchId?: number | null;
		findingType: (typeof FINDING_TYPES)[number];
		severity?: (typeof SEVERITIES)[number];
		title: string;
		description?: string;
		referenceType?: string;
		referenceId?: number;
		assignedTo?: number | null;
	},
): Promise<{ id: number }> {
	const [row] = await tx
		.insert(auditFindings)
		.values({
			branch_id: input.branchId ?? null,
			finding_type: input.findingType,
			severity: input.severity ?? "MEDIUM",
			status: "OPEN",
			title: input.title,
			description: input.description ?? null,
			reference_type: input.referenceType ?? null,
			reference_id: input.referenceId ?? null,
			raised_by: staffId,
			assigned_to: input.assignedTo ?? null,
		})
		.returning();
	await logAudit(tx, {
		userId: staffId,
		action: "AUDIT_FINDING_CREATE",
		entityType: "audit_findings",
		entityId: row.id,
		newValues: {
			type: input.findingType,
			severity: input.severity ?? "MEDIUM",
			title: input.title,
		},
	});
	return { id: row.id };
}

export const auditFindingsRouter = router({
	// ── Write: raise a finding ────────────────────────────────────────────────
	create: permProcedure("audit", "write")
		.input(
			z.object({
				branchId: z.number().optional(),
				findingType: z.enum(FINDING_TYPES),
				severity: z.enum(SEVERITIES).default("MEDIUM"),
				title: z.string().min(1),
				description: z.string().optional(),
				referenceType: z.string().optional(),
				referenceId: z.number().optional(),
				assignedTo: z.number().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);
			return await ctx.db.transaction(async (tx: any) => {
				const { id } = await createFinding(tx, staffId, input);
				return { findingId: id };
			});
		}),

	// ── Read: list findings (filtered client-side) ───────────────────────────
	list: permProcedure("audit", "read")
		.input(
			z
				.object({
					status: z.string().optional(),
					findingType: z.string().optional(),
					severity: z.string().optional(),
					branchId: z.number().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const conds = [];
			if (input?.status) conds.push(eq(auditFindings.status, input.status));
			if (input?.findingType)
				conds.push(eq(auditFindings.finding_type, input.findingType));
			if (input?.severity)
				conds.push(eq(auditFindings.severity, input.severity));
			if (input?.branchId)
				conds.push(eq(auditFindings.branch_id, input.branchId));
			return await ctx.db
				.select()
				.from(auditFindings)
				.where(conds.length ? and(...conds) : undefined)
				.orderBy(desc(auditFindings.created_at));
		}),

	// ── Read: single finding + its corrective actions ────────────────────────
	get: permProcedure("audit", "read")
		.input(z.object({ findingId: z.number() }))
		.query(async ({ ctx, input }) => {
			const [finding] = await ctx.db
				.select()
				.from(auditFindings)
				.where(eq(auditFindings.id, input.findingId))
				.limit(1);
			if (!finding)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Finding not found.",
				});
			const actions = await ctx.db
				.select()
				.from(correctiveActions)
				.where(eq(correctiveActions.finding_id, input.findingId))
				.orderBy(desc(correctiveActions.created_at));
			return { finding, correctiveActions: actions };
		}),

	// ── Write: advance non-terminal status (state machine) ────────────────────
	updateStatus: permProcedure("audit", "write")
		.input(
			z.object({
				findingId: z.number(),
				status: z.enum(["UNDER_REVIEW", "CORRECTIVE_ACTION_REQUIRED"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);
			// Legal source states per target.
			const allowedFrom: Record<string, string[]> = {
				UNDER_REVIEW: ["OPEN"],
				CORRECTIVE_ACTION_REQUIRED: ["OPEN", "UNDER_REVIEW"],
			};
			return await ctx.db.transaction(async (tx: any) => {
				const [finding] = await tx
					.select()
					.from(auditFindings)
					.where(eq(auditFindings.id, input.findingId))
					.limit(1);
				if (!finding)
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Finding not found.",
					});
				assertTransition(finding.status, allowedFrom[input.status], "finding");
				const [row] = await tx
					.update(auditFindings)
					.set({ status: input.status, updated_at: new Date() })
					.where(
						and(
							eq(auditFindings.id, input.findingId),
							eq(auditFindings.status, finding.status),
						),
					)
					.returning();
				if (!row)
					throw new TRPCError({
						code: "CONFLICT",
						message: "Finding changed concurrently; refresh.",
					});
				await logAudit(tx, {
					userId: staffId,
					action: "AUDIT_FINDING_STATUS",
					entityType: "audit_findings",
					entityId: input.findingId,
					oldValues: { status: finding.status },
					newValues: { status: input.status },
				});
				return { findingId: row.id, status: row.status };
			});
		}),

	// ── Write: attach a corrective action to a finding ───────────────────────
	assignCorrectiveAction: permProcedure("audit", "write")
		.input(
			z.object({
				findingId: z.number(),
				description: z.string().min(1),
				assignedTo: z.number().optional(),
				dueAt: z.coerce.date().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);
			return await ctx.db.transaction(async (tx: any) => {
				const [finding] = await tx
					.select({ id: auditFindings.id, branch_id: auditFindings.branch_id })
					.from(auditFindings)
					.where(eq(auditFindings.id, input.findingId))
					.limit(1);
				if (!finding)
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Finding not found.",
					});
				const [row] = await tx
					.insert(correctiveActions)
					.values({
						finding_id: input.findingId,
						description: input.description,
						status: "PENDING",
						assigned_to: input.assignedTo ?? null,
						due_at: input.dueAt ?? null,
					})
					.returning();
				await logAudit(tx, {
					userId: staffId,
					action: "CORRECTIVE_ACTION_CREATE",
					entityType: "corrective_actions",
					entityId: row.id,
					newValues: {
						findingId: input.findingId,
						assignedTo: input.assignedTo ?? null,
					},
				});
				if (input.assignedTo)
					await notify(tx, {
						branchId: finding.branch_id,
						userId: input.assignedTo,
						type: "CORRECTIVE_ACTION_ASSIGNED",
						priority: "high",
						title: "Corrective action assigned",
						message: input.description,
						referenceType: "audit_findings",
						referenceId: input.findingId,
					});
				return { correctiveActionId: row.id };
			});
		}),

	// ── Write: mark a corrective action progressed/completed ──────────────────
	updateCorrectiveAction: permProcedure("audit", "write")
		.input(
			z.object({
				correctiveActionId: z.number(),
				status: z.enum(["IN_PROGRESS", "COMPLETED"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);
			const allowedFrom: Record<string, string[]> = {
				IN_PROGRESS: ["PENDING"],
				COMPLETED: ["PENDING", "IN_PROGRESS"],
			};
			return await ctx.db.transaction(async (tx: any) => {
				const [ca] = await tx
					.select()
					.from(correctiveActions)
					.where(eq(correctiveActions.id, input.correctiveActionId))
					.limit(1);
				if (!ca)
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Corrective action not found.",
					});
				assertTransition(
					ca.status,
					allowedFrom[input.status],
					"corrective action",
				);
				const [row] = await tx
					.update(correctiveActions)
					.set({
						status: input.status,
						completed_by:
							input.status === "COMPLETED" ? staffId : ca.completed_by,
						completed_at:
							input.status === "COMPLETED" ? new Date() : ca.completed_at,
					})
					.where(
						and(
							eq(correctiveActions.id, input.correctiveActionId),
							eq(correctiveActions.status, ca.status),
						),
					)
					.returning();
				if (!row)
					throw new TRPCError({
						code: "CONFLICT",
						message: "Action changed concurrently; refresh.",
					});
				await logAudit(tx, {
					userId: staffId,
					action: "CORRECTIVE_ACTION_STATUS",
					entityType: "corrective_actions",
					entityId: input.correctiveActionId,
					oldValues: { status: ca.status },
					newValues: { status: input.status },
				});
				return { correctiveActionId: row.id, status: row.status };
			});
		}),

	// ── Approve: resolve a finding (blocks approve-own) ───────────────────────
	resolve: permProcedure("audit", "approve")
		.input(z.object({ findingId: z.number(), note: z.string().optional() }))
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);
			return await ctx.db.transaction(async (tx: any) => {
				const [finding] = await tx
					.select()
					.from(auditFindings)
					.where(eq(auditFindings.id, input.findingId))
					.limit(1);
				if (!finding)
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Finding not found.",
					});
				// Separation of duties: cannot resolve a finding you raised.
				if (staffId && finding.raised_by && staffId === finding.raised_by)
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You cannot resolve a finding you raised yourself.",
					});
				assertTransition(
					finding.status,
					["OPEN", "UNDER_REVIEW", "CORRECTIVE_ACTION_REQUIRED"],
					"finding",
				);
				const [row] = await tx
					.update(auditFindings)
					.set({
						status: "RESOLVED",
						resolved_by: staffId,
						resolved_at: new Date(),
						updated_at: new Date(),
					})
					.where(
						and(
							eq(auditFindings.id, input.findingId),
							eq(auditFindings.status, finding.status),
						),
					)
					.returning();
				if (!row)
					throw new TRPCError({
						code: "CONFLICT",
						message: "Finding changed concurrently; refresh.",
					});
				await logAudit(tx, {
					userId: staffId,
					action: "AUDIT_FINDING_RESOLVE",
					entityType: "audit_findings",
					entityId: input.findingId,
					oldValues: { status: finding.status },
					newValues: { status: "RESOLVED", note: input.note ?? null },
				});
				return { findingId: row.id, status: row.status };
			});
		}),

	// ── Approve: verify & close a resolved finding ────────────────────────────
	verify: permProcedure("audit", "approve")
		.input(z.object({ findingId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);
			return await ctx.db.transaction(async (tx: any) => {
				const [finding] = await tx
					.select()
					.from(auditFindings)
					.where(eq(auditFindings.id, input.findingId))
					.limit(1);
				if (!finding)
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Finding not found.",
					});
				assertTransition(finding.status, ["RESOLVED"], "finding");

				// High-severity / Critical findings requiring secondary verification
				if (finding.severity === "HIGH" || finding.severity === "CRITICAL") {
					if (staffId && finding.resolved_by && staffId === finding.resolved_by) {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: "Secondary verification required: A high-severity finding must be verified by a different auditor than the one who resolved it.",
						});
					}
					if (staffId && finding.raised_by && staffId === finding.raised_by) {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: "Secondary verification required: A high-severity finding must be verified by a different auditor than the one who raised it.",
						});
					}
				}

				const [row] = await tx
					.update(auditFindings)
					.set({ status: "CLOSED", updated_at: new Date() })
					.where(
						and(
							eq(auditFindings.id, input.findingId),
							eq(auditFindings.status, "RESOLVED"),
						),
					)
					.returning();
				if (!row)
					throw new TRPCError({
						code: "CONFLICT",
						message: "Finding changed concurrently; refresh.",
					});
				await logAudit(tx, {
					userId: staffId,
					action: "AUDIT_FINDING_VERIFY",
					entityType: "audit_findings",
					entityId: input.findingId,
					oldValues: { status: "RESOLVED" },
					newValues: { status: "CLOSED" },
				});
				return { findingId: row.id, status: row.status };
			});
		}),
});
