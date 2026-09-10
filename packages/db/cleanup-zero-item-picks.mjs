import pg from "pg";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../.env") });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  console.log("Cleaning up pick lists with 0 items...");

  // Find pick lists that have 0 pick_list_items
  const res = await client.query(`
    DELETE FROM pick_lists 
    WHERE id NOT IN (SELECT DISTINCT pick_list_id FROM pick_list_items)
    RETURNING id, order_id
  `);

  console.log(`Deleted ${res.rows.length} 0-item pick lists.`);

  // Also check if any order_items were missing for orders, create dummy item if needed or link properly
} finally {
  client.release();
  await pool.end();
}
