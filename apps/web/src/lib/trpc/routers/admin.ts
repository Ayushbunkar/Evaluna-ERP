/**
 * Admin router — the backend for the /admin dashboard.
 *
 * Conventions used throughout this file:
 *  - Reads are gated to admin-class roles; writes are gated to admin only.
 *  - Every list query returns a stable envelope: { items, total, page, pageSize,
 *    totalPages }. The admin UI depends on that shape.
 *  - Every input schema tolerates `undefined` (via `.default({})`) so a client
 *    calling `useQuery()` with no argument does not get a BAD_REQUEST.
 *  - Branch scoping is decided on the SERVER. A branch-bound user can never
 *    widen their scope by sending a different branch_id.
 *  - Mutations write an audit_logs row.
 */
import {
	auditLogs,
	bankAccounts,
	branches,
	companies,
	customers,
	enhancedAttendance,
	expenses,
	payroll,
	purchases,
	staff,
	suppliers,
	transactions,
	user,
} from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import {
	and,
	asc,
	count,
	desc,
	eq,
	gte,
	ilike,
	lte,
	ne,
	or,
	sql,
} from "drizzle-orm";
import { z } from "zod";
import { roleProcedure, router } from "../init";

// ── Access tiers ─────────────────────────────────────────────────────────────
// `super_admin` is not a value of user.role — it is the is_superadmin flag —
// but roleProcedure() already bypasses the list for superadmins. It is kept in
// these arrays only for readability/back-compat with existing call sites.
const READ_ROLES = ["admin", "super_admin", "manager"] as const;
const WRITE_ROLES = ["admin", "super_admin"] as const;
const HR_READ_ROLES = ["admin", "super_admin", "manager", "hr"] as const;
const FINANCE_READ_ROLES = [
	"admin",
	"super_admin",
	"manager",
	"auditor",
] as const;

const adminRead = () => roleProcedure([...READ_ROLES]);
const adminWrite = () => roleProcedure([...WRITE_ROLES]);

// ── Shared input fragments ───────────────────────────────────────────────────
const pageInput = {
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(200).default(20),
	sortDir: z.enum(["asc", "desc"]).default("desc"),
};

/** Wraps an object schema so `undefined` input resolves to all-defaults. */
function optionalInput<T extends z.ZodRawShape>(shape: T) {
	return z.object(shape).default({} as never);
}

type Paged<T> = {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

function envelope<T>(
	items: T[],
	total: number,
	page: number,
	pageSize: number,
): Paged<T> {
	return {
		items,
		total,
		page,
		pageSize,
		totalPages: Math.max(1, Math.ceil(total / pageSize)),
	};
}

/**
 * Decides which branch a query may see.
 * A user bound to a branch is locked to it — the requested branch_id is only
 * honoured for unscoped users (superadmin / no branch), which prevents a branch
 * admin from reading another branch by changing a request parameter.
 */
function branchScope(
	ctx: { user: { branchId?: string | number | null; isSuperadmin?: boolean } },
	requested?: number,
): number | null {
	const own = ctx.user.branchId;
	if (own !== null && own !== undefined && own !== "") {
		return Number(own);
	}
	return requested ?? null;
}

/** Case-insensitive LIKE fragment, or undefined when the term is blank. */
function term(search?: string) {
	const t = search?.trim();
	return t ? `%${t}%` : undefined;
}

function toNumber(value: unknown): number {
	const n =
		typeof value === "string" ? Number.parseFloat(value) : Number(value);
	return Number.isFinite(n) ? n : 0;
}

function isoDate(value: unknown): string | null {
	if (!value) return null;
	const d = value instanceof Date ? value : new Date(value as string);
	return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Resolves the acting user to a staff row id, because audit_logs.user_id is an
 * integer FK to staff while the auth user id is a text id on the `user` table.
 * Returns null when the admin has no staff record — the actor is still recorded
 * in the payload, so the trail is never anonymous.
 */
async function actorStaffId(ctx: any): Promise<number | null> {
	try {
		const rows = await ctx.db
			.select({ id: staff.id })
			.from(staff)
			.where(eq(staff.email, ctx.user.email))
			.limit(1);
		return rows[0]?.id ?? null;
	} catch {
		return null;
	}
}

/** Best-effort audit trail. Never fails the mutation it is recording. */
async function writeAudit(
	ctx: any,
	entry: {
		action: string;
		entityType: string;
		entityId?: number | null;
		oldValues?: unknown;
		newValues?: unknown;
	},
) {
	try {
		await ctx.db.insert(auditLogs).values({
			user_id: await actorStaffId(ctx),
			action: entry.action,
			entity_type: entry.entityType,
			entity_id: entry.entityId ?? null,
			old_values: (entry.oldValues ?? null) as never,
			new_values: {
				...(entry.newValues && typeof entry.newValues === "object"
					? entry.newValues
					: { value: entry.newValues ?? null }),
				_actor: {
					id: ctx.user.id,
					email: ctx.user.email,
					name: ctx.user.name,
					role: ctx.user.role,
				},
			} as never,
		});
	} catch (error) {
		console.error("[admin] audit write failed", {
			action: entry.action,
			entityType: entry.entityType,
			entityId: entry.entityId,
			error,
		});
	}
}

/** Turns a Postgres unique-violation into a message an admin can act on. */
function rethrowDbError(error: any, context: string): never {
	const code = error?.code ?? error?.cause?.code;
	const constraint = error?.constraint ?? error?.cause?.constraint_name;
	if (code === "23505" || code === "230505") {
		throw new TRPCError({
			code: "CONFLICT",
			message: `That ${context} already exists (duplicate ${
				constraint?.includes("email")
					? "email"
					: constraint?.includes("code")
						? "code"
						: "value"
			}).`,
		});
	}
	if (code === "23503") {
		throw new TRPCError({
			code: "CONFLICT",
			message: `This ${context} is still referenced by other records and cannot be removed.`,
		});
	}
	if (code === "23502") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `A required field for this ${context} was missing.`,
		});
	}
	console.error(`[admin] ${context} operation failed`, error);
	throw new TRPCError({
		code: "INTERNAL_SERVER_ERROR",
		message: `Unable to complete the ${context} operation.`,
	});
}

function notFound(what: string): never {
	throw new TRPCError({ code: "NOT_FOUND", message: `${what} not found.` });
}

// ── Sort whitelists ──────────────────────────────────────────────────────────
const EMPLOYEE_SORT = {
	name: staff.name,
	code: staff.staff_code,
	department: staff.department,
	role: staff.role,
	status: staff.status,
	join_date: staff.join_date,
	salary: staff.salary,
	created_at: staff.created_at,
} as const;

const SUPPLIER_SORT = {
	name: suppliers.name,
	code: suppliers.supplier_code,
	outstanding: suppliers.outstanding_balance,
	category: suppliers.supplier_category,
	created_at: suppliers.created_at,
} as const;

const CUSTOMER_SORT = {
	name: customers.name,
	code: customers.customer_code,
	status: customers.status,
	type: customers.customer_type,
	credit_used: customers.credit_used,
	credit_limit: customers.credit_limit,
	created_at: customers.created_at,
} as const;

const COMPANY_SORT = {
	name: companies.name,
	status: companies.status,
	created_at: companies.created_at,
} as const;

const BRANCH_SORT = {
	name: branches.name,
	code: branches.code,
	created_at: branches.created_at,
} as const;

const TRANSACTION_SORT = {
	created_at: transactions.created_at,
	amount: transactions.amount,
	type: transactions.type,
} as const;

function orderBy(
	map: Record<string, any>,
	key: string | undefined,
	dir: "asc" | "desc",
	fallback: string,
) {
	const column = map[key ?? ""] ?? map[fallback];
	return dir === "asc" ? asc(column) : desc(column);
}

