const path = require("node:path");
const dotenv = require("dotenv");
const { Client } = require("pg");

dotenv.config({ path: path.resolve(process.cwd(), "packages/db/.env2") });

const resetSql = `
  DROP TABLE IF EXISTS "proof_of_deliveries" CASCADE;
  DROP TABLE IF EXISTS "trip_collections" CASCADE;
  DROP TABLE IF EXISTS "gps_logs" CASCADE;
  DROP TABLE IF EXISTS "trip_stops" CASCADE;
  DROP TABLE IF EXISTS "route_stops" CASCADE;
  DROP TABLE IF EXISTS "delivery_stops" CASCADE;
  DROP TABLE IF EXISTS "sales_return_items" CASCADE;
  DROP TABLE IF EXISTS "sales_returns" CASCADE;
  DROP TABLE IF EXISTS "delivery_trips" CASCADE;
  DROP TABLE IF EXISTS "delivery_routes" CASCADE;

  CREATE TABLE "delivery_routes" (
    "id" serial PRIMARY KEY,
    "name" varchar(100) NOT NULL,
    "description" text,
    "branch_id" integer,
    "estimated_distance" numeric(10,2),
    "estimated_time" integer,
    "priority" varchar(20) DEFAULT 'normal',
    "is_active" boolean DEFAULT true,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
  );

  CREATE TABLE "delivery_trips" (
    "id" serial PRIMARY KEY,
    "route_id" integer REFERENCES "delivery_routes"("id"),
    "driver_id" varchar(255) NOT NULL,
    "vehicle_id" integer,
    "status" varchar(20) DEFAULT 'pending',
    "start_time" timestamp,
    "end_time" timestamp,
    "total_distance" numeric(10,2),
    "expected_cash_collection" numeric(12,2),
    "actual_cash_collection" numeric(12,2),
    "expected_stops" integer,
    "completed_stops" integer,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
  );

  CREATE TABLE "route_stops" (
    "id" serial PRIMARY KEY,
    "route_id" integer NOT NULL REFERENCES "delivery_routes"("id"),
    "customer_id" integer NOT NULL REFERENCES "customers"("id"),
    "sequence" integer NOT NULL,
    "estimated_arrival_time" timestamp,
    "estimated_departure_time" timestamp,
    "distance_from_previous" numeric(10,2),
    "notes" text,
    "created_at" timestamp DEFAULT now()
  );

  CREATE TABLE "trip_stops" (
    "id" serial PRIMARY KEY,
    "trip_id" integer NOT NULL REFERENCES "delivery_trips"("id"),
    "customer_id" integer NOT NULL REFERENCES "customers"("id"),
    "sequence" integer NOT NULL,
    "status" varchar(50) DEFAULT 'pending',
    "comments" text,
    "created_at" timestamp DEFAULT now(),
    "resolved_at" timestamp
  );

  CREATE TABLE "gps_logs" (
    "id" serial PRIMARY KEY,
    "trip_id" integer REFERENCES "delivery_trips"("id"),
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "accuracy" numeric(5,2),
    "speed" numeric(5,2),
    "battery_level" numeric(5,2),
    "bearing" numeric(5,2),
    "altitude" numeric(6,2),
    "timestamp" timestamp DEFAULT now(),
    "created_at" timestamp DEFAULT now()
  );

  CREATE TABLE "proof_of_deliveries" (
    "id" serial PRIMARY KEY,
    "trip_stop_id" integer REFERENCES "trip_stops"("id"),
    "order_id" integer REFERENCES "orders"("id"),
    "delivery_status" varchar(20) NOT NULL,
    "signature_url" varchar(255),
    "photo_url" varchar(255),
    "notes" text,
    "delivered_by" integer REFERENCES "staff"("id"),
    "delivered_at" timestamp,
    "created_at" timestamp DEFAULT now()
  );

  CREATE TABLE "trip_collections" (
    "id" serial PRIMARY KEY,
    "trip_id" integer REFERENCES "delivery_trips"("id"),
    "payment_method" varchar(50) NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "transaction_id" varchar(100),
    "reference_number" varchar(100),
    "screenshot_url" varchar(255),
    "collected_by" integer REFERENCES "staff"("id"),
    "collected_at" timestamp,
    "created_at" timestamp DEFAULT now()
  );

  CREATE TABLE "delivery_stops" (
    "id" serial PRIMARY KEY,
    "trip_id" integer REFERENCES "delivery_trips"("id"),
    "order_id" integer REFERENCES "orders"("id"),
    "customer_id" integer NOT NULL REFERENCES "customers"("id"),
    "sequence" integer NOT NULL,
    "status" varchar(50) DEFAULT 'pending',
    "comments" text,
    "created_at" timestamp DEFAULT now(),
    "resolved_at" timestamp
  );

  CREATE TABLE "sales_returns" (
    "branch_id" integer REFERENCES "branches"("id"),
    "id" serial PRIMARY KEY,
    "order_id" integer NOT NULL REFERENCES "orders"("id"),
    "customer_id" integer NOT NULL REFERENCES "customers"("id"),
    "total_amount" numeric(10,2) NOT NULL,
    "cgst_amount" numeric(10,2) DEFAULT '0',
    "sgst_amount" numeric(10,2) DEFAULT '0',
    "igst_amount" numeric(10,2) DEFAULT '0',
    "status" varchar(20) DEFAULT 'pending',
    "user_uid" varchar(255) NOT NULL,
    "created_at" timestamp DEFAULT now()
  );

  CREATE TABLE "sales_return_items" (
    "id" serial PRIMARY KEY,
    "return_id" integer NOT NULL REFERENCES "sales_returns"("id"),
    "product_id" integer NOT NULL REFERENCES "products"("id"),
    "quantity" integer NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "refund_amount" numeric(10,2) NOT NULL,
    "created_at" timestamp DEFAULT now()
  );
`;

(async () => {
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: { rejectUnauthorized: false },
	});

	await client.connect();
	await client.query("BEGIN");
	await client.query(resetSql);
	await client.query("COMMIT");

	const result = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'delivery_routes','delivery_trips','route_stops','trip_stops','gps_logs',
        'proof_of_deliveries','trip_collections','delivery_stops','sales_returns','sales_return_items'
      )
    ORDER BY table_name;
  `);

	console.log(JSON.stringify(result.rows, null, 2));
	await client.end();
})().catch((error) => {
	console.error(error);
	process.exit(1);
});
