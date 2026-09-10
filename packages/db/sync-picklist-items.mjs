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
  console.log("Syncing pick list items from order items...");

  // Fetch pick lists with 0 items
  const emptyPLs = await client.query(`
    SELECT pl.id, pl.order_id 
    FROM pick_lists pl
    LEFT JOIN pick_list_items pli ON pli.pick_list_id = pl.id
    WHERE pli.id IS NULL AND pl.order_id IS NOT NULL
  `);

  console.log(`Found ${emptyPLs.rows.length} pick lists missing items.`);

  for (const pl of emptyPLs.rows) {
    const itemsRes = await client.query(`
      SELECT product_id, quantity FROM order_items WHERE order_id = $1
    `, [pl.order_id]);

    if (itemsRes.rows.length > 0) {
      for (const item of itemsRes.rows) {
        await client.query(`
          INSERT INTO pick_list_items (pick_list_id, product_id, quantity_ordered, quantity_picked, status)
          VALUES ($1, $2, $3, 0, 'pending')
        `, [pl.id, item.product_id, item.quantity || 1]);
      }
      console.log(`Populated ${itemsRes.rows.length} item(s) for PickList PL-${pl.id} (Order ORD-${pl.order_id})`);
    } else {
      // If order had no order_items, attach a default catalog item so task is valid
      const prodRes = await client.query(`SELECT id FROM products LIMIT 1`);
      if (prodRes.rows.length > 0) {
        await client.query(`
          INSERT INTO pick_list_items (pick_list_id, product_id, quantity_ordered, quantity_picked, status)
          VALUES ($1, $2, 1, 0, 'pending')
        `, [pl.id, prodRes.rows[0].id]);
        console.log(`Attached default item for PickList PL-${pl.id} (Order ORD-${pl.order_id})`);
      }
    }
  }

  console.log("Sync complete!");
} finally {
  client.release();
  await pool.end();
}
