import {
	productBarcodes,
	products,
	upcTasks,
} from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../init";
import { permProcedure } from "../util/auditor-procedures";
import { assertTransition, logAudit, notify, resolveStaffId } from "../util/audit";

/**
 * Assignee-or-privileged guard: the person a task is assigned to may progress it,
 * and so may any user holding `upc.write` (auditor+) or a superadmin. Prevents an
 * unrelated employee from touching someone else's task while still letting the
 * assigned worker (who lacks the auditor domain) start/complete their own.
 */
function assertCanWorkTask(ctxUser: any, staffId: number | null, assignedTo: number | null) {
	if (ctxUser?.isSuperadmin) return;
	if (ctxUser?.permissions?.includes("upc.write")) return;
	if (assignedTo != null && staffId != null && assignedTo === staffId) return;
	throw new TRPCError({
		code: "FORBIDDEN",
		message: "Only the assigned worker or an auditor can act on this task.",
	});
}

// Open (non-terminal) task states — used for idempotency and transition guards.
const OPEN_TASK_STATES = [
	"PENDING",
	"ASSIGNED",
	"IN_PROGRESS",
	"VERIFICATION_REQUIRED",
];

/** UPC-A check digit for a 11-digit numeric string. */
function upcCheckDigit(body11: string): number {
	let oddSum = 0;
	let evenSum = 0;
	for (let i = 0; i < 11; i++) {
		const d = Number(body11[i]);
		if (i % 2 === 0) oddSum += d;
		else evenSum += d;
	}
	const total = oddSum * 3 + evenSum;
	return (10 - (total % 10)) % 10;
}

/** Generate a candidate internal UPC-A (12 digits) with a valid check digit. */
function generateInternalUpc(): string {
	// "2" prefix is the GS1 range reserved for in-store / internal use.
	let body = "2";
	for (let i = 0; i < 10; i++) body += Math.floor(Math.random() * 10);
	return body + String(upcCheckDigit(body));
}

/** True when the string is a structurally valid 12-digit UPC-A. */
function isValidUpc(upc: string): boolean {
	if (!/^\d{12}$/.test(upc)) return false;
	return Number(upc[11]) === upcCheckDigit(upc.slice(0, 11));
}

