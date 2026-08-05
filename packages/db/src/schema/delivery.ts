import { relations } from "drizzle-orm";
import {
	boolean,
	decimal,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { branches, customers, orders, staff, user } from "..";

export const vehicleStatusEnum = pgEnum("vehicle_status", [
	"available",
	"in_use",
	"maintenance",
	"retired",
]);

// Vehicles
export const vehicles = pgTable("vehicles", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	registration_number: varchar("registration_number", { length: 50 }).notNull(),
	type: varchar("type", { length: 50 }).notNull(),
	capacity_kg: decimal("capacity_kg", { precision: 10, scale: 2 }),
	branch_id: integer("branch_id").references(() => branches.id),
	status: vehicleStatusEnum("status").default("available"),
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at")
		.defaultNow()
		.$onUpdateFn(() => new Date()),
});

// Delivery Routes
export const deliveryRoutes = pgTable("delivery_routes", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	description: text("description"),
	branch_id: integer("branch_id"),
	estimated_distance: decimal("estimated_distance", { precision: 10, scale: 2 }),
	estimated_time: integer("estimated_time"), // in minutes
	priority: varchar("priority", { length: 20 }).default("normal"),
	is_active: boolean("is_active").default(true),
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at")
		.defaultNow()
		.$onUpdateFn(() => new Date()),
});

export const routeStops = pgTable("route_stops", {
	id: serial("id").primaryKey(),
	route_id: integer("route_id")
		.references(() => deliveryRoutes.id)
		.notNull(),
	customer_id: integer("customer_id")
		.references(() => customers.id)
		.notNull(),
	sequence: integer("sequence").notNull(),
	estimated_arrival_time: timestamp("estimated_arrival_time"),
	estimated_departure_time: timestamp("estimated_departure_time"),
	distance_from_previous: decimal("distance_from_previous", { precision: 10, scale: 2 }),
	notes: text("notes"),
	created_at: timestamp("created_at").defaultNow(),
});

// Delivery Trips
export const deliveryTrips = pgTable("delivery_trips", {
	id: serial("id").primaryKey(),
	route_id: integer("route_id").references(() => deliveryRoutes.id),
	driver_id: varchar("driver_id", { length: 255 }).notNull(),
	vehicle_id: integer("vehicle_id"),
	status: varchar("status", { length: 20 }).default("pending"),
	start_time: timestamp("start_time"),
	end_time: timestamp("end_time"),
	total_distance: decimal("total_distance", { precision: 10, scale: 2 }),
	expected_cash_collection: decimal("expected_cash_collection", { precision: 12, scale: 2 }),
	actual_cash_collection: decimal("actual_cash_collection", { precision: 12, scale: 2 }),
	expected_stops: integer("expected_stops"),
	completed_stops: integer("completed_stops"),
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at")
		.defaultNow()
		.$onUpdateFn(() => new Date()),
});

export const tripStops = pgTable("trip_stops", {
	id: serial("id").primaryKey(),
	trip_id: integer("trip_id")
		.references(() => deliveryTrips.id)
		.notNull(),
	customer_id: integer("customer_id")
		.references(() => customers.id)
		.notNull(),
	sequence: integer("sequence").notNull(),
	status: varchar("status", { length: 50 }).default("pending"),
	comments: text("comments"),
	created_at: timestamp("created_at").defaultNow(),
	resolved_at: timestamp("resolved_at"),
});

// GPS Logs
export const gpsLogs = pgTable("gps_logs", {
	id: serial("id").primaryKey(),
	trip_id: integer("trip_id").references(() => deliveryTrips.id),
	latitude: decimal("latitude", { precision: 10, scale: 8 }),
	longitude: decimal("longitude", { precision: 11, scale: 8 }),
	accuracy: decimal("accuracy", { precision: 5, scale: 2 }),
	speed: decimal("speed", { precision: 5, scale: 2 }),
	bearing: decimal("bearing", { precision: 5, scale: 2 }),
	altitude: decimal("altitude", { precision: 6, scale: 2 }),
	timestamp: timestamp("timestamp").defaultNow(),
	created_at: timestamp("created_at").defaultNow(),
});

