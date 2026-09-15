import {
	auditLogs,
	productBarcodes,
	products,
	staff,
	upcTasks,
} from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import {
	and,
	count,
	desc,
	eq,
	ilike,
	inArray,
	ne,
	or,
	sql,
} from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../init";
import {
	assertTransition,
	logAudit,
	notify,
	resolveStaffId,
} from "../util/audit";
import { permProcedure } from "../util/auditor-procedures";

/**
 * Assignee-or-privileged guard: the person a task is assigned to may progress it,
 * and so may any user holding `upc.write` (auditor+) or a superadmin. Prevents an
 * unrelated employee from touching someone else's task while still letting the
 * assigned worker (who lacks the auditor domain) start/complete their own.
 */
function assertCanWorkTask(
	ctxUser: any,
	staffId: number | null,
	assignedTo: number | null,
) {
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
	// ── 1. Summary Statistics Cards ──────────────────────────────────────────
	getStats: permProcedure("upc", "read").query(async ({ ctx }) => {
		const [totalProds] = await ctx.db
			.select({ count: count() })
			.from(products)
			.where(eq(products.is_deleted, false));

		const [prodsWithUpc] = await ctx.db
			.select({ count: count() })
			.from(productBarcodes)
			.where(eq(productBarcodes.barcode_type, "UPC"));

		const [assignedTasks] = await ctx.db
			.select({ count: count() })
			.from(upcTasks)
			.where(eq(upcTasks.status, "ASSIGNED"));

		const [inProgressTasks] = await ctx.db
			.select({ count: count() })
			.from(upcTasks)
			.where(eq(upcTasks.status, "IN_PROGRESS"));

		const [completedTasks] = await ctx.db
			.select({ count: count() })
			.from(upcTasks)
			.where(inArray(upcTasks.status, ["COMPLETED", "VERIFIED"]));

		const [pendingTasks] = await ctx.db
			.select({ count: count() })
			.from(upcTasks)
			.where(eq(upcTasks.status, "PENDING"));

		const total = Number(totalProds?.count) || 0;
		const withUpc = Number(prodsWithUpc?.count) || 0;
		const withoutUpc = Math.max(0, total - withUpc);

		return {
			totalProducts: total,
			productsWithUpc: withUpc,
			productsWithoutUpc: withoutUpc,
			tasksAssigned: Number(assignedTasks?.count) || 0,
			tasksInProgress: Number(inProgressTasks?.count) || 0,
			tasksCompleted: Number(completedTasks?.count) || 0,
			tasksPending: Number(pendingTasks?.count) || 0,
		};
	}),

	// ── 2. Product Search & Selection (Debounced, Server-side Paginated) ───────
	searchProducts: permProcedure("upc", "read")
		.input(
			z.object({
				search: z.string().optional(),
				category: z.string().optional(),
				hasUpcFilter: z.enum(["all", "with_upc", "without_upc"]).default("all"),
				page: z.number().default(1),
				pageSize: z.number().default(20),
			}),
		)
		.query(async ({ ctx, input }) => {
			const offset = (input.page - 1) * input.pageSize;
			const whereConds = [eq(products.is_deleted, false)];

			if (input.search && input.search.trim() !== "") {
				const term = `%${input.search.trim()}%`;
				whereConds.push(
					or(
						ilike(products.name, term),
						ilike(products.sku, term),
						ilike(products.barcode, term),
						ilike(products.category, term),
					)!,
				);
			}

			if (input.category && input.category !== "all") {
				whereConds.push(eq(products.category, input.category));
			}

			const upcSubquery = ctx.db
				.select({ productId: productBarcodes.product_id })
				.from(productBarcodes)
				.where(eq(productBarcodes.barcode_type, "UPC"));

			if (input.hasUpcFilter === "with_upc") {
				whereConds.push(inArray(products.id, upcSubquery));
			} else if (input.hasUpcFilter === "without_upc") {
				whereConds.push(sql`${products.id} NOT IN (${upcSubquery})`);
			}

			const [totalCount] = await ctx.db
				.select({ count: count() })
				.from(products)
				.where(and(...whereConds));

			const items = await ctx.db
				.select({
					id: products.id,
					name: products.name,
					sku: products.sku,
					category: products.category,
					price: products.price,
					unit: products.unit,
					barcode: products.barcode,
					created_at: products.created_at,
				})
				.from(products)
				.where(and(...whereConds))
				.limit(input.pageSize)
				.offset(offset)
				.orderBy(desc(products.id));

			const productIds = items.map((i) => i.id);
			const upcMap = new Map<number, { barcode: string; created_at: Date | null }>();
			const taskMap = new Map<number, { id: number; status: string; taskType: string; priority: string | null; assignedToName: string | null }>();

			if (productIds.length > 0) {
				const upcRows = await ctx.db
					.select({
						productId: productBarcodes.product_id,
						barcode: productBarcodes.barcode,
						created_at: productBarcodes.created_at,
					})
					.from(productBarcodes)
					.where(
						and(
							inArray(productBarcodes.product_id, productIds),
							eq(productBarcodes.barcode_type, "UPC"),
						),
					);

				for (const u of upcRows) {
					upcMap.set(u.productId, { barcode: u.barcode, created_at: u.created_at });
				}

				const openTasks = await ctx.db
					.select({
						id: upcTasks.id,
						productId: upcTasks.product_id,
						status: upcTasks.status,
						taskType: upcTasks.task_type,
						priority: upcTasks.priority,
						assignedToName: staff.name,
					})
					.from(upcTasks)
					.leftJoin(staff, eq(upcTasks.assigned_to, staff.id))
					.where(
						and(
							inArray(upcTasks.product_id, productIds),
							inArray(upcTasks.status, OPEN_TASK_STATES),
						),
					);

				for (const t of openTasks) {
					taskMap.set(t.productId, {
						id: t.id,
						status: t.status,
						taskType: t.taskType,
						priority: t.priority,
						assignedToName: t.assignedToName,
					});
				}
			}

			const enrichedItems = items.map((item) => {
				const upcData = upcMap.get(item.id);
				const activeTask = taskMap.get(item.id) || null;
				return {
					...item,
					upc: upcData?.barcode || (item.barcode && item.barcode.length === 12 ? item.barcode : null),
					hasUpc: Boolean(upcData || (item.barcode && item.barcode.length === 12)),
					upcCreatedAt: upcData?.created_at || null,
					activeTask,
				};
			});

			const total = Number(totalCount?.count) || 0;

			return {
				items: enrichedItems,
				total,
				page: input.page,
				pageSize: input.pageSize,
				totalPages: Math.ceil(total / input.pageSize),
			};
		}),

	// ── 3. Eligible Employees for UPC Task Assignment ─────────────────────────
	getEligibleEmployees: permProcedure("upc", "read").query(async ({ ctx }) => {
		const eligibleRoles = [
			"picker",
			"packer",
			"putter",
			"dispatcher",
			"warehouse_supervisor",
			"manager",
			"admin",
		];

		const employees = await ctx.db
			.select({
				id: staff.id,
				staff_code: staff.staff_code,
				name: staff.name,
				email: staff.email,
				phone: staff.phone,
				role: staff.role,
				department: staff.department,
				branch_id: staff.branch_id,
				status: staff.status,
			})
			.from(staff)
			.where(
				and(
					eq(staff.is_deleted, false),
					eq(staff.status, "active"),
					inArray(staff.role, eligibleRoles),
				),
			)
			.orderBy(staff.name);

		return employees;
	}),

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
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Product not found.",
				});
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
		.input(
			z.object({ upc: z.string(), excludeProductId: z.number().optional() }),
		)
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

	// ── 5. Generate UPC (Collision-Safe Unique Allocation) ─────────────────────
	generate: permProcedure("upc", "write")
		.input(
			z.object({
				productId: z.number(),
				upc: z.string().optional(),
				source: z.enum(["internal", "external"]).default("internal"),
				replaceExisting: z.boolean().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);

			return await ctx.db.transaction(async (tx: any) => {
				const [product] = await tx
					.select()
					.from(products)
					.where(eq(products.id, input.productId))
					.limit(1);

				if (!product) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Product not found.",
					});
				}

				const existingUpcs = await tx
					.select()
					.from(productBarcodes)
					.where(
						and(
							eq(productBarcodes.product_id, input.productId),
							eq(productBarcodes.barcode_type, "UPC"),
						),
					);

				if (existingUpcs.length > 0 && !input.replaceExisting) {
					throw new TRPCError({
						code: "CONFLICT",
						message: `Product "${product.name}" already has an active UPC (${existingUpcs[0].barcode}). Explicit confirmation required to replace it.`,
					});
				}

				let upc = input.upc;
				if (upc) {
					if (!isValidUpc(upc)) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Invalid UPC-A (must be exactly 12 digits with a valid check digit).",
						});
					}
				} else {
					for (let attempt = 0; attempt < 10; attempt++) {
						const candidate = generateInternalUpc();
						const dup = await tx
							.select({ id: productBarcodes.id })
							.from(productBarcodes)
							.where(
								and(
									eq(productBarcodes.barcode, candidate),
									eq(productBarcodes.barcode_type, "UPC"),
								),
							)
							.limit(1);

						if (dup.length === 0) {
							upc = candidate;
							break;
						}
					}

					if (!upc) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Failed to generate unique UPC after multiple attempts. Please try again.",
						});
					}
				}

				const collision = await tx
					.select({
						id: productBarcodes.id,
						productId: productBarcodes.product_id,
					})
					.from(productBarcodes)
					.where(
						and(
							eq(productBarcodes.barcode, upc),
							eq(productBarcodes.barcode_type, "UPC"),
							ne(productBarcodes.product_id, input.productId),
						),
					)
					.limit(1);

				if (collision.length > 0) {
					throw new TRPCError({
						code: "CONFLICT",
						message: `UPC ${upc} is already allocated to product #${collision[0].productId}.`,
					});
				}

				let barcodeRowId: number;
				if (existingUpcs.length > 0) {
					const [updated] = await tx
						.update(productBarcodes)
						.set({
							barcode: upc,
							created_at: new Date(),
						})
						.where(eq(productBarcodes.id, existingUpcs[0].id))
						.returning();
					barcodeRowId = updated.id;
				} else {
					const [inserted] = await tx
						.insert(productBarcodes)
						.values({
							product_id: input.productId,
							barcode: upc,
							barcode_type: "UPC",
						})
						.returning();
					barcodeRowId = inserted.id;
				}

				await tx
					.update(products)
					.set({
						barcode: upc,
						updated_at: new Date(),
					})
					.where(eq(products.id, input.productId));

				await logAudit(tx, {
					userId: staffId,
					action: existingUpcs.length > 0 ? "UPC_REPLACE" : "UPC_GENERATE",
					entityType: "products",
					entityId: input.productId,
					oldValues: existingUpcs[0] ? { upc: existingUpcs[0].barcode } : null,
					newValues: { upc, source: input.source, barcodeId: barcodeRowId },
				});

				return {
					upc,
					barcodeId: barcodeRowId,
					product: {
						id: product.id,
						name: product.name,
						sku: product.sku,
						category: product.category,
					},
					replaced: existingUpcs.length > 0,
				};
			});
		}),

	// ── 6. Bulk UPC Generation ───────────────────────────────────────────────
	bulkGenerate: permProcedure("upc", "write")
		.input(
			z.object({
				productIds: z.array(z.number()).min(1),
				forceReplace: z.boolean().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);

			return await ctx.db.transaction(async (tx: any) => {
				const prods = await tx
					.select({
						id: products.id,
						name: products.name,
						sku: products.sku,
						barcode: products.barcode,
					})
					.from(products)
					.where(inArray(products.id, input.productIds));

				const existingUpcs = await tx
					.select()
					.from(productBarcodes)
					.where(
						and(
							inArray(productBarcodes.product_id, input.productIds),
							eq(productBarcodes.barcode_type, "UPC"),
						),
					);

				const existingMap = new Map(existingUpcs.map((u: any) => [u.product_id, u]));
				const generated: { productId: number; upc: string }[] = [];
				let skippedCount = 0;

				for (const p of prods) {
					const hasExisting = existingMap.has(p.id);
					if (hasExisting && !input.forceReplace) {
						skippedCount++;
						continue;
					}

					let upc = "";
					for (let attempt = 0; attempt < 10; attempt++) {
						const candidate = generateInternalUpc();
						const dup = await tx
							.select({ id: productBarcodes.id })
							.from(productBarcodes)
							.where(
								and(
									eq(productBarcodes.barcode, candidate),
									eq(productBarcodes.barcode_type, "UPC"),
								),
							)
							.limit(1);

						if (dup.length === 0) {
							upc = candidate;
							break;
						}
					}

					if (!upc) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: `Failed to generate unique UPC for product #${p.id}.`,
						});
					}

					if (hasExisting) {
						const oldRow: any = existingMap.get(p.id);
						await tx
							.update(productBarcodes)
							.set({ barcode: upc, created_at: new Date() })
							.where(eq(productBarcodes.id, oldRow.id));
					} else {
						await tx.insert(productBarcodes).values({
							product_id: p.id,
							barcode: upc,
							barcode_type: "UPC",
						});
					}

					await tx
						.update(products)
						.set({ barcode: upc, updated_at: new Date() })
						.where(eq(products.id, p.id));

					await logAudit(tx, {
						userId: staffId,
						action: hasExisting ? "UPC_BULK_REPLACE" : "UPC_BULK_GENERATE",
						entityType: "products",
						entityId: p.id,
						newValues: { upc },
					});

					generated.push({ productId: p.id, upc });
				}

				return {
					generatedCount: generated.length,
					skippedCount,
					generated,
				};
			});
		}),

	// ── 7. Create & Assign UPC Task ───────────────────────────────────────────
	createTask: permProcedure("upc", "write")
		.input(
			z.object({
				productId: z.number(),
				branchId: z.number().optional(),
				taskType: z.enum(["labeling", "placement", "verification", "generate"]).default("labeling"),
				assignedTo: z.number().optional(),
				priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
				dueAt: z.coerce.date().optional(),
				instructions: z.string().optional(),
				upcValue: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);

			return await ctx.db.transaction(async (tx: any) => {
				const [product] = await tx
					.select()
					.from(products)
					.where(eq(products.id, input.productId))
					.limit(1);

				if (!product) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Product not found.",
					});
				}

				let assignedStaffName = "";
				if (input.assignedTo) {
					const [staffMember] = await tx
						.select()
						.from(staff)
						.where(and(eq(staff.id, input.assignedTo), eq(staff.status, "active")))
						.limit(1);

					if (!staffMember) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Selected employee is not an active staff member.",
						});
					}
					assignedStaffName = staffMember.name;
				}

				const open = await tx
					.select({ id: upcTasks.id, status: upcTasks.status })
					.from(upcTasks)
					.where(
						and(
							eq(upcTasks.product_id, input.productId),
							eq(upcTasks.task_type, input.taskType),
							inArray(upcTasks.status, [
								"PENDING",
								"ASSIGNED",
								"IN_PROGRESS",
								"VERIFICATION_REQUIRED",
							]),
						),
					);

				if (open.length > 0) {
					throw new TRPCError({
						code: "CONFLICT",
						message: `An open "${input.taskType}" task (#${open[0].id}) already exists for product "${product.name}".`,
					});
				}

				let upcVal = input.upcValue;
				if (!upcVal) {
					const [upcRow] = await tx
						.select({ barcode: productBarcodes.barcode })
						.from(productBarcodes)
						.where(
							and(
								eq(productBarcodes.product_id, input.productId),
								eq(productBarcodes.barcode_type, "UPC"),
							),
						)
						.limit(1);
					upcVal = upcRow?.barcode || product.barcode || null;
				}

				const [task] = await tx
					.insert(upcTasks)
					.values({
						product_id: input.productId,
						branch_id: input.branchId ?? null,
						task_type: input.taskType,
						status: input.assignedTo ? "ASSIGNED" : "PENDING",
						assigned_to: input.assignedTo ?? null,
						created_by: staffId,
						priority: input.priority,
						instructions: input.instructions ?? null,
						notes: input.instructions ?? null,
						upc_value: upcVal,
						upc_source: "internal",
						due_at: input.dueAt ?? null,
					})
					.returning();

				await logAudit(tx, {
					userId: staffId,
					action: "UPC_TASK_CREATE",
					entityType: "upc_tasks",
					entityId: task.id,
					newValues: {
						productId: input.productId,
						taskType: input.taskType,
						assignedTo: input.assignedTo ?? null,
						priority: input.priority,
						upc: upcVal,
					},
				});

				if (input.assignedTo) {
					await notify(tx, {
						branchId: input.branchId ?? null,
						userId: input.assignedTo,
						type: "UPC_TASK_ASSIGNED",
						priority: input.priority === "URGENT" ? "critical" : input.priority === "HIGH" ? "high" : "normal",
						title: `UPC Task Assigned: ${product.name}`,
						message: `You have been assigned a ${input.taskType} task for ${product.name} (SKU: ${product.sku || "N/A"}).`,
						referenceType: "upc_tasks",
						referenceId: task.id,
					});
				}

				return {
					taskId: task.id,
					status: task.status,
					productName: product.name,
					assignedToName: assignedStaffName,
				};
			});
		}),

	// Alias for backwards compatibility
	assignTask: permProcedure("upc", "write")
		.input(
			z.object({
				productId: z.number(),
				branchId: z.number().optional(),
				taskType: z.enum(["labeling", "placement", "verification", "generate"]).default("labeling"),
				assignedTo: z.number().optional(),
				priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
				dueAt: z.coerce.date().optional(),
				notes: z.string().optional(),
				instructions: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);
			const open = await ctx.db
				.select({ id: upcTasks.id })
				.from(upcTasks)
				.where(
					and(
						eq(upcTasks.product_id, input.productId),
						eq(upcTasks.task_type, input.taskType),
						inArray(upcTasks.status, [
							"PENDING",
							"ASSIGNED",
							"IN_PROGRESS",
							"VERIFICATION_REQUIRED",
						]),
					),
				);

			if (open.length > 0) {
				throw new TRPCError({
					code: "CONFLICT",
					message: `An open "${input.taskType}" task (#${open[0].id}) already exists for product #${input.productId}.`,
				});
			}

			const [task] = await ctx.db
				.insert(upcTasks)
				.values({
					product_id: input.productId,
					branch_id: input.branchId ?? null,
					task_type: input.taskType,
					status: input.assignedTo ? "ASSIGNED" : "PENDING",
					assigned_to: input.assignedTo ?? null,
					created_by: staffId,
					priority: input.priority,
					instructions: input.instructions || input.notes || null,
					notes: input.notes || input.instructions || null,
					due_at: input.dueAt ?? null,
				})
				.returning();
			return { taskId: task.id, status: task.status };
		}),

	// ── 8. Bulk Assign Tasks ──────────────────────────────────────────────────
	bulkAssignTasks: permProcedure("upc", "write")
		.input(
			z.object({
				productIds: z.array(z.number()).min(1),
				assignedTo: z.number(),
				taskType: z.enum(["labeling", "placement", "verification", "generate"]).default("labeling"),
				priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
				dueAt: z.coerce.date().optional(),
				instructions: z.string().optional(),
				branchId: z.number().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);

			return await ctx.db.transaction(async (tx: any) => {
				const [staffMember] = await tx
					.select()
					.from(staff)
					.where(and(eq(staff.id, input.assignedTo), eq(staff.status, "active")))
					.limit(1);

				if (!staffMember) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Selected employee is not an active staff member.",
					});
				}

				let createdCount = 0;

				for (const pid of input.productIds) {
					const open = await tx
						.select({ id: upcTasks.id })
						.from(upcTasks)
						.where(
							and(
								eq(upcTasks.product_id, pid),
								eq(upcTasks.task_type, input.taskType),
								inArray(upcTasks.status, OPEN_TASK_STATES),
							),
						)
						.limit(1);

					if (open.length > 0) continue;

					const [upcRow] = await tx
						.select({ barcode: productBarcodes.barcode })
						.from(productBarcodes)
						.where(
							and(
								eq(productBarcodes.product_id, pid),
								eq(productBarcodes.barcode_type, "UPC"),
							),
						)
						.limit(1);

					const [task] = await tx
						.insert(upcTasks)
						.values({
							product_id: pid,
							branch_id: input.branchId ?? null,
							task_type: input.taskType,
							status: "ASSIGNED",
							assigned_to: input.assignedTo,
							created_by: staffId,
							priority: input.priority,
							instructions: input.instructions ?? null,
							notes: input.instructions ?? null,
							upc_value: upcRow?.barcode ?? null,
							due_at: input.dueAt ?? null,
						})
						.returning();

					await logAudit(tx, {
						userId: staffId,
						action: "UPC_TASK_BULK_ASSIGN",
						entityType: "upc_tasks",
						entityId: task.id,
						newValues: { productId: pid, assignedTo: input.assignedTo },
					});

					createdCount++;
				}

				if (createdCount > 0) {
					await notify(tx, {
						branchId: input.branchId ?? null,
						userId: input.assignedTo,
						type: "UPC_TASK_ASSIGNED",
						priority: input.priority === "URGENT" ? "critical" : "normal",
						title: `Bulk UPC Tasks Assigned (${createdCount} items)`,
						message: `You have been assigned ${createdCount} UPC tasks.`,
						referenceType: "upc_tasks",
					});
				}

				return { createdCount };
			});
		}),

	// ── 9. List UPC Tasks (Full Filter, Search & Pagination) ──────────────────
	listTasks: permProcedure("upc", "read")
		.input(
			z.object({
				status: z.string().optional(),
				assignedTo: z.number().optional(),
				priority: z.string().optional(),
				search: z.string().optional(),
				page: z.number().default(1),
				pageSize: z.number().default(20),
			}),
		)
		.query(async ({ ctx, input }) => {
			const offset = (input.page - 1) * input.pageSize;
			const conds = [];

			if (input.status && input.status !== "ALL") {
				conds.push(eq(upcTasks.status, input.status));
			}

			if (input.assignedTo) {
				conds.push(eq(upcTasks.assigned_to, input.assignedTo));
			}

			if (input.priority && input.priority !== "ALL") {
				conds.push(eq(upcTasks.priority, input.priority));
			}

			if (input.search && input.search.trim() !== "") {
				const term = `%${input.search.trim()}%`;
				conds.push(
					or(
						ilike(products.name, term),
						ilike(products.sku, term),
						ilike(upcTasks.upc_value, term),
						ilike(staff.name, term),
					)!,
				);
			}

			const whereClause = conds.length > 0 ? and(...conds) : undefined;

			const [totalCount] = await ctx.db
				.select({ count: count() })
				.from(upcTasks)
				.leftJoin(products, eq(upcTasks.product_id, products.id))
				.leftJoin(staff, eq(upcTasks.assigned_to, staff.id))
				.where(whereClause);

			const rows = await ctx.db
				.select({
					id: upcTasks.id,
					product_id: upcTasks.product_id,
					product_name: products.name,
					sku: products.sku,
					category: products.category,
					task_type: upcTasks.task_type,
					status: upcTasks.status,
					priority: upcTasks.priority,
					upc_value: upcTasks.upc_value,
					assigned_to: upcTasks.assigned_to,
					assigned_to_name: staff.name,
					assigned_to_role: staff.role,
					instructions: upcTasks.instructions,
					notes: upcTasks.notes,
					due_at: upcTasks.due_at,
					created_at: upcTasks.created_at,
					completed_at: upcTasks.completed_at,
					verified_at: upcTasks.verified_at,
				})
				.from(upcTasks)
				.leftJoin(products, eq(upcTasks.product_id, products.id))
				.leftJoin(staff, eq(upcTasks.assigned_to, staff.id))
				.where(whereClause)
				.limit(input.pageSize)
				.offset(offset)
				.orderBy(desc(upcTasks.created_at));

			const total = Number(totalCount?.count) || 0;

			return {
				tasks: rows,
				total,
				page: input.page,
				pageSize: input.pageSize,
				totalPages: Math.ceil(total / input.pageSize),
			};
		}),

	// ── 10. UPC History (All Generated Barcodes with Product Context) ─────────
	listHistory: permProcedure("upc", "read")
		.input(
			z.object({
				search: z.string().optional(),
				page: z.number().default(1),
				pageSize: z.number().default(20),
			}),
		)
		.query(async ({ ctx, input }) => {
			const offset = (input.page - 1) * input.pageSize;
			const conds = [eq(productBarcodes.barcode_type, "UPC")];

			if (input.search && input.search.trim() !== "") {
				const term = `%${input.search.trim()}%`;
				conds.push(
					or(
						ilike(products.name, term),
						ilike(products.sku, term),
						ilike(productBarcodes.barcode, term),
						ilike(products.category, term),
					)!,
				);
			}

			const [totalCount] = await ctx.db
				.select({ count: count() })
				.from(productBarcodes)
				.leftJoin(products, eq(productBarcodes.product_id, products.id))
				.where(and(...conds));

			const rows = await ctx.db
				.select({
					id: productBarcodes.id,
					product_id: productBarcodes.product_id,
					product_name: products.name,
					sku: products.sku,
					category: products.category,
					barcode: productBarcodes.barcode,
					barcode_type: productBarcodes.barcode_type,
					created_at: productBarcodes.created_at,
				})
				.from(productBarcodes)
				.leftJoin(products, eq(productBarcodes.product_id, products.id))
				.where(and(...conds))
				.limit(input.pageSize)
				.offset(offset)
				.orderBy(desc(productBarcodes.created_at));

			const total = Number(totalCount?.count) || 0;

			return {
				history: rows,
				total,
				page: input.page,
				pageSize: input.pageSize,
				totalPages: Math.ceil(total / input.pageSize),
			};
		}),

	// ── 11. Task Details with History & Audit Trail ───────────────────────────
	getTaskDetails: permProcedure("upc", "read")
		.input(z.object({ taskId: z.number() }))
		.query(async ({ ctx, input }) => {
			const [task] = await ctx.db
				.select({
					id: upcTasks.id,
					product_id: upcTasks.product_id,
					branch_id: upcTasks.branch_id,
					task_type: upcTasks.task_type,
					status: upcTasks.status,
					priority: upcTasks.priority,
					upc_value: upcTasks.upc_value,
					upc_source: upcTasks.upc_source,
					assigned_to: upcTasks.assigned_to,
					created_by: upcTasks.created_by,
					verified_by: upcTasks.verified_by,
					instructions: upcTasks.instructions,
					notes: upcTasks.notes,
					due_at: upcTasks.due_at,
					created_at: upcTasks.created_at,
					updated_at: upcTasks.updated_at,
					completed_at: upcTasks.completed_at,
					verified_at: upcTasks.verified_at,
					product_name: products.name,
					sku: products.sku,
					category: products.category,
					price: products.price,
				})
				.from(upcTasks)
				.leftJoin(products, eq(upcTasks.product_id, products.id))
				.where(eq(upcTasks.id, input.taskId))
				.limit(1);

			if (!task) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Task not found.",
				});
			}

			let assignedStaff = null;
			if (task.assigned_to) {
				const [s] = await ctx.db
					.select()
					.from(staff)
					.where(eq(staff.id, task.assigned_to))
					.limit(1);
				assignedStaff = s || null;
			}

			let createdByStaff = null;
			if (task.created_by) {
				const [c] = await ctx.db
					.select()
					.from(staff)
					.where(eq(staff.id, task.created_by))
					.limit(1);
				createdByStaff = c || null;
			}

			const taskAuditLogs = await ctx.db
				.select()
				.from(auditLogs)
				.where(
					and(
						eq(auditLogs.entity_type, "upc_tasks"),
						eq(auditLogs.entity_id, input.taskId),
					),
				)
				.orderBy(desc(auditLogs.timestamp))
				.limit(20);

			return {
				task,
				assignedStaff,
				createdByStaff,
				auditLogs: taskAuditLogs,
			};
		}),

	// ── 12. Reassign Task ─────────────────────────────────────────────────────
	reassignTask: permProcedure("upc", "write")
		.input(
			z.object({
				taskId: z.number(),
				newAssignedTo: z.number(),
				instructions: z.string().optional(),
				priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);

			return await ctx.db.transaction(async (tx: any) => {
				const [task] = await tx
					.select()
					.from(upcTasks)
					.where(eq(upcTasks.id, input.taskId))
					.limit(1);

				if (!task) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Task not found.",
					});
				}

				if (task.status === "COMPLETED" || task.status === "VERIFIED" || task.status === "CANCELLED") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Cannot reassign a task that is ${task.status}.`,
					});
				}

				const [targetStaff] = await tx
					.select()
					.from(staff)
					.where(and(eq(staff.id, input.newAssignedTo), eq(staff.status, "active")))
					.limit(1);

				if (!targetStaff) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Target employee is not an active staff member.",
					});
				}

				const [updated] = await tx
					.update(upcTasks)
					.set({
						assigned_to: input.newAssignedTo,
						status: "ASSIGNED",
						instructions: input.instructions ?? task.instructions,
						priority: input.priority ?? task.priority,
						updated_at: new Date(),
					})
					.where(eq(upcTasks.id, input.taskId))
					.returning();

				await logAudit(tx, {
					userId: staffId,
					action: "UPC_TASK_REASSIGN",
					entityType: "upc_tasks",
					entityId: input.taskId,
					oldValues: { assignedTo: task.assigned_to },
					newValues: { assignedTo: input.newAssignedTo },
				});

				await notify(tx, {
					branchId: task.branch_id,
					userId: input.newAssignedTo,
					type: "UPC_TASK_ASSIGNED",
					priority: "normal",
					title: "UPC Task Reassigned to You",
					message: `UPC task #${task.id} has been reassigned to you.`,
					referenceType: "upc_tasks",
					referenceId: task.id,
				});

				return { taskId: updated.id, status: updated.status, assignedToName: targetStaff.name };
			});
		}),

	// ── 13. Cancel Task ───────────────────────────────────────────────────────
	cancelTask: permProcedure("upc", "write")
		.input(
			z.object({
				taskId: z.number(),
				reason: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);

			return await ctx.db.transaction(async (tx: any) => {
				const [task] = await tx
					.select()
					.from(upcTasks)
					.where(eq(upcTasks.id, input.taskId))
					.limit(1);

				if (!task) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Task not found.",
					});
				}

				if (task.status === "COMPLETED" || task.status === "VERIFIED") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Cannot cancel an already completed or verified task.",
					});
				}

				const [updated] = await tx
					.update(upcTasks)
					.set({
						status: "CANCELLED",
						notes: input.reason ? `Cancelled: ${input.reason}` : task.notes,
						updated_at: new Date(),
					})
					.where(eq(upcTasks.id, input.taskId))
					.returning();

				await logAudit(tx, {
					userId: staffId,
					action: "UPC_TASK_CANCEL",
					entityType: "upc_tasks",
					entityId: input.taskId,
					oldValues: { status: task.status },
					newValues: { status: "CANCELLED", reason: input.reason ?? null },
				});

				return { taskId: updated.id, status: updated.status };
			});
		}),

	// ── 14. Start Task (Assignee or Supervisor) ───────────────────────────────
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

				if (!task) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Task not found.",
					});
				}

				assertCanWorkTask(ctx.user, staffId, task.assigned_to);
				assertTransition(task.status, ["PENDING", "ASSIGNED"], "UPC task");

				const [row] = await tx
					.update(upcTasks)
					.set({
						status: "IN_PROGRESS",
						assigned_to: task.assigned_to ?? staffId,
						updated_at: new Date(),
					})
					.where(eq(upcTasks.id, input.taskId))
					.returning();

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

	// ── 15. Complete Task (Assignee Workflow Completion) ──────────────────────
	completeTask: protectedProcedure
		.input(
			z.object({
				taskId: z.number(),
				upcValue: z.string().optional(),
				completionNotes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);

			return await ctx.db.transaction(async (tx: any) => {
				const [task] = await tx
					.select()
					.from(upcTasks)
					.where(eq(upcTasks.id, input.taskId))
					.limit(1);

				if (!task) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Task not found.",
					});
				}

				assertCanWorkTask(ctx.user, staffId, task.assigned_to);
				assertTransition(task.status, ["IN_PROGRESS", "ASSIGNED", "PENDING"], "UPC task");

				const finalUpc = input.upcValue || task.upc_value;

				if (finalUpc && !isValidUpc(finalUpc)) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid UPC-A code format.",
					});
				}

				if (finalUpc) {
					const existing = await tx
						.select({ id: productBarcodes.id })
						.from(productBarcodes)
						.where(
							and(
								eq(productBarcodes.product_id, task.product_id),
								eq(productBarcodes.barcode_type, "UPC"),
							),
						)
						.limit(1);

					if (existing.length === 0) {
						await tx.insert(productBarcodes).values({
							product_id: task.product_id,
							barcode: finalUpc,
							barcode_type: "UPC",
						});
						await tx
							.update(products)
							.set({ barcode: finalUpc, updated_at: new Date() })
							.where(eq(products.id, task.product_id));
					}
				}

				const [row] = await tx
					.update(upcTasks)
					.set({
						status: "COMPLETED",
						upc_value: finalUpc,
						notes: input.completionNotes ?? task.notes,
						completed_at: new Date(),
						updated_at: new Date(),
					})
					.where(eq(upcTasks.id, input.taskId))
					.returning();

				await logAudit(tx, {
					userId: staffId,
					action: "UPC_TASK_COMPLETE",
					entityType: "upc_tasks",
					entityId: input.taskId,
					oldValues: { status: task.status },
					newValues: { status: "COMPLETED", notes: input.completionNotes ?? null },
				});

				if (task.created_by) {
					await notify(tx, {
						branchId: task.branch_id,
						userId: task.created_by,
						type: "UPC_TASK_COMPLETED",
						priority: "normal",
						title: "UPC Task Completed",
						message: `UPC Task #${task.id} has been marked completed.`,
						referenceType: "upc_tasks",
						referenceId: task.id,
					});
				}

				return { taskId: row.id, status: row.status };
			});
		}),

	// ── 16. Verify Task (Auditor / Supervisor Quality Gate) ───────────────────
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

				if (!task) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Task not found.",
					});
				}

				assertTransition(task.status, ["COMPLETED", "VERIFICATION_REQUIRED"], "UPC task");

				if (staffId && task.assigned_to === staffId) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Separation of duties: you cannot verify a task you completed or were assigned to.",
					});
				}

				const [row] = await tx
					.update(upcTasks)
					.set({
						status: "VERIFIED",
						verified_by: staffId,
						verified_at: new Date(),
						updated_at: new Date(),
					})
					.where(eq(upcTasks.id, input.taskId))
					.returning();

				await logAudit(tx, {
					userId: staffId,
					action: "UPC_TASK_VERIFY",
					entityType: "upc_tasks",
					entityId: input.taskId,
					oldValues: { status: task.status },
					newValues: { status: "VERIFIED" },
				});

				return { taskId: row.id, status: row.status };
			});
		}),

	// ── 17. Reject Task (Auditor / Supervisor Quality Gate) ───────────────────
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

				if (!task) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Task not found.",
					});
				}

				assertTransition(task.status, ["COMPLETED", "VERIFICATION_REQUIRED"], "UPC task");

				const [row] = await tx
					.update(upcTasks)
					.set({
						status: "REJECTED",
						verified_by: staffId,
						verified_at: new Date(),
						notes: input.reason ?? task.notes,
						updated_at: new Date(),
					})
					.where(eq(upcTasks.id, input.taskId))
					.returning();

				await logAudit(tx, {
					userId: staffId,
					action: "UPC_TASK_REJECT",
					entityType: "upc_tasks",
					entityId: input.taskId,
					oldValues: { status: task.status },
					newValues: { status: "REJECTED", reason: input.reason ?? null },
				});

				return { taskId: row.id, status: row.status };
			});
		}),
});