export const upcRouter = router({
	// ── Read: inspect a product's identifiers ────────────────────────────────
	checkExisting: permProcedure("upc", "read")
		.input(z.object({ productId: z.number() }))
		.query(async ({ ctx, input }) => {
			const [product] = await ctx.db
				.select({
					id: products.id,
					name: products.name,
					sku: products.sku,
					barcode: products.barcode,
				})
				.from(products)
				.where(eq(products.id, input.productId))
				.limit(1);
			if (!product)
				throw new TRPCError({ code: "NOT_FOUND", message: "Product not found." });
			const upcRows = await ctx.db
				.select()
				.from(productBarcodes)
				.where(
					and(
						eq(productBarcodes.product_id, input.productId),
						eq(productBarcodes.barcode_type, "UPC"),
					),
				);
			return { product, upcs: upcRows, hasUpc: upcRows.length > 0 };
		}),

	// ── Read: is this UPC already used by another product? ───────────────────
	checkDuplicate: permProcedure("upc", "read")
		.input(z.object({ upc: z.string(), excludeProductId: z.number().optional() }))
		.query(async ({ ctx, input }) => {
			const rows = await ctx.db
				.select()
				.from(productBarcodes)
				.where(
					and(
						eq(productBarcodes.barcode, input.upc),
						eq(productBarcodes.barcode_type, "UPC"),
						input.excludeProductId
							? ne(productBarcodes.product_id, input.excludeProductId)
							: undefined,
					),
				);
			return { duplicate: rows.length > 0, rows };
		}),

	// ── Write: auditor generates a UPC directly (policy-allowed path) ─────────
	generate: permProcedure("upc", "write")
		.input(
			z.object({
				productId: z.number(),
				upc: z.string().optional(), // omit → auto-generate internal UPC
				source: z.enum(["internal", "external"]).default("internal"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);
			if (input.source === "external" && !input.upc)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "External source requires a UPC value.",
				});
			return await ctx.db.transaction(async (tx: any) => {
				// Choose the UPC: caller-supplied (validated) or auto-generated.
				let upc = input.upc;
				if (upc) {
					if (!isValidUpc(upc))
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Invalid UPC-A (must be 12 digits with a valid check digit).",
						});
				} else {
					// Retry a few times to dodge the (rare) random collision.
					for (let attempt = 0; attempt < 5; attempt++) {
						const cand = generateInternalUpc();
						const dup = await tx
							.select({ id: productBarcodes.id })
							.from(productBarcodes)
							.where(
								and(
									eq(productBarcodes.barcode, cand),
									eq(productBarcodes.barcode_type, "UPC"),
								),
							)
							.limit(1);
						if (dup.length === 0) {
							upc = cand;
							break;
						}
					}
					if (!upc)
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Could not allocate a unique UPC. Try again.",
						});
				}
				// Duplicate guard (application-level; the partial-unique index is the
				// DB backstop and will also reject a concurrent duplicate).
				const existing = await tx
					.select({ id: productBarcodes.id, product_id: productBarcodes.product_id })
					.from(productBarcodes)
					.where(
						and(
							eq(productBarcodes.barcode, upc),
							eq(productBarcodes.barcode_type, "UPC"),
						),
					)
					.limit(1);
				if (existing.length > 0)
					throw new TRPCError({
						code: "CONFLICT",
						message: `UPC ${upc} is already assigned to product ${existing[0].product_id}.`,
					});
				const [row] = await tx
					.insert(productBarcodes)
					.values({ product_id: input.productId, barcode: upc, barcode_type: "UPC" })
					.returning();
				await logAudit(tx, {
					userId: staffId,
					action: "UPC_GENERATE",
					entityType: "products",
					entityId: input.productId,
					newValues: { upc, source: input.source },
				});
				return { upc, barcodeId: row.id };
			});
		}),

	// ── Write: create a UPC task (idempotent — one OPEN task per product+type) ─
	assignTask: permProcedure("upc", "write")
		.input(
			z.object({
				productId: z.number(),
				branchId: z.number().optional(),
				taskType: z.enum(["generate", "verify"]).default("generate"),
				assignedTo: z.number().optional(),
				dueAt: z.coerce.date().optional(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);
			return await ctx.db.transaction(async (tx: any) => {
				// Idempotency: refuse a second open task for the same product+type.
				const open = await tx
					.select({ id: upcTasks.id, status: upcTasks.status })
					.from(upcTasks)
					.where(
						and(
							eq(upcTasks.product_id, input.productId),
							eq(upcTasks.task_type, input.taskType),
							inArray(upcTasks.status, OPEN_TASK_STATES),
						),
					)
					.limit(1);
				if (open.length > 0)
					throw new TRPCError({
						code: "CONFLICT",
						message: `An open ${input.taskType} task already exists for product ${input.productId}.`,
					});
				const [row] = await tx
					.insert(upcTasks)
					.values({
						product_id: input.productId,
						branch_id: input.branchId ?? null,
						task_type: input.taskType,
						status: input.assignedTo ? "ASSIGNED" : "PENDING",
						assigned_to: input.assignedTo ?? null,
						created_by: staffId,
						due_at: input.dueAt ?? null,
						notes: input.notes ?? null,
					})
					.returning();
				await logAudit(tx, {
					userId: staffId,
					action: "UPC_TASK_CREATE",
					entityType: "upc_tasks",
					entityId: row.id,
					newValues: { productId: input.productId, taskType: input.taskType, assignedTo: input.assignedTo ?? null },
				});
				if (input.assignedTo)
					await notify(tx, {
						branchId: input.branchId ?? null,
						userId: input.assignedTo,
						type: "UPC_TASK_ASSIGNED",
						priority: "normal",
						title: "New UPC task assigned",
						message: `You have a new ${input.taskType} task for product #${input.productId}.`,
						referenceType: "upc_tasks",
						referenceId: row.id,
					});
				return { taskId: row.id, status: row.status };
			});
		}),

	// ── Read: list UPC tasks (filtered client-side) ──────────────────────────
	listTasks: permProcedure("upc", "read")
		.input(
			z
				.object({
					status: z.string().optional(),
					assignedTo: z.number().optional(),
					branchId: z.number().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const conds = [];
			if (input?.status) conds.push(eq(upcTasks.status, input.status));
			if (input?.assignedTo) conds.push(eq(upcTasks.assigned_to, input.assignedTo));
			if (input?.branchId) conds.push(eq(upcTasks.branch_id, input.branchId));
			const rows = await ctx.db
				.select()
				.from(upcTasks)
				.where(conds.length ? and(...conds) : undefined)
				.orderBy(desc(upcTasks.created_at));
			return rows;
		}),

	// ── Write: assignee starts a task (ASSIGNED/PENDING → IN_PROGRESS) ────────
	startTask: protectedProcedure
		.input(z.object({ taskId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);
			return await ctx.db.transaction(async (tx: any) => {
				const [task] = await tx
					.select()
					.from(upcTasks)
					.where(eq(upcTasks.id, input.taskId))
					.limit(1);
				if (!task)
					throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
				assertCanWorkTask(ctx.user, staffId, task.assigned_to);
				assertTransition(task.status, ["PENDING", "ASSIGNED"], "UPC task");
				const [row] = await tx
					.update(upcTasks)
					.set({ status: "IN_PROGRESS", assigned_to: task.assigned_to ?? staffId, updated_at: new Date() })
					.where(and(eq(upcTasks.id, input.taskId), inArray(upcTasks.status, ["PENDING", "ASSIGNED"])))
					.returning();
				if (!row)
					throw new TRPCError({ code: "CONFLICT", message: "Task changed concurrently; refresh." });
				await logAudit(tx, {
					userId: staffId,
					action: "UPC_TASK_START",
					entityType: "upc_tasks",
					entityId: input.taskId,
					oldValues: { status: task.status },
					newValues: { status: "IN_PROGRESS" },
				});
				return { taskId: row.id, status: row.status };
			});
		}),

	// ── Write: assignee submits result (IN_PROGRESS → VERIFICATION_REQUIRED) ──
	completeTask: protectedProcedure
		.input(
			z.object({
				taskId: z.number(),
				upcValue: z.string(),
				upcSource: z.enum(["internal", "external"]).default("internal"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);
			if (!isValidUpc(input.upcValue))
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid UPC-A (must be 12 digits with a valid check digit).",
				});
			return await ctx.db.transaction(async (tx: any) => {
				const [task] = await tx
					.select()
					.from(upcTasks)
					.where(eq(upcTasks.id, input.taskId))
					.limit(1);
				if (!task)
					throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
				assertCanWorkTask(ctx.user, staffId, task.assigned_to);
				assertTransition(task.status, ["IN_PROGRESS", "ASSIGNED", "PENDING"], "UPC task");
				// Reject a value that already belongs to another product's active UPC.
				const dup = await tx
					.select({ id: productBarcodes.id, product_id: productBarcodes.product_id })
					.from(productBarcodes)
					.where(
						and(
							eq(productBarcodes.barcode, input.upcValue),
							eq(productBarcodes.barcode_type, "UPC"),
							ne(productBarcodes.product_id, task.product_id),
						),
					)
					.limit(1);
				if (dup.length > 0)
					throw new TRPCError({
						code: "CONFLICT",
						message: `UPC ${input.upcValue} is already assigned to product ${dup[0].product_id}.`,
					});
				const [row] = await tx
					.update(upcTasks)
					.set({
						status: "VERIFICATION_REQUIRED",
						upc_value: input.upcValue,
						upc_source: input.upcSource,
						completed_at: new Date(),
						updated_at: new Date(),
					})
					.where(and(eq(upcTasks.id, input.taskId), inArray(upcTasks.status, ["IN_PROGRESS", "ASSIGNED", "PENDING"])))
					.returning();
				if (!row)
					throw new TRPCError({ code: "CONFLICT", message: "Task changed concurrently; refresh." });
				await logAudit(tx, {
					userId: staffId,
					action: "UPC_TASK_COMPLETE",
					entityType: "upc_tasks",
					entityId: input.taskId,
					oldValues: { status: task.status },
					newValues: { status: "VERIFICATION_REQUIRED", upc: input.upcValue },
				});
				return { taskId: row.id, status: row.status };
			});
		}),

	// ── Approve: auditor verifies a submitted task (→ VERIFIED, writes UPC) ───
	verifyTask: permProcedure("upc", "approve")
		.input(z.object({ taskId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);
			return await ctx.db.transaction(async (tx: any) => {
				const [task] = await tx
					.select()
					.from(upcTasks)
					.where(eq(upcTasks.id, input.taskId))
					.limit(1);
				if (!task)
					throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
				assertTransition(task.status, ["VERIFICATION_REQUIRED"], "UPC task");
				// Separation of duties: the verifier cannot be the submitter.
				if (staffId && task.assigned_to && staffId === task.assigned_to)
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You cannot verify a UPC task you completed yourself.",
					});
				if (!task.upc_value || !isValidUpc(task.upc_value))
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Task has no valid UPC value to verify.",
					});
				// Duplicate backstop against other products' active UPCs.
				const dup = await tx
					.select({ product_id: productBarcodes.product_id })
					.from(productBarcodes)
					.where(
						and(
							eq(productBarcodes.barcode, task.upc_value),
							eq(productBarcodes.barcode_type, "UPC"),
							ne(productBarcodes.product_id, task.product_id),
						),
					)
					.limit(1);
				if (dup.length > 0)
					throw new TRPCError({
						code: "CONFLICT",
						message: `UPC ${task.upc_value} is already assigned to product ${dup[0].product_id}.`,
					});
				// Persist the UPC to product_barcodes if not already present for this product.
				const already = await tx
					.select({ id: productBarcodes.id })
					.from(productBarcodes)
					.where(
						and(
							eq(productBarcodes.barcode, task.upc_value),
							eq(productBarcodes.barcode_type, "UPC"),
							eq(productBarcodes.product_id, task.product_id),
						),
					)
					.limit(1);
				if (already.length === 0)
					await tx
						.insert(productBarcodes)
						.values({ product_id: task.product_id, barcode: task.upc_value, barcode_type: "UPC" });
				const [row] = await tx
					.update(upcTasks)
					.set({ status: "VERIFIED", verified_by: staffId, verified_at: new Date(), updated_at: new Date() })
					.where(and(eq(upcTasks.id, input.taskId), eq(upcTasks.status, "VERIFICATION_REQUIRED")))
					.returning();
				if (!row)
					throw new TRPCError({ code: "CONFLICT", message: "Task changed concurrently; refresh." });
				await logAudit(tx, {
					userId: staffId,
					action: "UPC_TASK_VERIFY",
					entityType: "upc_tasks",
					entityId: input.taskId,
					oldValues: { status: "VERIFICATION_REQUIRED" },
					newValues: { status: "VERIFIED", upc: task.upc_value },
				});
				if (task.assigned_to)
					await notify(tx, {
						branchId: task.branch_id,
						userId: task.assigned_to,
						type: "UPC_TASK_VERIFIED",
						priority: "normal",
						title: "UPC task verified",
						message: `Your UPC task #${task.id} was verified.`,
						referenceType: "upc_tasks",
						referenceId: task.id,
					});
				return { taskId: row.id, status: row.status, upc: task.upc_value };
			});
		}),

	// ── Approve: auditor rejects a submitted task (→ REJECTED) ────────────────
	rejectTask: permProcedure("upc", "approve")
		.input(z.object({ taskId: z.number(), reason: z.string().optional() }))
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);
			return await ctx.db.transaction(async (tx: any) => {
				const [task] = await tx
					.select()
					.from(upcTasks)
					.where(eq(upcTasks.id, input.taskId))
					.limit(1);
				if (!task)
					throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
				assertTransition(task.status, ["VERIFICATION_REQUIRED"], "UPC task");
				if (staffId && task.assigned_to && staffId === task.assigned_to)
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You cannot review a UPC task you completed yourself.",
					});
				const [row] = await tx
					.update(upcTasks)
					.set({
						status: "REJECTED",
						verified_by: staffId,
						verified_at: new Date(),
						notes: input.reason ?? task.notes,
						updated_at: new Date(),
					})
					.where(and(eq(upcTasks.id, input.taskId), eq(upcTasks.status, "VERIFICATION_REQUIRED")))
					.returning();
				if (!row)
					throw new TRPCError({ code: "CONFLICT", message: "Task changed concurrently; refresh." });
				await logAudit(tx, {
					userId: staffId,
					action: "UPC_TASK_REJECT",
					entityType: "upc_tasks",
					entityId: input.taskId,
					oldValues: { status: "VERIFICATION_REQUIRED" },
					newValues: { status: "REJECTED", reason: input.reason ?? null },
				});
				if (task.assigned_to)
					await notify(tx, {
						branchId: task.branch_id,
						userId: task.assigned_to,
						type: "UPC_TASK_REJECTED",
						priority: "high",
						title: "UPC task rejected",
						message: `Your UPC task #${task.id} was rejected. ${input.reason ?? ""}`.trim(),
						referenceType: "upc_tasks",
						referenceId: task.id,
					});
				return { taskId: row.id, status: row.status };
			});
		}),
});
