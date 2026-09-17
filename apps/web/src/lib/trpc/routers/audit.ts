import {
	auditDiscrepancies,
	branches,
	branchInventory,
	missingStockQueue,
	products,
	staff,
	stockAdjustments,
	stockAuditItems,
	stockAudits,
	stockLedger,
} from "@/lib/db/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { router } from "@/lib/trpc/init";
import { logAudit, resolveStaffId } from "../util/audit";
import { permProcedure } from "../util/auditor-procedures";

export const auditRouter = router({
	// ── Summary KPI Stats for Auditor Dashboard ──────────────────────────────
	getDashboardStats: permProcedure("inventory_audit", "read")
		.input(
			z
				.object({
					branchId: z.number().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const branchCond = input?.branchId ? eq(stockAudits.branch_id, input.branchId) : undefined;

			const allAudits = await db
				.select({
					id: stockAudits.id,
					status: stockAudits.status,
				})
				.from(stockAudits)
				.where(branchCond);

			const pendingAudits = allAudits.filter(
				(a) => a.status === "planned" || a.status === "pending",
			).length;
			const inProgress = allAudits.filter(
				(a) => a.status === "in_progress",
			).length;
			const completedAudits = allAudits.filter(
				(a) => a.status === "completed" || a.status === "approved",
			).length;

			const discrepancies = await db
				.select({
					id: auditDiscrepancies.id,
					status: auditDiscrepancies.resolution_status,
				})
				.from(auditDiscrepancies);

			const varianceFound = discrepancies.filter(
				(d) => d.status === "pending",
			).length;

			// Accuracy rate
			const auditItemStats = await db
				.select({
					status: stockAuditItems.status,
				})
				.from(stockAuditItems);

			const totalItemsCounted = auditItemStats.length;
			const matchedItems = auditItemStats.filter((i) => i.status === "match").length;
			const accuracyRate = totalItemsCounted > 0
				? Math.round((matchedItems / totalItemsCounted) * 100)
				: 100;

			return {
				pendingAudits,
				inProgress,
				completedAudits,
				varianceFound,
				totalAudits: allAudits.length,
				accuracyRate,
				criticalVariances: discrepancies.filter((d) => d.status === "pending").length,
			};
		}),

	// ── List Stock Audits with progress and discrepancy summaries ───────────
	listAudits: permProcedure("inventory_audit", "read")
		.input(
			z
				.object({
					status: z.string().optional(),
					branchId: z.number().optional(),
					auditorId: z.number().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const rows = await db
				.select()
				.from(stockAudits)
				.orderBy(desc(stockAudits.created_at));

			const filtered = rows.filter((r) => {
				if (input?.status && r.status !== input.status) return false;
				if (input?.branchId && r.branch_id !== input.branchId) return false;
				if (input?.auditorId && r.auditor_id !== input.auditorId) return false;
				return true;
			});

			if (filtered.length === 0) return [];

			const branchIds = Array.from(new Set(filtered.map((a) => a.branch_id).filter(Boolean)));
			const auditorIds = Array.from(new Set(filtered.map((a) => a.auditor_id).filter(Boolean)));
			const auditIds = filtered.map((a) => a.id);

			let branchMap = new Map();
			if (branchIds.length > 0) {
				const bList = await db.select().from(branches).where(inArray(branches.id, branchIds));
				branchMap = new Map(bList.map((b) => [b.id, b]));
			}

			let auditorMap = new Map();
			if (auditorIds.length > 0) {
				const sList = await db.select().from(staff).where(inArray(staff.id, auditorIds));
				auditorMap = new Map(sList.map((s) => [s.id, s]));
			}

			let itemsMap = new Map<number, any[]>();
			if (auditIds.length > 0) {
				const allItems = await db.select().from(stockAuditItems).where(inArray(stockAuditItems.audit_id, auditIds));
				for (const it of allItems) {
					const list = itemsMap.get(it.audit_id) || [];
					list.push(it);
					itemsMap.set(it.audit_id, list);
				}
			}

			return filtered.map((audit) => {
				const items = itemsMap.get(audit.id) || [];
				const totalItemsCount = items.length;
				const countedItemsCount = items.filter((i) => i.counted_qty !== null).length;
				const matchedItemsCount = items.filter((i) => i.status === "match").length;
				const varianceItemsCount = items.filter(
					(i) => i.status === "mismatch" || (i.counted_qty !== null && i.counted_qty !== i.expected_qty),
				).length;

				return {
					...audit,
					branch: branchMap.get(audit.branch_id) || null,
					auditor: auditorMap.get(audit.auditor_id) || null,
					totalItemsCount,
					countedItemsCount,
					matchedItemsCount,
					varianceItemsCount,
				};
			});
		}),

	// ── Single Audit with full details and counted items ─────────────────────
	getAudit: permProcedure("inventory_audit", "read")
		.input(z.object({ auditId: z.number() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const [audit] = await db
				.select()
				.from(stockAudits)
				.where(eq(stockAudits.id, input.auditId))
				.limit(1);

			if (!audit) {
				return { audit: null, items: [] };
			}

			let branch = null;
			if (audit.branch_id) {
				const [b] = await db
					.select()
					.from(branches)
					.where(eq(branches.id, audit.branch_id))
					.limit(1);
				branch = b ?? null;
			}

			let auditor = null;
			if (audit.auditor_id) {
				const [st] = await db
					.select()
					.from(staff)
					.where(eq(staff.id, audit.auditor_id))
					.limit(1);
				auditor = st ?? null;
			}

			const rawItems = await db
				.select()
				.from(stockAuditItems)
				.where(eq(stockAuditItems.audit_id, input.auditId))
				.orderBy(stockAuditItems.id);

			const productIds = rawItems.map((i) => i.product_id).filter(Boolean);
			let productMap = new Map();
			if (productIds.length > 0) {
				const prods = await db
					.select()
					.from(products)
					.where(inArray(products.id, productIds));
				productMap = new Map(prods.map((p) => [p.id, p]));
			}

			const items = rawItems.map((item) => {
				const prod = productMap.get(item.product_id);
				const expected = item.expected_qty ?? 0;
				const counted = item.counted_qty !== null ? Number(item.counted_qty) : null;
				const variance = counted !== null ? counted - expected : null;

				return {
					...item,
					product: prod || null,
					location: null,
					variance,
					status: item.status || "pending",
					discrepancy_reason: item.discrepancy_reason || "",
					remarks: item.remarks || "",
				};
			});

			return {
				audit: {
					...audit,
					branch,
					auditor,
				},
				items,
			};
		}),

	// ── Manager: Create Inventory Audit Task with Snapshot Expected Quantities ──
	createAuditTask: permProcedure("inventory_audit", "write")
		.input(
			z.object({
				branch_id: z.number(),
				auditor_id: z.number().optional(),
				audit_type: z.string().optional().default("cycle_count"),
				location_name: z.string().optional(),
				due_date: z.string().or(z.date()).optional(),
				notes: z.string().optional(),
				product_ids: z.array(z.number()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);

			let targetProducts: Array<{ id: number; in_stock: number }> = [];

			if (input.product_ids && input.product_ids.length > 0) {
				const prods = await db
					.select()
					.from(products)
					.where(inArray(products.id, input.product_ids));
				targetProducts = prods.map((p) => ({
					id: p.id,
					in_stock: Number((p as any).in_stock ?? 0),
				}));
			} else {
				const allProds = await db
					.select()
					.from(products)
					.limit(50);
				targetProducts = allProds.map((p) => ({
					id: p.id,
					in_stock: Number((p as any).in_stock ?? 0),
				}));
			}

			const [newAudit] = await db
				.insert(stockAudits)
				.values({
					branch_id: input.branch_id,
					auditor_id: input.auditor_id ?? staffId ?? 1,
					status: "planned",
					audit_type: input.audit_type,
					location_name: input.location_name,
					due_date: input.due_date ? new Date(input.due_date) : undefined,
					notes: input.notes,
				})
				.returning();

			if (targetProducts.length > 0) {
				const auditItemsToInsert = targetProducts.map((p) => ({
					audit_id: newAudit.id,
					product_id: p.id,
					location_id: null,
					expected_qty: p.in_stock,
					counted_qty: null,
					status: "pending",
					discrepancy_reason: null,
					remarks: null,
				}));

				await db.insert(stockAuditItems).values(auditItemsToInsert);
			}

			await logAudit(db, {
				userId: staffId,
				action: "STOCK_AUDIT_CREATE",
				entityType: "stock_audits",
				entityId: newAudit.id,
				newValues: {
					branch_id: input.branch_id,
					audit_type: input.audit_type,
					item_count: targetProducts.length,
				},
			});

			return newAudit;
		}),

	// ── Auditor: Start an Audit ──────────────────────────────────────────────
	startAudit: permProcedure("inventory_audit", "write")
		.input(z.object({ audit_id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);

			const [updated] = await db
				.update(stockAudits)
				.set({
					status: "in_progress",
				})
				.where(eq(stockAudits.id, input.audit_id))
				.returning();

			await logAudit(db, {
				userId: staffId,
				action: "audit_started",
				entityType: "stock_audits",
				entityId: input.audit_id,
				newValues: { status: "in_progress" },
			});

			return updated;
		}),

	// ── Auditor: Save Partial Counting Progress ──────────────────────────────
	saveAuditProgress: permProcedure("inventory_audit", "write")
		.input(
			z.object({
				audit_id: z.number(),
				items: z.array(
					z.object({
						item_id: z.number(),
						counted_qty: z.number(),
						discrepancy_reason: z.string().optional(),
						remarks: z.string().optional(),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);

			for (const item of input.items) {
				const [existing] = await db
					.select()
					.from(stockAuditItems)
					.where(eq(stockAuditItems.id, item.item_id))
					.limit(1);

				if (existing) {
					const expected = existing.expected_qty ?? 0;
					const status = item.counted_qty === expected ? "match" : "mismatch";

					await db
						.update(stockAuditItems)
						.set({
							counted_qty: item.counted_qty,
							status,
							discrepancy_reason: item.discrepancy_reason,
							remarks: item.remarks,
						})
						.where(eq(stockAuditItems.id, item.item_id));
				}
			}

			await logAudit(db, {
				userId: staffId,
				action: "audit_progress_saved",
				entityType: "stock_audits",
				entityId: input.audit_id,
				newValues: { updated_items: input.items.length },
			});

			return { success: true };
		}),

	// ── Auditor: Submit Completed Physical Count ─────────────────────────────
	submitAudit: permProcedure("inventory_audit", "write")
		.input(
			z.object({
				audit_id: z.number(),
				items: z.array(
					z.object({
						item_id: z.number(),
						counted_qty: z.number(),
						discrepancy_reason: z.string().optional(),
						remarks: z.string().optional(),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);

			let hasDiscrepancy = false;

			for (const item of input.items) {
				const [existing] = await db
					.select()
					.from(stockAuditItems)
					.where(eq(stockAuditItems.id, item.item_id))
					.limit(1);

				if (existing) {
					const expected = existing.expected_qty ?? 0;
					const status = item.counted_qty === expected ? "match" : "mismatch";

					await db
						.update(stockAuditItems)
						.set({
							counted_qty: item.counted_qty,
							status,
							discrepancy_reason: item.discrepancy_reason,
							remarks: item.remarks,
						})
						.where(eq(stockAuditItems.id, item.item_id));

					if (item.counted_qty !== expected) {
						hasDiscrepancy = true;
						const variance = item.counted_qty - expected;
						const discType = variance < 0 ? "missing" : "damage";

						await db.insert(auditDiscrepancies).values({
							audit_item_id: item.item_id,
							discrepancy_type: discType,
							quantity: Math.abs(variance),
							reason: item.discrepancy_reason || item.remarks || "Physical count variance",
							resolution_status: "pending",
						});
					}
				}
			}

			const finalStatus = hasDiscrepancy ? "discrepancy_review" : "completed";
			const completedAt = hasDiscrepancy ? null : new Date();

			const [updated] = await db
				.update(stockAudits)
				.set({
					status: finalStatus,
					completed_at: completedAt,
				})
				.where(eq(stockAudits.id, input.audit_id))
				.returning();

			await logAudit(db, {
				userId: staffId,
				action: "audit_submitted",
				entityType: "stock_audits",
				entityId: input.audit_id,
				newValues: { status: finalStatus, hasDiscrepancy },
			});

			return updated;
		}),

	// ── Manager: Review and Reconcile Audit Discrepancies ─────────────────────
	reviewAudit: permProcedure("inventory_audit", "approve")
		.input(
			z.object({
				audit_id: z.number(),
				action: z.enum(["approve", "reject"]),
				notes: z.string().optional(),
				discrepancy_resolutions: z.array(
					z.object({
						discrepancy_id: z.number(),
						action: z.enum(["adjust_stock", "write_off", "investigate", "dismiss"]),
						notes: z.string().optional(),
					}),
				).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);

			if (input.discrepancy_resolutions) {
				for (const res of input.discrepancy_resolutions) {
					const resStatus = res.action === "dismiss" ? "rejected" : "approved";
					await db
						.update(auditDiscrepancies)
						.set({
							resolution_status: resStatus,
							resolved_by: staffId ?? 1,
							resolved_at: new Date(),
							reason: res.notes,
						})
						.where(eq(auditDiscrepancies.id, res.discrepancy_id));
				}
			}

			const [updated] = await db
				.update(stockAudits)
				.set({
					status: input.action === "approve" ? "completed" : "rejected",
					completed_at: new Date(),
					notes: input.notes,
				})
				.where(eq(stockAudits.id, input.audit_id))
				.returning();

			await logAudit(db, {
				userId: staffId,
				action: `audit_${input.action}d`,
				entityType: "stock_audits",
				entityId: input.audit_id,
				newValues: { notes: input.notes },
			});

			return updated;
		}),

	// ── Legacy Compatibility Helpers ──────────────────────────────────────────
	create: permProcedure("inventory_audit", "write")
		.input(
			z.object({
				branch_id: z.number(),
				auditor_id: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);
			const result = await ctx.db
				.insert(stockAudits)
				.values({
					branch_id: input.branch_id,
					auditor_id: input.auditor_id,
					status: "planned",
				})
				.returning();

			await logAudit(ctx.db, {
				userId: staffId,
				action: "STOCK_AUDIT_CREATE",
				entityType: "stock_audits",
				entityId: result[0].id,
				newValues: { branch_id: input.branch_id, auditor_id: input.auditor_id },
			});

			return result[0];
		}),

	addCount: permProcedure("inventory_audit", "write")
		.input(
			z.object({
				audit_id: z.number(),
				product_id: z.number(),
				location_id: z.number().optional(),
				expected_qty: z.number(),
				counted_qty: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const status = input.counted_qty === input.expected_qty ? "match" : "mismatch";
			const result = await ctx.db
				.insert(stockAuditItems)
				.values({
					audit_id: input.audit_id,
					product_id: input.product_id,
					location_id: input.location_id,
					expected_qty: input.expected_qty,
					counted_qty: input.counted_qty,
					status,
				})
				.returning();

			const item = result[0];

			if (input.counted_qty < input.expected_qty) {
				const missingQty = input.expected_qty - input.counted_qty;
				await ctx.db.insert(auditDiscrepancies).values({
					audit_item_id: item.id,
					discrepancy_type: "missing",
					quantity: missingQty,
				});
				await ctx.db.insert(missingStockQueue).values({
					audit_id: input.audit_id,
					product_id: input.product_id,
					quantity: missingQty,
					status: "missing",
				});
			}

			return item;
		}),

	reportDamageOrExpiry: permProcedure("inventory_audit", "write")
		.input(
			z.object({
				audit_item_id: z.number(),
				type: z.enum(["damage", "expiry", "pna"]),
				quantity: z.number(),
				reason: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const result = await ctx.db
				.insert(auditDiscrepancies)
				.values({
					audit_item_id: input.audit_item_id,
					discrepancy_type: input.type,
					quantity: input.quantity,
					reason: input.reason,
				})
				.returning();
			return result[0];
		}),

	listEscalations: permProcedure("inventory_audit", "read").query(
		async ({ ctx }) => {
			return ctx.db
				.select()
				.from(auditDiscrepancies)
				.where(eq(auditDiscrepancies.resolution_status, "pending"));
		},
	),

	resolveDiscrepancy: permProcedure("inventory_audit", "approve")
		.input(
			z.object({
				discrepancy_id: z.number(),
				status: z.enum(["approved", "rejected"]),
				resolver_id: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);
			const result = await ctx.db
				.update(auditDiscrepancies)
				.set({
					resolution_status: input.status,
					resolved_by: input.resolver_id,
					resolved_at: new Date(),
				})
				.where(eq(auditDiscrepancies.id, input.discrepancy_id))
				.returning();

			await logAudit(ctx.db, {
				userId: staffId,
				action: "DISCREPANCY_RESOLVE",
				entityType: "audit_discrepancies",
				entityId: input.discrepancy_id,
				newValues: { status: input.status },
			});

			return result[0];
		}),
});
