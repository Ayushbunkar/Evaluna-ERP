const path = require("node:path");
const dotenv = require("dotenv");
const { Client } = require("pg");

dotenv.config({
	path: path.resolve(__dirname, "..", "packages", "db", ".env2"),
});

(async () => {
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: { rejectUnauthorized: false },
	});

	await client.connect();

	const result = await client.query(`
    SELECT table_name, column_name, data_type, udt_name, character_maximum_length, is_nullable
    FROM information_schema.columns
    WHERE column_name IN ('latitude', 'longitude')
    ORDER BY table_name, ordinal_position;
  `);

	console.log(JSON.stringify(result.rows, null, 2));

	const check = await client.query(`
    SELECT table_name, column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_name IN ('gps_logs', 'branch_geofences', 'customers')
    ORDER BY table_name, ordinal_position;
  `);

	console.log("--- other relevant columns ---");
	console.log(JSON.stringify(check.rows, null, 2));

	await client.end();
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
