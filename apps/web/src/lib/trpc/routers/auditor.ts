import {
	auditFindings,
	auditLogs,
	notifications,
	placementVerifications,
	productBatches,
	receivingInspections,
	staff,
	stockAdjustments,
	stockAuditItems,
	stockAudits,
	upcTasks,
} from "@evaluna/db/schema";
import { and, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { router } from "../init";
import { permProcedure } from "../util/auditor-procedures";

const UPC_OPEN = ["PENDING", "ASSIGNED", "IN_PROGRESS", "VERIFICATION_REQUIRED"];
const FINDING_OPEN = ["OPEN", "UNDER_REVIEW", "CORRECTIVE_ACTION_REQUIRED"];

export const auditorRouter = router({
	getDashboardStats: permProcedure("audit", "read")
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;

			const expDate = new Date();
			expDate.setDate(expDate.getDate() + 30);

			const sixMonthsAgo = new Date();
			sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

			// Real queries executed in parallel
			const [
				adjustments,
				expiring,
				recentAudits,
				damageTimelineRaw,
				expiryTimelineRaw,
			] = await Promise.all([
				db
					.select({
						type: stockAdjustments.adjustment_type,
						count: count(stockAdjustments.id),
					})
					.from(stockAdjustments)
					.groupBy(stockAdjustments.adjustment_type),
				db
					.select({ count: count() })
					.from(productBatches)
					.where(lte(productBatches.expiry_date, expDate)),
				db
					.select({
						id: stockAdjustments.id,
						reason: stockAdjustments.reason,
						staff: staff.name,
					})
					.from(stockAdjustments)
					.leftJoin(staff, eq(stockAdjustments.created_by, staff.id))
					.orderBy(desc(stockAdjustments.created_at))
					.limit(3),
				// Damage timeline: monthly count of damage adjustments
				db
					.select({
						month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${stockAdjustments.created_at}), 'Mon YYYY')`,
						count: count(),
					})
					.from(stockAdjustments)
					.where(
						and(
							eq(stockAdjustments.adjustment_type, "damage"),
							gte(stockAdjustments.created_at, sixMonthsAgo),
						),
					)
					.groupBy(sql`DATE_TRUNC('month', ${stockAdjustments.created_at})`)
					.orderBy(sql`DATE_TRUNC('month', ${stockAdjustments.created_at})`),
				// Expiry timeline: monthly count of expiring batches
				db
					.select({
						month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${productBatches.expiry_date}), 'Mon YYYY')`,
						count: count(),
					})
					.from(productBatches)
					.where(
						and(
							gte(productBatches.expiry_date, sixMonthsAgo),
							lte(productBatches.expiry_date, expDate),
						),
					)
					.groupBy(sql`DATE_TRUNC('month', ${productBatches.expiry_date})`)
					.orderBy(sql`DATE_TRUNC('month', ${productBatches.expiry_date})`),
			]);

			let mismatchCount = 0;
			let damageCount = 0;

			adjustments.forEach((a) => {
				if (a.type === "mismatch") mismatchCount += Number(a.count);
				if (a.type === "damage") damageCount += Number(a.count);
			});

			const expiryCount = Number(expiring[0]?.count) || 0;

			// ── Auditor-specific aggregates (real data from the new tables) ──────
			const [
				openUpcTasks,
				completedUpcTasks,
				openFindings,
				findingsBySeverity,
				pendingReceiving,
				awaitingPlacement,
				plannedAudits,
				completedAuditsRows,
				recentFindings,
				auditItemStatus,
			] = await Promise.all([
				db.select({ c: count() }).from(upcTasks).where(inArray(upcTasks.status, UPC_OPEN)),
				db.select({ c: count() }).from(upcTasks).where(eq(upcTasks.status, "VERIFIED")),
				db.select({ c: count() }).from(auditFindings).where(inArray(auditFindings.status, FINDING_OPEN)),
				db
					.select({ severity: auditFindings.severity, c: count() })
					.from(auditFindings)
					.where(inArray(auditFindings.status, FINDING_OPEN))
					.groupBy(auditFindings.severity),
				db.select({ c: count() }).from(receivingInspections).where(eq(receivingInspections.status, "PENDING")),
				db
					.select({ c: count() })
					.from(placementVerifications)
					.where(inArray(placementVerifications.status, ["AWAITING_PLACEMENT", "VERIFICATION_REQUIRED"])),
				db.select({ c: count() }).from(stockAudits).where(inArray(stockAudits.status, ["planned", "in_progress", "escalated"])),
				db.select({ c: count() }).from(stockAudits).where(eq(stockAudits.status, "completed")),
				db
					.select({
						id: auditFindings.id,
						title: auditFindings.title,
						type: auditFindings.finding_type,
						severity: auditFindings.severity,
						status: auditFindings.status,
						created_at: auditFindings.created_at,
					})
					.from(auditFindings)
					.orderBy(desc(auditFindings.created_at))
					.limit(10),
				db
					.select({ status: stockAuditItems.status, c: count() })
					.from(stockAuditItems)
					.groupBy(stockAuditItems.status),
			]);

			const pendingAudits = Number(plannedAudits[0]?.c) || 0;
			const completedAudits = Number(completedAuditsRows[0]?.c) || 0;
			// Stock accuracy = matched count items / total counted items (null when none).
			let matched = 0;
			let totalItems = 0;
			for (const row of auditItemStatus) {
				const n = Number(row.c);
				totalItems += n;
				if (row.status === "match") matched += n;
			}
			const stockAccuracy =
				totalItems > 0 ? Math.round((matched / totalItems) * 1000) / 10 : null;

			return {
				// KPIs
				pendingAudits,
				completedAudits,
				mismatchCount,
				damageCount,
				expiryCount,
				stockAccuracy,
				openUpcTasks: Number(openUpcTasks[0]?.c) || 0,
				completedUpcTasks: Number(completedUpcTasks[0]?.c) || 0,
				openFindings: Number(openFindings[0]?.c) || 0,
				pendingReceiving: Number(pendingReceiving[0]?.c) || 0,
				awaitingPlacement: Number(awaitingPlacement[0]?.c) || 0,
				findingsBySeverity: findingsBySeverity.map((f) => ({
					severity: f.severity,
					count: Number(f.c),
				})),

				// Charts
				damageTimeline: damageTimelineRaw.map((d) => ({
					month: d.month,
					count: Number(d.count),
				})),
				expiryTimeline: expiryTimelineRaw.map((e) => ({
					month: e.month,
					count: Number(e.count),
				})),
				warehouseIssues: [
					{ name: "Damage", value: damageCount },
					{ name: "Expiry", value: expiryCount },
					{ name: "Missing", value: mismatchCount },
				].filter((i) => i.value > 0),

				// Summaries / Tables
				auditQueue: recentFindings
					.filter((f) => FINDING_OPEN.includes(f.status))
					.map((f) => ({
						id: `FND-${f.id}`,
						title: f.title,
						type: f.type,
						severity: f.severity,
						status: f.status,
					})),
				recentFindings: recentFindings.map((f) => ({
					id: f.id,
					title: f.title,
					type: f.type,
					severity: f.severity,
					status: f.status,
					created_at: f.created_at,
				})),
				productMismatch: [],
				recentAudits: recentAudits.map((r) => ({
					id: `ADT-${r.id}`,
					area: r.reason || "General",
					completedBy: r.staff || "System",
					accuracy: "N/A",
					issues: 0,
				})),
				notifications: [],
			};
		}),

	// ── Read: immutable audit trail (read-only; never mutated here) ───────────
	listAuditLogs: permProcedure("audit", "read")
		.input(
			z
				.object({
					entityType: z.string().optional(),
					action: z.string().optional(),
					limit: z.number().min(1).max(500).default(200),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const conds = [];
			if (input?.entityType) conds.push(eq(auditLogs.entity_type, input.entityType));
			if (input?.action) conds.push(eq(auditLogs.action, input.action));
			const rows = await ctx.db
				.select({
					id: auditLogs.id,
					user_id: auditLogs.user_id,
					user_name: staff.name,
					action: auditLogs.action,
					entity_type: auditLogs.entity_type,
					entity_id: auditLogs.entity_id,
					old_values: auditLogs.old_values,
					new_values: auditLogs.new_values,
					created_at: auditLogs.created_at,
				})
				.from(auditLogs)
				.leftJoin(staff, eq(auditLogs.user_id, staff.id))
				.where(conds.length ? and(...conds) : undefined)
				.orderBy(desc(auditLogs.created_at))
				.limit(input?.limit ?? 200);
			return rows;
		}),
});
