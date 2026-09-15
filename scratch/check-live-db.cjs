const path = require("node:path");
const dotenv = require("dotenv");
const { Client } = require("pg");
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
		console.log("customLookup resolve4 result:", { host, rErr, addrs });
		if (!rErr && addrs && addrs.length > 0) {
			if (opt && opt.all) {
				return cb(
					null,
					addrs.map((a) => ({ address: a, family: 4 })),
				);
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
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: { rejectUnauthorized: false },
		lookup: customLookup,
	});

	await client.connect();

	const result = await client.query(`
    SELECT table_name, column_name, data_type, udt_name, character_maximum_length, is_nullable
    FROM information_schema.columns
    WHERE column_name IN ('latitude', 'longitude')
    ORDER BY table_name, ordinal_position;
  `);

	console.log("Connected successfully to Neon DB!");
	console.log(JSON.stringify(result.rows, null, 2));

	await client.end();
})().catch((err) => {
	console.error("Connection error:", err);
	process.exit(1);
});
