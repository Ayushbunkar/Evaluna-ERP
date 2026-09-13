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

const cleanUrl = DATABASE_URL.replace(/^"|"$/g, "");

// DNS lookup fallback helper to bypass ISP/router DNS blocking (e.g. JioFiber query refused)
function customLookup(host: string, opt: any, cb: any) {
	if (typeof opt === "function") {
		cb = opt;
		opt = {};
	}
	const dns = require("node:dns");
	if (typeof dns.setServers === "function") {
		try {
			dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
		} catch {}
	}
	dns.resolve4(host, (rErr: any, addrs: any) => {
		if (!rErr && addrs && addrs.length > 0) {
			if (opt && opt.all) {
				return cb(null, addrs.map((a: string) => ({ address: a, family: 4 })));
			}
			return cb(null, addrs[0], 4);
		}
		dns.lookup(host, opt, cb);
	});
}

// Use postgres.js for full transaction support (better than neon-http for full ERPs)
const sql = postgres(cleanUrl, { prepare: false, lookup: customLookup });
export const db = drizzle(sql, { schema });

// re-export pglite instance for any code that needs direct access (null for postgres mode)
export const pglite = null;
