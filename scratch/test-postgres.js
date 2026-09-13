const path = require("node:path");
const dotenv = require("dotenv");
const postgres = require("postgres");
const dns = require("node:dns");

if (typeof dns.setServers === "function") {
	dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
}

function customLookup(host, opt, cb) {
	if (typeof opt === "function") {
		cb = opt;
		opt = {};
	}
	dns.resolve4(host, (rErr, addrs) => {
		if (!rErr && addrs && addrs.length > 0) {
			if (opt && opt.all) {
				return cb(null, addrs.map((a) => ({ address: a, family: 4 })));
			}
			return cb(null, addrs[0], 4);
		}
		dns.lookup(host, opt, cb);
	});
}

dotenv.config({
	path: path.resolve(__dirname, "..", "packages", "db", ".env2"),
});

(async () => {
	const sql = postgres(process.env.DATABASE_URL.replace(/^"|"$/g, ""), {
		prepare: false,
		lookup: customLookup,
	});

	const result = await sql`SELECT 1 as connected`;
	console.log("Postgres.js Connected successfully to Neon DB!", result);
	await sql.end();
})().catch((err) => {
	console.error("Postgres.js error:", err);
	process.exit(1);
});