// Proof of Delivery
export const proofOfDeliveries = pgTable("proof_of_deliveries", {
	id: serial("id").primaryKey(),
	trip_stop_id: integer("trip_stop_id").references(() => tripStops.id),
	order_id: integer("order_id").references(() => orders.id),
	delivery_status: varchar("delivery_status", { length: 20 }).notNull(),
	signature_url: varchar("signature_url", { length: 255 }),
	photo_url: varchar("photo_url", { length: 255 }),
	notes: text("notes"),
	delivered_by: integer("delivered_by").references(() => staff.id),
	delivered_at: timestamp("delivered_at"),
	created_at: timestamp("created_at").defaultNow(),
});

// Trip Collections
export const tripCollections = pgTable("trip_collections", {
	id: serial("id").primaryKey(),
	trip_id: integer("trip_id").references(() => deliveryTrips.id),
	payment_method: varchar("payment_method", { length: 50 }).notNull(),
	amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
	transaction_id: varchar("transaction_id", { length: 100 }),
	reference_number: varchar("reference_number", { length: 100 }),
	screenshot_url: varchar("screenshot_url", { length: 255 }),
	collected_by: integer("collected_by").references(() => staff.id),
	collected_at: timestamp("collected_at"),
	created_at: timestamp("created_at").defaultNow(),
});

// Relations
export const deliveryRoutesRelations = relations(deliveryRoutes, ({ many }) => ({
	stops: many(routeStops),
	trips: many(deliveryTrips),
}));

export const routeStopsRelations = relations(routeStops, ({ one }) => ({
	route: one(deliveryRoutes, {
		fields: [routeStops.route_id],
		references: [deliveryRoutes.id],
	}),
	customer: one(customers, {
		fields: [routeStops.customer_id],
		references: [customers.id],
	}),
}));

export const deliveryTripsRelations = relations(deliveryTrips, ({ many, one }) => ({
	stops: many(tripStops),
	gpsLogs: many(gpsLogs),
	collections: many(tripCollections),
	route: one(deliveryRoutes, {
		fields: [deliveryTrips.route_id],
		references: [deliveryRoutes.id],
	}),
	driver: one(user, {
		fields: [deliveryTrips.driver_id],
		references: [user.id],
	}),
	vehicle: one(vehicles, {
		fields: [deliveryTrips.vehicle_id],
		references: [vehicles.id],
	}),
}));

export const tripStopsRelations = relations(tripStops, ({ one, many }) => ({
	trip: one(deliveryTrips, {
		fields: [tripStops.trip_id],
		references: [deliveryTrips.id],
	}),
	customer: one(customers, {
		fields: [tripStops.customer_id],
		references: [customers.id],
	}),
	proofOfDeliveries: many(proofOfDeliveries),
}));

export const gpsLogsRelations = relations(gpsLogs, ({ one }) => ({
	trip: one(deliveryTrips, {
		fields: [gpsLogs.trip_id],
		references: [deliveryTrips.id],
	}),
}));

export const proofOfDeliveriesRelations = relations(proofOfDeliveries, ({ one }) => ({
	tripStop: one(tripStops, {
		fields: [proofOfDeliveries.trip_stop_id],
		references: [tripStops.id],
	}),
	order: one(orders, {
		fields: [proofOfDeliveries.order_id],
		references: [orders.id],
	}),
	deliveredBy: one(staff, {
		fields: [proofOfDeliveries.delivered_by],
		references: [staff.id],
	}),
}));

export const tripCollectionsRelations = relations(tripCollections, ({ one }) => ({
	trip: one(deliveryTrips, {
		fields: [tripCollections.trip_id],
		references: [deliveryTrips.id],
	}),
	collectedBy: one(staff, {
		fields: [tripCollections.collected_by],
		references: [staff.id],
	}),
}));