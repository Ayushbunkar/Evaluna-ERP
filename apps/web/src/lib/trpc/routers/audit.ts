import {
	auditDiscrepancies,
	branches,
	branchInventory,
	branchLocations,
	missingStockQueue,
	productCategories,
	productCategoryMapping,
	products,
	staff,
	stockAdjustments,
	stockAuditItems,
	stockAudits,
	stockLedger,
} from "@/lib/db/schema";
import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "@/lib/trpc/init";
import { TRPCError } from "@trpc/server";
import { logAudit, notify, resolveStaffId } from "../util/audit";
import { permProcedure } from "../util/auditor-procedures";

// Helper to safely extract rows across postgres.js, pg, and pglite
const getRows = <T = any>(res: any): T[] => {
	if (!res) return [];
	if (Array.isArray(res)) return res;
	if (Array.isArray(res.rows)) return res.rows;
	return [];
};

export const auditRouter = router({
	// ── Summary KPI Stats for Auditor & Warehouse Dashboards ─────────────────
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
			const branchWhere = input?.branchId
				? sql`WHERE branch_id = ${input.branchId}`
				: sql``;

			const statsRows = getRows(
				await db.execute<{
					total_audits: number;
					pending_audits: number;
					in_progress: number;
					completed_audits: number;
					recount_requested: number;
					variance_found: number;
					total_items: number;
					counted_items: number;
					matched_items: number;
					shortage_lines: number;
					excess_lines: number;
				}>(sql`
				SELECT
					(SELECT coalesce(count(*), 0)::int FROM stock_audits ${branchWhere}) AS total_audits,
					(SELECT coalesce(count(*) filter (WHERE status IN ('planned', 'pending', 'scheduled')), 0)::int FROM stock_audits ${branchWhere}) AS pending_audits,
					(SELECT coalesce(count(*) filter (WHERE status = 'in_progress'), 0)::int FROM stock_audits ${branchWhere}) AS in_progress,
					(SELECT coalesce(count(*) filter (WHERE status IN ('completed', 'approved', 'reconciled')), 0)::int FROM stock_audits ${branchWhere}) AS completed_audits,
					(SELECT coalesce(count(*) filter (WHERE status = 'recount_requested'), 0)::int FROM stock_audits ${branchWhere}) AS recount_requested,
					(SELECT coalesce(count(*) filter (WHERE resolution_status = 'pending'), 0)::int FROM audit_discrepancies) AS variance_found,
					(SELECT coalesce(count(*), 0)::int FROM stock_audit_items) AS total_items,
					(SELECT coalesce(count(*) filter (WHERE counted_qty IS NOT NULL), 0)::int FROM stock_audit_items) AS counted_items,
					(SELECT coalesce(count(*) filter (WHERE status = 'match'), 0)::int FROM stock_audit_items) AS matched_items,
					(SELECT coalesce(count(*) filter (WHERE counted_qty IS NOT NULL AND counted_qty < expected_qty), 0)::int FROM stock_audit_items) AS shortage_lines,
					(SELECT coalesce(count(*) filter (WHERE counted_qty IS NOT NULL AND counted_qty > expected_qty), 0)::int FROM stock_audit_items) AS excess_lines
			`),
			);
			const stats = statsRows[0];

			// Discrepancy breakdown by category
			const discRows = getRows(
				await db.execute<{
					missing_count: number;
					excess_count: number;
					damage_count: number;
					expiry_count: number;
					wrong_loc_count: number;
					total_exposure: string;
				}>(sql`
				SELECT
					coalesce(count(*) filter (WHERE discrepancy_type = 'missing'), 0)::int AS missing_count,
					coalesce(count(*) filter (WHERE discrepancy_type = 'excess'), 0)::int AS excess_count,
					coalesce(count(*) filter (WHERE discrepancy_type = 'damage'), 0)::int AS damage_count,
					coalesce(count(*) filter (WHERE discrepancy_type = 'expiry'), 0)::int AS expiry_count,
					coalesce(count(*) filter (WHERE discrepancy_type = 'wrong_location'), 0)::int AS wrong_loc_count,
					coalesce(sum(coalesce(variance_value, 0)), 0)::text AS total_exposure
				FROM audit_discrepancies
			`),
			);
			const discrepancyStats = discRows[0];

			const totalCounted = Number(stats?.counted_items || 0);
			const matched = Number(stats?.matched_items || 0);
			const accuracyRate =
				totalCounted > 0 ? Math.round((matched / totalCounted) * 100) : 100;

			return {
				totalAudits: Number(stats?.total_audits || 0),
				pendingAudits: Number(stats?.pending_audits || 0),
				inProgress: Number(stats?.in_progress || 0),
				completedAudits: Number(stats?.completed_audits || 0),
				recountRequested: Number(stats?.recount_requested || 0),
				varianceFound: Number(stats?.variance_found || 0),
				totalItems: Number(stats?.total_items || 0),
				totalLinesCounted: totalCounted,
				matchedItems: matched,
				shortageLines: Number(stats?.shortage_lines || 0),
				excessLines: Number(stats?.excess_lines || 0),
				accuracyRate,
				criticalVariances: Number(stats?.variance_found || 0),
				discrepancyBreakdown: {
					missing: Number(discrepancyStats?.missing_count || 0),
					excess: Number(discrepancyStats?.excess_count || 0),
					damage: Number(discrepancyStats?.damage_count || 0),
					expiry: Number(discrepancyStats?.expiry_count || 0),
					wrongLocation: Number(discrepancyStats?.wrong_loc_count || 0),
				},
				totalVarianceExposure: Number(discrepancyStats?.total_exposure || 0),
			};
		}),

	// ── List Stock Audits with comprehensive filter & summary ────────────────
	listAudits: permProcedure("inventory_audit", "read")
		.input(
			z
				.object({
					status: z.string().optional(),
					branchId: z.number().optional(),
					auditorId: z.number().optional(),
					priority: z.string().optional(),
					search: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const conds = [];
			if (input?.status) conds.push(eq(stockAudits.status, input.status));
			if (input?.branchId) conds.push(eq(stockAudits.branch_id, input.branchId));
			if (input?.auditorId)
				conds.push(eq(stockAudits.auditor_id, input.auditorId));
			if (input?.priority)
				conds.push(eq(stockAudits.priority, input.priority));

			if (input?.search) {
				const term = `%${input.search}%`;
				conds.push(
					or(
						like(stockAudits.audit_number, term),
						like(stockAudits.title, term),
						like(stockAudits.location_name, term),
					),
				);
			}

			const rows = await db
				.select({
					id: stockAudits.id,
					audit_number: stockAudits.audit_number,
					title: stockAudits.title,
					branch_id: stockAudits.branch_id,
					status: stockAudits.status,
					priority: stockAudits.priority,
					counting_method: stockAudits.counting_method,
					audit_type: stockAudits.audit_type,
					location_name: stockAudits.location_name,
					auditor_id: stockAudits.auditor_id,
					assigned_by: stockAudits.assigned_by,
					assigned_at: stockAudits.assigned_at,
					start_date: stockAudits.start_date,
					due_date: stockAudits.due_date,
					notes: stockAudits.notes,
					review_notes: stockAudits.review_notes,
					reconciled_by: stockAudits.reconciled_by,
					reconciled_at: stockAudits.reconciled_at,
					created_at: stockAudits.created_at,
					completed_at: stockAudits.completed_at,
				})
				.from(stockAudits)
				.where(conds.length > 0 ? and(...conds) : undefined)
				.orderBy(desc(stockAudits.created_at))
				.limit(200);

			if (rows.length === 0) return [];

			const branchIds = Array.from(
				new Set(rows.map((a) => a.branch_id).filter(Boolean)),
			);
			const staffIds = Array.from(
				new Set(
					[
						...rows.map((a) => a.auditor_id),
						...rows.map((a) => a.assigned_by),
						...rows.map((a) => a.reconciled_by),
					].filter(Boolean) as number[],
				),
			);
			const auditIds = rows.map((a) => a.id);

			let branchMap = new Map();
			if (branchIds.length > 0) {
				const bList = await db
					.select()
					.from(branches)
					.where(inArray(branches.id, branchIds));
				branchMap = new Map(bList.map((b) => [b.id, b]));
			}

			let staffMap = new Map();
			if (staffIds.length > 0) {
				const sList = await db
					.select()
					.from(staff)
					.where(inArray(staff.id, staffIds));
				staffMap = new Map(sList.map((s) => [s.id, s]));
			}

			let itemsMap = new Map<number, any[]>();
			if (auditIds.length > 0) {
				const allItems = await db
					.select()
					.from(stockAuditItems)
					.where(inArray(stockAuditItems.audit_id, auditIds));
				for (const it of allItems) {
					const list = itemsMap.get(it.audit_id) || [];
					list.push(it);
					itemsMap.set(it.audit_id, list);
				}
			}

			return rows.map((audit) => {
				const items = itemsMap.get(audit.id) || [];
				const totalItemsCount = items.length;
				const countedItemsCount = items.filter(
					(i) => i.counted_qty !== null,
				).length;
				const matchedItemsCount = items.filter((i) => i.status === "match").length;
				const varianceItemsCount = items.filter(
					(i) =>
						i.status === "mismatch" ||
						(i.counted_qty !== null &&
							i.counted_qty !== (i.expected_qty ?? 0)),
				).length;
				const recountCount = items.filter(
					(i) => i.recount_qty !== null || i.status === "recount_requested",
				).length;

				return {
					...audit,
					branch: branchMap.get(audit.branch_id) || null,
					auditor: staffMap.get(audit.auditor_id) || null,
					assignedByStaff: staffMap.get(audit.assigned_by) || null,
					reconciledByStaff: staffMap.get(audit.reconciled_by) || null,
					totalItemsCount,
					countedItemsCount,
					matchedItemsCount,
					varianceItemsCount,
					recountCount,
				};
			});
		}),

	// ── Single Audit Details with Blind Count Protection ─────────────────────
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
				return { audit: null, items: [], discrepancies: [] };
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

			let assignedByStaff = null;
			if (audit.assigned_by) {
				const [st] = await db
					.select()
					.from(staff)
					.where(eq(staff.id, audit.assigned_by))
					.limit(1);
				assignedByStaff = st ?? null;
			}

			let reconciledByStaff = null;
			if (audit.reconciled_by) {
				const [st] = await db
					.select()
					.from(staff)
					.where(eq(staff.id, audit.reconciled_by))
					.limit(1);
				reconciledByStaff = st ?? null;
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

			const itemIds = rawItems.map((i) => i.id);
			let discrepanciesMap = new Map<number, any[]>();
			let discrepanciesList: any[] = [];
			if (itemIds.length > 0) {
				discrepanciesList = await db
					.select()
					.from(auditDiscrepancies)
					.where(inArray(auditDiscrepancies.audit_item_id, itemIds));
				for (const d of discrepanciesList) {
					const list = discrepanciesMap.get(d.audit_item_id) || [];
					list.push(d);
					discrepanciesMap.set(d.audit_item_id, list);
				}
			}

			// Blind Count Security:
			// If blind counting and the user is an employee/auditor without approval permission,
			// mask `expected_qty` if not counted or if audit is in progress/planned!
			const userHasApprove =
				ctx.user.isSuperadmin ||
				ctx.user.permissions.includes("inventory_audit.approve");
			const isBlindMasked =
				audit.counting_method === "blind" &&
				!userHasApprove &&
				audit.status !== "completed";

			const items = rawItems.map((item) => {
				const prod = productMap.get(item.product_id);
				const expected = item.expected_qty ?? 0;
				const counted =
					item.counted_qty !== null ? Number(item.counted_qty) : null;
				const recount =
					item.recount_qty !== null ? Number(item.recount_qty) : null;
				const effectiveCount = recount !== null ? recount : counted;
				const variance =
					effectiveCount !== null ? effectiveCount - expected : null;

				return {
					...item,
					product: prod || null,
					// Blind count protection: mask snapshot expected_qty if applicable
					expected_qty: isBlindMasked && counted === null ? null : expected,
					counted_qty: counted,
					recount_qty: recount,
					variance: isBlindMasked && counted === null ? null : variance,
					status: item.status || "pending",
					discrepancies: discrepanciesMap.get(item.id) || [],
				};
			});

			return {
				audit: {
					...audit,
					branch,
					auditor,
					assignedByStaff,
					reconciledByStaff,
				},
				items,
				discrepancies: discrepanciesList,
			};
		}),

	// ── Scope Preview for Audit Plan Creation Wizard ─────────────────────────
	getAuditScopePreview: permProcedure("inventory_audit", "write")
		.input(
			z.object({
				branchId: z.number(),
				categoryId: z.number().optional(),
				productIds: z.array(z.number()).optional(),
				search: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;

			let targetProductIds: number[] | null = null;

			if (input.productIds && input.productIds.length > 0) {
				targetProductIds = input.productIds;
			} else if (input.categoryId) {
				const mappings = await db
					.select({ product_id: productCategoryMapping.product_id })
					.from(productCategoryMapping)
					.where(eq(productCategoryMapping.category_id, input.categoryId));
				targetProductIds = mappings.map((m) => m.product_id);
			}

			const whereConds = [];
			if (targetProductIds && targetProductIds.length > 0) {
				whereConds.push(inArray(products.id, targetProductIds));
			} else if (targetProductIds && targetProductIds.length === 0) {
				return {
					totalProducts: 0,
					totalExpectedStock: 0,
					sampleProducts: [],
				};
			}

			if (input.search) {
				const term = `%${input.search}%`;
				whereConds.push(
					or(
						like(products.name, term),
						like(products.sku, term),
						like(products.barcode, term),
					),
				);
			}

			const matchingProducts = await db
				.select({
					id: products.id,
					name: products.name,
					sku: products.sku,
					barcode: products.barcode,
					base_procurement_price: products.base_procurement_price,
					price: products.price,
				})
				.from(products)
				.where(whereConds.length > 0 ? and(...whereConds) : undefined)
				.limit(100);

			// Query branch inventory snapshot for the selected warehouse
			const prodIds = matchingProducts.map((p) => p.id);
			let branchStockMap = new Map<number, number>();
			if (prodIds.length > 0) {
				const bInv = await db
					.select()
					.from(branchInventory)
					.where(
						and(
							eq(branchInventory.branch_id, input.branchId),
							inArray(branchInventory.product_id, prodIds),
						),
					);
				for (const inv of bInv) {
					branchStockMap.set(inv.product_id, Number(inv.in_stock || 0));
				}
			}

			let totalExpectedStock = 0;
			const sampleProducts = matchingProducts.map((p) => {
				const stock = branchStockMap.get(p.id) ?? 0;
				totalExpectedStock += stock;
				return {
					...p,
					branch_stock: stock,
				};
			});

			return {
				totalProducts: matchingProducts.length,
				totalExpectedStock,
				sampleProducts: sampleProducts.slice(0, 20),
			};
		}),

	// ── List Assignable Staff for Audit Assignment ───────────────────────────
	getAssignableAuditors: permProcedure("inventory_audit", "read")
		.input(z.object({ branchId: z.number().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const conds = [];
			if (input?.branchId) conds.push(eq(staff.branch_id, input.branchId));

			const members = await db
				.select({
					id: staff.id,
					name: staff.name,
					staff_code: staff.staff_code,
					email: staff.email,
					role: staff.role,
					department: staff.department,
					branch_id: staff.branch_id,
				})
				.from(staff)
				.where(conds.length > 0 ? and(...conds) : undefined)
				.limit(100);

			return members;
		}),

	// ── Warehouse Manager: Create Audit Plan with Frozen Stock Snapshots ─────
	createAuditPlan: permProcedure("inventory_audit", "write")
		.input(
			z.object({
				branch_id: z.number(),
				title: z.string().min(1, "Audit title is required"),
				audit_type: z
					.enum([
						"cycle_count",
						"full_physical",
						"spot_check",
						"discrepancy_followup",
					])
					.default("cycle_count"),
				counting_method: z.enum(["blind", "assisted"]).default("blind"),
				priority: z
					.enum(["low", "medium", "high", "urgent"])
					.default("medium"),
				auditor_id: z.number(),
				location_name: z.string().optional(),
				start_date: z.string().or(z.date()).optional(),
				due_date: z.string().or(z.date()).optional(),
				notes: z.string().optional(),
				product_ids: z.array(z.number()).optional(),
				category_id: z.number().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const managerStaffId = await resolveStaffId(db, ctx.user.email);

			// Determine target products for snapshot
			let targetProductIds: number[] = [];

			if (input.product_ids && input.product_ids.length > 0) {
				targetProductIds = input.product_ids;
			} else if (input.category_id) {
				const mappings = await db
					.select({ product_id: productCategoryMapping.product_id })
					.from(productCategoryMapping)
					.where(eq(productCategoryMapping.category_id, input.category_id));
				targetProductIds = mappings.map((m) => m.product_id);
			} else {
				const all = await db
					.select({ id: products.id })
					.from(products)
					.limit(200);
				targetProductIds = all.map((p) => p.id);
			}

			if (targetProductIds.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No products matched the selected audit criteria.",
				});
			}

			// Capture frozen inventory snapshot for the branch
			const prods = await db
				.select()
				.from(products)
				.where(inArray(products.id, targetProductIds));

			const branchInvRows = await db
				.select()
				.from(branchInventory)
				.where(
					and(
						eq(branchInventory.branch_id, input.branch_id),
						inArray(branchInventory.product_id, targetProductIds),
					),
				);

			const branchStockMap = new Map<number, number>();
			for (const row of branchInvRows) {
				branchStockMap.set(row.product_id, Number(row.in_stock || 0));
			}

			// Generate human-friendly sequential audit number: AUD-YYYY-XXXX
			const year = new Date().getFullYear();
			const countResult = getRows(
				await db.execute<{ count: number }>(sql`
					SELECT coalesce(count(*), 0)::int as count FROM stock_audits
				`),
			);
			const nextNum = Number(countResult[0]?.count || 0) + 1;
			const auditNumber = `AUD-${year}-${String(nextNum).padStart(4, "0")}`;

			const [newAudit] = await db
				.insert(stockAudits)
				.values({
					audit_number: auditNumber,
					title: input.title,
					branch_id: input.branch_id,
					auditor_id: input.auditor_id,
					assigned_by: managerStaffId,
					assigned_at: new Date(),
					status: "planned",
					audit_type: input.audit_type,
					counting_method: input.counting_method,
					priority: input.priority,
					location_name: input.location_name,
					start_date: input.start_date ? new Date(input.start_date) : new Date(),
					due_date: input.due_date ? new Date(input.due_date) : undefined,
					notes: input.notes,
				})
				.returning();

			// Freeze snapshot expected_qty into stock_audit_items
			const auditItemsToInsert = prods.map((p) => {
				const expectedStock = branchStockMap.get(p.id) ?? 0;

				return {
					audit_id: newAudit.id,
					product_id: p.id,
					location_id: null,
					expected_qty: expectedStock,
					counted_qty: null,
					status: "pending",
					discrepancy_reason: null,
					remarks: null,
				};
			});

			await db.insert(stockAuditItems).values(auditItemsToInsert);

			// Log immutable audit record
			await logAudit(db, {
				userId: managerStaffId,
				action: "STOCK_AUDIT_CREATE",
				entityType: "stock_audits",
				entityId: newAudit.id,
				newValues: {
					audit_number: auditNumber,
					title: input.title,
					branch_id: input.branch_id,
					auditor_id: input.auditor_id,
					items_count: auditItemsToInsert.length,
					counting_method: input.counting_method,
				},
			});

			// Notify assigned auditor/employee
			try {
				await notify(db, {
					branchId: input.branch_id,
					userId: input.auditor_id,
					type: "audit_assigned",
					priority:
						input.priority === "urgent" || input.priority === "high"
							? "high"
							: "normal",
					title: `New Stock Audit Assigned: ${auditNumber}`,
					message: `You have been assigned to conduct ${input.counting_method} stock audit "${input.title}" with ${auditItemsToInsert.length} lines.`,
					referenceType: "stock_audits",
					referenceId: newAudit.id,
				});
			} catch (e) {
				console.warn("Notification dispatch skipped:", e);
			}

			return newAudit;
		}),

	// ── Employee Workspace: Get My Assigned Audits ───────────────────────────
	getMyAudits: protectedProcedure
		.input(
			z
				.object({
					status: z.enum(["active", "completed", "all"]).default("active"),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);

			if (!staffId && !ctx.user.isSuperadmin) {
				return [];
			}

			const conds = [];
			if (staffId && !ctx.user.isSuperadmin) {
				conds.push(eq(stockAudits.auditor_id, staffId));
			}

			if (input?.status === "active") {
				conds.push(
					inArray(stockAudits.status, [
						"planned",
						"in_progress",
						"recount_requested",
					]),
				);
			} else if (input?.status === "completed") {
				conds.push(
					inArray(stockAudits.status, [
						"completed",
						"discrepancy_review",
						"reconciled",
					]),
				);
			}

			const audits = await db
				.select()
				.from(stockAudits)
				.where(conds.length > 0 ? and(...conds) : undefined)
				.orderBy(desc(stockAudits.created_at))
				.limit(50);

			if (audits.length === 0) return [];

			const auditIds = audits.map((a) => a.id);
			const branchIds = Array.from(
				new Set(audits.map((a) => a.branch_id).filter(Boolean)),
			);

			let branchMap = new Map();
			if (branchIds.length > 0) {
				const bList = await db
					.select()
					.from(branches)
					.where(inArray(branches.id, branchIds));
				branchMap = new Map(bList.map((b) => [b.id, b]));
			}

			const items = await db
				.select()
				.from(stockAuditItems)
				.where(inArray(stockAuditItems.audit_id, auditIds));

			const itemsByAudit = new Map<number, any[]>();
			for (const it of items) {
				const list = itemsByAudit.get(it.audit_id) || [];
				list.push(it);
				itemsByAudit.set(it.audit_id, list);
			}

			return audits.map((audit) => {
				const auditItems = itemsByAudit.get(audit.id) || [];
				const totalLines = auditItems.length;
				const countedLines = auditItems.filter(
					(i) => i.counted_qty !== null,
				).length;
				const recountNeeded = auditItems.filter(
					(i) => i.status === "recount_requested",
				).length;

				return {
					...audit,
					branch: branchMap.get(audit.branch_id) || null,
					totalLines,
					countedLines,
					recountNeeded,
					progressPercent:
						totalLines > 0 ? Math.round((countedLines / totalLines) * 100) : 0,
				};
			});
		}),

	// ── Auditor/Employee: Start Physical Count ────────────────────────────────
	startAudit: permProcedure("inventory_audit", "write")
		.input(z.object({ audit_id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);

			const [updated] = await db
				.update(stockAudits)
				.set({
					status: "in_progress",
					start_date: new Date(),
				})
				.where(eq(stockAudits.id, input.audit_id))
				.returning();

			await logAudit(db, {
				userId: staffId,
				action: "STOCK_AUDIT_STARTED",
				entityType: "stock_audits",
				entityId: input.audit_id,
				newValues: { status: "in_progress" },
			});

			return updated;
		}),

	// ── Employee: Save Draft Physical Counts (Autosave & Zero-Count Support) ──
	recordCountProgress: permProcedure("inventory_audit", "write")
		.input(
			z.object({
				audit_id: z.number(),
				items: z.array(
					z.object({
						item_id: z.number(),
						counted_qty: z.number().min(0),
						remarks: z.string().optional(),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);

			for (const item of input.items) {
				await db
					.update(stockAuditItems)
					.set({
						counted_qty: item.counted_qty,
						remarks: item.remarks,
						status: "counted",
					})
					.where(eq(stockAuditItems.id, item.item_id));
			}

			// Ensure audit status reflects in_progress
			await db
				.update(stockAudits)
				.set({ status: "in_progress" })
				.where(
					and(
						eq(stockAudits.id, input.audit_id),
						eq(stockAudits.status, "planned"),
					),
				);

			await logAudit(db, {
				userId: staffId,
				action: "STOCK_AUDIT_PROGRESS_SAVED",
				entityType: "stock_audits",
				entityId: input.audit_id,
				newValues: { lines_updated: input.items.length },
			});

			return { success: true };
		}),

	// ── Employee: Finalize and Submit Count Lines (Variance Computation) ──────
	submitCountLines: permProcedure("inventory_audit", "write")
		.input(
			z.object({
				audit_id: z.number(),
				items: z.array(
					z.object({
						item_id: z.number(),
						counted_qty: z.number().min(0),
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
			let discrepancyCount = 0;

			// Fetch products for pricing calculation
			const [audit] = await db
				.select()
				.from(stockAudits)
				.where(eq(stockAudits.id, input.audit_id))
				.limit(1);

			for (const item of input.items) {
				const [existing] = await db
					.select()
					.from(stockAuditItems)
					.where(eq(stockAuditItems.id, item.item_id))
					.limit(1);

				if (existing) {
					const expected = existing.expected_qty ?? 0;
					const counted = item.counted_qty;
					const variance = counted - expected;
					const status = variance === 0 ? "match" : "mismatch";

					await db
						.update(stockAuditItems)
						.set({
							counted_qty: counted,
							variance_qty: variance,
							status,
							discrepancy_reason: item.discrepancy_reason,
							remarks: item.remarks,
							submitted_at: new Date(),
						})
						.where(eq(stockAuditItems.id, item.item_id));

					if (variance !== 0) {
						hasDiscrepancy = true;
						discrepancyCount++;

						// Fetch product cost price for valuation
						const [prod] = await db
							.select()
							.from(products)
							.where(eq(products.id, existing.product_id))
							.limit(1);

						const unitCost = Number(
							prod?.base_procurement_price || prod?.price || 0,
						);
						const varianceValue = Math.abs(variance) * unitCost;

						const discType = variance < 0 ? "missing" : "excess";

						await db.insert(auditDiscrepancies).values({
							audit_item_id: item.item_id,
							discrepancy_type: discType,
							quantity: Math.abs(variance),
							variance_value: String(varianceValue),
							reason:
								item.discrepancy_reason ||
								item.remarks ||
								`Variance of ${variance > 0 ? "+" : ""}${variance} units identified during count.`,
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
				action: "STOCK_AUDIT_SUBMITTED",
				entityType: "stock_audits",
				entityId: input.audit_id,
				newValues: {
					status: finalStatus,
					has_discrepancy: hasDiscrepancy,
					discrepancy_count: discrepancyCount,
				},
			});

			// Notify assigner / warehouse supervisor
			if (audit?.assigned_by) {
				try {
					await notify(db, {
						branchId: audit.branch_id,
						userId: audit.assigned_by,
						type: "audit_submitted",
						priority: hasDiscrepancy ? "high" : "normal",
						title: `Stock Count Submitted: ${audit.audit_number || audit.id}`,
						message: hasDiscrepancy
							? `Count submitted with ${discrepancyCount} discrepancy lines. Action required.`
							: `Physical count submitted with 100% match. Ready for final review.`,
						referenceType: "stock_audits",
						referenceId: audit.id,
					});
				} catch (e) {
					console.warn("Notification skipped:", e);
				}
			}

			return {
				success: true,
				status: finalStatus,
				discrepancyCount,
				audit: updated,
			};
		}),

	// ── Warehouse Manager: Request Physical Recount (Preserves History) ───────
	requestRecount: permProcedure("inventory_audit", "write")
		.input(
			z.object({
				audit_id: z.number(),
				item_ids: z.array(z.number()).min(1),
				recount_notes: z.string().min(1, "Recount reason is required"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const managerStaffId = await resolveStaffId(db, ctx.user.email);

			// Mark individual audit lines for recount without erasing original counted_qty
			await db
				.update(stockAuditItems)
				.set({
					status: "recount_requested",
					recount_notes: input.recount_notes,
					recount_requested_at: new Date(),
				})
				.where(
					and(
						eq(stockAuditItems.audit_id, input.audit_id),
						inArray(stockAuditItems.id, input.item_ids),
					),
				);

			// Update audit status
			const [updated] = await db
				.update(stockAudits)
				.set({
					status: "recount_requested",
					review_notes: input.recount_notes,
				})
				.where(eq(stockAudits.id, input.audit_id))
				.returning();

			await logAudit(db, {
				userId: managerStaffId,
				action: "STOCK_AUDIT_RECOUNT_REQUESTED",
				entityType: "stock_audits",
				entityId: input.audit_id,
				newValues: {
					item_ids: input.item_ids,
					recount_notes: input.recount_notes,
				},
			});

			// Notify assigned auditor of recount requirement
			if (updated.auditor_id) {
				try {
					await notify(db, {
						branchId: updated.branch_id,
						userId: updated.auditor_id,
						type: "audit_recount_requested",
						priority: "high",
						title: `Recount Requested: ${updated.audit_number || updated.id}`,
						message: `Manager requested recount for ${input.item_ids.length} lines: "${input.recount_notes}"`,
						referenceType: "stock_audits",
						referenceId: updated.id,
					});
				} catch (e) {
					console.warn("Notification skipped:", e);
				}
			}

			return updated;
		}),

	// ── Employee: Submit Recount Lines (Records Recount Without Overwriting) ──
	submitRecount: permProcedure("inventory_audit", "write")
		.input(
			z.object({
				audit_id: z.number(),
				items: z.array(
					z.object({
						item_id: z.number(),
						recount_qty: z.number().min(0),
						notes: z.string().optional(),
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
					const recountVariance = item.recount_qty - expected;

					await db
						.update(stockAuditItems)
						.set({
							recount_qty: item.recount_qty,
							recount_by: staffId,
							recount_notes: item.notes || existing.recount_notes,
							variance_qty: recountVariance,
							status: recountVariance === 0 ? "match" : "mismatch",
						})
						.where(eq(stockAuditItems.id, item.item_id));
				}
			}

			// Transition back to review
			const [updated] = await db
				.update(stockAudits)
				.set({
					status: "discrepancy_review",
				})
				.where(eq(stockAudits.id, input.audit_id))
				.returning();

			await logAudit(db, {
				userId: staffId,
				action: "STOCK_AUDIT_RECOUNT_SUBMITTED",
				entityType: "stock_audits",
				entityId: input.audit_id,
				newValues: { recounted_lines: input.items.length },
			});

			return updated;
		}),

	// ── Manager: Accept Specific Line Quantities Before Final Reconciliation ──
	acceptLineCount: permProcedure("inventory_audit", "approve")
		.input(
			z.object({
				audit_id: z.number(),
				items: z.array(
					z.object({
						item_id: z.number(),
						accepted_qty: z.number().min(0),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const managerStaffId = await resolveStaffId(db, ctx.user.email);

			for (const item of input.items) {
				const [existing] = await db
					.select()
					.from(stockAuditItems)
					.where(eq(stockAuditItems.id, item.item_id))
					.limit(1);

				if (existing) {
					const expected = existing.expected_qty ?? 0;
					const variance = item.accepted_qty - expected;

					await db
						.update(stockAuditItems)
						.set({
							final_accepted_qty: item.accepted_qty,
							variance_qty: variance,
							adjustment_status: variance !== 0 ? "approved" : "none",
						})
						.where(eq(stockAuditItems.id, item.item_id));
				}
			}

			await logAudit(db, {
				userId: managerStaffId,
				action: "STOCK_AUDIT_LINES_ACCEPTED",
				entityType: "stock_audits",
				entityId: input.audit_id,
				newValues: { line_count: input.items.length },
			});

			return { success: true };
		}),

	// ── Manager Reconciliation & Atomic Ledger Posting (Idempotency Gated) ────
	reconcileAudit: permProcedure("inventory_audit", "approve")
		.input(
			z.object({
				audit_id: z.number(),
				notes: z.string().optional(),
				apply_adjustments: z.boolean().default(true),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);

			const [audit] = await db
				.select()
				.from(stockAudits)
				.where(eq(stockAudits.id, input.audit_id))
				.limit(1);

			if (!audit) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Audit record not found.",
				});
			}

			// Idempotency check: prevent duplicate posting of adjustments
			if (audit.status === "completed" && audit.reconciled_at !== null) {
				throw new TRPCError({
					code: "CONFLICT",
					message:
						"This audit has already been reconciled and ledger adjustments posted.",
				});
			}

			const items = await db
				.select()
				.from(stockAuditItems)
				.where(eq(stockAuditItems.audit_id, input.audit_id));

			let adjustedLinesCount = 0;

			// Process each line item
			for (const item of items) {
				const expected = item.expected_qty ?? 0;
				// Determine effective physical quantity
				const effectiveCount =
					item.final_accepted_qty !== null
						? Number(item.final_accepted_qty)
						: item.recount_qty !== null
							? Number(item.recount_qty)
							: item.counted_qty !== null
								? Number(item.counted_qty)
								: expected;

				const delta = effectiveCount - expected;

				if (delta !== 0 && input.apply_adjustments) {
					adjustedLinesCount++;
					const isAddition = delta > 0;
					const absQuantity = Math.abs(delta);

					// 1. Post to stockAdjustments
					const [adjustment] = await db
						.insert(stockAdjustments)
						.values({
							product_id: item.product_id,
							quantity: String(absQuantity),
							adjustment_type: isAddition ? "addition" : "subtraction",
							reason: `Inventory Audit Reconciliation (${audit.audit_number || audit.id})`,
							reference_document: audit.audit_number || `AUD-${audit.id}`,
							created_by: staffId,
						})
						.returning();

					// 2. Post to stockLedger for FIFO audit compliance
					const [prod] = await db
						.select()
						.from(products)
						.where(eq(products.id, item.product_id))
						.limit(1);
					const unitCost = Number(
						prod?.base_procurement_price || prod?.price || 0,
					);

					await db.insert(stockLedger).values({
						branch_id: audit.branch_id,
						product_id: item.product_id,
						transaction_type: isAddition ? "in" : "out",
						quantity: String(absQuantity),
						unit_cost: String(unitCost),
						total_cost: String(absQuantity * unitCost),
						reference_type: "audit_reconciliation",
						reference_id: audit.id,
					});

					// 3. Update branchInventory
					const [existingBranchInv] = await db
						.select()
						.from(branchInventory)
						.where(
							and(
								eq(branchInventory.branch_id, audit.branch_id),
								eq(branchInventory.product_id, item.product_id),
							),
						)
						.limit(1);

					if (existingBranchInv) {
						const currentStock = Number(existingBranchInv.in_stock || 0);
						const newStock = Math.max(0, currentStock + delta);
						await db
							.update(branchInventory)
							.set({ in_stock: String(newStock) })
							.where(eq(branchInventory.id, existingBranchInv.id));
					} else {
						await db.insert(branchInventory).values({
							branch_id: audit.branch_id,
							product_id: item.product_id,
							in_stock: String(Math.max(0, delta)),
						});
					}

					// 4. Update stockAuditItems with adjustment link
					await db
						.update(stockAuditItems)
						.set({
							final_accepted_qty: effectiveCount,
							variance_qty: delta,
							adjustment_status: "posted",
							adjustment_id: adjustment.id,
						})
						.where(eq(stockAuditItems.id, item.id));
				} else {
					await db
						.update(stockAuditItems)
						.set({
							final_accepted_qty: effectiveCount,
							variance_qty: delta,
							adjustment_status: "none",
						})
						.where(eq(stockAuditItems.id, item.id));
				}
			}

			// Mark all discrepancies for this audit as resolved/approved
			const itemIds = items.map((i) => i.id);
			if (itemIds.length > 0) {
				await db
					.update(auditDiscrepancies)
					.set({
						resolution_status: "approved",
						resolved_by: staffId,
						resolved_at: new Date(),
						investigation_notes: input.notes || "Reconciled by manager",
					})
					.where(inArray(auditDiscrepancies.audit_item_id, itemIds));
			}

			// Mark audit as completed and reconciled
			const [reconciledAudit] = await db
				.update(stockAudits)
				.set({
					status: "completed",
					reconciled_by: staffId,
					reconciled_at: new Date(),
					completed_at: new Date(),
					review_notes: input.notes,
				})
				.where(eq(stockAudits.id, input.audit_id))
				.returning();

			await logAudit(db, {
				userId: staffId,
				action: "STOCK_AUDIT_RECONCILED",
				entityType: "stock_audits",
				entityId: input.audit_id,
				newValues: {
					audit_number: audit.audit_number,
					adjusted_lines: adjustedLinesCount,
					notes: input.notes,
				},
			});

			return {
				success: true,
				audit: reconciledAudit,
				adjustedLinesCount,
			};
		}),

	// ── Manager: Cancel Audit ────────────────────────────────────────────────
	cancelAudit: permProcedure("inventory_audit", "write")
		.input(
			z.object({
				audit_id: z.number(),
				reason: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);

			const [updated] = await db
				.update(stockAudits)
				.set({
					status: "cancelled",
					notes: input.reason,
				})
				.where(eq(stockAudits.id, input.audit_id))
				.returning();

			await logAudit(db, {
				userId: staffId,
				action: "STOCK_AUDIT_CANCELLED",
				entityType: "stock_audits",
				entityId: input.audit_id,
				newValues: { reason: input.reason },
			});

			return updated;
		}),

	// ── Legacy Compatibility Helpers ──────────────────────────────────────────
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
				const allProds = await db.select().from(products).limit(50);
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
							reason:
								item.discrepancy_reason ||
								item.remarks ||
								"Physical count variance",
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

	reviewAudit: permProcedure("inventory_audit", "approve")
		.input(
			z.object({
				audit_id: z.number(),
				action: z.enum(["approve", "reject"]),
				notes: z.string().optional(),
				discrepancy_resolutions: z
					.array(
						z.object({
							discrepancy_id: z.number(),
							action: z.enum([
								"adjust_stock",
								"write_off",
								"investigate",
								"dismiss",
							]),
							notes: z.string().optional(),
						}),
					)
					.optional(),
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
				newValues: {
					branch_id: input.branch_id,
					auditor_id: input.auditor_id,
				},
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
			const status =
				input.counted_qty === input.expected_qty ? "match" : "mismatch";
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
