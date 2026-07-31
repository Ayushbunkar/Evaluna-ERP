import * as dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: "./.env" });

async function check() {
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
	});
	await client.connect();
	const res = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `);
	console.log(res.rows);
	await client.end();
}
check();
