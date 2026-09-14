import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as authSchema from "./auth-schema";
import * as schema from "./schema";

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

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is missing in environment variables.");
}

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	...( { lookup: customLookup } as any ),
});

export const db = drizzle(pool, { schema: { ...schema, ...authSchema } });
