const path = require('node:path');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config({ path: path.resolve(__dirname, '..', 'packages', 'db', '.env2') });

const statements = [
  `ALTER TABLE IF EXISTS "gps_logs" ALTER COLUMN "latitude" TYPE numeric(10,8) USING NULLIF(trim("latitude"), '')::numeric(10,8);`,
  `ALTER TABLE IF EXISTS "gps_logs" ALTER COLUMN "longitude" TYPE numeric(11,8) USING NULLIF(trim("longitude"), '')::numeric(11,8);`,
  `ALTER TABLE IF EXISTS "gps_logs" ALTER COLUMN "accuracy" TYPE numeric(5,2) USING NULLIF(trim("accuracy"), '')::numeric(5,2);`,
  `ALTER TABLE IF EXISTS "gps_logs" ALTER COLUMN "speed" TYPE numeric(5,2) USING NULLIF(trim("speed"), '')::numeric(5,2);`,
  `ALTER TABLE IF EXISTS "gps_logs" ALTER COLUMN "bearing" TYPE numeric(5,2) USING NULLIF(trim("bearing"), '')::numeric(5,2);`,
  `ALTER TABLE IF EXISTS "gps_logs" ALTER COLUMN "altitude" TYPE numeric(6,2) USING NULLIF(trim("altitude"), '')::numeric(6,2);`,
  `ALTER TABLE IF EXISTS "gps_logs" ADD COLUMN IF NOT EXISTS "battery_level" numeric(5,2);`,
];

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  for (const statement of statements) {
    try {
      await client.query(statement);
      console.log('OK:', statement.slice(0, 120));
    } catch (error) {
      console.log('SKIP:', error.message);
    }
  }

  const result = await client.query(`
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_name = 'gps_logs' AND column_name IN ('latitude','longitude','accuracy','speed','bearing','altitude','battery_level')
    ORDER BY ordinal_position;
  `);

  console.log(JSON.stringify(result.rows, null, 2));
  await client.end();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
