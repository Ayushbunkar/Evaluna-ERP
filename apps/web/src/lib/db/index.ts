import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	throw new Error("DATABASE_URL is missing in environment variables.");
}

function normalizePgUrl(rawUrl: string): string {
	let cleanUrl = rawUrl
		.replace(/^"|"$/g, "")
		.replace(/sslmode=(require|prefer|verify-ca)/g, "sslmode=verify-full");

	// Automatic Neon Connection Pooler Upgrade for serverless environments
	try {
		const dbUrlParsed = new URL(cleanUrl);
		if (
			dbUrlParsed.hostname.endsWith(".neon.tech") &&
			!dbUrlParsed.hostname.includes("-pooler")
		) {
			const hostParts = dbUrlParsed.hostname.split(".");
			hostParts[0] = `${hostParts[0]}-pooler`;
			dbUrlParsed.hostname = hostParts.join(".");
			cleanUrl = dbUrlParsed.toString();
		}
	} catch {
		// Fall back to cleanUrl if URL parsing fails
	}
	return cleanUrl;
}

// DNS lookup fallback helper to bypass ISP/router DNS blocking (e.g. JioFiber query refused)
function customLookup(host: string, opt: any, cb: any) {
	if (typeof opt === "function") {
		cb = opt;
		opt = {};
	}
	// Fast-path for local PostgreSQL on VPS / localhost (avoid external 8.8.8.8 DNS query)
	if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
		const ip = host === "::1" ? "::1" : "127.0.0.1";
		const family = host === "::1" ? 6 : 4;
		if (opt && opt.all) {
			return cb(null, [{ address: ip, family }]);
		}
		return cb(null, ip, family);
	}
	try {
		const req = typeof eval !== "undefined" ? eval("require") : null;
		const dns = req ? req("node:dns") : null;
		if (dns && typeof dns.setServers === "function") {
			try {
				dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
			} catch {}
		}
		if (dns && typeof dns.resolve4 === "function") {
			return dns.resolve4(host, (rErr: any, addrs: any) => {
				if (!rErr && addrs && addrs.length > 0) {
					if (opt && opt.all) {
						return cb(
							null,
							addrs.map((a: string) => ({ address: a, family: 4 })),
						);
					}
					return cb(null, addrs[0], 4);
				}
				if (typeof dns.lookup === "function") {
					return dns.lookup(host, opt, cb);
				}
				return cb(null, host);
			});
		}
	} catch {}
	return cb(null, host);
}

function createDrizzleInstance(rawUrl: string) {
	const cleanUrl = normalizePgUrl(rawUrl);
	const isCloudDb = Boolean(
		cleanUrl.includes(".neon.tech") ||
			cleanUrl.includes("supabase.co") ||
			cleanUrl.includes("pooler.supabase.com"),
	);
	const isServerless = Boolean(process.env.VERCEL || isCloudDb);

	const sqlClient = postgres(cleanUrl, {
		prepare: !isServerless,
		max: isServerless ? 3 : 20,
		idle_timeout: 30,
		connect_timeout: 8,
		...(isCloudDb ? { ssl: "require" as const } : {}),
		lookup: customLookup,
	});

	return {
		sqlClient,
		dbInstance: drizzle(sqlClient, { schema }),
	};
}

// Global singleton to reuse postgres connection pool across warm serverless functions
declare global {
	var _evalunaWebSql: ReturnType<typeof postgres> | undefined;
	var _evalunaWebDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
	var _evalunaAuditSql: ReturnType<typeof postgres> | undefined;
	var _evalunaAuditDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
	var _evalunaAuditSchemaReady: Promise<void> | undefined;
}

if (!globalThis._evalunaWebDb) {
	const { sqlClient, dbInstance } = createDrizzleInstance(DATABASE_URL);
	globalThis._evalunaWebSql = sqlClient;
	globalThis._evalunaWebDb = dbInstance;
}

export const db = globalThis._evalunaWebDb;

// Optional Secondary Database for Audit Logs & Event Logs (2nd Supabase / Postgres project)
const RAW_AUDIT_URL = process.env.AUDIT_DATABASE_URL?.trim();
export const isSplitAuditDb = Boolean(
	RAW_AUDIT_URL &&
		normalizePgUrl(RAW_AUDIT_URL) !== normalizePgUrl(DATABASE_URL),
);

if (isSplitAuditDb && RAW_AUDIT_URL && !globalThis._evalunaAuditDb) {
	const { sqlClient, dbInstance } = createDrizzleInstance(RAW_AUDIT_URL);
	globalThis._evalunaAuditSql = sqlClient;
	globalThis._evalunaAuditDb = dbInstance;
}

export const auditDb =
	isSplitAuditDb && globalThis._evalunaAuditDb ? globalThis._evalunaAuditDb : db;

/**
 * Ensures audit_logs and event_logs tables exist on the secondary auditDb
 * (without cross-DB foreign keys) so a fresh 2nd Supabase DB works out-of-the-box.
 */
export function ensureAuditDbSchema(): Promise<void> {
	if (!isSplitAuditDb || !globalThis._evalunaAuditSql) {
		return Promise.resolve();
	}
	if (!globalThis._evalunaAuditSchemaReady) {
		const sql = globalThis._evalunaAuditSql;
		globalThis._evalunaAuditSchemaReady = (async () => {
			try {
				await sql`
					CREATE TABLE IF NOT EXISTS audit_logs (
						id SERIAL PRIMARY KEY,
						user_id INTEGER,
						action VARCHAR(100) NOT NULL,
						entity_type VARCHAR(100) NOT NULL,
						entity_id INTEGER,
						old_values JSONB,
						new_values JSONB,
						ip_address VARCHAR(45),
						user_agent TEXT,
						created_at TIMESTAMP DEFAULT NOW()
					)
				`;
				await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC)`;
				await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id)`;
				await sql`
					CREATE TABLE IF NOT EXISTS event_logs (
						id SERIAL PRIMARY KEY,
						branch_id INTEGER,
						user_id VARCHAR(255),
						severity VARCHAR(20) NOT NULL DEFAULT 'info',
						category VARCHAR(50) NOT NULL,
						event VARCHAR(255) NOT NULL,
						message TEXT,
						metadata JSONB,
						duration_ms INTEGER,
						status_code INTEGER,
						ip_address VARCHAR(45),
						user_agent TEXT,
						created_at TIMESTAMP NOT NULL DEFAULT NOW()
					)
				`;
				await sql`CREATE INDEX IF NOT EXISTS idx_event_logs_created_at ON event_logs (created_at DESC)`;
			} catch (err) {
				console.warn("[auditDb] Non-critical schema bootstrap notice:", err);
			}
		})();
	}
	return globalThis._evalunaAuditSchemaReady;
}

// re-export pglite instance for any code that needs direct access (null for postgres mode)
export const pglite = null;
