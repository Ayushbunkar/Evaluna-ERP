// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { createTestDb, FINANCE_SCHEMA_DDL, makeFinanceUser } from "./helpers";

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const { paymentsRouter } = await import("../payments");
const { bankAccountsRouter } = await import("../bank-accounts");
const { employeeExpensesRouter } = await import("../employee-expenses");
const { createCallerFactory } = await import("../../init");

// Actors
const manager = makeFinanceUser({ id: "mgr", email: "mgr@test.com", role: "manager", branchId: 1 });
const auditor = makeFinanceUser({ id: "aud", email: "aud@test.com", role: "auditor", branchId: 1 });
const employee = makeFinanceUser({ id: "emp", email: "emp@test.com", role: "staff", branchId: 1 });
const otherBranchMgr = makeFinanceUser({ id: "mgr2", email: "mgr2@test.com", role: "manager", branchId: 2 });

const payAs = (u) => createCallerFactory(paymentsRouter)({ user: u });
const bankAs = (u) => createCallerFactory(bankAccountsRouter)({ user: u });
const expAs = (u) => createCallerFactory(employeeExpensesRouter)({ user: u });

// Seeded ids populated in beforeAll
let fuelCatId;
let cashId;
let hdfcId;
let otherBranchAcctId;
const CASH_OPENING = 25000;
const HDFC_OPENING = 500000;

async function balance(id) {
	const res = await pg.query(
		`SELECT current_balance FROM bank_accounts WHERE id = $1`,
		[id],
	);
	return Number(res.rows[0]?.current_balance);
}

beforeAll(async () => {
	await pg.exec(FINANCE_SCHEMA_DDL);
	// Branches
	await pg.exec(`INSERT INTO branches (id, name) VALUES (1, 'Main'), (2, 'Other');`);
	// Staff (emails must match actor emails for requireStaff / audit resolution)
	await pg.exec(`
		INSERT INTO staff (id, name, email, role, join_date, salary, branch_id) VALUES
		(1, 'Manager', 'mgr@test.com', 'manager', NOW(), 50000, 1),
		(2, 'Employee', 'emp@test.com', 'staff', NOW(), 30000, 1),
		(3, 'Other Mgr', 'mgr2@test.com', 'manager', NOW(), 50000, 2);
	`);
	// Category
	await pg.exec(`INSERT INTO payment_categories (id, branch_id, name, kind, is_active, is_system) VALUES (1, 1, 'Fuel', 'expense', true, false);`);
	fuelCatId = 1;
	// Accounts (branch 1: cash + hdfc; branch 2: one account for isolation)
	await pg.exec(`
		INSERT INTO bank_accounts (id, branch_id, account_name, account_type, opening_balance, current_balance, currency, status) VALUES
		(1, 1, 'Cash in Hand', 'cash', ${CASH_OPENING}, ${CASH_OPENING}, 'INR', 'active'),
		(2, 1, 'HDFC Current', 'bank', ${HDFC_OPENING}, ${HDFC_OPENING}, 'INR', 'active'),
		(3, 2, 'Other Branch Cash', 'cash', 9000, 9000, 'INR', 'active');
	`);
	cashId = 1;
	hdfcId = 2;
	otherBranchAcctId = 3;
});

afterAll(async () => {
	await pg.close();
});

describe("payments.create — Section 51 real chain", () => {
	it("records a categorized expense, posts a ledger txn, and moves the bank balance", async () => {
		const before = await balance(cashId);
		await payAs(manager).create({
			payment_type: "expense",
			category_id: fuelCatId,
			amount: 1500,
			bank_account_id: cashId,
			description: "Petrol for delivery van",
		});

		// Balance moved by exactly the amount (money out).
		expect(await balance(cashId)).toBe(before - 1500);

		// A completed ledger transaction was written and linked.
		const txns = await pg.query(
			`SELECT type, amount, reference_type FROM transactions WHERE reference_type = 'payment'`,
		);
		const rows = txns.rows;
		expect(rows.length).toBeGreaterThanOrEqual(1);
		expect(rows.some((t) => t.type === "out" && Number(t.amount) === 1500)).toBe(true);

		// Visible through the list API with its category joined.
		const list = await payAs(manager).list({ limit: 50, offset: 0 });
		const found = list.items.find((p) => Number(p.amount) === 1500);
		expect(found).toBeTruthy();
		expect(found.category?.name).toBe("Fuel");
	});

	it("supports the Other/Miscellaneous custom-category fallback", async () => {
		const before = await balance(hdfcId);
		await payAs(manager).create({
			payment_type: "expense",
			custom_category_name: "Emergency courier",
			amount: 450,
			bank_account_id: hdfcId,
			description: "Other — urgent courier",
		});
		expect(await balance(hdfcId)).toBe(before - 450);
		const list = await payAs(manager).list({ limit: 50, offset: 0 });
		expect(
			list.items.some((p) => p.custom_category_name === "Emergency courier"),
		).toBe(true);
	});

	it("adds income back to the balance (money in)", async () => {
		const before = await balance(hdfcId);
		await payAs(manager).create({
			payment_type: "income",
			custom_category_name: "Counter sales",
			amount: 18500,
			bank_account_id: hdfcId,
		});
		expect(await balance(hdfcId)).toBe(before + 18500);
	});

	it("rejects a payment with neither category nor custom name — nothing posted", async () => {
		const before = await balance(cashId);
		await expect(
			payAs(manager).create({ payment_type: "expense", amount: 100, bank_account_id: cashId }),
		).rejects.toThrow();
		expect(await balance(cashId)).toBe(before);
	});

	it("forbids a write from a role without finance.write (auditor)", async () => {
		await expect(
			payAs(auditor).create({
				payment_type: "expense",
				category_id: fuelCatId,
				amount: 10,
				bank_account_id: cashId,
			}),
		).rejects.toThrow();
	});
});

