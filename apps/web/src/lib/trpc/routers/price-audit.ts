import { priceChangeHistory, products } from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { router } from "../init";
import { resolveStaffId } from "../util/audit";
import { permProcedure } from "../util/auditor-procedures";
import { createFinding } from "./audit-findings";

/**
 * Price audit is READ + FLAG only. The auditor never edits a price record here —
 * `pricing_audit` grants read/write (flag) but NOT `products.write`. Reviewing a
 * change raises an audit finding; the price row in `products` is untouched.
 */
export const priceAuditRouter = router({
	// ── Read: immutable price-change log (newest first) ───────────────────────
	listPriceChanges: permProcedure("pricing_audit", "read")
		.input(z.object({ productId: z.number().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const rows = await ctx.db
				.select({
					id: priceChangeHistory.id,
					product_id: priceChangeHistory.product_id,
					product_name: products.name,
					price_field: priceChangeHistory.price_field,
					old_price: priceChangeHistory.old_price,
					new_price: priceChangeHistory.new_price,
					changed_by: priceChangeHistory.changed_by,
					changed_by_uid: priceChangeHistory.changed_by_uid,
					reason: priceChangeHistory.reason,
					approval_ref: priceChangeHistory.approval_ref,
					source: priceChangeHistory.source,
					created_at: priceChangeHistory.created_at,
				})
				.from(priceChangeHistory)
				.leftJoin(products, eq(priceChangeHistory.product_id, products.id))
				.where(
					input?.productId
						? eq(priceChangeHistory.product_id, input.productId)
						: undefined,
				)
				.orderBy(desc(priceChangeHistory.created_at));
			return rows;
		}),

	// ── Write (flag only): review a change → raise a price finding ────────────
	reviewChange: permProcedure("pricing_audit", "write")
		.input(
			z.object({
				priceChangeId: z.number(),
				severity: z
					.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
					.default("MEDIUM"),
				description: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);
			return await ctx.db.transaction(async (tx: any) => {
				const [change] = await tx
					.select()
					.from(priceChangeHistory)
					.where(eq(priceChangeHistory.id, input.priceChangeId))
					.limit(1);
				if (!change)
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Price change not found.",
					});
				const { id } = await createFinding(tx, staffId, {
					findingType: "price",
					severity: input.severity,
					title: `Price change flagged on product #${change.product_id} (${change.price_field})`,
					description: `${input.description} [${change.old_price} → ${change.new_price}]`,
					referenceType: "price_change_history",
					referenceId: input.priceChangeId,
				});
				return { findingId: id };
			});
		}),
});
