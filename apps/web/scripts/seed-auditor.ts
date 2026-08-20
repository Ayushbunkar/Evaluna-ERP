/**
 * Auditor demo/test seed (Phase 5) — dev/test ONLY, idempotent, reversible.
 *
 * SAFETY:
 *  - Guarded by SEED_AUDITOR=1 so it can never run by accident against prod.
 *  - REUSES existing branch/staff/products — it does NOT fabricate auth users
 *    or fake production identities. If the prerequisites aren't present it
 *    logs and skips rather than inventing data.
 *  - Every seeded row carries the marker text "[SEED-AUDITOR]" so it is easy to
 *    identify and delete. Re-running inserts nothing new (idempotent).
 *
 * It creates a small, realistic set of auditor scenarios so the /auditor UI has
 * something to show in a dev environment:
 *   1. An open UPC *verify* task.
 *   2. An escalated stock audit with a mismatch item + an inventory finding and
 *      a pending corrective action.
 *   3. An append-only price-change record awaiting auditor review.
 *   4. An auditor notification.
 *
 * Run: cd apps/web && SEED_AUDITOR=1 bun scripts/seed-auditor.ts
 */
import {
	auditFindings,
	correctiveActions,
	notifications,
	priceChangeHistory,
	products,
	staff,
	stockAuditItems,
	stockAudits,
	upcTasks,
} from "@evaluna/db/schema";
import { and, eq, like } from "drizzle-orm";
import { db } from "../src/lib/db/index";

const TAG = "[SEED-AUDITOR]";

async function main() {
	if (process.env.SEED_AUDITOR !== "1") {
		console.error(
			"Refusing to run: set SEED_AUDITOR=1 to seed auditor demo data (dev/test only).",
		);
		process.exit(1);
	}

	// Reuse existing operational data — never fabricate identities.
	const auditor = (
		await db.select().from(staff).where(eq(staff.role, "auditor")).limit(1)
	)[0];
	const branchId = auditor?.branch_id ?? null;
	const prods = await db.select().from(products).limit(2);

	if (!auditor || branchId == null || prods.length < 2) {
		console.warn(
			"  ! Prerequisites missing (need an auditor staff with a branch and ≥2 products). Skipping — nothing seeded.",
		);
		process.exit(0);
	}
	const [prodA, prodB] = prods;
	console.log(
		`Seeding auditor demo data on branch ${branchId} (auditor #${auditor.id})…`,
	);

	// 1) Open UPC verify task ─────────────────────────────────────────────────
	const existingTask = await db
		.select({ id: upcTasks.id })
		.from(upcTasks)
		.where(and(eq(upcTasks.product_id, prodA.id), eq(upcTasks.task_type, "verify")))
		.limit(1);
	if (existingTask[0]) {
		console.log("  upc_tasks: verify task already present");
	} else {
		await db.insert(upcTasks).values({
			product_id: prodA.id,
			branch_id: branchId,
			task_type: "verify",
			status: "PENDING",
			created_by: auditor.id,
			notes: `${TAG} verify shelf UPC matches system`,
		});
		console.log("  upc_tasks: +1 verify task");
	}

	// 2) Escalated stock audit + mismatch item + finding + corrective action ──
	const existingAudit = await db
		.select({ id: auditFindings.id })
		.from(auditFindings)
		.where(like(auditFindings.title, `${TAG}%`))
		.limit(1);
	if (existingAudit[0]) {
		console.log("  audit_findings: seed finding already present");
	} else {
		const [audit] = await db
			.insert(stockAudits)
			.values({ branch_id: branchId, status: "escalated", auditor_id: auditor.id })
			.returning();
		await db.insert(stockAuditItems).values({
			audit_id: audit.id,
			product_id: prodA.id,
			expected_qty: 100,
			counted_qty: 88,
			status: "escalated",
		});
		const [finding] = await db
			.insert(auditFindings)
			.values({
				branch_id: branchId,
				finding_type: "inventory",
				severity: "HIGH",
				status: "CORRECTIVE_ACTION_REQUIRED",
				title: `${TAG} Stock count mismatch on ${prodA.name}`,
				description: "Physical count 88 vs expected 100 (−12). Investigate shrinkage.",
				reference_type: "stock_audits",
				reference_id: audit.id,
				raised_by: auditor.id,
			})
			.returning();
		await db.insert(correctiveActions).values({
			finding_id: finding.id,
			description: `${TAG} Recount aisle and reconcile ledger`,
			status: "PENDING",
			assigned_to: auditor.id,
		});
		console.log("  stock_audits/finding/corrective_action: +1 escalated scenario");
	}

	// 3) Append-only price-change awaiting review ─────────────────────────────
	const existingPrice = await db
		.select({ id: priceChangeHistory.id })
		.from(priceChangeHistory)
		.where(and(eq(priceChangeHistory.product_id, prodB.id), eq(priceChangeHistory.source, "seed")))
		.limit(1);
	if (existingPrice[0]) {
		console.log("  price_change_history: seed change already present");
	} else {
		await db.insert(priceChangeHistory).values({
			product_id: prodB.id,
			price_field: "base_selling_price",
			old_price: "100.00",
			new_price: "129.00",
			changed_by: auditor.id,
			reason: `${TAG} manager price increase pending auditor review`,
			source: "seed",
		});
		console.log("  price_change_history: +1 change to review");
	}

	// 4) Auditor notification ─────────────────────────────────────────────────
	const existingNote = await db
		.select({ id: notifications.id })
		.from(notifications)
		.where(like(notifications.title, `${TAG}%`))
		.limit(1);
	if (existingNote[0]) {
		console.log("  notifications: seed notification already present");
	} else {
		await db.insert(notifications).values({
			branch_id: branchId,
			type: "audit_finding",
			channel: "in_app",
			priority: "high",
			title: `${TAG} New inventory finding needs action`,
			message: "A HIGH-severity stock discrepancy was raised. Review in Findings.",
			reference_type: "audit_findings",
			status: "pending",
		});
		console.log("  notifications: +1 auditor notification");
	}

	console.log("Done. All seeded rows carry the [SEED-AUDITOR] marker.");
	process.exit(0);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