describe("payments.void", () => {
	it("reverses the bank balance and marks the payment void", async () => {
		const before = await balance(cashId);
		const created = await payAs(manager).create({
			payment_type: "expense",
			category_id: fuelCatId,
			amount: 700,
			bank_account_id: cashId,
			description: "To be voided",
		});
		expect(await balance(cashId)).toBe(before - 700);
		await payAs(manager).void({ id: created.id });
		expect(await balance(cashId)).toBe(before); // fully restored
	});
});

describe("bankAccounts.transfer — atomic both-sided move", () => {
	it("debits source, credits destination, and records the transfer", async () => {
		const fromBefore = await balance(cashId);
		const toBefore = await balance(hdfcId);
		await bankAs(manager).transfer({
			from_account_id: cashId,
			to_account_id: hdfcId,
			amount: 2000,
			description: "Top up",
		});
		expect(await balance(cashId)).toBe(fromBefore - 2000);
		expect(await balance(hdfcId)).toBe(toBefore + 2000);

		const transfers = await bankAs(manager).listTransfers();
		const t = transfers.find((x) => Number(x.amount) === 2000);
		expect(t).toBeTruthy();
		expect(t.from_transaction_id).toBeTruthy();
		expect(t.to_transaction_id).toBeTruthy();
	});

	it("rejects a transfer to the same account", async () => {
		await expect(
			bankAs(manager).transfer({ from_account_id: cashId, to_account_id: cashId, amount: 10 }),
		).rejects.toThrow();
	});

	it("blocks a cross-branch transfer (tenant isolation)", async () => {
		const before = await balance(cashId);
		await expect(
			bankAs(manager).transfer({
				from_account_id: cashId,
				to_account_id: otherBranchAcctId, // belongs to branch 2
				amount: 500,
			}),
		).rejects.toThrow();
		expect(await balance(cashId)).toBe(before); // untouched
	});
});

describe("employeeExpenses — reimbursement workflow", () => {
	it("submit → approve → pay moves through states and pays out from a bank account", async () => {
		// Employee submits.
		const submitted = await expAs(employee).submit({
			amount: 1200,
			category_id: fuelCatId,
			description: "Client visit fuel",
		});
		expect(submitted.status).toBe("submitted");
		expect(submitted.staff_id).toBe(2);

		// Manager sees it in the branch queue.
		const queue = await expAs(manager).list({ limit: 50, offset: 0 });
		expect(queue.items.some((e) => e.id === submitted.id)).toBe(true);

		// Approve.
		const approved = await expAs(manager).review({ id: submitted.id, decision: "approve" });
		expect(approved.status).toBe("approved");
		expect(approved.reviewed_by).toBe(1);

		// Pay from HDFC.
		const hdfcBefore = await balance(hdfcId);
		const result = await expAs(manager).pay({ id: submitted.id, bank_account_id: hdfcId });
		expect(result.expense.status).toBe("paid");
		expect(result.expense.payment_id).toBe(result.payment.id);
		expect(await balance(hdfcId)).toBe(hdfcBefore - 1200);
	});

	it("cannot pay an expense that is not approved", async () => {
		const submitted = await expAs(employee).submit({
			amount: 300,
			custom_category_name: "Misc",
		});
		await expect(expAs(manager).pay({ id: submitted.id })).rejects.toThrow();
	});

	it("cannot review an already-reviewed expense", async () => {
		const submitted = await expAs(employee).submit({ amount: 400, category_id: fuelCatId });
		await expAs(manager).review({ id: submitted.id, decision: "reject" });
		await expect(
			expAs(manager).review({ id: submitted.id, decision: "approve" }),
		).rejects.toThrow();
	});

	it("forbids the reviewer list to a non-finance role", async () => {
		await expect(expAs(employee).list({ limit: 10, offset: 0 })).rejects.toThrow();
	});
});

describe("branch isolation", () => {
	it("a manager in another branch sees none of branch 1's payments", async () => {
		const mine = await payAs(manager).list({ limit: 100, offset: 0 });
		expect(mine.items.length).toBeGreaterThan(0);
		const theirs = await payAs(otherBranchMgr).list({ limit: 100, offset: 0 });
		expect(theirs.items.length).toBe(0);
	});

	it("a manager in another branch sees none of branch 1's accounts", async () => {
		const theirs = await bankAs(otherBranchMgr).list({ include_inactive: true });
		expect(theirs.every((a) => a.id === otherBranchAcctId)).toBe(true);
	});
});
