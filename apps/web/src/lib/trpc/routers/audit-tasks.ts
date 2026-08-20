import { correctiveActions, stockAudits, upcTasks } from "@evaluna/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { router } from "../init";
import { permProcedure } from "../util/auditor-procedures";

/**
 * Unified auditor task feed. Read-only aggregation across the three task-bearing
 * tables (UPC tasks, corrective actions, stock audits). Each row is normalised to
 * a common shape so the UI can render one list with category/status/overdue
 * filters. Mutations live in each domain's own router.
 */
type FeedItem = {
	source: "upc" | "corrective_action" | "stock_audit";
	id: number;
	title: string;
	status: string;
	assignedTo: number | null;
	dueAt: Date | null;
	createdAt: Date | null;
	overdue: boolean;
};

const UPC_OPEN = ["PENDING", "ASSIGNED", "IN_PROGRESS", "VERIFICATION_REQUIRED"];
const CA_OPEN = ["PENDING", "IN_PROGRESS", "OVERDUE"];
const SA_OPEN = ["planned", "in_progress", "escalated"];

export const auditTasksRouter = router({
	// ── Read: unified feed (client filters by category/status/overdue) ────────
	feed: permProcedure("audit_tasks", "read")
		.input(
			z
				.object({
					onlyOpen: z.boolean().optional(),
					assignedTo: z.number().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const now = Date.now();
			const items: FeedItem[] = [];

			const upcConds = [];
			if (input?.onlyOpen) upcConds.push(inArray(upcTasks.status, UPC_OPEN));
			if (input?.assignedTo) upcConds.push(eq(upcTasks.assigned_to, input.assignedTo));
			const upcRows = await ctx.db
				.select()
				.from(upcTasks)
				.where(upcConds.length ? and(...upcConds) : undefined)
				.orderBy(desc(upcTasks.created_at));
			for (const t of upcRows) {
				items.push({
					source: "upc",
					id: t.id,
					title: `UPC ${t.task_type} — product #${t.product_id}`,
					status: t.status,
					assignedTo: t.assigned_to ?? null,
					dueAt: t.due_at ?? null,
					createdAt: t.created_at ?? null,
					overdue: !!t.due_at && new Date(t.due_at).getTime() < now && UPC_OPEN.includes(t.status),
				});
			}

			const caConds = [];
			if (input?.onlyOpen) caConds.push(inArray(correctiveActions.status, CA_OPEN));
			if (input?.assignedTo) caConds.push(eq(correctiveActions.assigned_to, input.assignedTo));
			const caRows = await ctx.db
				.select()
				.from(correctiveActions)
				.where(caConds.length ? and(...caConds) : undefined)
				.orderBy(desc(correctiveActions.created_at));
			for (const c of caRows) {
				items.push({
					source: "corrective_action",
					id: c.id,
					title: `Corrective action — finding #${c.finding_id}`,
					status: c.status,
					assignedTo: c.assigned_to ?? null,
					dueAt: c.due_at ?? null,
					createdAt: c.created_at ?? null,
					overdue: !!c.due_at && new Date(c.due_at).getTime() < now && CA_OPEN.includes(c.status),
				});
			}

			const saConds = [];
			if (input?.onlyOpen) saConds.push(inArray(stockAudits.status, SA_OPEN));
			if (input?.assignedTo) saConds.push(eq(stockAudits.auditor_id, input.assignedTo));
			const saRows = await ctx.db
				.select()
				.from(stockAudits)
				.where(saConds.length ? and(...saConds) : undefined)
				.orderBy(desc(stockAudits.created_at));
			for (const s of saRows) {
				items.push({
					source: "stock_audit",
					id: s.id,
					title: `Stock audit — branch #${s.branch_id}`,
					status: s.status ?? "unknown",
					assignedTo: s.auditor_id ?? null,
					dueAt: null,
					createdAt: s.created_at ?? null,
					overdue: false,
				});
			}

			items.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
			return items;
		}),
});