export const adminRouter = router({
	// ════════════════════════════════════════════════════════════════════════
	// Dashboard
	// ════════════════════════════════════════════════════════════════════════
	getDashboardStats: adminRead()
		.input(optionalInput({ branch_id: z.number().int().optional() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const branchId = branchScope(ctx, input.branch_id);
			const inBranch = (column: any) =>
				branchId !== null ? eq(column, branchId) : undefined;

			const [
				totalCompanies,
				activeCompanies,
				totalUsers,
				activeUsers,
				totalEmployees,
				activeEmployees,
				presentToday,
				onLeaveCount,
				payrollPendingCount,
				newHiresThisMonth,
				totalSuppliers,
				totalCustomers,
				activeCustomers,
				totalBranches,
				monthlyRevenue,
				monthlyExpenses,
				receivables,
				payables,
			] = await Promise.all([
				db.select({ count: count() }).from(companies),
				db
					.select({ count: count() })
					.from(companies)
					.where(eq(companies.status, "active")),
				db.select({ count: count() }).from(user),
				db
					.select({ count: count() })
					.from(user)
					.where(eq(user.is_active, true)),
				db
					.select({ count: count() })
					.from(staff)
					.where(and(eq(staff.is_deleted, false), inBranch(staff.branch_id))),
				db
					.select({ count: count() })
					.from(staff)
					.where(
						and(
							eq(staff.is_deleted, false),
							eq(staff.status, "active"),
							inBranch(staff.branch_id),
						),
					),
				db
					.select({ count: count() })
					.from(enhancedAttendance)
					.innerJoin(staff, eq(enhancedAttendance.employeeId, staff.id))
					.where(
						and(
							eq(enhancedAttendance.date, sql`CURRENT_DATE`),
							eq(enhancedAttendance.status, "present"),
							eq(staff.is_deleted, false),
							inBranch(staff.branch_id),
						),
					),
				db
					.select({ count: count() })
					.from(enhancedAttendance)
					.innerJoin(staff, eq(enhancedAttendance.employeeId, staff.id))
					.where(
						and(
							eq(enhancedAttendance.date, sql`CURRENT_DATE`),
							eq(enhancedAttendance.status, "leave"),
							eq(staff.is_deleted, false),
							inBranch(staff.branch_id),
						),
					),
				db
					.select({ count: count() })
					.from(payroll)
					.where(
						and(
							eq(payroll.month, sql`TO_CHAR(CURRENT_DATE, 'YYYY-MM')`),
							ne(payroll.status, "paid"),
							inBranch(payroll.branch_id),
						),
					),
				db
					.select({ count: count() })
					.from(staff)
					.where(
						and(
							eq(staff.is_deleted, false),
							sql`${staff.join_date} >= DATE_TRUNC('month', CURRENT_DATE)`,
							sql`${staff.join_date} < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`,
							inBranch(staff.branch_id),
						),
					),
				db.select({ count: count() }).from(suppliers),
				db
					.select({ count: count() })
					.from(customers)
					.where(
						and(eq(customers.is_deleted, false), inBranch(customers.branch_id)),
					),
				db
					.select({ count: count() })
					.from(customers)
					.where(
						and(
							eq(customers.is_deleted, false),
							eq(customers.status, "active"),
							inBranch(customers.branch_id),
						),
					),
				db.select({ count: count() }).from(branches),
				db
					.select({
						total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
					})
					.from(transactions)
					.where(
						and(
							eq(transactions.type, "in"),
							gte(
								transactions.created_at,
								sql`DATE_TRUNC('month', CURRENT_DATE)`,
							),
							inBranch(transactions.branch_id),
						),
					),
				db
					.select({ total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)` })
					.from(expenses)
					.where(
						and(
							gte(expenses.created_at, sql`DATE_TRUNC('month', CURRENT_DATE)`),
							inBranch(expenses.branch_id),
						),
					),
				db
					.select({
						total: sql<string>`COALESCE(SUM(${customers.credit_used}), 0)`,
					})
					.from(customers)
					.where(
						and(eq(customers.is_deleted, false), inBranch(customers.branch_id)),
					),
				db
					.select({
						total: sql<string>`COALESCE(SUM(${suppliers.outstanding_balance}), 0)`,
					})
					.from(suppliers),
			]);

			const monthlyRev = toNumber(monthlyRevenue[0]?.total);
			const monthlyExp = toNumber(monthlyExpenses[0]?.total);

			return {
				branchScope: branchId,
				totalCompanies: totalCompanies[0]?.count ?? 0,
				activeCompanies: activeCompanies[0]?.count ?? 0,
				totalUsers: totalUsers[0]?.count ?? 0,
				activeUsers: activeUsers[0]?.count ?? 0,
				totalEmployees: totalEmployees[0]?.count ?? 0,
				activeEmployees: activeEmployees[0]?.count ?? 0,
				presentToday: presentToday[0]?.count ?? 0,
				onLeave: onLeaveCount[0]?.count ?? 0,
				payrollPending: payrollPendingCount[0]?.count ?? 0,
				newHiresThisMonth: newHiresThisMonth[0]?.count ?? 0,
				totalSuppliers: totalSuppliers[0]?.count ?? 0,
				totalCustomers: totalCustomers[0]?.count ?? 0,
				activeCustomers: activeCustomers[0]?.count ?? 0,
				totalBranches: totalBranches[0]?.count ?? 0,
				monthlyRevenue: monthlyRev,
				monthlyExpenses: monthlyExp,
				netProfit: monthlyRev - monthlyExp,
				totalReceivables: toNumber(receivables[0]?.total),
				totalPayables: toNumber(payables[0]?.total),
			};
		}),

	/** Monthly revenue vs expense series for the dashboard chart. */
	getRevenueSeries: adminRead()
		.input(
			optionalInput({
				months: z.number().int().min(1).max(24).default(6),
				branch_id: z.number().int().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const branchId = branchScope(ctx, input.branch_id);
			const since = sql`DATE_TRUNC('month', CURRENT_DATE) - MAKE_INTERVAL(months => ${input.months - 1})`;

			const [income, spend] = await Promise.all([
				db
					.select({
						month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${transactions.created_at}), 'YYYY-MM')`,
						total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
					})
					.from(transactions)
					.where(
						and(
							eq(transactions.type, "in"),
							gte(transactions.created_at, since),
							branchId !== null
								? eq(transactions.branch_id, branchId)
								: undefined,
						),
					)
					.groupBy(sql`DATE_TRUNC('month', ${transactions.created_at})`),
				db
					.select({
						month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${expenses.created_at}), 'YYYY-MM')`,
						total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
					})
					.from(expenses)
					.where(
						and(
							gte(expenses.created_at, since),
							branchId !== null ? eq(expenses.branch_id, branchId) : undefined,
						),
					)
					.groupBy(sql`DATE_TRUNC('month', ${expenses.created_at})`),
			]);

			const byMonth = new Map<string, { revenue: number; expenses: number }>();
			for (const row of income) {
				byMonth.set(row.month, { revenue: toNumber(row.total), expenses: 0 });
			}
			for (const row of spend) {
				const existing = byMonth.get(row.month) ?? { revenue: 0, expenses: 0 };
				existing.expenses = toNumber(row.total);
				byMonth.set(row.month, existing);
			}

			return [...byMonth.entries()]
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([month, v]) => ({
					month,
					revenue: v.revenue,
					expenses: v.expenses,
					profit: v.revenue - v.expenses,
				}));
		}),

	// ════════════════════════════════════════════════════════════════════════
	// Employees (staff table)
	// ════════════════════════════════════════════════════════════════════════
	getEmployees: roleProcedure([...HR_READ_ROLES])
		.input(
			optionalInput({
				...pageInput,
				sortBy: z
					.enum([
						"name",
						"code",
						"department",
						"role",
						"status",
						"join_date",
						"salary",
						"created_at",
					])
					.default("created_at"),
				branch_id: z.number().int().optional(),
				search: z.string().optional(),
				department: z.string().optional(),
				role: z.string().optional(),
				status: z.enum(["active", "inactive"]).optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const branchId = branchScope(ctx, input.branch_id);
			const like = term(input.search);

			const where = and(
				eq(staff.is_deleted, false),
				branchId !== null ? eq(staff.branch_id, branchId) : undefined,
				input.department ? eq(staff.department, input.department) : undefined,
				input.role ? eq(staff.role, input.role) : undefined,
				input.status ? eq(staff.status, input.status) : undefined,
				like
					? or(
							ilike(staff.name, like),
							ilike(staff.staff_code, like),
							ilike(staff.email, like),
							ilike(staff.phone, like),
						)
					: undefined,
			);

			const [rows, totals] = await Promise.all([
				db
					.select({
						id: staff.id,
						staff_code: staff.staff_code,
						name: staff.name,
						email: staff.email,
						phone: staff.phone,
						department: staff.department,
						role: staff.role,
						status: staff.status,
						branch_id: staff.branch_id,
						branch_name: branches.name,
						join_date: staff.join_date,
						salary: staff.salary,
						created_at: staff.created_at,
					})
					.from(staff)
					.leftJoin(branches, eq(staff.branch_id, branches.id))
					.where(where)
					.orderBy(
						orderBy(EMPLOYEE_SORT, input.sortBy, input.sortDir, "created_at"),
					)
					.limit(input.pageSize)
					.offset((input.page - 1) * input.pageSize),
				db.select({ count: count() }).from(staff).where(where),
			]);

			return envelope(
				rows.map((r: any) => ({
					id: r.id,
					emp_code: r.staff_code || `EMP-${r.id}`,
					name: r.name,
					email: r.email ?? null,
					phone: r.phone ?? null,
					department: r.department ?? null,
					role: r.role ?? null,
					status: r.status ?? "active",
					branch_id: r.branch_id ?? null,
					branch_name: r.branch_name ?? null,
					join_date: isoDate(r.join_date),
					salary: toNumber(r.salary),
					created_at: isoDate(r.created_at),
				})),
				totals[0]?.count ?? 0,
				input.page,
				input.pageSize,
			);
		}),

	/** Distinct departments and roles present in staff — powers the filter menus. */
	getEmployeeFacets: roleProcedure([...HR_READ_ROLES])
		.input(optionalInput({ branch_id: z.number().int().optional() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const branchId = branchScope(ctx, input.branch_id);
			const where = and(
				eq(staff.is_deleted, false),
				branchId !== null ? eq(staff.branch_id, branchId) : undefined,
			);
			const [departments, roles] = await Promise.all([
				db
					.selectDistinct({ value: staff.department })
					.from(staff)
					.where(where)
					.orderBy(asc(staff.department)),
				db
					.selectDistinct({ value: staff.role })
					.from(staff)
					.where(where)
					.orderBy(asc(staff.role)),
			]);
			return {
				departments: departments
					.map((d: any) => d.value)
					.filter(
						(v: unknown): v is string => typeof v === "string" && v.length > 0,
					),
				roles: roles
					.map((d: any) => d.value)
					.filter(
						(v: unknown): v is string => typeof v === "string" && v.length > 0,
					),
			};
		}),

	getEmployee: roleProcedure([...HR_READ_ROLES])
		.input(z.object({ id: z.number().int() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const branchId = branchScope(ctx);
			const rows = await db
				.select({
					employee: staff,
					branch_name: branches.name,
				})
				.from(staff)
				.leftJoin(branches, eq(staff.branch_id, branches.id))
				.where(
					and(
						eq(staff.id, input.id),
						eq(staff.is_deleted, false),
						branchId !== null ? eq(staff.branch_id, branchId) : undefined,
					),
				)
				.limit(1);

			const row = rows[0];
			if (!row) notFound("Employee");
			const e = row.employee;
			return {
				id: e.id,
				emp_code: e.staff_code || `EMP-${e.id}`,
				name: e.name,
				email: e.email ?? null,
				phone: e.phone ?? null,
				address: e.address ?? null,
				department: e.department ?? null,
				role: e.role ?? null,
				status: e.status ?? "active",
				branch_id: e.branch_id ?? null,
				branch_name: row.branch_name ?? null,
				join_date: isoDate(e.join_date),
				salary: toNumber(e.salary),
				monthly_sales_target: toNumber(e.monthly_sales_target),
				pf_number: e.pf_number ?? null,
				pan: e.pan ?? null,
				bank_name: e.bank_name ?? null,
				bank_account: e.bank_account ?? null,
				ifsc: e.ifsc ?? null,
				created_at: isoDate(e.created_at),
				updated_at: isoDate(e.updated_at),
			};
		}),

	createEmployee: adminWrite()
		.input(
			z.object({
				name: z.string().trim().min(2).max(255),
				email: z.string().trim().toLowerCase().email(),
				phone: z.string().trim().max(20).optional().or(z.literal("")),
				address: z.string().trim().max(500).optional().or(z.literal("")),
				role: z.string().trim().min(1).max(50),
				department: z.string().trim().max(50).optional().or(z.literal("")),
				join_date: z.string().min(1),
				salary: z.number().min(0).max(100000000),
				monthly_sales_target: z.number().min(0).optional(),
				branch_id: z.number().int().optional(),
				pf_number: z.string().trim().max(50).optional().or(z.literal("")),
				pan: z
					.string()
					.trim()
					.toUpperCase()
					.max(10)
					.optional()
					.or(z.literal("")),
				bank_name: z.string().trim().max(100).optional().or(z.literal("")),
				bank_account: z.string().trim().max(50).optional().or(z.literal("")),
				ifsc: z
					.string()
					.trim()
					.toUpperCase()
					.max(11)
					.optional()
					.or(z.literal("")),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const joinDate = new Date(input.join_date);
			if (Number.isNaN(joinDate.getTime())) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Joining date is not a valid date.",
				});
			}
			const blank = (v?: string) => (v && v.length > 0 ? v : null);
			try {
				const created = await ctx.db.transaction(async (tx: any) => {
					const [row] = await tx
						.insert(staff)
						.values({
							name: input.name,
							email: input.email,
							phone: blank(input.phone),
							address: blank(input.address),
							role: input.role,
							department: blank(input.department),
							join_date: joinDate,
							salary: input.salary.toString(),
							monthly_sales_target: (
								input.monthly_sales_target ?? 0
							).toString(),
							branch_id: branchScope(ctx, input.branch_id),
							pf_number: blank(input.pf_number),
							pan: blank(input.pan),
							bank_name: blank(input.bank_name),
							bank_account: blank(input.bank_account),
							ifsc: blank(input.ifsc),
							status: "active",
							is_deleted: false,
						})
						.returning();
					const [withCode] = await tx
						.update(staff)
						.set({ staff_code: `EMP-${String(row.id).padStart(5, "0")}` })
						.where(eq(staff.id, row.id))
						.returning();
					return withCode ?? row;
				});
				await writeAudit(ctx, {
					action: "employee.create",
					entityType: "staff",
					entityId: created.id,
					newValues: {
						name: created.name,
						email: created.email,
						role: created.role,
					},
				});
				return {
					id: created.id,
					emp_code: created.staff_code,
					name: created.name,
				};
			} catch (error) {
				rethrowDbError(error, "employee");
			}
		}),

	updateEmployee: adminWrite()
		.input(
			z.object({
				id: z.number().int(),
				name: z.string().trim().min(2).max(255).optional(),
				email: z.string().trim().toLowerCase().email().optional(),
				phone: z.string().trim().max(20).optional().or(z.literal("")),
				address: z.string().trim().max(500).optional().or(z.literal("")),
				role: z.string().trim().min(1).max(50).optional(),
				department: z.string().trim().max(50).optional().or(z.literal("")),
				join_date: z.string().optional(),
				salary: z.number().min(0).max(100000000).optional(),
				monthly_sales_target: z.number().min(0).optional(),
				branch_id: z.number().int().nullable().optional(),
				status: z.enum(["active", "inactive"]).optional(),
				pf_number: z.string().trim().max(50).optional().or(z.literal("")),
				pan: z
					.string()
					.trim()
					.toUpperCase()
					.max(10)
					.optional()
					.or(z.literal("")),
				bank_name: z.string().trim().max(100).optional().or(z.literal("")),
				bank_account: z.string().trim().max(50).optional().or(z.literal("")),
				ifsc: z
					.string()
					.trim()
					.toUpperCase()
					.max(11)
					.optional()
					.or(z.literal("")),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const scope = branchScope(ctx);
			const existingRows = await db
				.select()
				.from(staff)
				.where(
					and(
						eq(staff.id, input.id),
						eq(staff.is_deleted, false),
						scope !== null ? eq(staff.branch_id, scope) : undefined,
					),
				)
				.limit(1);
			const existing = existingRows[0];
			if (!existing) notFound("Employee");

			// Only touch fields that were actually sent, so unrelated columns
			// (aadhaar, code, targets) survive a partial edit.
			const patch: Record<string, unknown> = {};
			const setText = (key: string, value?: string) => {
				if (value !== undefined) patch[key] = value.length > 0 ? value : null;
			};
			if (input.name !== undefined) patch.name = input.name;
			if (input.email !== undefined) patch.email = input.email;
			if (input.role !== undefined) patch.role = input.role;
			if (input.status !== undefined) patch.status = input.status;
			setText("phone", input.phone);
			setText("address", input.address);
			setText("department", input.department);
			setText("pf_number", input.pf_number);
			setText("pan", input.pan);
			setText("bank_name", input.bank_name);
			setText("bank_account", input.bank_account);
			setText("ifsc", input.ifsc);
			if (input.salary !== undefined) patch.salary = input.salary.toString();
			if (input.monthly_sales_target !== undefined) {
				patch.monthly_sales_target = input.monthly_sales_target.toString();
			}
			if (input.join_date !== undefined) {
				const d = new Date(input.join_date);
				if (Number.isNaN(d.getTime())) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Joining date is not a valid date.",
					});
				}
				patch.join_date = d;
			}
			// A branch-bound admin cannot move an employee out of their branch.
			if (input.branch_id !== undefined && scope === null) {
				patch.branch_id = input.branch_id;
			}

			if (Object.keys(patch).length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Nothing to update.",
				});
			}

			try {
				const [updated] = await db
					.update(staff)
					.set(patch)
					.where(eq(staff.id, input.id))
					.returning();
				await writeAudit(ctx, {
					action: "employee.update",
					entityType: "staff",
					entityId: input.id,
					oldValues: {
						name: existing.name,
						email: existing.email,
						role: existing.role,
						status: existing.status,
					},
					newValues: patch,
				});
				return { id: updated.id, name: updated.name };
			} catch (error) {
				rethrowDbError(error, "employee");
			}
		}),

	setEmployeeStatus: adminWrite()
		.input(
			z.object({
				id: z.number().int(),
				status: z.enum(["active", "inactive"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const scope = branchScope(ctx);
			const [updated] = await ctx.db
				.update(staff)
				.set({ status: input.status })
				.where(
					and(
						eq(staff.id, input.id),
						eq(staff.is_deleted, false),
						scope !== null ? eq(staff.branch_id, scope) : undefined,
					),
				)
				.returning();
			if (!updated) notFound("Employee");
			await writeAudit(ctx, {
				action:
					input.status === "active"
						? "employee.activate"
						: "employee.deactivate",
				entityType: "staff",
				entityId: input.id,
				newValues: { status: input.status },
			});
			return { id: updated.id, status: updated.status };
		}),

	/** Soft delete — the row is archived, never removed, so history stays intact. */
	archiveEmployee: adminWrite()
		.input(z.object({ id: z.number().int() }))
		.mutation(async ({ ctx, input }) => {
			const scope = branchScope(ctx);
			const [updated] = await ctx.db
				.update(staff)
				.set({ is_deleted: true, deleted_at: new Date(), status: "inactive" })
				.where(
					and(
						eq(staff.id, input.id),
						eq(staff.is_deleted, false),
						scope !== null ? eq(staff.branch_id, scope) : undefined,
					),
				)
				.returning();
			if (!updated) notFound("Employee");
			await writeAudit(ctx, {
				action: "employee.archive",
				entityType: "staff",
				entityId: input.id,
				oldValues: { name: updated.name, is_deleted: false },
				newValues: { is_deleted: true },
			});
			return { id: updated.id, name: updated.name };
		}),

	// ════════════════════════════════════════════════════════════════════════
	// Suppliers
	// ════════════════════════════════════════════════════════════════════════
	getSuppliers: adminRead()
		.input(
			optionalInput({
				...pageInput,
				sortBy: z
					.enum(["name", "code", "outstanding", "category", "created_at"])
					.default("created_at"),
				search: z.string().optional(),
				category: z.string().optional(),
				outstandingOnly: z.boolean().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const like = term(input.search);
			const where = and(
				input.category
					? eq(suppliers.supplier_category, input.category)
					: undefined,
				input.outstandingOnly
					? sql`${suppliers.outstanding_balance} > 0`
					: undefined,
				like
					? or(
							ilike(suppliers.name, like),
							ilike(suppliers.supplier_code, like),
							ilike(suppliers.email, like),
							ilike(suppliers.phone, like),
							ilike(suppliers.gst_number, like),
						)
					: undefined,
			);

			const [rows, totals] = await Promise.all([
				db
					.select()
					.from(suppliers)
					.where(where)
					.orderBy(
						orderBy(SUPPLIER_SORT, input.sortBy, input.sortDir, "created_at"),
					)
					.limit(input.pageSize)
					.offset((input.page - 1) * input.pageSize),
				db.select({ count: count() }).from(suppliers).where(where),
			]);

			return envelope(
				rows.map((r: any) => ({
					id: r.id,
					supplier_code: r.supplier_code || `SUP-${r.id}`,
					name: r.name,
					email: r.email ?? null,
					phone: r.phone ?? null,
					address: r.address ?? null,
					gst_number: r.gst_number ?? null,
					pan_number: r.pan_number ?? null,
					category: r.supplier_category ?? "local",
					outstanding_balance: toNumber(r.outstanding_balance),
					created_at: isoDate(r.created_at),
				})),
				totals[0]?.count ?? 0,
				input.page,
				input.pageSize,
			);
		}),

	getSupplierCategories: adminRead().query(async ({ ctx }) => {
		const rows = await ctx.db
			.selectDistinct({ value: suppliers.supplier_category })
			.from(suppliers)
			.orderBy(asc(suppliers.supplier_category));
		return rows
			.map((r: any) => r.value)
			.filter(
				(v: unknown): v is string => typeof v === "string" && v.length > 0,
			);
	}),

	getSupplier: adminRead()
		.input(z.object({ id: z.number().int() }))
		.query(async ({ ctx, input }) => {
			const rows = await ctx.db
				.select()
				.from(suppliers)
				.where(eq(suppliers.id, input.id))
				.limit(1);
			const s = rows[0];
			if (!s) notFound("Supplier");

			// Recent purchase activity for this supplier.
			const purchaseRows = await ctx.db
				.select({
					id: purchases.id,
					grn_number: purchases.grn_number,
					total_amount: purchases.total_amount,
					amount_paid: purchases.amount_paid,
					status: purchases.status,
					payment_status: purchases.payment_status,
					created_at: purchases.created_at,
				})
				.from(purchases)
				.where(eq(purchases.supplier_id, input.id))
				.orderBy(desc(purchases.created_at))
				.limit(10);

			const recentPurchases = purchaseRows.map((p: any) => ({
				id: p.id,
				grn_number: p.grn_number ?? null,
				total: toNumber(p.total_amount),
				paid: toNumber(p.amount_paid),
				status: p.status ?? null,
				payment_status: p.payment_status ?? null,
				created_at: isoDate(p.created_at),
			}));

			return {
				id: s.id,
				supplier_code: s.supplier_code || `SUP-${s.id}`,
				name: s.name,
				email: s.email ?? null,
				phone: s.phone ?? null,
				address: s.address ?? null,
				gst_number: s.gst_number ?? null,
				pan_number: s.pan_number ?? null,
				category: s.supplier_category ?? "local",
				outstanding_balance: toNumber(s.outstanding_balance),
				created_at: isoDate(s.created_at),
				recentPurchases,
			};
		}),

	createSupplier: adminWrite()
		.input(
			z.object({
				name: z.string().trim().min(2).max(255),
				email: z
					.string()
					.trim()
					.toLowerCase()
					.email()
					.optional()
					.or(z.literal("")),
				phone: z.string().trim().max(20).optional().or(z.literal("")),
				address: z.string().trim().max(500).optional().or(z.literal("")),
				gst_number: z
					.string()
					.trim()
					.toUpperCase()
					.max(15)
					.optional()
					.or(z.literal("")),
				pan_number: z
					.string()
					.trim()
					.toUpperCase()
					.max(10)
					.optional()
					.or(z.literal("")),
				supplier_category: z.string().trim().max(20).default("local"),
				outstanding_balance: z.number().min(0).default(0),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const blank = (v?: string) => (v && v.length > 0 ? v : null);
			try {
				const created = await ctx.db.transaction(async (tx: any) => {
					const [row] = await tx
						.insert(suppliers)
						.values({
							name: input.name,
							email: blank(input.email),
							phone: blank(input.phone),
							address: blank(input.address),
							gst_number: blank(input.gst_number),
							pan_number: blank(input.pan_number),
							supplier_category: input.supplier_category || "local",
							outstanding_balance: input.outstanding_balance.toString(),
						})
						.returning();
					const [withCode] = await tx
						.update(suppliers)
						.set({ supplier_code: `SUP-${String(row.id).padStart(5, "0")}` })
						.where(eq(suppliers.id, row.id))
						.returning();
					return withCode ?? row;
				});
				await writeAudit(ctx, {
					action: "supplier.create",
					entityType: "suppliers",
					entityId: created.id,
					newValues: { name: created.name, gst_number: created.gst_number },
				});
				return {
					id: created.id,
					supplier_code: created.supplier_code,
					name: created.name,
				};
			} catch (error) {
				rethrowDbError(error, "supplier");
			}
		}),

	updateSupplier: adminWrite()
		.input(
			z.object({
				id: z.number().int(),
				name: z.string().trim().min(2).max(255).optional(),
				email: z
					.string()
					.trim()
					.toLowerCase()
					.max(255)
					.optional()
					.or(z.literal("")),
				phone: z.string().trim().max(20).optional().or(z.literal("")),
				address: z.string().trim().max(500).optional().or(z.literal("")),
				gst_number: z
					.string()
					.trim()
					.toUpperCase()
					.max(15)
					.optional()
					.or(z.literal("")),
				pan_number: z
					.string()
					.trim()
					.toUpperCase()
					.max(10)
					.optional()
					.or(z.literal("")),
				supplier_category: z.string().trim().max(20).optional(),
				outstanding_balance: z.number().min(0).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const rows = await ctx.db
				.select()
				.from(suppliers)
				.where(eq(suppliers.id, input.id))
				.limit(1);
			const existing = rows[0];
			if (!existing) notFound("Supplier");

			const patch: Record<string, unknown> = {};
			const setText = (key: string, value?: string) => {
				if (value !== undefined) patch[key] = value.length > 0 ? value : null;
			};
			if (input.name !== undefined) patch.name = input.name;
			if (input.supplier_category !== undefined) {
				patch.supplier_category = input.supplier_category;
			}
			setText("email", input.email);
			setText("phone", input.phone);
			setText("address", input.address);
			setText("gst_number", input.gst_number);
			setText("pan_number", input.pan_number);
			if (input.outstanding_balance !== undefined) {
				patch.outstanding_balance = input.outstanding_balance.toString();
			}
			if (Object.keys(patch).length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Nothing to update.",
				});
			}

			try {
				const [updated] = await ctx.db
					.update(suppliers)
					.set(patch)
					.where(eq(suppliers.id, input.id))
					.returning();
				await writeAudit(ctx, {
					action: "supplier.update",
					entityType: "suppliers",
					entityId: input.id,
					oldValues: {
						name: existing.name,
						outstanding_balance: existing.outstanding_balance,
					},
					newValues: patch,
				});
				return { id: updated.id, name: updated.name };
			} catch (error) {
				rethrowDbError(error, "supplier");
			}
		}),

	/**
	 * Suppliers have no soft-delete column, so this is a hard delete. It is
	 * refused by Postgres when purchases still reference the supplier, and that
	 * FK violation is surfaced as a readable CONFLICT.
	 */
	deleteSupplier: adminWrite()
		.input(z.object({ id: z.number().int() }))
		.mutation(async ({ ctx, input }) => {
			const rows = await ctx.db
				.select({ id: suppliers.id, name: suppliers.name })
				.from(suppliers)
				.where(eq(suppliers.id, input.id))
				.limit(1);
			if (!rows[0]) notFound("Supplier");
			try {
				await ctx.db.delete(suppliers).where(eq(suppliers.id, input.id));
			} catch (error) {
				rethrowDbError(error, "supplier");
			}
			await writeAudit(ctx, {
				action: "supplier.delete",
				entityType: "suppliers",
				entityId: input.id,
				oldValues: { name: rows[0].name },
			});
			return { id: input.id, name: rows[0].name };
		}),

	// ════════════════════════════════════════════════════════════════════════
	// Customers
	// ════════════════════════════════════════════════════════════════════════
	getCustomers: adminRead()
		.input(
			optionalInput({
				...pageInput,
				sortBy: z
					.enum([
						"name",
						"code",
						"status",
						"type",
						"credit_used",
						"credit_limit",
						"created_at",
					])
					.default("created_at"),
				branch_id: z.number().int().optional(),
				search: z.string().optional(),
				status: z.enum(["active", "inactive"]).optional(),
				customer_type: z.string().optional(),
				creditHoldOnly: z.boolean().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const branchId = branchScope(ctx, input.branch_id);
			const like = term(input.search);
			const where = and(
				eq(customers.is_deleted, false),
				branchId !== null ? eq(customers.branch_id, branchId) : undefined,
				input.status ? eq(customers.status, input.status) : undefined,
				input.customer_type
					? eq(customers.customer_type, input.customer_type)
					: undefined,
				input.creditHoldOnly ? eq(customers.credit_hold, true) : undefined,
				like
					? or(
							ilike(customers.name, like),
							ilike(customers.customer_code, like),
							ilike(customers.email, like),
							ilike(customers.phone, like),
							ilike(customers.gst_number, like),
						)
					: undefined,
			);

			const [rows, totals] = await Promise.all([
				db
					.select({
						id: customers.id,
						customer_code: customers.customer_code,
						name: customers.name,
						email: customers.email,
						phone: customers.phone,
						status: customers.status,
						customer_type: customers.customer_type,
						credit_limit: customers.credit_limit,
						credit_used: customers.credit_used,
						credit_hold: customers.credit_hold,
						loyalty_tier: customers.loyalty_tier,
						branch_id: customers.branch_id,
						branch_name: branches.name,
						created_at: customers.created_at,
					})
					.from(customers)
					.leftJoin(branches, eq(customers.branch_id, branches.id))
					.where(where)
					.orderBy(
						orderBy(CUSTOMER_SORT, input.sortBy, input.sortDir, "created_at"),
					)
					.limit(input.pageSize)
					.offset((input.page - 1) * input.pageSize),
				db.select({ count: count() }).from(customers).where(where),
			]);

			return envelope(
				rows.map((r: any) => ({
					id: r.id,
					customer_code: r.customer_code || `CUST-${r.id}`,
					name: r.name,
					email: r.email ?? null,
					phone: r.phone ?? null,
					status: r.status ?? "active",
					customer_type: r.customer_type ?? "retail",
					credit_limit: toNumber(r.credit_limit),
					credit_used: toNumber(r.credit_used),
					credit_hold: Boolean(r.credit_hold),
					loyalty_tier: r.loyalty_tier ?? null,
					branch_id: r.branch_id ?? null,
					branch_name: r.branch_name ?? null,
					created_at: isoDate(r.created_at),
				})),
				totals[0]?.count ?? 0,
				input.page,
				input.pageSize,
			);
		}),

	getCustomer: adminRead()
		.input(z.object({ id: z.number().int() }))
		.query(async ({ ctx, input }) => {
			const scope = branchScope(ctx);
			const rows = await ctx.db
				.select({ c: customers, branch_name: branches.name })
				.from(customers)
				.leftJoin(branches, eq(customers.branch_id, branches.id))
				.where(
					and(
						eq(customers.id, input.id),
						eq(customers.is_deleted, false),
						scope !== null ? eq(customers.branch_id, scope) : undefined,
					),
				)
				.limit(1);
			const row = rows[0];
			if (!row) notFound("Customer");
			const c = row.c;
			return {
				id: c.id,
				customer_code: c.customer_code || `CUST-${c.id}`,
				name: c.name,
				email: c.email ?? null,
				phone: c.phone ?? null,
				address: c.address ?? null,
				status: c.status ?? "active",
				customer_type: c.customer_type ?? "retail",
				gst_number: c.gst_number ?? null,
				pan_number: c.pan_number ?? null,
				credit_limit: toNumber(c.credit_limit),
				credit_used: toNumber(c.credit_used),
				credit_available: toNumber(c.credit_limit) - toNumber(c.credit_used),
				credit_hold: Boolean(c.credit_hold),
				store_credit: toNumber(c.store_credit),
				payment_terms: c.payment_terms ?? null,
				loyalty_tier: c.loyalty_tier ?? null,
				loyalty_points: c.loyalty_points ?? 0,
				total_spent: toNumber(c.total_spent),
				lifetime_value: toNumber(c.lifetime_value),
				marketing_opt_in: Boolean(c.marketing_opt_in),
				branch_id: c.branch_id ?? null,
				branch_name: row.branch_name ?? null,
				created_at: isoDate(c.created_at),
				updated_at: isoDate(c.updated_at),
			};
		}),

	getCustomerTypes: adminRead().query(async ({ ctx }) => {
		const rows = await ctx.db
			.selectDistinct({ value: customers.customer_type })
			.from(customers)
			.where(eq(customers.is_deleted, false))
			.orderBy(asc(customers.customer_type));
		return rows
			.map((r: any) => r.value)
			.filter(
				(v: unknown): v is string => typeof v === "string" && v.length > 0,
			);
	}),

	createCustomer: adminWrite()
		.input(
			z.object({
				name: z.string().trim().min(2).max(255),
				email: z.string().trim().toLowerCase().email(),
				phone: z.string().trim().max(20).optional().or(z.literal("")),
				address: z.string().trim().max(500).optional().or(z.literal("")),
				gst_number: z
					.string()
					.trim()
					.toUpperCase()
					.max(15)
					.optional()
					.or(z.literal("")),
				pan_number: z
					.string()
					.trim()
					.toUpperCase()
					.max(10)
					.optional()
					.or(z.literal("")),
				customer_type: z.string().trim().max(20).default("retail"),
				credit_limit: z.number().min(0).default(0),
				payment_terms: z.number().int().min(0).max(365).default(30),
				status: z.enum(["active", "inactive"]).default("active"),
				marketing_opt_in: z.boolean().default(true),
				branch_id: z.number().int().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const blank = (v?: string) => (v && v.length > 0 ? v : null);
			try {
				const created = await ctx.db.transaction(async (tx: any) => {
					const [row] = await tx
						.insert(customers)
						.values({
							name: input.name,
							email: input.email,
							phone: blank(input.phone),
							address: blank(input.address),
							gst_number: blank(input.gst_number),
							pan_number: blank(input.pan_number),
							customer_type: input.customer_type || "retail",
							credit_limit: input.credit_limit.toString(),
							credit_used: "0",
							payment_terms: input.payment_terms,
							status: input.status,
							marketing_opt_in: input.marketing_opt_in,
							branch_id: branchScope(ctx, input.branch_id),
							user_uid: ctx.user.id,
							is_deleted: false,
						})
						.returning();
					const [withCode] = await tx
						.update(customers)
						.set({ customer_code: `CUST-${String(row.id).padStart(5, "0")}` })
						.where(eq(customers.id, row.id))
						.returning();
					return withCode ?? row;
				});
				await writeAudit(ctx, {
					action: "customer.create",
					entityType: "customers",
					entityId: created.id,
					newValues: { name: created.name, email: created.email },
				});
				return {
					id: created.id,
					customer_code: created.customer_code,
					name: created.name,
				};
			} catch (error) {
				rethrowDbError(error, "customer");
			}
		}),

	updateCustomer: adminWrite()
		.input(
			z.object({
				id: z.number().int(),
				name: z.string().trim().min(2).max(255).optional(),
				email: z.string().trim().toLowerCase().email().optional(),
				phone: z.string().trim().max(20).optional().or(z.literal("")),
				address: z.string().trim().max(500).optional().or(z.literal("")),
				gst_number: z
					.string()
					.trim()
					.toUpperCase()
					.max(15)
					.optional()
					.or(z.literal("")),
				pan_number: z
					.string()
					.trim()
					.toUpperCase()
					.max(10)
					.optional()
					.or(z.literal("")),
				customer_type: z.string().trim().max(20).optional(),
				credit_limit: z.number().min(0).optional(),
				payment_terms: z.number().int().min(0).max(365).optional(),
				credit_hold: z.boolean().optional(),
				status: z.enum(["active", "inactive"]).optional(),
				marketing_opt_in: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const scope = branchScope(ctx);
			const rows = await ctx.db
				.select()
				.from(customers)
				.where(
					and(
						eq(customers.id, input.id),
						eq(customers.is_deleted, false),
						scope !== null ? eq(customers.branch_id, scope) : undefined,
					),
				)
				.limit(1);
			const existing = rows[0];
			if (!existing) notFound("Customer");

			const patch: Record<string, unknown> = {};
			const setText = (key: string, value?: string) => {
				if (value !== undefined) patch[key] = value.length > 0 ? value : null;
			};
			if (input.name !== undefined) patch.name = input.name;
			if (input.email !== undefined) patch.email = input.email;
			if (input.customer_type !== undefined)
				patch.customer_type = input.customer_type;
			if (input.status !== undefined) patch.status = input.status;
			if (input.credit_hold !== undefined)
				patch.credit_hold = input.credit_hold;
			if (input.marketing_opt_in !== undefined) {
				patch.marketing_opt_in = input.marketing_opt_in;
			}
			if (input.payment_terms !== undefined)
				patch.payment_terms = input.payment_terms;
			if (input.credit_limit !== undefined) {
				patch.credit_limit = input.credit_limit.toString();
			}
			setText("phone", input.phone);
			setText("address", input.address);
			setText("gst_number", input.gst_number);
			setText("pan_number", input.pan_number);

			if (Object.keys(patch).length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Nothing to update.",
				});
			}

			try {
				const [updated] = await ctx.db
					.update(customers)
					.set(patch)
					.where(eq(customers.id, input.id))
					.returning();
				await writeAudit(ctx, {
					action: "customer.update",
					entityType: "customers",
					entityId: input.id,
					oldValues: {
						name: existing.name,
						email: existing.email,
						status: existing.status,
						credit_limit: existing.credit_limit,
					},
					newValues: patch,
				});
				return { id: updated.id, name: updated.name };
			} catch (error) {
				rethrowDbError(error, "customer");
			}
		}),

	/** Soft delete. Refused while the customer still owes money. */
	archiveCustomer: adminWrite()
		.input(z.object({ id: z.number().int() }))
		.mutation(async ({ ctx, input }) => {
			const scope = branchScope(ctx);
			const rows = await ctx.db
				.select()
				.from(customers)
				.where(
					and(
						eq(customers.id, input.id),
						eq(customers.is_deleted, false),
						scope !== null ? eq(customers.branch_id, scope) : undefined,
					),
				)
				.limit(1);
			const existing = rows[0];
			if (!existing) notFound("Customer");

			if (toNumber(existing.credit_used) > 0) {
				throw new TRPCError({
					code: "CONFLICT",
					message: `${existing.name} still has an outstanding balance. Settle the receivable before archiving.`,
				});
			}

			const [updated] = await ctx.db
				.update(customers)
				.set({ is_deleted: true, deleted_at: new Date(), status: "inactive" })
				.where(eq(customers.id, input.id))
				.returning();
			await writeAudit(ctx, {
				action: "customer.archive",
				entityType: "customers",
				entityId: input.id,
				oldValues: { name: existing.name, is_deleted: false },
				newValues: { is_deleted: true },
			});
			return { id: updated.id, name: updated.name };
		}),

	// ════════════════════════════════════════════════════════════════════════
	// Companies
	// ════════════════════════════════════════════════════════════════════════
	getCompanies: adminRead()
		.input(
			optionalInput({
				...pageInput,
				sortBy: z.enum(["name", "status", "created_at"]).default("created_at"),
				search: z.string().optional(),
				status: z.enum(["active", "inactive"]).optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const like = term(input.search);
			const where = and(
				input.status ? eq(companies.status, input.status) : undefined,
				like
					? or(
							ilike(companies.name, like),
							ilike(companies.gst_number, like),
							ilike(companies.pan, like),
							ilike(companies.contact, like),
						)
					: undefined,
			);

			const [rows, totals] = await Promise.all([
				db
					.select()
					.from(companies)
					.where(where)
					.orderBy(
						orderBy(COMPANY_SORT, input.sortBy, input.sortDir, "created_at"),
					)
					.limit(input.pageSize)
					.offset((input.page - 1) * input.pageSize),
				db.select({ count: count() }).from(companies).where(where),
			]);

			return envelope(
				rows.map((c: any) => ({
					id: c.id,
					name: c.name,
					address: c.address ?? null,
					contact: c.contact ?? null,
					gst_number: c.gst_number ?? null,
					pan: c.pan ?? null,
					status: c.status ?? "active",
					financial_year_start: isoDate(c.financial_year_start),
					financial_year_end: isoDate(c.financial_year_end),
					created_at: isoDate(c.created_at),
				})),
				totals[0]?.count ?? 0,
				input.page,
				input.pageSize,
			);
		}),

	getCompany: adminRead()
		.input(z.object({ id: z.number().int() }))
		.query(async ({ ctx, input }) => {
			const rows = await ctx.db
				.select()
				.from(companies)
				.where(eq(companies.id, input.id))
				.limit(1);
			const c = rows[0];
			if (!c) notFound("Company");
			return {
				id: c.id,
				name: c.name,
				address: c.address ?? null,
				contact: c.contact ?? null,
				gst_number: c.gst_number ?? null,
				pan: c.pan ?? null,
				status: c.status ?? "active",
				financial_year_start: isoDate(c.financial_year_start),
				financial_year_end: isoDate(c.financial_year_end),
				created_at: isoDate(c.created_at),
			};
		}),

	createCompany: adminWrite()
		.input(
			z.object({
				name: z.string().trim().min(2).max(255),
				address: z.string().trim().max(500).optional().or(z.literal("")),
				contact: z.string().trim().max(20).optional().or(z.literal("")),
				gst_number: z
					.string()
					.trim()
					.toUpperCase()
					.max(15)
					.optional()
					.or(z.literal("")),
				pan: z
					.string()
					.trim()
					.toUpperCase()
					.max(10)
					.optional()
					.or(z.literal("")),
				financial_year_start: z.string().optional().or(z.literal("")),
				financial_year_end: z.string().optional().or(z.literal("")),
				status: z.enum(["active", "inactive"]).default("active"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const blank = (v?: string) => (v && v.length > 0 ? v : null);
			const date = (v?: string) => {
				if (!v) return null;
				const d = new Date(v);
				return Number.isNaN(d.getTime()) ? null : d;
			};
			const start = date(input.financial_year_start);
			const end = date(input.financial_year_end);
			if (start && end && end <= start) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Financial year end must be after the start date.",
				});
			}
			try {
				const [created] = await ctx.db
					.insert(companies)
					.values({
						name: input.name,
						address: blank(input.address),
						contact: blank(input.contact),
						gst_number: blank(input.gst_number),
						pan: blank(input.pan),
						financial_year_start: start,
						financial_year_end: end,
						status: input.status,
					})
					.returning();
				await writeAudit(ctx, {
					action: "company.create",
					entityType: "companies",
					entityId: created.id,
					newValues: { name: created.name, gst_number: created.gst_number },
				});
				return { id: created.id, name: created.name };
			} catch (error) {
				rethrowDbError(error, "company");
			}
		}),

	updateCompany: adminWrite()
		.input(
			z.object({
				id: z.number().int(),
				name: z.string().trim().min(2).max(255).optional(),
				address: z.string().trim().max(500).optional().or(z.literal("")),
				contact: z.string().trim().max(20).optional().or(z.literal("")),
				gst_number: z
					.string()
					.trim()
					.toUpperCase()
					.max(15)
					.optional()
					.or(z.literal("")),
				pan: z
					.string()
					.trim()
					.toUpperCase()
					.max(10)
					.optional()
					.or(z.literal("")),
				financial_year_start: z.string().optional().or(z.literal("")),
				financial_year_end: z.string().optional().or(z.literal("")),
				status: z.enum(["active", "inactive"]).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const rows = await ctx.db
				.select()
				.from(companies)
				.where(eq(companies.id, input.id))
				.limit(1);
			const existing = rows[0];
			if (!existing) notFound("Company");

			const patch: Record<string, unknown> = {};
			const setText = (key: string, value?: string) => {
				if (value !== undefined) patch[key] = value.length > 0 ? value : null;
			};
			if (input.name !== undefined) patch.name = input.name;
			if (input.status !== undefined) patch.status = input.status;
			setText("address", input.address);
			setText("contact", input.contact);
			setText("gst_number", input.gst_number);
			setText("pan", input.pan);

			const parseDate = (v: string) => {
				if (v.length === 0) return null;
				const d = new Date(v);
				if (Number.isNaN(d.getTime())) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Financial year dates must be valid dates.",
					});
				}
				return d;
			};
			if (input.financial_year_start !== undefined) {
				patch.financial_year_start = parseDate(input.financial_year_start);
			}
			if (input.financial_year_end !== undefined) {
				patch.financial_year_end = parseDate(input.financial_year_end);
			}
			const start = (patch.financial_year_start ??
				existing.financial_year_start) as Date | null;
			const end = (patch.financial_year_end ??
				existing.financial_year_end) as Date | null;
			if (start && end && new Date(end) <= new Date(start)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Financial year end must be after the start date.",
				});
			}

			if (Object.keys(patch).length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Nothing to update.",
				});
			}

			try {
				const [updated] = await ctx.db
					.update(companies)
					.set(patch)
					.where(eq(companies.id, input.id))
					.returning();
				await writeAudit(ctx, {
					action: "company.update",
					entityType: "companies",
					entityId: input.id,
					oldValues: { name: existing.name, status: existing.status },
					newValues: patch,
				});
				return { id: updated.id, name: updated.name };
			} catch (error) {
				rethrowDbError(error, "company");
			}
		}),

	// ════════════════════════════════════════════════════════════════════════
	// Branches
	// ════════════════════════════════════════════════════════════════════════
	getBranches: adminRead()
		.input(
			optionalInput({
				...pageInput,
				sortBy: z.enum(["name", "code", "created_at"]).default("name"),
				search: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const scope = branchScope(ctx);
			const like = term(input.search);
			const where = and(
				scope !== null ? eq(branches.id, scope) : undefined,
				like
					? or(
							ilike(branches.name, like),
							ilike(branches.code, like),
							ilike(branches.address, like),
							ilike(branches.phone, like),
						)
					: undefined,
			);

			const [rows, totals] = await Promise.all([
				db
					.select({
						id: branches.id,
						name: branches.name,
						code: branches.code,
						address: branches.address,
						phone: branches.phone,
						email: branches.email,
						is_headquarters: branches.is_headquarters,
						manager_id: branches.manager_id,
						manager_name: staff.name,
						created_at: branches.created_at,
					})
					.from(branches)
					.leftJoin(staff, eq(branches.manager_id, staff.id))
					.where(where)
					.orderBy(orderBy(BRANCH_SORT, input.sortBy, input.sortDir, "name"))
					.limit(input.pageSize)
					.offset((input.page - 1) * input.pageSize),
				db.select({ count: count() }).from(branches).where(where),
			]);

			return envelope(
				rows.map((b: any) => ({
					id: b.id,
					name: b.name,
					code: b.code || `BR-${b.id}`,
					address: b.address ?? null,
					phone: b.phone ?? null,
					email: b.email ?? null,
					is_headquarters: Boolean(b.is_headquarters),
					manager_id: b.manager_id ?? null,
					manager_name: b.manager_name ?? null,
					created_at: isoDate(b.created_at),
				})),
				totals[0]?.count ?? 0,
				input.page,
				input.pageSize,
			);
		}),

	getBranch: adminRead()
		.input(z.object({ id: z.number().int() }))
		.query(async ({ ctx, input }) => {
			const scope = branchScope(ctx);
			if (scope !== null && scope !== input.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You can only view your own branch.",
				});
			}
			const rows = await ctx.db
				.select({ b: branches, manager_name: staff.name })
				.from(branches)
				.leftJoin(staff, eq(branches.manager_id, staff.id))
				.where(eq(branches.id, input.id))
				.limit(1);
			const row = rows[0];
			if (!row) notFound("Branch");

			const [employeeCount, customerCount] = await Promise.all([
				ctx.db
					.select({ count: count() })
					.from(staff)
					.where(
						and(eq(staff.branch_id, input.id), eq(staff.is_deleted, false)),
					),
				ctx.db
					.select({ count: count() })
					.from(customers)
					.where(
						and(
							eq(customers.branch_id, input.id),
							eq(customers.is_deleted, false),
						),
					),
			]);

			const b = row.b;
			return {
				id: b.id,
				name: b.name,
				code: b.code || `BR-${b.id}`,
				address: b.address ?? null,
				phone: b.phone ?? null,
				email: b.email ?? null,
				is_headquarters: Boolean(b.is_headquarters),
				manager_id: b.manager_id ?? null,
				manager_name: row.manager_name ?? null,
				created_at: isoDate(b.created_at),
				employeeCount: employeeCount[0]?.count ?? 0,
				customerCount: customerCount[0]?.count ?? 0,
			};
		}),

	createBranch: adminWrite()
		.input(
			z.object({
				name: z.string().trim().min(2).max(100),
				code: z
					.string()
					.trim()
					.toUpperCase()
					.max(20)
					.optional()
					.or(z.literal("")),
				address: z.string().trim().max(500).optional().or(z.literal("")),
				phone: z.string().trim().max(20).optional().or(z.literal("")),
				email: z
					.string()
					.trim()
					.toLowerCase()
					.email()
					.optional()
					.or(z.literal("")),
				manager_id: z.number().int().nullable().optional(),
				is_headquarters: z.boolean().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const blank = (v?: string) => (v && v.length > 0 ? v : null);
			try {
				const created = await ctx.db.transaction(async (tx: any) => {
					// A single headquarters is a business invariant, so promoting one
					// branch demotes the rest inside the same transaction.
					if (input.is_headquarters) {
						await tx
							.update(branches)
							.set({ is_headquarters: false })
							.where(eq(branches.is_headquarters, true));
					}
					const [row] = await tx
						.insert(branches)
						.values({
							name: input.name,
							code: blank(input.code),
							address: blank(input.address),
							phone: blank(input.phone),
							email: blank(input.email),
							manager_id: input.manager_id ?? null,
							is_headquarters: input.is_headquarters,
						})
						.returning();
					if (!row.code) {
						const [withCode] = await tx
							.update(branches)
							.set({ code: `BR-${String(row.id).padStart(4, "0")}` })
							.where(eq(branches.id, row.id))
							.returning();
						return withCode ?? row;
					}
					return row;
				});
				await writeAudit(ctx, {
					action: "branch.create",
					entityType: "branches",
					entityId: created.id,
					newValues: { name: created.name, code: created.code },
				});
				return { id: created.id, name: created.name, code: created.code };
			} catch (error) {
				rethrowDbError(error, "branch");
			}
		}),

	updateBranch: adminWrite()
		.input(
			z.object({
				id: z.number().int(),
				name: z.string().trim().min(2).max(100).optional(),
				code: z
					.string()
					.trim()
					.toUpperCase()
					.max(20)
					.optional()
					.or(z.literal("")),
				address: z.string().trim().max(500).optional().or(z.literal("")),
				phone: z.string().trim().max(20).optional().or(z.literal("")),
				email: z
					.string()
					.trim()
					.toLowerCase()
					.max(255)
					.optional()
					.or(z.literal("")),
				manager_id: z.number().int().nullable().optional(),
				is_headquarters: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const scope = branchScope(ctx);
			if (scope !== null && scope !== input.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You can only edit your own branch.",
				});
			}
			const rows = await ctx.db
				.select()
				.from(branches)
				.where(eq(branches.id, input.id))
				.limit(1);
			const existing = rows[0];
			if (!existing) notFound("Branch");

			const patch: Record<string, unknown> = {};
			const setText = (key: string, value?: string) => {
				if (value !== undefined) patch[key] = value.length > 0 ? value : null;
			};
			if (input.name !== undefined) patch.name = input.name;
			if (input.manager_id !== undefined) patch.manager_id = input.manager_id;
			if (input.is_headquarters !== undefined) {
				patch.is_headquarters = input.is_headquarters;
			}
			setText("code", input.code);
			setText("address", input.address);
			setText("phone", input.phone);
			setText("email", input.email);

			if (Object.keys(patch).length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Nothing to update.",
				});
			}

			try {
				const updated = await ctx.db.transaction(async (tx: any) => {
					if (input.is_headquarters === true) {
						await tx
							.update(branches)
							.set({ is_headquarters: false })
							.where(
								and(
									eq(branches.is_headquarters, true),
									ne(branches.id, input.id),
								),
							);
					}
					const [row] = await tx
						.update(branches)
						.set(patch)
						.where(eq(branches.id, input.id))
						.returning();
					return row;
				});
				await writeAudit(ctx, {
					action: "branch.update",
					entityType: "branches",
					entityId: input.id,
					oldValues: { name: existing.name, code: existing.code },
					newValues: patch,
				});
				return { id: updated.id, name: updated.name };
			} catch (error) {
				rethrowDbError(error, "branch");
			}
		}),

	/**
	 * Hard delete, because branches have no archive column. Refused while any
	 * employee, customer or transaction still points at the branch — the checks
	 * run first so the admin gets a reason instead of a raw FK error.
	 */
	deleteBranch: adminWrite()
		.input(z.object({ id: z.number().int() }))
		.mutation(async ({ ctx, input }) => {
			const rows = await ctx.db
				.select({
					id: branches.id,
					name: branches.name,
					is_headquarters: branches.is_headquarters,
				})
				.from(branches)
				.where(eq(branches.id, input.id))
				.limit(1);
			const existing = rows[0];
			if (!existing) notFound("Branch");
			if (existing.is_headquarters) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "The headquarters branch cannot be deleted.",
				});
			}

			const [employees, custs] = await Promise.all([
				ctx.db
					.select({ count: count() })
					.from(staff)
					.where(
						and(eq(staff.branch_id, input.id), eq(staff.is_deleted, false)),
					),
				ctx.db
					.select({ count: count() })
					.from(customers)
					.where(
						and(
							eq(customers.branch_id, input.id),
							eq(customers.is_deleted, false),
						),
					),
			]);
			const employeeCount = employees[0]?.count ?? 0;
			const customerCount = custs[0]?.count ?? 0;
			if (employeeCount > 0 || customerCount > 0) {
				throw new TRPCError({
					code: "CONFLICT",
					message: `${existing.name} still has ${employeeCount} employee(s) and ${customerCount} customer(s). Reassign them before deleting the branch.`,
				});
			}

			try {
				await ctx.db.delete(branches).where(eq(branches.id, input.id));
			} catch (error) {
				rethrowDbError(error, "branch");
			}
			await writeAudit(ctx, {
				action: "branch.delete",
				entityType: "branches",
				entityId: input.id,
				oldValues: { name: existing.name },
			});
			return { id: input.id, name: existing.name };
		}),

	/** Active employees, for the branch-manager picker. */
	getManagerCandidates: adminRead()
		.input(optionalInput({ search: z.string().optional() }))
		.query(async ({ ctx, input }) => {
			const like = term(input.search);
			const rows = await ctx.db
				.select({
					id: staff.id,
					name: staff.name,
					role: staff.role,
					staff_code: staff.staff_code,
				})
				.from(staff)
				.where(
					and(
						eq(staff.is_deleted, false),
						eq(staff.status, "active"),
						like
							? or(ilike(staff.name, like), ilike(staff.staff_code, like))
							: undefined,
					),
				)
				.orderBy(asc(staff.name))
				.limit(100);
			return rows.map((r: any) => ({
				id: r.id,
				name: r.name,
				role: r.role ?? null,
				code: r.staff_code ?? null,
			}));
		}),

	// ════════════════════════════════════════════════════════════════════════
	// Finance
	// ════════════════════════════════════════════════════════════════════════
	getFinancialSummary: roleProcedure([...FINANCE_READ_ROLES])
		.input(
			optionalInput({
				branch_id: z.number().int().optional(),
				from: z.string().optional(),
				to: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const branchId = branchScope(ctx, input.branch_id);
			const parse = (v?: string) => {
				if (!v) return null;
				const d = new Date(v);
				return Number.isNaN(d.getTime()) ? null : d;
			};
			const from = parse(input.from);
			const to = parse(input.to);
			if (from && to && to < from) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "The end date must be on or after the start date.",
				});
			}
			const inRange = (column: any) =>
				and(
					from ? gte(column, from) : undefined,
					to ? lte(column, to) : undefined,
				);

			const [revenue, spend, receivables, payables, cash, bank, txCount] =
				await Promise.all([
					db
						.select({
							total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
						})
						.from(transactions)
						.where(
							and(
								eq(transactions.type, "in"),
								branchId !== null
									? eq(transactions.branch_id, branchId)
									: undefined,
								inRange(transactions.created_at),
							),
						),
					db
						.select({
							total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
						})
						.from(expenses)
						.where(
							and(
								branchId !== null
									? eq(expenses.branch_id, branchId)
									: undefined,
								inRange(expenses.created_at),
							),
						),
					db
						.select({
							total: sql<string>`COALESCE(SUM(${customers.credit_used}), 0)`,
						})
						.from(customers)
						.where(
							and(
								eq(customers.is_deleted, false),
								branchId !== null
									? eq(customers.branch_id, branchId)
									: undefined,
							),
						),
					db
						.select({
							total: sql<string>`COALESCE(SUM(${suppliers.outstanding_balance}), 0)`,
						})
						.from(suppliers),
					db
						.select({
							total: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'in' THEN ${transactions.amount} ELSE -${transactions.amount} END), 0)`,
						})
						.from(transactions)
						.where(
							and(
								branchId !== null
									? eq(transactions.branch_id, branchId)
									: undefined,
								inRange(transactions.created_at),
							),
						),
					db
						.select({
							total: sql<string>`COALESCE(SUM(${bankAccounts.current_balance}), 0)`,
						})
						.from(bankAccounts)
						.where(
							and(
								eq(bankAccounts.is_deleted, false),
								eq(bankAccounts.status, "active"),
								branchId !== null
									? eq(bankAccounts.branch_id, branchId)
									: undefined,
							),
						),
					db
						.select({ count: count() })
						.from(transactions)
						.where(
							and(
								branchId !== null
									? eq(transactions.branch_id, branchId)
									: undefined,
								inRange(transactions.created_at),
							),
						),
				]);

			const totalRevenue = toNumber(revenue[0]?.total);
			const totalExpenses = toNumber(spend[0]?.total);
			const netProfit = totalRevenue - totalExpenses;

			return {
				branchScope: branchId,
				from: from ? from.toISOString() : null,
				to: to ? to.toISOString() : null,
				totalRevenue,
				totalExpenses,
				netProfit,
				profitMargin:
					totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : null,
				totalReceivables: toNumber(receivables[0]?.total),
				totalPayables: toNumber(payables[0]?.total),
				cashBalance: toNumber(cash[0]?.total),
				bankBalance: toNumber(bank[0]?.total),
				transactionCount: txCount[0]?.count ?? 0,
			};
		}),

	getTransactions: roleProcedure([...FINANCE_READ_ROLES])
		.input(
			optionalInput({
				...pageInput,
				sortBy: z.enum(["created_at", "amount", "type"]).default("created_at"),
				branch_id: z.number().int().optional(),
				search: z.string().optional(),
				type: z.enum(["in", "out"]).optional(),
				category: z.string().optional(),
				from: z.string().optional(),
				to: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const branchId = branchScope(ctx, input.branch_id);
			const like = term(input.search);
			const parse = (v?: string) => {
				if (!v) return null;
				const d = new Date(v);
				return Number.isNaN(d.getTime()) ? null : d;
			};
			const from = parse(input.from);
			const to = parse(input.to);

			const where = and(
				branchId !== null ? eq(transactions.branch_id, branchId) : undefined,
				input.type ? eq(transactions.type, input.type) : undefined,
				input.category ? eq(transactions.category, input.category) : undefined,
				from ? gte(transactions.created_at, from) : undefined,
				to ? lte(transactions.created_at, to) : undefined,
				like
					? or(
							ilike(transactions.description, like),
							ilike(transactions.category, like),
							ilike(transactions.reference_type, like),
						)
					: undefined,
			);

			const [rows, totals, sums] = await Promise.all([
				db
					.select({
						id: transactions.id,
						description: transactions.description,
						amount: transactions.amount,
						type: transactions.type,
						category: transactions.category,
						status: transactions.status,
						reference_type: transactions.reference_type,
						reference_id: transactions.reference_id,
						branch_id: transactions.branch_id,
						branch_name: branches.name,
						created_at: transactions.created_at,
					})
					.from(transactions)
					.leftJoin(branches, eq(transactions.branch_id, branches.id))
					.where(where)
					.orderBy(
						orderBy(
							TRANSACTION_SORT,
							input.sortBy,
							input.sortDir,
							"created_at",
						),
					)
					.limit(input.pageSize)
					.offset((input.page - 1) * input.pageSize),
				db.select({ count: count() }).from(transactions).where(where),
				db
					.select({
						inflow: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'in' THEN ${transactions.amount} ELSE 0 END), 0)`,
						outflow: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} <> 'in' THEN ${transactions.amount} ELSE 0 END), 0)`,
					})
					.from(transactions)
					.where(where),
			]);

			return {
				...envelope(
					rows.map((t: any) => ({
						id: t.id,
						description: t.description ?? null,
						amount: toNumber(t.amount),
						type: t.type ?? null,
						category: t.category ?? null,
						status: t.status ?? null,
						reference_type: t.reference_type ?? null,
						reference_id: t.reference_id ?? null,
						branch_id: t.branch_id ?? null,
						branch_name: t.branch_name ?? null,
						created_at: isoDate(t.created_at),
					})),
					totals[0]?.count ?? 0,
					input.page,
					input.pageSize,
				),
				inflow: toNumber(sums[0]?.inflow),
				outflow: toNumber(sums[0]?.outflow),
			};
		}),

	getTransactionCategories: roleProcedure([...FINANCE_READ_ROLES]).query(
		async ({ ctx }) => {
			const rows = await ctx.db
				.selectDistinct({ value: transactions.category })
				.from(transactions)
				.orderBy(asc(transactions.category));
			return rows
				.map((r: any) => r.value)
				.filter(
					(v: unknown): v is string => typeof v === "string" && v.length > 0,
				);
		},
	),

	// ════════════════════════════════════════════════════════════════════════
	// Activity / audit trail
	// ════════════════════════════════════════════════════════════════════════
	getActivityLog: adminRead()
		.input(
			optionalInput({
				...pageInput,
				entity_type: z.string().optional(),
				action: z.string().optional(),
				search: z.string().optional(),
				from: z.string().optional(),
				to: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const like = term(input.search);
			const parse = (v?: string) => {
				if (!v) return null;
				const d = new Date(v);
				return Number.isNaN(d.getTime()) ? null : d;
			};
			const from = parse(input.from);
			const to = parse(input.to);

			const where = and(
				input.entity_type
					? eq(auditLogs.entity_type, input.entity_type)
					: undefined,
				input.action ? ilike(auditLogs.action, `%${input.action}%`) : undefined,
				from ? gte(auditLogs.created_at, from) : undefined,
				to ? lte(auditLogs.created_at, to) : undefined,
				like
					? or(
							ilike(auditLogs.action, like),
							ilike(auditLogs.entity_type, like),
							ilike(staff.name, like),
						)
					: undefined,
			);

			const [rows, totals] = await Promise.all([
				db
					.select({
						id: auditLogs.id,
						action: auditLogs.action,
						entity_type: auditLogs.entity_type,
						entity_id: auditLogs.entity_id,
						old_values: auditLogs.old_values,
						new_values: auditLogs.new_values,
						created_at: auditLogs.created_at,
						actor_name: staff.name,
						actor_email: staff.email,
					})
					.from(auditLogs)
					.leftJoin(staff, eq(auditLogs.user_id, staff.id))
					.where(where)
					.orderBy(
						input.sortDir === "asc"
							? asc(auditLogs.created_at)
							: desc(auditLogs.created_at),
					)
					.limit(input.pageSize)
					.offset((input.page - 1) * input.pageSize),
				db
					.select({ count: count() })
					.from(auditLogs)
					.leftJoin(staff, eq(auditLogs.user_id, staff.id))
					.where(where),
			]);

			return envelope(
				rows.map((r: any) => {
					const payloadActor = (r.new_values && r.new_values._actor) || null;
					const { _actor, ...changes } = (r.new_values ?? {}) as Record<
						string,
						unknown
					>;
					return {
						id: r.id,
						action: r.action,
						entity_type: r.entity_type,
						entity_id: r.entity_id ?? null,
						actor_name: r.actor_name ?? payloadActor?.name ?? "Unknown",
						actor_email: r.actor_email ?? payloadActor?.email ?? null,
						actor_role: payloadActor?.role ?? null,
						changes,
						previous: r.old_values ?? null,
						created_at: isoDate(r.created_at),
					};
				}),
				totals[0]?.count ?? 0,
				input.page,
				input.pageSize,
			);
		}),

	getActivityFacets: adminRead().query(async ({ ctx }) => {
		const rows = await ctx.db
			.selectDistinct({ value: auditLogs.entity_type })
			.from(auditLogs)
			.orderBy(asc(auditLogs.entity_type));
		return {
			entityTypes: rows
				.map((r: any) => r.value)
				.filter(
					(v: unknown): v is string => typeof v === "string" && v.length > 0,
				),
		};
	}),

	/** Compact real audit feed for the dashboard card. */
	getRecentActivity: adminRead()
		.input(optionalInput({ limit: z.number().int().min(1).max(20).default(8) }))
		.query(async ({ ctx, input }) => {
			const rows = await ctx.db
				.select({
					id: auditLogs.id,
					action: auditLogs.action,
					entity_type: auditLogs.entity_type,
					entity_id: auditLogs.entity_id,
					new_values: auditLogs.new_values,
					created_at: auditLogs.created_at,
					actor_name: staff.name,
				})
				.from(auditLogs)
				.leftJoin(staff, eq(auditLogs.user_id, staff.id))
				.orderBy(desc(auditLogs.created_at))
				.limit(input.limit);

			return rows.map((r: any) => {
				const actor = (r.new_values && r.new_values._actor) || null;
				const subject =
					(r.new_values && (r.new_values.name || r.new_values.value)) || null;
				return {
					id: r.id,
					action: r.action,
					entity_type: r.entity_type,
					entity_id: r.entity_id ?? null,
					subject: typeof subject === "string" ? subject : null,
					actor_name: r.actor_name ?? actor?.name ?? "Unknown",
					created_at: isoDate(r.created_at),
				};
			});
		}),

	// ════════════════════════════════════════════════════════════════════════
	// Global search — powers the admin header search box
	// ════════════════════════════════════════════════════════════════════════
	globalSearch: adminRead()
		.input(z.object({ q: z.string().trim().min(2).max(80) }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const like = `%${input.q}%`;
			const scope = branchScope(ctx);

			const [employees, custs, sups, comps, brs] = await Promise.all([
				db
					.select({ id: staff.id, name: staff.name, code: staff.staff_code })
					.from(staff)
					.where(
						and(
							eq(staff.is_deleted, false),
							scope !== null ? eq(staff.branch_id, scope) : undefined,
							or(
								ilike(staff.name, like),
								ilike(staff.staff_code, like),
								ilike(staff.email, like),
							),
						),
					)
					.limit(5),
				db
					.select({
						id: customers.id,
						name: customers.name,
						code: customers.customer_code,
					})
					.from(customers)
					.where(
						and(
							eq(customers.is_deleted, false),
							scope !== null ? eq(customers.branch_id, scope) : undefined,
							or(
								ilike(customers.name, like),
								ilike(customers.customer_code, like),
								ilike(customers.email, like),
								ilike(customers.phone, like),
							),
						),
					)
					.limit(5),
				db
					.select({
						id: suppliers.id,
						name: suppliers.name,
						code: suppliers.supplier_code,
					})
					.from(suppliers)
					.where(
						or(
							ilike(suppliers.name, like),
							ilike(suppliers.supplier_code, like),
						),
					)
					.limit(5),
				db
					.select({ id: companies.id, name: companies.name })
					.from(companies)
					.where(
						or(ilike(companies.name, like), ilike(companies.gst_number, like)),
					)
					.limit(5),
				db
					.select({ id: branches.id, name: branches.name, code: branches.code })
					.from(branches)
					.where(or(ilike(branches.name, like), ilike(branches.code, like)))
					.limit(5),
			]);

			const map = (rows: any[], type: string, href: (id: number) => string) =>
				rows.map((r) => ({
					type,
					id: r.id,
					label: r.name,
					sublabel: r.code ?? null,
					href: href(r.id),
				}));

			return [
				...map(employees, "Employee", (id) => `/admin/employees?view=${id}`),
				...map(custs, "Customer", (id) => `/admin/customers?view=${id}`),
				...map(sups, "Supplier", (id) => `/admin/suppliers?view=${id}`),
				...map(comps, "Company", (id) => `/admin/companies?view=${id}`),
				...map(brs, "Branch", (id) => `/admin/branches?view=${id}`),
			];
		}),
});
