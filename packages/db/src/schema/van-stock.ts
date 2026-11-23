import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	decimal,
	index,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { user } from "../auth-schema";
import { branches, products } from "../schema";
import { vehicles } from "./delivery";

// ── Van Stock Plans ─────────────────────────────────────────────────────────
export const vanStockPlans = pgTable(
	"van_stock_plans",
	{
		id: serial("id").primaryKey(),
		plan_code: varchar("plan_code", { length: 50 }).notNull().unique(),
		vehicle_id: integer("vehicle_id")
			.references(() => vehicles.id)
			.notNull(),
		driver_id: varchar("driver_id", { length: 255 }),
		branch_id: integer("branch_id")
			.references(() => branches.id)
			.notNull(),
		dispatch_date: date("dispatch_date").notNull(),
		status: varchar("status", { length: 50 }).notNull().default("DRAFT"),
		revision: integer("revision").notNull().default(1),
		notes: text("notes"),
		special_instructions: text("special_instructions"),

		// Manager Creation
		created_by_id: varchar("created_by_id", { length: 255 }).notNull(),
		created_by_name: varchar("created_by_name", { length: 255 }),

		// Picking Stage
		assigned_picker_id: varchar("assigned_picker_id", { length: 255 }),
		picked_at: timestamp("picked_at"),

		// Packing Stage
		assigned_packer_id: varchar("assigned_packer_id", { length: 255 }),
		packed_at: timestamp("packed_at"),

		// Manager Verification Stage
		verified_by_id: varchar("verified_by_id", { length: 255 }),
		verified_at: timestamp("verified_at"),
		verification_notes: text("verification_notes"),

		// Loading Stage
		assigned_loader_id: varchar("assigned_loader_id", { length: 255 }),
		loaded_at: timestamp("loaded_at"),
		loading_notes: text("loading_notes"),
		loading_checklist: jsonb("loading_checklist"),

		// Final Dispatch Stage
		dispatched_by_id: varchar("dispatched_by_id", { length: 255 }),
		dispatched_at: timestamp("dispatched_at"),
		dispatch_reference: varchar("dispatch_reference", { length: 100 }).unique(),

		// Return Stage
		driver_return_notes: text("driver_return_notes"),
		returned_at: timestamp("returned_at"),
		return_verified_by_id: varchar("return_verified_by_id", { length: 255 }),
		return_verified_at: timestamp("return_verified_at"),
		return_verification_notes: text("return_verification_notes"),

		// Rejections / Corrections
		rejection_reason: text("rejection_reason"),
		rejection_stage: varchar("rejection_stage", { length: 50 }),

		created_at: timestamp("created_at").defaultNow().notNull(),
		updated_at: timestamp("updated_at")
			.defaultNow()
			.$onUpdateFn(() => new Date())
			.notNull(),
	},
	(table) => ({
		statusIdx: index("idx_van_stock_plans_status").on(table.status),
		vehicleIdx: index("idx_van_stock_plans_vehicle").on(table.vehicle_id),
		branchIdx: index("idx_van_stock_plans_branch").on(table.branch_id),
		driverIdx: index("idx_van_stock_plans_driver").on(table.driver_id),
		dateIdx: index("idx_van_stock_plans_date").on(table.dispatch_date),
	}),
);

