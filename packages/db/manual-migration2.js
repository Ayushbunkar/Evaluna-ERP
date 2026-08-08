import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS "delivery_routes" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(100) NOT NULL,
        "description" text,
        "branch_id" integer,
        "estimated_distance" numeric(10, 2),
        "estimated_time" integer,
        "priority" varchar(20) DEFAULT 'normal',
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "route_stops" (
        "id" serial PRIMARY KEY NOT NULL,
        "route_id" integer NOT NULL,
        "customer_id" integer NOT NULL,
        "sequence" integer NOT NULL,
        "estimated_arrival_time" timestamp,
        "estimated_departure_time" timestamp,
        "distance_from_previous" numeric(10, 2),
        "notes" text,
        "created_at" timestamp DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "delivery_trips" (
        "id" serial PRIMARY KEY NOT NULL,
        "route_id" integer,
        "driver_id" varchar(255) NOT NULL,
        "vehicle_id" integer,
        "status" varchar(20) DEFAULT 'pending',
        "start_time" timestamp,
        "end_time" timestamp,
        "total_distance" numeric(10, 2),
        "expected_cash_collection" numeric(12, 2),
        "actual_cash_collection" numeric(12, 2),
        "expected_stops" integer,
        "completed_stops" integer,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "trip_stops" (
        "id" serial PRIMARY KEY NOT NULL,
        "trip_id" integer NOT NULL,
        "customer_id" integer NOT NULL,
        "sequence" integer NOT NULL,
        "status" varchar(50) DEFAULT 'pending',
        "comments" text,
        "arrival_time" timestamp,
        "departure_time" timestamp,
        "created_at" timestamp DEFAULT now()
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS "gps_logs" (
        "id" serial PRIMARY KEY NOT NULL,
        "trip_id" integer NOT NULL,
        "latitude" varchar(50) NOT NULL,
        "longitude" varchar(50) NOT NULL,
        "speed" varchar(50),
        "timestamp" timestamp DEFAULT now(),
        "created_at" timestamp DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "sales_returns" (
        "id" serial PRIMARY KEY NOT NULL,
        "order_id" integer,
        "customer_id" integer,
        "reference_type" varchar(50) NOT NULL,
        "status" varchar(50) DEFAULT 'pending',
        "user_uid" varchar(255) NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "sales_return_items" (
        "id" serial PRIMARY KEY NOT NULL,
        "return_id" integer,
        "product_id" integer NOT NULL,
        "quantity" integer NOT NULL,
        "condition" varchar(50) DEFAULT 'good',
        "reason" text,
        "created_at" timestamp DEFAULT now()
      );
    `);

    await client.query('COMMIT');
    console.log("Migration 2 successful");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Migration 2 failed:", e);
  } finally {
    client.release();
  }
}

migrate().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
