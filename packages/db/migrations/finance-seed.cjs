/**
 * Finance & Accounts — realistic, relationally-consistent seed data.
 *
 * Idempotent: if payment_categories already has rows it exits without changes,
 * so it is safe to run repeatedly against a shared DB. Everything runs inside a
 * single SQL transaction, mirroring the app's real posting logic (a payment
 * always writes a cash-ledger transaction and moves a bank-account balance) so
 * the seeded data is exactly what the running app would produce.
 *
 * Run: node packages/db/migrations/finance-seed.cjs
 */
const path = require("node:path");
const dotenv = require("dotenv");
const pg = require("pg");

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

function docNumber(prefix) {
	const ts = Date.now().toString(36).toUpperCase();
	const rand = Math.floor(Math.random() * 1296)
		.toString(36)
		.toUpperCase()
		.padStart(2, "0");
	return `${prefix}-${ts}${rand}`;
}

// PLACEHOLDER_SEED
async function seed() {
	if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
	const client = await pool.connect();
	try {
		await client.query("BEGIN");

		const existing = await client.query(
			'SELECT COUNT(*)::int AS c FROM "payment_categories"',
		);
		if (existing.rows[0].c > 0) {
			await client.query("ROLLBACK");
			console.log(
				"Finance seed skipped: payment_categories already populated.",
			);
			return;
		}

		// Anchor to existing tenants/actors so all FKs resolve.
		const branchRes = await client.query(
			'SELECT id FROM "branches" ORDER BY id LIMIT 1',
		);
		const branchId = branchRes.rows[0]?.id ?? null;
		const userRes = await client.query(
			'SELECT id FROM "user" ORDER BY id LIMIT 1',
		);
		const createdBy = userRes.rows[0]?.id ?? "seed";
		const staffRes = await client.query(
			'SELECT id FROM "staff" ORDER BY id LIMIT 2',
		);
		const staffIds = staffRes.rows.map((r) => r.id);

		// ── Categories ──────────────────────────────────────────────────────────
		const catNames = [
			["Fuel", "expense", false],
			["Food & Refreshments", "expense", false],
			["Office Supplies", "expense", false],
			["Travel", "expense", false],
			["Sales Income", "income", false],
			["Other / Miscellaneous", "expense", true],
		];
		const catIds = {};
		for (const [name, kind, isSystem] of catNames) {
			const r = await client.query(
				`INSERT INTO "payment_categories" (branch_id, name, kind, is_active, is_system)
				 VALUES ($1, $2, $3, true, $4) RETURNING id`,
				[branchId, name, kind, isSystem],
			);
			catIds[name] = r.rows[0].id;
		}

		// ── Bank / Cash accounts ─────────────────────────────────────────────────
		async function addAccount(name, type, bankName, number, opening) {
			const masked = number
				? `XXXX XXXX ${String(number).replace(/\s+/g, "").slice(-4)}`
				: null;
			const r = await client.query(
				`INSERT INTO "bank_accounts"
				 (branch_id, account_name, account_type, bank_name, account_number,
				  account_number_masked, opening_balance, current_balance, currency, status)
				 VALUES ($1,$2,$3,$4,$5,$6,$7,$7,'INR','active') RETURNING id`,
				[branchId, name, type, bankName, number, masked, opening],
			);
			return r.rows[0].id;
		}
		const hdfc = await addAccount(
			"HDFC Current A/C",
			"bank",
			"HDFC Bank",
			"50100234564832",
			"500000.00",
		);
		const cash = await addAccount(
			"Cash in Hand",
			"cash",
			null,
			null,
			"25000.00",
		);
		const petty = await addAccount(
			"Petty Cash Box",
			"petty_cash",
			null,
			null,
			"5000.00",
		);

		// PLACEHOLDER_SEED2
		// Helper mirroring postPaymentTx: payment + ledger transaction + balance move.
		async function postPayment(opts) {
			const {
				type,
				categoryId = null,
				customName = null,
				amount,
				bankAccountId = null,
				staffId = null,
				description = null,
				source = "payment",
			} = opts;
			const dir = type === "income" || type === "receipt" ? "in" : "out";
			const num = docNumber("PAY");
			const p = await client.query(
				`INSERT INTO "payments"
				 (branch_id, payment_number, payment_type, category_id, custom_category_name,
				  amount, currency, payment_date, bank_account_id, staff_id, description,
				  status, source, created_by)
				 VALUES ($1,$2,$3,$4,$5,$6,'INR', now(), $7,$8,$9,'completed',$10,$11)
				 RETURNING id`,
				[
					branchId,
					num,
					type,
					categoryId,
					customName,
					amount,
					bankAccountId,
					staffId,
					description,
					source,
					createdBy,
				],
			);
			const paymentId = p.rows[0].id;
			const t = await client.query(
				`INSERT INTO "transactions"
				 (branch_id, amount, user_uid, type, category, status, description,
				  reference_type, reference_id)
				 VALUES ($1,$2,$3,$4,$5,'completed',$6,'payment',$7) RETURNING id`,
				[
					branchId,
					amount,
					createdBy,
					dir,
					customName || "payment",
					description || num,
					paymentId,
				],
			);
			await client.query(
				'UPDATE "payments" SET transaction_id = $1 WHERE id = $2',
				[t.rows[0].id, paymentId],
			);
			if (bankAccountId) {
				const signed = dir === "in" ? amount : `-${amount}`;
				await client.query(
					`UPDATE "bank_accounts" SET current_balance = current_balance + $1::numeric WHERE id = $2`,
					[signed, bankAccountId],
				);
			}
			return paymentId;
		}

		// ── Section-51 payments: the real everyday chain ─────────────────────────
		await postPayment({
			type: "expense",
			categoryId: catIds.Fuel,
			amount: "1500.00",
			bankAccountId: cash,
			description: "Petrol for delivery van",
		});
		await postPayment({
			type: "expense",
			categoryId: catIds.Fuel,
			amount: "4000.00",
			bankAccountId: hdfc,
			description: "Diesel — generator + truck",
		});
		await postPayment({
			type: "expense",
			categoryId: catIds["Food & Refreshments"],
			amount: "2800.00",
			bankAccountId: cash,
			description: "Team lunch",
		});
		await postPayment({
			type: "expense",
			customName: "Emergency courier",
			amount: "450.00",
			bankAccountId: petty,
			description: "Other — urgent document courier",
		});
		await postPayment({
			type: "income",
			categoryId: catIds["Sales Income"],
			amount: "18500.00",
			bankAccountId: hdfc,
			description: "Counter sales settlement",
		});

		// ── Employee expenses (reimbursement workflow, various states) ───────────
		if (staffIds.length > 0) {
			const s0 = staffIds[0];
			const s1 = staffIds[1] ?? staffIds[0];
			async function addExpense(
				staffId,
				amount,
				status,
				categoryId,
				customName,
				extra = {},
			) {
				const num = docNumber("EXP");
				const cols = {
					submitted_at: null,
					reviewed_by: null,
					reviewed_at: null,
					paid_at: null,
					payment_id: null,
					...extra,
				};
				const r = await client.query(
					`INSERT INTO "employee_expenses"
					 (branch_id, expense_number, staff_id, amount, category_id, custom_category_name,
					  expense_date, description, status, submitted_at, reviewed_by, reviewed_at, paid_at, payment_id, created_by)
					 VALUES ($1,$2,$3,$4,$5,$6, now(), $7, $8, $9,$10,$11,$12,$13,$14) RETURNING id`,
					[
						branchId,
						num,
						staffId,
						amount,
						categoryId,
						customName,
						`Reimbursement ${num}`,
						status,
						cols.submitted_at,
						cols.reviewed_by,
						cols.reviewed_at,
						cols.paid_at,
						cols.payment_id,
						createdBy,
					],
				);
				return r.rows[0].id;
			}
			await addExpense(s0, "1200.00", "submitted", catIds.Travel, null, {
				submitted_at: "now()" === "now()" ? new Date().toISOString() : null,
			});
			await addExpense(
				s1,
				"800.00",
				"approved",
				catIds["Office Supplies"],
				null,
				{
					submitted_at: new Date().toISOString(),
					reviewed_by: s0,
					reviewed_at: new Date().toISOString(),
				},
			);
			// A paid one: create its payout payment then link it.
			const payoutId = await postPayment({
				type: "payment",
				categoryId: catIds.Travel,
				amount: "2100.00",
				bankAccountId: hdfc,
				staffId: s1,
				description: "Reimbursement payout",
				source: "employee_expense",
			});
			await addExpense(s1, "2100.00", "paid", catIds.Travel, null, {
				submitted_at: new Date().toISOString(),
				reviewed_by: s0,
				reviewed_at: new Date().toISOString(),
				paid_at: new Date().toISOString(),
				payment_id: payoutId,
			});
		}

		// ── One account transfer (cash box → petty cash) ─────────────────────────
		{
			const num = docNumber("TRF");
			const amount = "2000.00";
			const outT = await client.query(
				`INSERT INTO "transactions" (branch_id, amount, user_uid, type, category, status, description, reference_type)
				 VALUES ($1,$2,$3,'out','transfer','completed',$4,'transfer') RETURNING id`,
				[branchId, amount, createdBy, `Transfer ${num}`],
			);
			const inT = await client.query(
				`INSERT INTO "transactions" (branch_id, amount, user_uid, type, category, status, description, reference_type)
				 VALUES ($1,$2,$3,'in','transfer','completed',$4,'transfer') RETURNING id`,
				[branchId, amount, createdBy, `Transfer ${num}`],
			);
			await client.query(
				`INSERT INTO "account_transfers"
				 (branch_id, transfer_number, from_account_id, to_account_id, amount, transfer_date,
				  description, from_transaction_id, to_transaction_id, status, created_by)
				 VALUES ($1,$2,$3,$4,$5, now(), $6,$7,$8,'completed',$9)`,
				[
					branchId,
					num,
					cash,
					petty,
					amount,
					"Top up petty cash",
					outT.rows[0].id,
					inT.rows[0].id,
					createdBy,
				],
			);
			await client.query(
				`UPDATE "bank_accounts" SET current_balance = current_balance - $1::numeric WHERE id = $2`,
				[amount, cash],
			);
			await client.query(
				`UPDATE "bank_accounts" SET current_balance = current_balance + $1::numeric WHERE id = $2`,
				[amount, petty],
			);
		}

		await client.query("COMMIT");
		console.log("Finance seed complete.");
	} catch (e) {
		await client.query("ROLLBACK");
		throw e;
	} finally {
		client.release();
	}
}

seed()
	.then(() => process.exit(0))
	.catch((e) => {
		console.error("Finance seed failed:", e);
		process.exit(1);
	});
