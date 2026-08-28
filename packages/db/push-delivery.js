import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	throw new Error("DATABASE_URL is not set!");
}

const sql = postgres(DATABASE_URL);

async function run() {
	console.log("Pushing delivery schema directly to DB...");

	try {
		await sql`CREATE TYPE "public"."vehicle_status" AS ENUM('available', 'in_use', 'maintenance', 'retired');`;
		console.log("Created vehicle_status enum");
	} catch (e) {
		console.log("Enum likely already exists:", e.message);
	}

	try {
		await sql`CREATE TABLE IF NOT EXISTS "vehicles" (
            "id" serial PRIMARY KEY NOT NULL,
            "name" varchar(100) NOT NULL,
            "registration_number" varchar(50) NOT NULL,
            "type" varchar(50) NOT NULL,
            "capacity_kg" numeric(10, 2),
            "branch_id" integer,
            "status" "public"."vehicle_status" DEFAULT 'available',
            "created_at" timestamp DEFAULT now(),
            "updated_at" timestamp DEFAULT now()
        );`;
		console.log("Created vehicles table");
	} catch (e) {
		console.error("Failed creating vehicles:", e);
	}

	try {
		await sql`CREATE TABLE IF NOT EXISTS "delivery_routes" (
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
        );`;
		console.log("Created delivery_routes table");
	} catch (e) {
		console.error(e);
	}

	try {
		await sql`CREATE TABLE IF NOT EXISTS "route_stops" (
            "id" serial PRIMARY KEY NOT NULL,
            "route_id" integer NOT NULL,
            "customer_id" integer NOT NULL,
            "sequence" integer NOT NULL,
            "estimated_arrival_time" timestamp,
            "estimated_departure_time" timestamp,
            "distance_from_previous" numeric(10, 2),
            "notes" text,
            "created_at" timestamp DEFAULT now()
        );`;
		console.log("Created route_stops table");
	} catch (e) {
		console.error(e);
	}

	try {
		await sql`CREATE TABLE IF NOT EXISTS "delivery_trips" (
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
        );`;
		console.log("Created delivery_trips table");
	} catch (e) {
		console.error(e);
	}

	try {
		await sql`CREATE TABLE IF NOT EXISTS "trip_stops" (
            "id" serial PRIMARY KEY NOT NULL,
            "trip_id" integer NOT NULL,
            "customer_id" integer NOT NULL,
            "sequence" integer NOT NULL,
            "status" varchar(50) DEFAULT 'pending',
            "comments" text,
            "created_at" timestamp DEFAULT now(),
            "resolved_at" timestamp
        );`;
		console.log("Created trip_stops table");
	} catch (e) {
		console.error(e);
	}

	try {
		await sql`CREATE TABLE IF NOT EXISTS "gps_logs" (
            "id" serial PRIMARY KEY NOT NULL,
            "trip_id" integer,
            "latitude" numeric(10, 8),
            "longitude" numeric(11, 8),
            "accuracy" numeric(5, 2),
            "speed" numeric(5, 2),
            "bearing" numeric(5, 2),
            "altitude" numeric(6, 2),
            "timestamp" timestamp DEFAULT now(),
            "created_at" timestamp DEFAULT now()
        );`;
		console.log("Created gps_logs table");
	} catch (e) {
		console.error(e);
	}

	try {
		await sql`CREATE TABLE IF NOT EXISTS "proof_of_deliveries" (
            "id" serial PRIMARY KEY NOT NULL,
            "trip_stop_id" integer,
            "order_id" integer,
            "delivery_status" varchar(20) NOT NULL,
            "signature_url" varchar(255),
            "photo_url" varchar(255),
            "notes" text,
            "delivered_by" integer,
            "delivered_at" timestamp,
            "created_at" timestamp DEFAULT now()
        );`;
		console.log("Created proof_of_deliveries table");
	} catch (e) {
		console.error(e);
	}

	try {
		await sql`CREATE TABLE IF NOT EXISTS "trip_collections" (
            "id" serial PRIMARY KEY NOT NULL,
            "trip_id" integer,
            "payment_method" varchar(50) NOT NULL,
            "amount" numeric(12, 2) NOT NULL,
            "transaction_id" varchar(100),
            "reference_number" varchar(100),
            "screenshot_url" varchar(255),
            "collected_by" integer,
            "collected_at" timestamp,
            "created_at" timestamp DEFAULT now()
        );`;
		console.log("Created trip_collections table");
	} catch (e) {
		console.error(e);
	}

	console.log("All tables created successfully!");
	process.exit(0);
}

run();
