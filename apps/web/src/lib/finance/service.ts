/**
 * Finance & Accounts — shared service layer.
 *
 * Pure, reusable business logic that operates inside a Drizzle transaction so
 * routers stay thin and every money movement is atomic. Reused by the payments,
 * bank-accounts, employee-expense and petty-cash routers.
 */

import {
	accountTransfers,
	auditLogs,
	bankAccounts,
	payments,
	staff,
	transactions,
} from "@evaluna/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Drizzle transaction handle. Typed as `any` to match the project-wide
 * convention — drizzle's parametrised transaction type is not cleanly
 * exportable and every existing router (orders, sales-returns) types it `any`.
 */
// biome-ignore lint/suspicious/noExplicitAny: matches project convention for drizzle tx
export type DbTx = any;

export interface Actor {
	id: string;
	email: string;
	name?: string | null;
}

/** Generate a human-readable, collision-resistant document number. */
export function generateDocNumber(prefix: string): string {
	const ts = Date.now().toString(36).toUpperCase();
	const rand = Math.floor(Math.random() * 1296)
		.toString(36)
		.toUpperCase()
		.padStart(2, "0");
	return `${prefix}-${ts}${rand}`;
}

/** Mask a bank account number, revealing only the last 4 digits. */
export function maskAccountNumber(raw?: string | null): string | null {
	if (!raw) return null;
	const digits = raw.replace(/\s+/g, "");
	if (digits.length <= 4) return digits;
	return `XXXX XXXX ${digits.slice(-4)}`;
}

/** Map a payment_type to the cash-ledger direction it produces. */
export function directionForPaymentType(paymentType: string): "in" | "out" {
	// income & receipt bring money in; expense / payment / refund send it out.
	return paymentType === "income" || paymentType === "receipt" ? "in" : "out";
}

/**
 * Write an audit row inside the given transaction. Resolves the acting
 * staff.id from the actor's email when possible (audit_logs.user_id → staff.id),
 * and always embeds the full actor identity in the values JSON for traceability.
 */
export async function logAudit(
	tx: DbTx,
	params: {
		actor: Actor;
		action: string;
		entityType: string;
		entityId: number | null;
		oldValues?: Record<string, unknown> | null;
		newValues?: Record<string, unknown> | null;
	},
): Promise<void> {
	let staffId: number | null = null;
	try {
		const [row] = await tx
			.select({ id: staff.id })
			.from(staff)
			.where(eq(staff.email, params.actor.email))
			.limit(1);
		staffId = row?.id ?? null;
	} catch {
		staffId = null;
	}
	await tx.insert(auditLogs).values({
		user_id: staffId,
		action: params.action,
		entity_type: params.entityType,
		entity_id: params.entityId,
		old_values: params.oldValues ?? null,
		new_values: { ...(params.newValues ?? {}), _actor: params.actor },
	});
}

/**
 * Atomically adjust a bank/cash account's current_balance by a signed decimal
 * amount. Performed entirely in SQL to preserve numeric precision and to avoid
 * stale read-modify-write races (the DB is the source of truth for balances).
 */
export async function adjustBankBalance(
	tx: DbTx,
	accountId: number,
	signedAmount: string,
): Promise<void> {
	await tx
		.update(bankAccounts)
		.set({
			current_balance: sql`${bankAccounts.current_balance} + ${signedAmount}::numeric`,
		})
		.where(eq(bankAccounts.id, accountId));
}

export interface PostPaymentInput {
	branchId: number | null;
	paymentType: string;
	categoryId?: number | null;
	customCategoryName?: string | null;
	amount: string; // decimal string
	currency?: string;
	paymentDate?: Date;
	paymentMethodId?: number | null;
	bankAccountId?: number | null;
	paidBy?: string | null;
	staffId?: number | null;
	vendorId?: number | null;
	customerId?: number | null;
	department?: string | null;
	project?: string | null;
	location?: string | null;
	description?: string | null;
	referenceNumber?: string | null;
	receiptAttachmentId?: number | null;
	notes?: string | null;
	taxAmount?: string;
	source?: string;
}

/**
 * Create a payment together with its cash-ledger transaction and (optionally)
 * a bank-account balance adjustment and audit log — all inside the caller's
 * transaction. Returns the created payment row.
 */
