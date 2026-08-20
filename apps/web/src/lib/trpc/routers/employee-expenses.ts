import { employeeExpenses, payments, staff } from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
	generateDocNumber,
	logAudit,
	postPaymentTx,
} from "@/lib/finance/service";
import { protectedProcedure, roleProcedure, router } from "../init";

const READ_ROLES = ["admin", "manager", "auditor"] as const;
const REVIEW_ROLES = ["admin", "manager"] as const;

/** Resolve the acting user's staff row (by email) or throw. */
async function requireStaff(email: string) {
	const [row] = await db
		.select({ id: staff.id, name: staff.name, branch_id: staff.branch_id })
		.from(staff)
		.where(eq(staff.email, email))
		.limit(1);
	if (!row)
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "No staff record is linked to your account",
		});
	return row;
}

export const employeeExpensesRouter = router({
	// ── Submit (create) ───────────────────────────────────────────────────────
	submit: protectedProcedure
		.input(
			z.object({
				amount: z.number().positive(),
				category_id: z.number().int().positive().nullish(),
				custom_category_name: z.string().max(150).nullish(),
				expense_date: z.coerce.date().optional(),
				description: z.string().max(2000).nullish(),
				business_purpose: z.string().max(2000).nullish(),
				payment_method: z.string().max(50).nullish(),
				vendor_id: z.number().int().positive().nullish(),
				project: z.string().max(100).nullish(),
				department: z.string().max(100).nullish(),
				receipt_attachment_id: z.number().int().positive().nullish(),
				as_draft: z.boolean().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			if (!input.category_id && !input.custom_category_name?.trim())
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Select a category or enter a custom category name",
				});
			const me = await requireStaff(ctx.user.email);
			const now = new Date();
			const [row] = await db
				.insert(employeeExpenses)
				.values({
					branch_id: ctx.user.branchId ?? me.branch_id ?? null,
					expense_number: generateDocNumber("EXP"),
					staff_id: me.id,
					amount: input.amount.toFixed(2),
					category_id: input.category_id ?? null,
					custom_category_name: input.custom_category_name?.trim() || null,
					expense_date: input.expense_date ?? now,
					description: input.description ?? null,
					business_purpose: input.business_purpose ?? null,
					payment_method: input.payment_method ?? null,
					vendor_id: input.vendor_id ?? null,
					project: input.project ?? null,
					department: input.department ?? null,
					receipt_attachment_id: input.receipt_attachment_id ?? null,
					status: input.as_draft ? "draft" : "submitted",
					submitted_at: input.as_draft ? null : now,
					created_by: ctx.user.id,
				})
				.returning();
			return row;
		}),

	// ── My expenses ─────────────────────────────────────────────────────────────
	listMine: protectedProcedure
		.input(
			z
				.object({ status: z.string().optional() })
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const me = await requireStaff(ctx.user.email);
			const conds = [
				eq(employeeExpenses.staff_id, me.id),
				eq(employeeExpenses.is_deleted, false),
			];
			if (input?.status) conds.push(eq(employeeExpenses.status, input.status));
			return db
				.select()
				.from(employeeExpenses)
				.where(and(...conds))
				.orderBy(desc(employeeExpenses.created_at));
		}),

	// ── Reviewer / finance list ─────────────────────────────────────────────────
	list: roleProcedure([...READ_ROLES])
		.input(
			z.object({
				status: z.string().optional(),
				staff_id: z.number().int().positive().optional(),
				limit: z.number().min(1).max(100).default(25),
				offset: z.number().min(0).default(0),
			}),
		)
		.query(async ({ ctx, input }) => {
			const conds = [eq(employeeExpenses.is_deleted, false)];
			if (ctx.user.branchId != null)
				conds.push(eq(employeeExpenses.branch_id, ctx.user.branchId));
			if (input.status) conds.push(eq(employeeExpenses.status, input.status));
			if (input.staff_id)
				conds.push(eq(employeeExpenses.staff_id, input.staff_id));
			const where = and(...conds);
			const [items, [{ total }]] = await Promise.all([
				db.query.employeeExpenses.findMany({
					where,
					with: {
						staffMember: { columns: { id: true, name: true } },
						category: true,
					},
					orderBy: [desc(employeeExpenses.created_at)],
					limit: input.limit,
					offset: input.offset,
				}),
				db.select({ total: count() }).from(employeeExpenses).where(where),
			]);
			return { items, total: Number(total) };
		}),

	get: protectedProcedure
		.input(z.object({ id: z.number().int().positive() }))
		.query(async ({ ctx, input }) => {
			const row = await db.query.employeeExpenses.findFirst({
				where: eq(employeeExpenses.id, input.id),
				with: { staffMember: true, category: true, payment: true },
			});
			if (!row || row.is_deleted)
				throw new TRPCError({ code: "NOT_FOUND", message: "Expense not found" });
			// A submitter may always read their own; reviewers read within their branch.
			const me = await requireStaff(ctx.user.email);
			const isOwner = row.staff_id === me.id;
			const isReviewer =
				(READ_ROLES as readonly string[]).includes(ctx.user.role) &&
				(ctx.user.branchId == null || row.branch_id === ctx.user.branchId);
			if (!isOwner && !isReviewer)
				throw new TRPCError({ code: "FORBIDDEN", message: "Not allowed" });
			return row;
		}),

	// ── Review (approve / reject) ─────────────────────────────────────────────
	review: roleProcedure([...REVIEW_ROLES])
		.input(
			z.object({
				id: z.number().int().positive(),
				decision: z.enum(["approve", "reject"]),
				review_notes: z.string().max(2000).nullish(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const reviewer = await requireStaff(ctx.user.email);
			return db.transaction(async (tx) => {
				const [existing] = await tx
					.select()
					.from(employeeExpenses)
					.where(
						and(
							eq(employeeExpenses.id, input.id),
							eq(employeeExpenses.is_deleted, false),
							ctx.user.branchId != null
								? eq(employeeExpenses.branch_id, ctx.user.branchId)
								: undefined,
						),
					)
					.limit(1);
				if (!existing)
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Expense not found",
					});
				if (!["submitted", "under_review"].includes(existing.status))
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Cannot review an expense that is "${existing.status}"`,
					});
				const newStatus =
					input.decision === "approve" ? "approved" : "rejected";
				const [updated] = await tx
					.update(employeeExpenses)
					.set({
						status: newStatus,
						reviewed_by: reviewer.id,
						reviewed_at: new Date(),
						review_notes: input.review_notes ?? null,
					})
					.where(eq(employeeExpenses.id, input.id))
					.returning();
				await logAudit(tx, {
					actor: {
						id: ctx.user.id,
						email: ctx.user.email,
						name: ctx.user.name,
					},
					action:
						input.decision === "approve"
							? "EXPENSE_APPROVED"
							: "EXPENSE_REJECTED",
					entityType: "employee_expenses",
					entityId: existing.id,
					oldValues: { status: existing.status },
					newValues: { status: newStatus, notes: input.review_notes ?? null },
				});
				return updated;
			});
		}),

	// ── Pay (reimburse an approved expense) ───────────────────────────────────
	pay: roleProcedure([...REVIEW_ROLES])
		.input(
			z.object({
				id: z.number().int().positive(),
				bank_account_id: z.number().int().positive().nullish(),
				payment_method_id: z.number().int().positive().nullish(),
				reference_number: z.string().max(100).nullish(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const actor = {
				id: ctx.user.id,
				email: ctx.user.email,
				name: ctx.user.name,
			};
			return db.transaction(async (tx) => {
				const [existing] = await tx
					.select()
					.from(employeeExpenses)
					.where(
						and(
							eq(employeeExpenses.id, input.id),
							eq(employeeExpenses.is_deleted, false),
							ctx.user.branchId != null
								? eq(employeeExpenses.branch_id, ctx.user.branchId)
								: undefined,
						),
					)
					.limit(1);
				if (!existing)
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Expense not found",
					});
				if (existing.status !== "approved")
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Only approved expenses can be paid",
					});

				// The reimbursement payout is a normal outgoing payment, tagged to
				// its source so it is traceable back to the expense workflow.
				const payment = await postPaymentTx(
					tx,
					{
						branchId: existing.branch_id,
						paymentType: "payment",
						categoryId: existing.category_id,
						customCategoryName: existing.custom_category_name,
						amount: existing.amount,
						paymentMethodId: input.payment_method_id ?? null,
						bankAccountId: input.bank_account_id ?? null,
						staffId: existing.staff_id,
						description:
							existing.description ??
							`Reimbursement ${existing.expense_number}`,
						referenceNumber:
							input.reference_number ?? existing.expense_number,
						source: "employee_expense",
					},
					actor,
				);

				const [updated] = await tx
					.update(employeeExpenses)
					.set({
						status: "paid",
						paid_at: new Date(),
						payment_id: payment.id,
					})
					.where(eq(employeeExpenses.id, input.id))
					.returning();

				await logAudit(tx, {
					actor,
					action: "EXPENSE_PAID",
					entityType: "employee_expenses",
					entityId: existing.id,
					oldValues: { status: existing.status },
					newValues: { status: "paid", payment_id: payment.id },
				});

				return { expense: updated, payment };
			});
		}),
});
