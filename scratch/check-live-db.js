const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const { Client } = require('pg');

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('sslmode=') ? undefined : { rejectUnauthorized: false },
  });

  await client.connect();

  const result = await client.query(`
    SELECT table_name, column_name, data_type, udt_name, character_maximum_length
    FROM information_schema.columns
    WHERE table_name IN ('gps_logs', 'delivery_stops', 'sales_returns', 'sales_return_items')
    ORDER BY table_name, ordinal_position;
  `);

  console.log(JSON.stringify(result.rows, null, 2));
  await client.end();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
