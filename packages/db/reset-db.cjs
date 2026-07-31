const { Client } = require("pg");
require("dotenv").config({ path: "../../.env" });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function resetDb() {
	await client.connect();
	console.log("Connected to DB, dropping schema...");
	try {
		await client.query("DROP SCHEMA public CASCADE;");
		await client.query("CREATE SCHEMA public;");
		await client.query("GRANT ALL ON SCHEMA public TO public;");
		console.log("Schema reset successfully.");
	} catch (e) {
		console.error("Error resetting schema:", e);
	}
	await client.end();
}

resetDb();
