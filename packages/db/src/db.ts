import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as authSchema from "./auth-schema";
import * as schema from "./schema";

function customLookup(host: string, opt: any, cb: any) {
	if (typeof opt === "function") {
		cb = opt;
		opt = {};
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

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is missing in environment variables.");
}

let cleanDbUrl = process.env.DATABASE_URL.replace(/^"|"$/g, "").replace(
	/sslmode=(require|prefer|verify-ca)/g,
	"sslmode=verify-full",
);

// Automatic Neon Connection Pooler Upgrade:
// In serverless environments (Vercel), routing through Neon's PgBouncer pooler (-pooler)
// reuses connections, drastically reducing database CPU load and handshake latency.
try {
	const dbUrlParsed = new URL(cleanDbUrl);
	if (
		dbUrlParsed.hostname.endsWith(".neon.tech") &&
		!dbUrlParsed.hostname.includes("-pooler")
	) {
		const hostParts = dbUrlParsed.hostname.split(".");
		hostParts[0] = `${hostParts[0]}-pooler`;
		dbUrlParsed.hostname = hostParts.join(".");
		cleanDbUrl = dbUrlParsed.toString();
	}
} catch {
	// Fall back to cleanDbUrl if URL parsing fails
}

// Global singleton to reuse connection pool across warm serverless function instances
declare global {
	var _evalunaPgPool: Pool | undefined;
}

const pool =
	globalThis._evalunaPgPool ??
	new Pool({
		connectionString: cleanDbUrl,
		max: 3, // Keep pool small for serverless instances
		idleTimeoutMillis: 30000,
		connectionTimeoutMillis: 5000,
		...({ lookup: customLookup } as any),
	});

if (process.env.NODE_ENV !== "production") {
	globalThis._evalunaPgPool = pool;
}

export const db = drizzle(pool, { schema: { ...schema, ...authSchema } });
