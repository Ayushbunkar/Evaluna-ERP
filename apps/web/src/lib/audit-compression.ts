import { gunzipSync, gzipSync } from "node:zlib";
import { securityAuditLog } from "@evaluna/db/auth-schema";
import {
	auditLogs,
	eventLogs,
	notifications,
	payrollAudit,
	vanStockAudits,
	vanStockPlans,
} from "@evaluna/db/schema";
import { and, eq, lt, sql } from "drizzle-orm";

// biome-ignore lint/suspicious/noExplicitAny: drizzle db handle
type DB = any;

export interface CompressedAuditPayload {
	_gz: string;
}

export interface AuditCompressionStats {
	processedCount: number;
	compressedCount: number;
	bytesBefore: number;
	bytesAfter: number;
	savedBytes: number;
	byTable?: Record<string, { compressedCount: number; savedBytes: number }>;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
let lastAutoCompressionRunAt = 0;

function isCompressedMarker(val: unknown): val is CompressedAuditPayload {
	return (
		typeof val === "object" &&
		val !== null &&
		"_gz" in val &&
		typeof (val as CompressedAuditPayload)._gz === "string"
	);
}

/**
 * Compresses any JSON value into `{ _gz: "<base64-gzip>" }` if smaller.
 */
export function compressJsonValue(value: unknown): {
	compressed: CompressedAuditPayload;
	bytesBefore: number;
	bytesAfter: number;
	worthCompressing: boolean;
} {
	const raw = JSON.stringify(value ?? null);
	const bytesBefore = Buffer.byteLength(raw, "utf8");
	const gzBase64 = gzipSync(Buffer.from(raw, "utf8"), { level: 9 }).toString(
		"base64",
	);
	const compressed: CompressedAuditPayload = { _gz: gzBase64 };
	const bytesAfter = Buffer.byteLength(JSON.stringify(compressed), "utf8");

	return {
		compressed,
		bytesBefore,
		bytesAfter,
		worthCompressing: bytesAfter < bytesBefore,
	};
}

/**
 * Restores a value compressed by `compressJsonValue`. Never throws.
 */
export function decompressJsonValue<T = unknown>(value: T): T {
	if (!isCompressedMarker(value)) return value;
	try {
		const buf = Buffer.from(value._gz, "base64");
		return JSON.parse(gunzipSync(buf).toString("utf8")) as T;
	} catch {
		return value;
	}
}

/**
 * Transparently decompresses specified JSONB fields on any row object.
 */
export function decompressRowFields<T extends Record<string, any>>(
	row: T,
	fields: (keyof T)[],
): T {
	if (!row) return row;
	let changed = false;
	const copy = { ...row };
	for (const field of fields) {
		if (isCompressedMarker(copy[field])) {
			copy[field] = decompressJsonValue(copy[field]);
			changed = true;
		}
	}
	return changed ? copy : row;
}

/**
 * Compresses old_values, new_values, and user_agent into a single gzip+base64
 * JSONB marker `{ _gz }`. Only replaces the payload if it actually saves space.
 */
export function compressAuditPayload(
	oldValues: unknown,
	newValues: unknown,
	userAgent?: string | null,
): {
	compressed: CompressedAuditPayload;
	bytesBefore: number;
	bytesAfter: number;
	worthCompressing: boolean;
} {
	return compressJsonValue({
		o: oldValues ?? null,
		n: newValues ?? null,
		u: userAgent ?? null,
	});
}

/**
 * Transparently restores `old_values`, `new_values`, and `user_agent` on any
 * audit_logs row whose payload was compressed with `compressAuditPayload`.
 * Never throws: if a row is uncompressed or malformed, returns it as-is.
 */
export function decompressAuditRow<
	T extends {
		old_values?: unknown;
		new_values?: unknown;
		user_agent?: string | null;
	},
>(row: T): T {
	if (!row || !isCompressedMarker(row.new_values)) {
		return row;
	}

	try {
		const buf = Buffer.from(row.new_values._gz, "base64");
		const parsed = JSON.parse(gunzipSync(buf).toString("utf8")) as {
			o?: unknown;
			n?: unknown;
			u?: string | null;
		};
		return {
			...row,
			old_values: parsed.o ?? null,
			new_values: parsed.n ?? null,
			...(row.user_agent !== undefined
				? { user_agent: parsed.u ?? row.user_agent }
				: {}),
		};
	} catch {
		return row;
	}
}

/**
 * Helper to compress a single JSONB column (plus optional user_agent) on any table
 * for rows older than `cutoff`.
 */
async function compressSingleJsonColumn(
	db: DB,
	table: any,
	idCol: any,
	createdCol: any,
	jsonCol: any,
	jsonColKey: string,
	cutoff: Date,
	batchSize: number,
	extraNullUpdates?: Record<string, null>,
	userAgentCol?: any,
): Promise<{ processed: number; compressed: number; before: number; after: number }> {
	const selectObj: Record<string, any> = { id: idCol, payload: jsonCol };
	if (userAgentCol) selectObj.ua = userAgentCol;

	const rows = await db
		.select(selectObj)
		.from(table)
		.where(
			and(
				lt(createdCol, cutoff),
				sql`${jsonCol} IS NOT NULL`,
				sql`NOT (${jsonCol} ? '_gz')`,
			),
		)
		.limit(batchSize);

	let compressed = 0;
	let before = 0;
	let after = 0;

	for (const row of rows) {
		if (isCompressedMarker(row.payload)) continue;
		const res = compressJsonValue(row.payload);
		before += res.bytesBefore;

		if (!res.worthCompressing) {
			after += res.bytesBefore;
			continue;
		}

		await db
			.update(table)
			.set({
				[jsonColKey]: res.compressed,
				...(extraNullUpdates ?? {}),
			})
			.where(eq(idCol, row.id));

		compressed += 1;
		after += res.bytesAfter;
	}

	return { processed: rows.length, compressed, before, after };
}

/**
 * Compresses audit_logs rows older than `olderThanDays` (default 30 days)
 * without deleting a single record. Safe and idempotent: skips already-compressed rows.
 */
export async function compressOldAuditLogs(
	db: DB,
	options: { olderThanDays?: number; batchSize?: number } = {},
): Promise<AuditCompressionStats> {
	const olderThanDays = options.olderThanDays ?? 30;
	const batchSize = options.batchSize ?? 200;
	const cutoff = new Date(Date.now() - olderThanDays * ONE_DAY_MS);

	const rows = await db
		.select({
			id: auditLogs.id,
			old_values: auditLogs.old_values,
			new_values: auditLogs.new_values,
			user_agent: auditLogs.user_agent,
		})
		.from(auditLogs)
		.where(
			and(
				lt(auditLogs.created_at, cutoff),
				sql`(${auditLogs.new_values} IS NULL OR NOT (${auditLogs.new_values} ? '_gz'))`,
			),
		)
		.limit(batchSize);

	let compressedCount = 0;
	let bytesBefore = 0;
	let bytesAfter = 0;

	for (const row of rows) {
		if (isCompressedMarker(row.new_values)) continue;
		const res = compressAuditPayload(
			row.old_values,
			row.new_values,
			row.user_agent,
		);
		bytesBefore += res.bytesBefore;

		if (!res.worthCompressing) {
			bytesAfter += res.bytesBefore;
			continue;
		}

		await db
			.update(auditLogs)
			.set({
				old_values: null,
				new_values: res.compressed,
				user_agent: null,
			})
			.where(eq(auditLogs.id, row.id));

		compressedCount += 1;
		bytesAfter += res.bytesAfter;
	}

	return {
		processedCount: rows.length,
		compressedCount,
		bytesBefore,
		bytesAfter,
		savedBytes: Math.max(0, bytesBefore - bytesAfter),
	};
}

/**
 * Compresses 30+ day old history/audit/log payloads across ALL ERP dashboards
 * (Admin, Auditor, SuperAdmin, Manager, Warehouse, Picker, Packer, Loader,
 * Delivery, HR/Payroll) with ZERO record deletions.
 */
export async function compressAllOldRecords(
	db: DB,
	options: { olderThanDays?: number; batchSize?: number } = {},
): Promise<AuditCompressionStats> {
	const olderThanDays = options.olderThanDays ?? 30;
	const batchSize = options.batchSize ?? 200;
	const cutoff = new Date(Date.now() - olderThanDays * ONE_DAY_MS);

	const auditRes = await compressOldAuditLogs(db, { olderThanDays, batchSize });

	const byTable: Record<string, { compressedCount: number; savedBytes: number }> =
		{
			audit_logs: {
				compressedCount: auditRes.compressedCount,
				savedBytes: auditRes.savedBytes,
			},
		};

	let totalProcessed = auditRes.processedCount;
	let totalCompressed = auditRes.compressedCount;
	let totalBefore = auditRes.bytesBefore;
	let totalAfter = auditRes.bytesAfter;

	const jobs: Array<{
		name: string;
		run: () => Promise<{
			processed: number;
			compressed: number;
			before: number;
			after: number;
		}>;
	}> = [
		{
			name: "security_audit_log",
			run: () =>
				compressSingleJsonColumn(
					db,
					securityAuditLog,
					securityAuditLog.id,
					securityAuditLog.created_at,
					securityAuditLog.new_value,
					"new_value",
					cutoff,
					batchSize,
				),
		},
		{
			name: "payroll_audit",
			run: () =>
				compressSingleJsonColumn(
					db,
					payrollAudit,
					payrollAudit.id,
					payrollAudit.changedAt,
					payrollAudit.newValues,
					"newValues",
					cutoff,
					batchSize,
					{ userAgent: null },
				),
		},
		{
			name: "van_stock_audits",
			run: () =>
				compressSingleJsonColumn(
					db,
					vanStockAudits,
					vanStockAudits.id,
					vanStockAudits.created_at,
					vanStockAudits.metadata,
					"metadata",
					cutoff,
					batchSize,
				),
		},
		{
			name: "van_stock_plans",
			run: () =>
				compressSingleJsonColumn(
					db,
					vanStockPlans,
					vanStockPlans.id,
					vanStockPlans.created_at,
					vanStockPlans.loading_checklist,
					"loading_checklist",
					cutoff,
					batchSize,
				),
		},
		{
			name: "event_logs",
			run: () =>
				compressSingleJsonColumn(
					db,
					eventLogs,
					eventLogs.id,
					eventLogs.created_at,
					eventLogs.metadata,
					"metadata",
					cutoff,
					batchSize,
					{ user_agent: null },
				),
		},
		{
			name: "notifications",
			run: () =>
				compressSingleJsonColumn(
					db,
					notifications,
					notifications.id,
					notifications.created_at,
					notifications.metadata,
					"metadata",
					cutoff,
					batchSize,
				),
		},
	];

	for (const job of jobs) {
		try {
			const res = await job.run();
			totalProcessed += res.processed;
			totalCompressed += res.compressed;
			totalBefore += res.before;
			totalAfter += res.after;
			byTable[job.name] = {
				compressedCount: res.compressed,
				savedBytes: Math.max(0, res.before - res.after),
			};
		} catch {
			// Skip if a table or column isn't present in a test/partial DB
		}
	}

	return {
		processedCount: totalProcessed,
		compressedCount: totalCompressed,
		bytesBefore: totalBefore,
		bytesAfter: totalAfter,
		savedBytes: Math.max(0, totalBefore - totalAfter),
		byTable,
	};
}

/**
 * Throttled background sweep (runs at most once every 24h per server instance)
 * so 30+ day old records across all dashboards are automatically compressed
 * without blocking reads.
 */
export function scheduleBackgroundAuditCompression(db: DB): void {
	const now = Date.now();
	if (now - lastAutoCompressionRunAt < ONE_DAY_MS) return;
	lastAutoCompressionRunAt = now;

	compressAllOldRecords(db, { olderThanDays: 30, batchSize: 200 }).catch(
		() => {},
	);
}
