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

const UPC_OPEN = [
	"PENDING",
	"ASSIGNED",
	"IN_PROGRESS",
	"VERIFICATION_REQUIRED",
];
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
				db
					.select({ c: count() })
					.from(upcTasks)
					.where(inArray(upcTasks.status, UPC_OPEN)),
				db
					.select({ c: count() })
					.from(upcTasks)
					.where(eq(upcTasks.status, "VERIFIED")),
				db
					.select({ c: count() })
					.from(auditFindings)
					.where(inArray(auditFindings.status, FINDING_OPEN)),
				db
					.select({ severity: auditFindings.severity, c: count() })
					.from(auditFindings)
					.where(inArray(auditFindings.status, FINDING_OPEN))
					.groupBy(auditFindings.severity),
				db
					.select({ c: count() })
					.from(receivingInspections)
					.where(eq(receivingInspections.status, "PENDING")),
				db
					.select({ c: count() })
					.from(placementVerifications)
					.where(
						inArray(placementVerifications.status, [
							"AWAITING_PLACEMENT",
							"VERIFICATION_REQUIRED",
						]),
					),
				db
					.select({ c: count() })
					.from(stockAudits)
					.where(
						inArray(stockAudits.status, [
							"planned",
							"in_progress",
							"escalated",
						]),
					),
				db
					.select({ c: count() })
					.from(stockAudits)
					.where(eq(stockAudits.status, "completed")),
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
			if (input?.entityType)
				conds.push(eq(auditLogs.entity_type, input.entityType));
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

	// ── getFindings: full audit findings list for the findings page ───────────
	getFindings: permProcedure("audit", "read")
		.input(
			z
				.object({
					status: z.string().optional(),
					severity: z.string().optional(),
					limit: z.number().min(1).max(200).default(100),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const conds = [];
			if (input?.status) conds.push(eq(auditFindings.status, input.status));
			if (input?.severity)
				conds.push(eq(auditFindings.severity, input.severity));

			const rows = await ctx.db
				.select({
					id: auditFindings.id,
					title: auditFindings.title,
					type: auditFindings.finding_type,
					severity: auditFindings.severity,
					status: auditFindings.status,
					date: auditFindings.created_at,
					description: auditFindings.description,
					resolution_notes: auditFindings.resolution_notes,
					resolved_at: auditFindings.resolved_at,
				})
				.from(auditFindings)
				.where(conds.length ? and(...conds) : undefined)
				.orderBy(desc(auditFindings.created_at))
				.limit(input?.limit ?? 100);

			return rows.map((r) => ({
				...r,
				date: r.date ? new Date(r.date).toISOString().split("T")[0] : "N/A",
			}));
		}),

	// ── getUpcTasks: UPC verification task list ────────────────────────────────
	getUpcTasks: permProcedure("upc", "read")
		.input(
			z
				.object({
					status: z.string().optional(),
					limit: z.number().min(1).max(200).default(100),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const conds = [];
			if (input?.status) conds.push(eq(upcTasks.status, input.status));

			const rows = await ctx.db
				.select({
					id: upcTasks.id,
					product_id: upcTasks.product_id,
					product_name: products.name,
					barcode: upcTasks.upc_value,
					status: upcTasks.status,
					task_type: upcTasks.task_type,
					notes: upcTasks.notes,
					created_at: upcTasks.created_at,
					completed_at: upcTasks.completed_at,
				})
				.from(upcTasks)
				.leftJoin(products, eq(upcTasks.product_id, products.id))
				.where(conds.length ? and(...conds) : undefined)
				.orderBy(desc(upcTasks.created_at))
				.limit(input?.limit ?? 100);

			return rows.map((r) => ({
				...r,
				barcode: r.barcode || "N/A",
				product_name: r.product_name || `Product #${r.product_id}`,
				created_at: r.created_at
					? new Date(r.created_at).toISOString().split("T")[0]
					: "N/A",
				completed_at: r.completed_at
					? new Date(r.completed_at).toISOString().split("T")[0]
					: null,
			}));
		}),

	// ── getProductsList: Fetch products for barcode generator modal ────────────
	getProductsList: permProcedure("upc", "read").query(async ({ ctx }) => {
		const rows = await ctx.db
			.select({
				id: products.id,
				name: products.name,
				sku: products.sku,
				barcode: products.barcode,
				price: products.price,
			})
			.from(products)
			.where(eq(products.is_deleted, false))
			.orderBy(products.name)
			.limit(200);
		return rows;
	}),

	// ── createUpcTask: Generate & assign barcode to product ─────────────────
	createUpcTask: permProcedure("upc", "write")
		.input(
			z.object({
				productId: z.number(),
				upcValue: z.string().min(1),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Update product barcode
			await ctx.db
				.update(products)
				.set({ barcode: input.upcValue, updated_at: new Date() })
				.where(eq(products.id, input.productId));

			// Insert UPC task record
			const [task] = await ctx.db
				.insert(upcTasks)
				.values({
					product_id: input.productId,
					upc_value: input.upcValue,
					task_type: "generate",
					status: "COMPLETED",
					notes: input.notes || "Barcode generated and printed by Auditor",
					completed_at: new Date(),
				})
				.returning();

			return task;
		}),

	// ── getReceivingInspections: receiving inspection list ────────────────────
	getReceivingInspections: permProcedure("audit", "read")
		.input(
			z
				.object({
					status: z.string().optional(),
					limit: z.number().min(1).max(200).default(100),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const conds = [];
			if (input?.status)
				conds.push(eq(receivingInspections.status, input.status));

			const rows = await ctx.db
				.select({
					id: receivingInspections.id,
					product_id: receivingInspections.product_id,
					product_name: products.name,
					product_sku: products.sku,
					expected_qty: receivingInspections.expected_qty,
					received_qty: receivingInspections.received_qty,
					condition: receivingInspections.condition,
					upc_status: receivingInspections.upc_status,
					status: receivingInspections.status,
					notes: receivingInspections.notes,
					created_at: receivingInspections.created_at,
					verified_at: receivingInspections.verified_at,
				})
				.from(receivingInspections)
				.leftJoin(products, eq(receivingInspections.product_id, products.id))
				.where(conds.length ? and(...conds) : undefined)
				.orderBy(desc(receivingInspections.created_at))
				.limit(input?.limit ?? 100);

			return rows.map((r) => ({
				...r,
				product_name: r.product_name || `Product #${r.product_id}`,
				product_sku: r.product_sku || "N/A",
				created_at: r.created_at
					? new Date(r.created_at).toISOString().split("T")[0]
					: "N/A",
				verified_at: r.verified_at
					? new Date(r.verified_at).toISOString().split("T")[0]
					: null,
			}));
		}),

	// ── createReceivingInspection: Log incoming goods GRN inspection ──────────
	createReceivingInspection: permProcedure("audit", "write")
		.input(
			z.object({
				productId: z.number(),
				expectedQty: z.number().min(0),
				receivedQty: z.number().min(0),
				condition: z.enum(["good", "damaged", "mismatch"]).default("good"),
				upcStatus: z.enum(["present", "missing", "invalid"]).default("present"),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const isMatch =
				input.expectedQty === input.receivedQty &&
				input.condition === "good" &&
				input.upcStatus === "present";

			const status = isMatch ? "VERIFIED" : "DISCREPANCY";

			const [row] = await ctx.db
				.insert(receivingInspections)
				.values({
					product_id: input.productId,
					expected_qty: input.expectedQty,
					received_qty: input.receivedQty,
					condition: input.condition,
					upc_status: input.upcStatus,
					status: status,
					notes: input.notes,
					verified_at: new Date(),
				})
				.returning();

			// Auto-raise audit finding if discrepancy
			if (!isMatch) {
				const [prod] = await ctx.db
					.select({ name: products.name })
					.from(products)
					.where(eq(products.id, input.productId))
					.limit(1);

				const defectReason =
					input.condition === "damaged"
						? "Damaged Goods Received"
						: input.expectedQty !== input.receivedQty
							? `Quantity Mismatch (Expected ${input.expectedQty}, Got ${input.receivedQty})`
							: `Barcode/UPC Issue (${input.upcStatus})`;

				await ctx.db.insert(auditFindings).values({
					finding_type: "receiving",
					severity: input.condition === "damaged" ? "CRITICAL" : "HIGH",
					status: "OPEN",
					title: `Receiving Defect: ${prod?.name || `Product #${input.productId}`} - ${defectReason}`,
					description: `Defect logged during incoming goods receiving inspection. Notes: ${input.notes || "None"}`,
				});
			}

			return row;
		}),

	// ── getPlacementVerifications: placement verification list ────────────────
	getPlacementVerifications: permProcedure("placement", "read")
		.input(
			z
				.object({
					status: z.string().optional(),
					limit: z.number().min(1).max(200).default(100),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const conds = [];
			if (input?.status)
				conds.push(eq(placementVerifications.status, input.status));

			const rows = await ctx.db
				.select({
					id: placementVerifications.id,
					product_id: placementVerifications.product_id,
					product_name: products.name,
					product_sku: products.sku,
					status: placementVerifications.status,
					notes: placementVerifications.notes,
					verified_at: placementVerifications.verified_at,
					created_at: placementVerifications.created_at,
				})
				.from(placementVerifications)
				.leftJoin(products, eq(placementVerifications.product_id, products.id))
				.where(conds.length ? and(...conds) : undefined)
				.orderBy(desc(placementVerifications.created_at))
				.limit(input?.limit ?? 100);

			return rows.map((r) => ({
				...r,
				product_name: r.product_name || `Product #${r.product_id}`,
				product_sku: r.product_sku || "N/A",
				created_at: r.created_at
					? new Date(r.created_at).toISOString().split("T")[0]
					: "N/A",
				verified_at: r.verified_at
					? new Date(r.verified_at).toISOString().split("T")[0]
					: null,
			}));
		}),

	// ── createPlacementVerification: Perform physical bin placement audit ─────
	createPlacementVerification: permProcedure("placement", "write")
		.input(
			z.object({
				productId: z.number(),
				locationNotes: z.string().optional(),
				status: z
					.enum(["VERIFIED", "DISCREPANCY", "PLACEMENT_EXCEPTION"])
					.default("VERIFIED"),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const fullNotes = input.locationNotes
				? `[Location: ${input.locationNotes}] ${input.notes || ""}`.trim()
				: input.notes;

			const [row] = await ctx.db
				.insert(placementVerifications)
				.values({
					product_id: input.productId,
					status: input.status,
					notes: fullNotes,
					verified_at: new Date(),
				})
				.returning();

			// Auto-raise audit finding if discrepancy or exception
			if (
				input.status === "DISCREPANCY" ||
				input.status === "PLACEMENT_EXCEPTION"
			) {
				const [prod] = await ctx.db
					.select({ name: products.name })
					.from(products)
					.where(eq(products.id, input.productId))
					.limit(1);

				await ctx.db.insert(auditFindings).values({
					finding_type: "placement",
					severity:
						input.status === "PLACEMENT_EXCEPTION" ? "CRITICAL" : "HIGH",
					status: "OPEN",
					title: `Placement Exception: ${prod?.name || `Product #${input.productId}`}`,
					description: `Physical placement discrepancy logged during audit. ${fullNotes || ""}`,
				});
			}

			return row;
		}),
});
