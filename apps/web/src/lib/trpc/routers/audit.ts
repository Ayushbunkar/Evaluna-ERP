import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
	auditDiscrepancies,
	missingStockQueue,
	stockAuditItems,
	stockAudits,
} from "@/lib/db/schema";
import { router } from "@/lib/trpc/init";
import { permProcedure } from "../util/auditor-procedures";
import { logAudit, resolveStaffId } from "../util/audit";

// Inventory-inspection service. Previously exposed via `publicProcedure` (an
// authz gap); now every entry point is gated by `inventory_audit.<action>`
// (auditor and above) and appends to the immutable audit trail.
export const auditRouter = router({
	// ── Read: stock-audit list (newest first) ────────────────────────────────
	listAudits: permProcedure("inventory_audit", "read")
		.input(
			z
				.object({ status: z.string().optional(), branchId: z.number().optional() })
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const rows = await ctx.db.select().from(stockAudits).orderBy(desc(stockAudits.created_at));
			return rows.filter((r: any) => {
				if (input?.status && r.status !== input.status) return false;
				if (input?.branchId && r.branch_id !== input.branchId) return false;
				return true;
			});
		}),

	// ── Read: single audit + its counted items ───────────────────────────────
	getAudit: permProcedure("inventory_audit", "read")
		.input(z.object({ auditId: z.number() }))
		.query(async ({ ctx, input }) => {
			const [audit] = await ctx.db
				.select()
				.from(stockAudits)
				.where(eq(stockAudits.id, input.auditId))
				.limit(1);
			const items = await ctx.db
				.select()
				.from(stockAuditItems)
				.where(eq(stockAuditItems.audit_id, input.auditId))
				.orderBy(desc(stockAuditItems.id));
			return { audit: audit ?? null, items };
		}),

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
				newValues: { branchId: input.branch_id, auditorId: input.auditor_id },
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
			let status = "match";
			if (input.counted_qty !== input.expected_qty) {
				status = "mismatch";
			}

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

			// If missing stock, add to discrepancy and missing queue
			if (input.counted_qty < input.expected_qty) {
				await ctx.db.insert(auditDiscrepancies).values({
					audit_item_id: result[0].id,
					discrepancy_type: "missing",
					quantity: input.expected_qty - input.counted_qty,
				});

				await ctx.db.insert(missingStockQueue).values({
					product_id: input.product_id,
					audit_id: input.audit_id,
					quantity: input.expected_qty - input.counted_qty,
					status: "missing",
				});
			}

			return result[0];
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

	listEscalations: permProcedure("inventory_audit", "read").query(async ({ ctx }) => {
		return ctx.db
			.select()
			.from(auditDiscrepancies)
			.where(eq(auditDiscrepancies.resolution_status, "pending"));
	}),

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