export async function postPaymentTx(
	tx: DbTx,
	input: PostPaymentInput,
	actor: Actor,
) {
	const paymentNumber = generateDocNumber("PAY");
	const direction = directionForPaymentType(input.paymentType);

	const [payment] = await tx
		.insert(payments)
		.values({
			branch_id: input.branchId ?? null,
			payment_number: paymentNumber,
			payment_type: input.paymentType,
			category_id: input.categoryId ?? null,
			custom_category_name: input.customCategoryName ?? null,
			amount: input.amount,
			currency: input.currency ?? "INR",
			payment_date: input.paymentDate ?? new Date(),
			payment_method_id: input.paymentMethodId ?? null,
			bank_account_id: input.bankAccountId ?? null,
			paid_by: input.paidBy ?? null,
			staff_id: input.staffId ?? null,
			vendor_id: input.vendorId ?? null,
			customer_id: input.customerId ?? null,
			department: input.department ?? null,
			project: input.project ?? null,
			location: input.location ?? null,
			description: input.description ?? null,
			reference_number: input.referenceNumber ?? null,
			receipt_attachment_id: input.receiptAttachmentId ?? null,
			notes: input.notes ?? null,
			tax_amount: input.taxAmount ?? "0",
			status: "completed",
			source: input.source ?? "payment",
			created_by: actor.id,
		})
		.returning();

	// Cash-ledger transaction — the single source of truth for cash movement.
	const [txn] = await tx
		.insert(transactions)
		.values({
			branch_id: input.branchId ?? null,
			amount: input.amount,
			user_uid: actor.id,
			type: direction,
			category: input.customCategoryName || "payment",
			status: "completed",
			description: input.description ?? paymentNumber,
			payment_method_id: input.paymentMethodId ?? null,
			reference_type: "payment",
			reference_id: payment.id,
		})
		.returning();

	await tx
		.update(payments)
		.set({ transaction_id: txn.id })
		.where(eq(payments.id, payment.id));

	if (input.bankAccountId) {
		const signed = direction === "in" ? input.amount : `-${input.amount}`;
		await adjustBankBalance(tx, input.bankAccountId, signed);
	}

	await logAudit(tx, {
		actor,
		action: "PAYMENT_CREATED",
		entityType: "payments",
		entityId: payment.id,
		newValues: {
			payment_number: paymentNumber,
			amount: input.amount,
			payment_type: input.paymentType,
			bank_account_id: input.bankAccountId ?? null,
		},
	});

	return { ...payment, transaction_id: txn.id };
}

export interface PostTransferInput {
	branchId: number | null;
	fromAccountId: number;
	toAccountId: number;
	amount: string; // decimal string
	transferDate?: Date;
	description?: string | null;
	referenceNumber?: string | null;
}

/**
 * Move money between two company accounts atomically: post an "out" transaction
 * on the source and an "in" transaction on the destination, adjust both
 * balances, and record the transfer — all inside the caller's transaction so a
 * partial transfer can never occur. Returns the created account_transfers row.
 */
export async function postTransferTx(
	tx: DbTx,
	input: PostTransferInput,
	actor: Actor,
) {
	if (input.fromAccountId === input.toAccountId) {
		throw new Error("Cannot transfer to the same account");
	}
	const transferNumber = generateDocNumber("TRF");
	const when = input.transferDate ?? new Date();
	const desc = input.description ?? transferNumber;

	const [outTxn] = await tx
		.insert(transactions)
		.values({
			branch_id: input.branchId ?? null,
			amount: input.amount,
			user_uid: actor.id,
			type: "out",
			category: "transfer",
			status: "completed",
			description: desc,
			reference_type: "transfer",
		})
		.returning();

	const [inTxn] = await tx
		.insert(transactions)
		.values({
			branch_id: input.branchId ?? null,
			amount: input.amount,
			user_uid: actor.id,
			type: "in",
			category: "transfer",
			status: "completed",
			description: desc,
			reference_type: "transfer",
		})
		.returning();

	const [transfer] = await tx
		.insert(accountTransfers)
		.values({
			branch_id: input.branchId ?? null,
			transfer_number: transferNumber,
			from_account_id: input.fromAccountId,
			to_account_id: input.toAccountId,
			amount: input.amount,
			transfer_date: when,
			description: input.description ?? null,
			reference_number: input.referenceNumber ?? null,
			from_transaction_id: outTxn.id,
			to_transaction_id: inTxn.id,
			status: "completed",
			created_by: actor.id,
		})
		.returning();

	await adjustBankBalance(tx, input.fromAccountId, `-${input.amount}`);
	await adjustBankBalance(tx, input.toAccountId, `${input.amount}`);

	await logAudit(tx, {
		actor,
		action: "ACCOUNT_TRANSFER",
		entityType: "account_transfers",
		entityId: transfer.id,
		newValues: {
			transfer_number: transferNumber,
			amount: input.amount,
			from_account_id: input.fromAccountId,
			to_account_id: input.toAccountId,
		},
	});

	return transfer;
}
