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
  console.log("Cleaning up duplicate single-stop test trips...");

  // Find duplicate trip IDs (keeping the latest 1 per driver/vehicle/status)
  const dupesRes = await client.query(`
    WITH DuplicateTrips AS (
      SELECT id, 
             ROW_NUMBER() OVER (PARTITION BY driver_id, vehicle_id, status ORDER BY id DESC) as rn
      FROM delivery_trips
      WHERE status = 'pending'
    )
    SELECT id FROM DuplicateTrips WHERE rn > 1
  `);

  const dupeIds = dupesRes.rows.map(r => r.id);
  console.log(`Found ${dupeIds.length} redundant duplicate trip IDs.`);

  if (dupeIds.length > 0) {
    // Delete associated trip_stops first
    await client.query(`DELETE FROM trip_stops WHERE trip_id = ANY($1)`, [dupeIds]);
    // Delete delivery_trips
    await client.query(`DELETE FROM delivery_trips WHERE id = ANY($1)`, [dupeIds]);
    console.log("Redundant duplicate trips and stops cleaned up!");
  }
} finally {
  client.release();
  await pool.end();
}
