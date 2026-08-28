import {
	bankAccounts,
	paymentCategories,
	payments,
	transactions,
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
	or,
	sql,
} from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
	adjustBankBalance,
	directionForPaymentType,
	logAudit,
	postPaymentTx,
} from "@/lib/finance/service";
import { protectedProcedure, roleProcedure, router } from "../init";

const READ_ROLES = ["admin", "manager", "auditor"] as const;
const WRITE_ROLES = ["admin", "manager"] as const;

const paymentInput = z.object({
	payment_type: z
		.enum(["expense", "income", "payment", "receipt", "refund"])
		.default("expense"),
	category_id: z.number().int().positive().nullish(),
	custom_category_name: z.string().max(150).nullish(),
	amount: z.number().positive(),
	currency: z.string().max(10).default("INR"),
	payment_date: z.coerce.date().optional(),
	payment_method_id: z.number().int().positive().nullish(),
	bank_account_id: z.number().int().positive().nullish(),
	paid_by: z.string().max(255).nullish(),
	staff_id: z.number().int().positive().nullish(),
	vendor_id: z.number().int().positive().nullish(),
	customer_id: z.number().int().positive().nullish(),
	department: z.string().max(100).nullish(),
	project: z.string().max(100).nullish(),
	location: z.string().max(150).nullish(),
	description: z.string().max(2000).nullish(),
	reference_number: z.string().max(100).nullish(),
	receipt_attachment_id: z.number().int().positive().nullish(),
	notes: z.string().max(2000).nullish(),
	tax_amount: z.number().min(0).default(0),
});

