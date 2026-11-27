import { gunzipSync, gzipSync } from "node:zlib";
import { auditLogs } from "@evaluna/db/schema";
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
	const raw = JSON.stringify({
		o: oldValues ?? null,
		n: newValues ?? null,
		u: userAgent ?? null,
	});
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
 * Throttled background sweep (runs at most once every 24h per server instance)
 * so 30+ day old audit logs are automatically compressed without blocking reads.
 */
export function scheduleBackgroundAuditCompression(db: DB): void {
	const now = Date.now();
	if (now - lastAutoCompressionRunAt < ONE_DAY_MS) return;
	lastAutoCompressionRunAt = now;

	compressOldAuditLogs(db, { olderThanDays: 30, batchSize: 200 }).catch(
		() => {},
	);
}