// ── Van Stock Plan Items ────────────────────────────────────────────────────
export const vanStockPlanItems = pgTable(
	"van_stock_plan_items",
	{
		id: serial("id").primaryKey(),
		plan_id: integer("plan_id")
			.references(() => vanStockPlans.id, { onDelete: "cascade" })
			.notNull(),
		product_id: integer("product_id")
			.references(() => products.id)
			.notNull(),
		is_additional: boolean("is_additional").notNull().default(false),
		additional_reason: text("additional_reason"),

		// Planned
		planned_quantity: decimal("planned_quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.notNull(),

		// Picked
		picked_quantity: decimal("picked_quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.default("0")
			.notNull(),
		picking_shortage: decimal("picking_shortage", { precision: 10, scale: 3 })
			.$type<number | string>()
			.default("0")
			.notNull(),
		picking_notes: text("picking_notes"),

		// Packed
		packed_quantity: decimal("packed_quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.default("0")
			.notNull(),
		packing_damaged: decimal("packing_damaged", { precision: 10, scale: 3 })
			.$type<number | string>()
			.default("0")
			.notNull(),
		packing_status: varchar("packing_status", { length: 50 }).default("pending"),
		packing_notes: text("packing_notes"),

		// Verified
		verified_quantity: decimal("verified_quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.default("0")
			.notNull(),
		verification_notes: text("verification_notes"),

		// Loaded
		loaded_quantity: decimal("loaded_quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.default("0")
			.notNull(),
		loading_status: varchar("loading_status", { length: 50 }).default("pending"),
		loading_notes: text("loading_notes"),

		// Delivery / Returns
		delivered_quantity: decimal("delivered_quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.default("0")
			.notNull(),
		returned_quantity: decimal("returned_quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.default("0")
			.notNull(),
		damaged_return_quantity: decimal("damaged_return_quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.default("0")
			.notNull(),
		return_reason_code: varchar("return_reason_code", { length: 100 }),
		return_notes: text("return_notes"),
		verified_return_quantity: decimal("verified_return_quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.default("0")
			.notNull(),

		created_at: timestamp("created_at").defaultNow().notNull(),
		updated_at: timestamp("updated_at")
			.defaultNow()
			.$onUpdateFn(() => new Date())
			.notNull(),
	},
	(table) => ({
		planIdx: index("idx_van_plan_items_plan_id").on(table.plan_id),
		productIdx: index("idx_van_plan_items_product_id").on(table.product_id),
	}),
);

// ── Van Stock Exceptions (e.g. Extra stock found during Loading or Picking) ──
export const vanStockExceptions = pgTable(
	"van_stock_exceptions",
	{
		id: serial("id").primaryKey(),
		plan_id: integer("plan_id")
			.references(() => vanStockPlans.id, { onDelete: "cascade" })
			.notNull(),
		product_id: integer("product_id")
			.references(() => products.id)
			.notNull(),
		stage: varchar("stage", { length: 50 }).notNull(), // 'PICKING' | 'PACKING' | 'LOADING' | 'RETURN'
		requested_by_id: varchar("requested_by_id", { length: 255 }).notNull(),
		requested_by_name: varchar("requested_by_name", { length: 255 }),
		quantity: decimal("quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.notNull(),
		reason: text("reason").notNull(),
		status: varchar("status", { length: 50 }).default("PENDING").notNull(), // 'PENDING' | 'APPROVED' | 'REJECTED'
		reviewed_by_id: varchar("reviewed_by_id", { length: 255 }),
		reviewed_by_name: varchar("reviewed_by_name", { length: 255 }),
		review_notes: text("review_notes"),
		reviewed_at: timestamp("reviewed_at"),
		created_at: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		planIdx: index("idx_van_exceptions_plan_id").on(table.plan_id),
		statusIdx: index("idx_van_exceptions_status").on(table.status),
	}),
);

// ── Van Stock Audits (Immutable Trail) ──────────────────────────────────────
export const vanStockAudits = pgTable(
	"van_stock_audits",
	{
		id: serial("id").primaryKey(),
		plan_id: integer("plan_id")
			.references(() => vanStockPlans.id, { onDelete: "cascade" })
			.notNull(),
		actor_id: varchar("actor_id", { length: 255 }).notNull(),
		actor_name: varchar("actor_name", { length: 255 }).notNull(),
		actor_role: varchar("actor_role", { length: 100 }).notNull(),
		stage: varchar("stage", { length: 50 }).notNull(),
		action: varchar("action", { length: 100 }).notNull(),
		previous_status: varchar("previous_status", { length: 50 }),
		new_status: varchar("new_status", { length: 50 }).notNull(),
		revision: integer("revision").default(1).notNull(),
		reason: text("reason"),
		notes: text("notes"),
		metadata: jsonb("metadata"),
		created_at: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		planIdx: index("idx_van_audits_plan_id").on(table.plan_id),
		createdIdx: index("idx_van_audits_created_at").on(table.created_at),
	}),
);

// ── Relations ───────────────────────────────────────────────────────────────
export const vanStockPlansRelations = relations(
	vanStockPlans,
	({ one, many }) => ({
		vehicle: one(vehicles, {
			fields: [vanStockPlans.vehicle_id],
			references: [vehicles.id],
		}),
		branch: one(branches, {
			fields: [vanStockPlans.branch_id],
			references: [branches.id],
		}),
		driver: one(user, {
			fields: [vanStockPlans.driver_id],
			references: [user.id],
		}),
		items: many(vanStockPlanItems),
		exceptions: many(vanStockExceptions),
		audits: many(vanStockAudits),
	}),
);

export const vanStockPlanItemsRelations = relations(
	vanStockPlanItems,
	({ one }) => ({
		plan: one(vanStockPlans, {
			fields: [vanStockPlanItems.plan_id],
			references: [vanStockPlans.id],
		}),
		product: one(products, {
			fields: [vanStockPlanItems.product_id],
			references: [products.id],
		}),
	}),
);

export const vanStockExceptionsRelations = relations(
	vanStockExceptions,
	({ one }) => ({
		plan: one(vanStockPlans, {
			fields: [vanStockExceptions.plan_id],
			references: [vanStockPlans.id],
		}),
		product: one(products, {
			fields: [vanStockExceptions.product_id],
			references: [products.id],
		}),
	}),
);

export const vanStockAuditsRelations = relations(
	vanStockAudits,
	({ one }) => ({
		plan: one(vanStockPlans, {
			fields: [vanStockAudits.plan_id],
			references: [vanStockPlans.id],
		}),
	}),
);
