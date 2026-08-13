const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const { Client } = require('pg');

const statements = [
  `ALTER TABLE IF EXISTS "gps_logs" ALTER COLUMN "latitude" TYPE numeric(10,8) USING "latitude"::numeric(10,8);`,
  `ALTER TABLE IF EXISTS "gps_logs" ALTER COLUMN "longitude" TYPE numeric(11,8) USING "longitude"::numeric(11,8);`,
  `ALTER TABLE IF EXISTS "gps_logs" ALTER COLUMN "accuracy" TYPE numeric(5,2) USING "accuracy"::numeric(5,2);`,
  `ALTER TABLE IF EXISTS "gps_logs" ALTER COLUMN "speed" TYPE numeric(5,2) USING "speed"::numeric(5,2);`,
  `ALTER TABLE IF EXISTS "gps_logs" ALTER COLUMN "bearing" TYPE numeric(5,2) USING "bearing"::numeric(5,2);`,
  `ALTER TABLE IF EXISTS "gps_logs" ALTER COLUMN "altitude" TYPE numeric(6,2) USING "altitude"::numeric(6,2);`,
  `ALTER TABLE IF EXISTS "gps_logs" ADD COLUMN IF NOT EXISTS "battery_level" numeric(5,2);`,
];

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  for (const sql of statements) {
    try {
      await client.query(sql);
      console.log('OK:', sql.split('ALTER COLUMN')[1] || sql);
    } catch (err) {
      console.log('SKIP:', err.message);
    }
  }

  const check = await client.query(`
    SELECT table_name, column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_name = 'gps_logs' AND column_name IN ('latitude','longitude','accuracy','speed','bearing','altitude','battery_level')
    ORDER BY ordinal_position;
  `);

  console.log(JSON.stringify(check.rows, null, 2));
  await client.end();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
