import { accountTransfers, bankAccounts } from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
	logAudit,
	maskAccountNumber,
	postTransferTx,
} from "@/lib/finance/service";
import { roleProcedure, router } from "../init";

const READ_ROLES = ["admin", "manager", "auditor"] as const;
const WRITE_ROLES = ["admin", "manager"] as const;

/**
 * Strip the raw account number before returning to the client. Only the masked
 * form ("XXXX XXXX 4832") ever leaves the server — the full number is write-only.
 */
// biome-ignore lint/suspicious/noExplicitAny: row shape varies by query
function sanitize<T extends Record<string, any>>(row: T) {
	const { account_number, ...rest } = row;
	return rest;
}

export const bankAccountsRouter = router({
	list: roleProcedure([...READ_ROLES])
		.input(
			z
				.object({
					account_type: z.string().optional(),
					include_inactive: z.boolean().default(false),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const conds = [eq(bankAccounts.is_deleted, false)];
			if (ctx.user.branchId != null)
				conds.push(eq(bankAccounts.branch_id, ctx.user.branchId));
			if (input?.account_type)
				conds.push(eq(bankAccounts.account_type, input.account_type));
			if (!input?.include_inactive)
				conds.push(eq(bankAccounts.status, "active"));
			const rows = await db
				.select()
				.from(bankAccounts)
				.where(and(...conds))
				.orderBy(asc(bankAccounts.account_name));
			return rows.map(sanitize);
		}),

	get: roleProcedure([...READ_ROLES])
		.input(z.object({ id: z.number().int().positive() }))
		.query(async ({ ctx, input }) => {
			const [row] = await db
				.select()
				.from(bankAccounts)
				.where(
					and(
						eq(bankAccounts.id, input.id),
						ctx.user.branchId != null
							? eq(bankAccounts.branch_id, ctx.user.branchId)
							: undefined,
					),
				)
				.limit(1);
			if (!row)
				throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });
			return sanitize(row);
		}),

	create: roleProcedure([...WRITE_ROLES])
		.input(
			z.object({
				account_name: z.string().min(1).max(255),
				account_type: z
					.enum(["bank", "cash", "card", "wallet", "petty_cash"])
					.default("bank"),
				bank_name: z.string().max(150).nullish(),
				account_number: z.string().max(50).nullish(),
				ifsc: z.string().max(20).nullish(),
				ledger_account_id: z.number().int().positive().nullish(),
				opening_balance: z.number().default(0),
				currency: z.string().max(10).default("INR"),
				notes: z.string().max(2000).nullish(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const opening = input.opening_balance.toFixed(2);
			return db.transaction(async (tx) => {
				const [row] = await tx
					.insert(bankAccounts)
					.values({
						branch_id: ctx.user.branchId ?? null,
						account_name: input.account_name,
						account_type: input.account_type,
						bank_name: input.bank_name ?? null,
						account_number: input.account_number ?? null,
						account_number_masked: maskAccountNumber(input.account_number),
						ifsc: input.ifsc ?? null,
						ledger_account_id: input.ledger_account_id ?? null,
						opening_balance: opening,
						current_balance: opening,
						currency: input.currency,
						notes: input.notes ?? null,
					})
					.returning();
				await logAudit(tx, {
					actor: {
						id: ctx.user.id,
						email: ctx.user.email,
						name: ctx.user.name,
					},
					action: "BANK_ACCOUNT_CREATED",
					entityType: "bank_accounts",
					entityId: row.id,
					newValues: {
						account_name: row.account_name,
						account_type: row.account_type,
						opening_balance: opening,
					},
				});
				return sanitize(row);
			});
		}),

	update: roleProcedure([...WRITE_ROLES])
		.input(
			z.object({
				id: z.number().int().positive(),
				account_name: z.string().min(1).max(255).optional(),
				bank_name: z.string().max(150).nullish(),
				account_number: z.string().max(50).nullish(),
				ifsc: z.string().max(20).nullish(),
				ledger_account_id: z.number().int().positive().nullish(),
				status: z.enum(["active", "inactive"]).optional(),
				notes: z.string().max(2000).nullish(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, account_number, ...rest } = input;
			const patch: Record<string, unknown> = { ...rest };
			// current_balance and opening_balance are never edited directly — they
			// only move through posted transactions/transfers to stay auditable.
			if (account_number !== undefined) {
				patch.account_number = account_number;
				patch.account_number_masked = maskAccountNumber(account_number);
			}
			const [row] = await db
				.update(bankAccounts)
				.set(patch)
				.where(
					and(
						eq(bankAccounts.id, id),
						ctx.user.branchId != null
							? eq(bankAccounts.branch_id, ctx.user.branchId)
							: undefined,
					),
				)
				.returning();
			if (!row)
				throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });
			return sanitize(row);
		}),

	// ── Transfers ─────────────────────────────────────────────────────────────
	transfer: roleProcedure([...WRITE_ROLES])
		.input(
			z.object({
				from_account_id: z.number().int().positive(),
				to_account_id: z.number().int().positive(),
				amount: z.number().positive(),
				transfer_date: z.coerce.date().optional(),
				description: z.string().max(2000).nullish(),
				reference_number: z.string().max(100).nullish(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			if (input.from_account_id === input.to_account_id)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Source and destination accounts must differ",
				});
			return db.transaction(async (tx) => {
				// Verify both accounts belong to this branch (no cross-tenant transfer).
				const branchCond =
					ctx.user.branchId != null
						? eq(bankAccounts.branch_id, ctx.user.branchId)
						: undefined;
				const accs = await tx
					.select({ id: bankAccounts.id })
					.from(bankAccounts)
					.where(
						and(
							eq(bankAccounts.is_deleted, false),
							branchCond,
							sql`${bankAccounts.id} IN (${input.from_account_id}, ${input.to_account_id})`,
						),
					);
				if (accs.length < 2)
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "One or both accounts not found in this branch",
					});
				return postTransferTx(
					tx,
					{
						branchId: ctx.user.branchId ?? null,
						fromAccountId: input.from_account_id,
						toAccountId: input.to_account_id,
						amount: input.amount.toFixed(2),
						transferDate: input.transfer_date,
						description: input.description ?? null,
						referenceNumber: input.reference_number ?? null,
					},
					{ id: ctx.user.id, email: ctx.user.email, name: ctx.user.name },
				);
			});
		}),

	listTransfers: roleProcedure([...READ_ROLES])
		.input(
			z
				.object({
					limit: z.number().min(1).max(100).default(25),
					offset: z.number().min(0).default(0),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const branchCond =
				ctx.user.branchId != null
					? eq(accountTransfers.branch_id, ctx.user.branchId)
					: undefined;
			return db
				.select()
				.from(accountTransfers)
				.where(branchCond)
				.orderBy(desc(accountTransfers.transfer_date))
				.limit(input?.limit ?? 25)
				.offset(input?.offset ?? 0);
		}),
});
