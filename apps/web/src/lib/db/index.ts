import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	throw new Error("DATABASE_URL is not set!");
}

if (DATABASE_URL.startsWith('"') && DATABASE_URL.endsWith('"')) {
	console.warn("DATABASE_URL has quotes, stripping them");
}

let cleanUrl = DATABASE_URL.replace(/^"|"$/g, "").replace(
	/sslmode=(require|prefer|verify-ca)/g,
	"sslmode=verify-full",
);

// Automatic Neon Connection Pooler Upgrade:
// In serverless environments (Vercel), routing through Neon's PgBouncer pooler (-pooler)
// reuses connections, drastically reducing database CPU load and handshake latency.
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

// Global singleton to reuse postgres connection pool across warm serverless functions
declare global {
	var _evalunaWebSql: ReturnType<typeof postgres> | undefined;
	var _evalunaWebDb: ReturnType<typeof drizzle> | undefined;
}

const isServerless = Boolean(
	process.env.VERCEL || cleanUrl.includes(".neon.tech"),
);

const sql =
	globalThis._evalunaWebSql ??
	postgres(cleanUrl, {
		prepare: !isServerless, // Prepared statements boost local VPS PostgreSQL speed; disabled for PgBouncer/Neon pooler
		max: isServerless ? 3 : 20, // Small pool for serverless, 20 for dedicated VPS PostgreSQL
		idle_timeout: 30,
		connect_timeout: 5,
		lookup: customLookup,
	});

globalThis._evalunaWebSql = sql;

export const db =
	globalThis._evalunaWebDb ?? drizzle(sql, { schema });

globalThis._evalunaWebDb = db;

// re-export pglite instance for any code that needs direct access (null for postgres mode)
export const pglite = null;
