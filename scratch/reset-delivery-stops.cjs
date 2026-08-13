const path = require('node:path');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config({ path: path.resolve(process.cwd(), 'packages/db/.env2') });

const sql = `
  DROP TABLE IF EXISTS "delivery_stops";

  CREATE TABLE "delivery_stops" (
    "id" serial PRIMARY KEY,
    "trip_id" integer REFERENCES "delivery_trips"("id"),
    "order_id" integer REFERENCES "orders"("id"),
    "customer_id" integer REFERENCES "customers"("id") NOT NULL,
    "sequence" integer NOT NULL,
    "status" varchar(50) DEFAULT 'pending',
    "comments" text,
    "created_at" timestamp DEFAULT now(),
    "resolved_at" timestamp
  );
`;

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  await client.query(sql);
  console.log('Reset delivery_stops to canonical schema.');

  const result = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'delivery_stops'
    ORDER BY ordinal_position;
  `);

  console.log(JSON.stringify(result.rows, null, 2));
  await client.end();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
