import { auditLogs, notifications, staff } from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

/**
 * Shared helpers for the Auditor role: staff resolution, immutable audit
 * logging, notification dispatch, and state-machine transition guards.
 *
 * All helpers accept a `db` handle so they work with both the request-scoped
 * `ctx.db` and a `db.transaction(tx => ...)` handle. Writes go to the canonical
 * `audit_logs` shape defined in packages/db/src/schema.ts
 * (user_id / action / entity_type / entity_id / old_values / new_values).
 */

// biome-ignore lint/suspicious/noExplicitAny: drizzle db/tx handle
type DB = any;

/**
 * Resolve the operational `staff.id` (int) for the logged-in user. The
 * better-auth `user` table keys by a text id and is bridged to `staff` by
 * email. Returns null when the user has no staff record (e.g. superadmin).
 */
export async function resolveStaffId(
	db: DB,
	email: string | null | undefined,
): Promise<number | null> {
	if (!email) return null;
	const rows = await db
		.select({ id: staff.id })
		.from(staff)
		.where(eq(staff.email, email))
		.limit(1);
	return rows[0]?.id ?? null;
}

/**
 * Append an immutable audit-trail entry. Never updates or deletes existing
 * rows — corrections are represented as new events.
 */
export async function logAudit(
	db: DB,
	entry: {
		userId?: number | null;
		action: string;
		entityType: string;
		entityId?: number | null;
		oldValues?: unknown;
		newValues?: unknown;
	},
): Promise<void> {
	await db.insert(auditLogs).values({
		user_id: entry.userId ?? null,
		action: entry.action,
		entity_type: entry.entityType,
		entity_id: entry.entityId ?? null,
		old_values: entry.oldValues ?? null,
		new_values: entry.newValues ?? null,
	});
}

/**
 * Dispatch an in-app notification. `type` and `reference_type` are free
 * varchars, so auditor-specific values need no migration. Deep-link via
 * reference_type + reference_id.
 */
export async function notify(
	db: DB,
	n: {
		branchId?: number | null;
		userId?: number | null;
		type: string;
		priority?: "low" | "normal" | "high" | "critical";
		title: string;
		message?: string;
		referenceType?: string;
		referenceId?: number;
		metadata?: Record<string, unknown>;
	},
): Promise<void> {
	await db.insert(notifications).values({
		branch_id: n.branchId ?? null,
		user_id: n.userId ?? null,
		type: n.type,
		channel: "in_app",
		priority: n.priority ?? "normal",
		title: n.title,
		message: n.message ?? null,
		metadata: n.metadata ?? null,
		reference_type: n.referenceType ?? null,
		reference_id: n.referenceId ?? null,
		status: "pending",
	});
}

/**
 * Guard a status-machine transition. Throws CONFLICT if `current` is not an
 * allowed source state — preventing arbitrary jumps (e.g. PENDING→VERIFIED).
 */
export function assertTransition(
	current: string,
	allowedFrom: string[],
	label = "record",
): void {
	if (!allowedFrom.includes(current)) {
		throw new TRPCError({
			code: "CONFLICT",
			message: `Cannot transition ${label} from "${current}". Allowed from: ${allowedFrom.join(", ")}.`,
		});
	}
}