// PLACEHOLDER_ROUTER
export const paymentsRouter = router({
	// ── Categories (configurable master data) ─────────────────────────────────
	listCategories: roleProcedure([...READ_ROLES])
		.input(
			z.object({ include_inactive: z.boolean().default(false) }).optional(),
		)
		.query(async ({ ctx, input }) => {
			const branchId = ctx.user.branchId;
			const conds = [] as ReturnType<typeof eq>[];
			if (branchId != null)
				conds.push(eq(paymentCategories.branch_id, branchId));
			if (!input?.include_inactive)
				conds.push(eq(paymentCategories.is_active, true));
			return db
				.select()
				.from(paymentCategories)
				.where(conds.length ? and(...conds) : undefined)
				.orderBy(asc(paymentCategories.name));
		}),

	createCategory: roleProcedure([...WRITE_ROLES])
		.input(
			z.object({
				name: z.string().min(1).max(100),
				parent_id: z.number().int().positive().nullish(),
				kind: z.enum(["expense", "income"]).default("expense"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [row] = await db
				.insert(paymentCategories)
				.values({
					branch_id: ctx.user.branchId ?? null,
					name: input.name,
					parent_id: input.parent_id ?? null,
					kind: input.kind,
				})
				.returning();
			return row;
		}),

	updateCategory: roleProcedure([...WRITE_ROLES])
		.input(
			z.object({
				id: z.number().int().positive(),
				name: z.string().min(1).max(100).optional(),
				kind: z.enum(["expense", "income"]).optional(),
				is_active: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...patch } = input;
			const [row] = await db
				.update(paymentCategories)
				.set(patch)
				.where(
					and(
						eq(paymentCategories.id, id),
						ctx.user.branchId != null
							? eq(paymentCategories.branch_id, ctx.user.branchId)
							: undefined,
					),
				)
				.returning();
			if (!row)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Category not found",
				});
			return row;
		}),

	// ── Payments list / detail / stats ────────────────────────────────────────
	list: roleProcedure([...READ_ROLES])
		.input(
			z.object({
				search: z.string().optional(),
				payment_type: z.string().optional(),
				category_id: z.number().int().positive().optional(),
				status: z.string().optional(),
				bank_account_id: z.number().int().positive().optional(),
				payment_method_id: z.number().int().positive().optional(),
				date_from: z.coerce.date().optional(),
				date_to: z.coerce.date().optional(),
				limit: z.number().min(1).max(100).default(25),
				offset: z.number().min(0).default(0),
				sort_by: z
					.enum(["payment_date", "amount", "created_at"])
					.default("payment_date"),
				sort_dir: z.enum(["asc", "desc"]).default("desc"),
			}),
		)
		.query(async ({ ctx, input }) => {
			const conds = [eq(payments.is_deleted, false)];
			if (ctx.user.branchId != null)
				conds.push(eq(payments.branch_id, ctx.user.branchId));
			if (input.payment_type)
				conds.push(eq(payments.payment_type, input.payment_type));
			if (input.status) conds.push(eq(payments.status, input.status));
			if (input.category_id)
				conds.push(eq(payments.category_id, input.category_id));
			if (input.bank_account_id)
				conds.push(eq(payments.bank_account_id, input.bank_account_id));
			if (input.payment_method_id)
				conds.push(eq(payments.payment_method_id, input.payment_method_id));
			if (input.date_from)
				conds.push(gte(payments.payment_date, input.date_from));
			if (input.date_to) conds.push(lte(payments.payment_date, input.date_to));
			if (input.search) {
				const q = `%${input.search}%`;
				const search = or(
					ilike(payments.payment_number, q),
					ilike(payments.description, q),
					ilike(payments.paid_by, q),
					ilike(payments.reference_number, q),
					ilike(payments.custom_category_name, q),
				);
				if (search) conds.push(search);
			}
			const where = and(...conds);
			const sortCol =
				input.sort_by === "amount"
					? payments.amount
					: input.sort_by === "created_at"
						? payments.created_at
						: payments.payment_date;
			const orderBy = input.sort_dir === "asc" ? asc(sortCol) : desc(sortCol);

			const [items, [{ total }]] = await Promise.all([
				db.query.payments.findMany({
					where,
					with: {
						category: true,
						bankAccount: { columns: { id: true, account_name: true } },
						vendor: { columns: { id: true, name: true } },
						customer: { columns: { id: true, name: true } },
						staffMember: { columns: { id: true, name: true } },
					},
					orderBy: [orderBy],
					limit: input.limit,
					offset: input.offset,
				}),
				db.select({ total: count() }).from(payments).where(where),
			]);
			return { items, total: Number(total) };
		}),

	get: roleProcedure([...READ_ROLES])
		.input(z.object({ id: z.number().int().positive() }))
		.query(async ({ ctx, input }) => {
			const payment = await db.query.payments.findFirst({
				where: and(
					eq(payments.id, input.id),
					ctx.user.branchId != null
						? eq(payments.branch_id, ctx.user.branchId)
						: undefined,
				),
				with: {
					category: true,
					bankAccount: true,
					paymentMethod: true,
					vendor: true,
					customer: true,
					staffMember: true,
				},
			});
			if (!payment)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payment not found",
				});
			return payment;
		}),

	stats: roleProcedure([...READ_ROLES]).query(async ({ ctx }) => {
		const branchCond =
			ctx.user.branchId != null
				? eq(payments.branch_id, ctx.user.branchId)
				: undefined;
		const monthStart = new Date();
		monthStart.setDate(1);
		monthStart.setHours(0, 0, 0, 0);

		const [outRes, inRes, monthRes, cntRes] = await Promise.all([
			db
				.select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
				.from(payments)
				.where(
					and(
						branchCond,
						eq(payments.is_deleted, false),
						sql`${payments.payment_type} IN ('expense','payment','refund')`,
					),
				),
			db
				.select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
				.from(payments)
				.where(
					and(
						branchCond,
						eq(payments.is_deleted, false),
						sql`${payments.payment_type} IN ('income','receipt')`,
					),
				),
			db
				.select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
				.from(payments)
				.where(
					and(
						branchCond,
						eq(payments.is_deleted, false),
						gte(payments.payment_date, monthStart),
					),
				),
			db
				.select({ total: count() })
				.from(payments)
				.where(and(branchCond, eq(payments.is_deleted, false))),
		]);
		return {
			totalOut: Number(outRes[0]?.total ?? 0),
			totalIn: Number(inRes[0]?.total ?? 0),
			thisMonth: Number(monthRes[0]?.total ?? 0),
			count: Number(cntRes[0]?.total ?? 0),
		};
	}),

	// ── Create ────────────────────────────────────────────────────────────────
	create: roleProcedure([...WRITE_ROLES])
		.input(paymentInput)
		.mutation(async ({ ctx, input }) => {
			// Flexible entry: a payment must be classified either by a real category
			// or by a free-text "Other / Miscellaneous" name — never silently blank.
			if (!input.category_id && !input.custom_category_name?.trim())
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Select a category or enter a custom category name",
				});

			const actor = {
				id: ctx.user.id,
				email: ctx.user.email,
				name: ctx.user.name,
			};

			return db.transaction(async (tx) => {
				return postPaymentTx(
					tx,
					{
						branchId: ctx.user.branchId ?? null,
						paymentType: input.payment_type,
						categoryId: input.category_id ?? null,
						customCategoryName: input.custom_category_name?.trim() || null,
						amount: input.amount.toFixed(2),
						currency: input.currency,
						paymentDate: input.payment_date,
						paymentMethodId: input.payment_method_id ?? null,
						bankAccountId: input.bank_account_id ?? null,
						paidBy: input.paid_by ?? null,
						staffId: input.staff_id ?? null,
						vendorId: input.vendor_id ?? null,
						customerId: input.customer_id ?? null,
						department: input.department ?? null,
						project: input.project ?? null,
						location: input.location ?? null,
						description: input.description ?? null,
						referenceNumber: input.reference_number ?? null,
						receiptAttachmentId: input.receipt_attachment_id ?? null,
						notes: input.notes ?? null,
						taxAmount: (input.tax_amount ?? 0).toFixed(2),
						source: "payment",
					},
					actor,
				);
			});
		}),

	// ── Update (with balance reconciliation) ──────────────────────────────────
	update: roleProcedure([...WRITE_ROLES])
		.input(
			z.object({
				id: z.number().int().positive(),
				payment_type: z
					.enum(["expense", "income", "payment", "receipt", "refund"])
					.optional(),
				category_id: z.number().int().positive().nullish(),
				custom_category_name: z.string().max(150).nullish(),
				amount: z.number().positive().optional(),
				payment_date: z.coerce.date().optional(),
				payment_method_id: z.number().int().positive().nullish(),
				bank_account_id: z.number().int().positive().nullish(),
				paid_by: z.string().max(255).nullish(),
				staff_id: z.number().int().positive().nullish(),
				vendor_id: z.number().int().positive().nullish(),
				customer_id: z.number().int().positive().nullish(),
				department: z.string().max(100).nullish(),
				project: z.string().max(100).nullish(),
				location: z.string().max(150).nullish(),
				description: z.string().max(2000).nullish(),
				reference_number: z.string().max(100).nullish(),
				notes: z.string().max(2000).nullish(),
				tax_amount: z.number().min(0).optional(),
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
					.from(payments)
					.where(
						and(
							eq(payments.id, input.id),
							eq(payments.is_deleted, false),
							ctx.user.branchId != null
								? eq(payments.branch_id, ctx.user.branchId)
								: undefined,
						),
					)
					.limit(1);
				if (!existing)
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Payment not found",
					});

				const newType = input.payment_type ?? existing.payment_type;
				const newAmount =
					input.amount != null ? input.amount.toFixed(2) : existing.amount;
				const newBankId =
					input.bank_account_id !== undefined
						? input.bank_account_id
						: existing.bank_account_id;

				// Reverse the old cash effect, then apply the new one — correct even
				// when the account, amount or direction all changed at once.
				const oldDir = directionForPaymentType(existing.payment_type);
				if (existing.bank_account_id) {
					const reversal =
						oldDir === "in" ? `-${existing.amount}` : `${existing.amount}`;
					await adjustBankBalance(tx, existing.bank_account_id, reversal);
				}
				const newDir = directionForPaymentType(newType);
				if (newBankId) {
					const applied = newDir === "in" ? `${newAmount}` : `-${newAmount}`;
					await adjustBankBalance(tx, newBankId, applied);
				}

				const patch: Record<string, unknown> = {
					payment_type: newType,
					amount: newAmount,
					bank_account_id: newBankId,
				};
				if (input.category_id !== undefined)
					patch.category_id = input.category_id;
				if (input.custom_category_name !== undefined)
					patch.custom_category_name =
						input.custom_category_name?.trim() || null;
				if (input.payment_date !== undefined)
					patch.payment_date = input.payment_date;
				if (input.payment_method_id !== undefined)
					patch.payment_method_id = input.payment_method_id;
				if (input.paid_by !== undefined) patch.paid_by = input.paid_by;
				if (input.staff_id !== undefined) patch.staff_id = input.staff_id;
				if (input.vendor_id !== undefined) patch.vendor_id = input.vendor_id;
				if (input.customer_id !== undefined)
					patch.customer_id = input.customer_id;
				if (input.department !== undefined) patch.department = input.department;
				if (input.project !== undefined) patch.project = input.project;
				if (input.location !== undefined) patch.location = input.location;
				if (input.description !== undefined)
					patch.description = input.description;
				if (input.reference_number !== undefined)
					patch.reference_number = input.reference_number;
				if (input.notes !== undefined) patch.notes = input.notes;
				if (input.tax_amount != null)
					patch.tax_amount = input.tax_amount.toFixed(2);

				const [updated] = await tx
					.update(payments)
					.set(patch)
					.where(eq(payments.id, input.id))
					.returning();

				// Keep the mirrored cash-ledger transaction in sync.
				if (existing.transaction_id)
					await tx
						.update(transactions)
						.set({ amount: newAmount, type: newDir })
						.where(eq(transactions.id, existing.transaction_id));

				await logAudit(tx, {
					actor,
					action: "PAYMENT_UPDATED",
					entityType: "payments",
					entityId: existing.id,
					oldValues: {
						amount: existing.amount,
						payment_type: existing.payment_type,
						bank_account_id: existing.bank_account_id,
					},
					newValues: {
						amount: newAmount,
						payment_type: newType,
						bank_account_id: newBankId,
					},
				});

				return updated;
			});
		}),

	// ── Void (soft delete + balance reversal) ─────────────────────────────────
	void: roleProcedure([...WRITE_ROLES])
		.input(
			z.object({
				id: z.number().int().positive(),
				reason: z.string().max(500).optional(),
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
					.from(payments)
					.where(
						and(
							eq(payments.id, input.id),
							eq(payments.is_deleted, false),
							ctx.user.branchId != null
								? eq(payments.branch_id, ctx.user.branchId)
								: undefined,
						),
					)
					.limit(1);
				if (!existing)
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Payment not found",
					});

				// Reverse the cash effect this payment produced.
				if (existing.bank_account_id) {
					const dir = directionForPaymentType(existing.payment_type);
					const reversal =
						dir === "in" ? `-${existing.amount}` : `${existing.amount}`;
					await adjustBankBalance(tx, existing.bank_account_id, reversal);
				}

				await tx
					.update(payments)
					.set({
						is_deleted: true,
						deleted_at: new Date(),
						status: "void",
						notes: input.reason
							? `${existing.notes ? `${existing.notes}\n` : ""}[VOID] ${input.reason}`
							: existing.notes,
					})
					.where(eq(payments.id, input.id));

				if (existing.transaction_id)
					await tx
						.update(transactions)
						.set({ status: "void" })
						.where(eq(transactions.id, existing.transaction_id));

				await logAudit(tx, {
					actor,
					action: "PAYMENT_VOIDED",
					entityType: "payments",
					entityId: existing.id,
					oldValues: {
						amount: existing.amount,
						payment_type: existing.payment_type,
						status: existing.status,
					},
					newValues: { status: "void", reason: input.reason ?? null },
				});

				return { id: existing.id, status: "void" as const };
			});
		}),
});
