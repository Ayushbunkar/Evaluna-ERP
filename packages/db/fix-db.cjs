const { Client } = require('pg');
require('dotenv').config({path: '../../.env'});
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function fix() {
  await client.connect();
  try {
    await client.query(`
      ALTER TABLE batch_stock 
      ADD CONSTRAINT batch_stock_location_id_warehouse_locations_id_fk 
      FOREIGN KEY (location_id) REFERENCES warehouse_locations(id) 
      ON DELETE CASCADE;
    `);
    console.log("Constraint added.");
  } catch (e) {
    console.log("Could not add constraint (maybe it exists or tables differ):", e.message);
  }
  
  try {
    await client.query(`
      ALTER TABLE batch_stock 
      ADD CONSTRAINT batch_stock_batch_id_product_batches_id_fk 
      FOREIGN KEY (batch_id) REFERENCES product_batches(id) 
      ON DELETE CASCADE;
    `);
    console.log("Batch constraint added.");
  } catch(e) {}
  
  await client.end();
}
fix();
