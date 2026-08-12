const { Client } = require("pg");

const client = new Client({
  connectionString: process.env.DATABASE_URL, // Replace with your actual neon string if missing
});

async function main() {
  await client.connect();
  console.log("Connected to DB");

  try {
    await client.query(`
      ALTER TABLE "customers" 
      ADD COLUMN IF NOT EXISTS "latitude" varchar(50),
      ADD COLUMN IF NOT EXISTS "longitude" varchar(50);
    `);
    console.log("Successfully added latitude and longitude to customers table.");

    // Add some mock coordinates to existing customers (approximate Mumbai area)
    await client.query(`
      UPDATE "customers" SET latitude = '19.0760', longitude = '72.8777' WHERE id = 1;
      UPDATE "customers" SET latitude = '19.0850', longitude = '72.8850' WHERE id = 2;
      UPDATE "customers" SET latitude = '19.0900', longitude = '72.8600' WHERE id = 3;
      UPDATE "customers" SET latitude = '19.0600', longitude = '72.8900' WHERE id = 4;
      UPDATE "customers" SET latitude = '19.0550', longitude = '72.8500' WHERE id = 5;
      -- Set a default for any other customers just in case
      UPDATE "customers" SET latitude = '19.0700', longitude = '72.8700' WHERE latitude IS NULL;
    `);
    console.log("Added mock coordinates to customers.");

  } catch (error) {
    console.error("Error executing query:", error);
  } finally {
    await client.end();
  }
}

main();
