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
  console.log("Finding orders without pick lists...");
  const ordersRes = await client.query(`
    SELECT o.id, o.status 
    FROM orders o 
    LEFT JOIN pick_lists pl ON pl.order_id = o.id 
    WHERE pl.id IS NULL
  `);

  console.log(`Found ${ordersRes.rows.length} orders needing pick lists.`);

  for (const row of ordersRes.rows) {
    const orderId = row.id;

    // 1. Create Pick List
    const plRes = await client.query(`
      INSERT INTO pick_lists (order_id, reference_type, reference_id, status, priority)
      VALUES ($1, 'sale', $1, 'pending', 'normal')
      RETURNING id
    `, [orderId]);

    const pickListId = plRes.rows[0].id;

    // 2. Fetch Order Items
    const itemsRes = await client.query(`
      SELECT product_id, quantity FROM order_items WHERE order_id = $1
    `, [orderId]);

    for (const item of itemsRes.rows) {
      await client.query(`
        INSERT INTO pick_list_items (pick_list_id, product_id, quantity_ordered, quantity_picked, status)
        VALUES ($1, $2, $3, 0, 'pending')
      `, [pickListId, item.product_id, item.quantity || 1]);
    }

    // 3. Update Order status to pending if it was set to completed
    await client.query(`
      UPDATE orders SET status = 'pending' WHERE id = $1 AND status = 'completed'
    `, [orderId]);

    console.log(`Created PickList PL-${pickListId} for Order ORD-${orderId}`);
  }

  console.log("Backfill complete!");
} finally {
  client.release();
  await pool.end();
}
