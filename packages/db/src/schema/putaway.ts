import { relations } from "drizzle-orm";
import {
	decimal,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { branches, branchLocations, products, purchases } from "../schema";
import { goodsReceiptNotes } from "./procurement";

// ── Putaway Tasks ───────────────────────────────────────────────────────────
export const putawayTasks = pgTable(
	"putaway_tasks",
	{
		id: serial("id").primaryKey(),
		task_number: varchar("task_number", { length: 60 }).notNull().unique(),
		branch_id: integer("branch_id")
			.references(() => branches.id)
			.notNull(),
		// 'SUPPLIER_GRN', 'VAN_RETURN', 'VAN_MANIFEST_REJECTION'
		source_type: varchar("source_type", { length: 50 }).notNull(),
		source_id: integer("source_id"), // grn_id, sales_return_id, or van_stock_plan_id
		source_reference: varchar("source_reference", { length: 100 }).notNull(), // e.g. GRN-001, VSP-20261109-1906, RET-001
		purchase_id: integer("purchase_id").references(() => purchases.id),
		grn_id: integer("grn_id").references(() => goodsReceiptNotes.id),
		supplier_name: varchar("supplier_name", { length: 255 }),
		driver_name: varchar("driver_name", { length: 255 }),
		vehicle_number: varchar("vehicle_number", { length: 100 }),
		route_name: varchar("route_name", { length: 255 }),
		// 'PENDING', 'IN_PROGRESS', 'PARTIALLY_COMPLETED', 'COMPLETED', 'DISCREPANCY'
		status: varchar("status", { length: 40 }).default("PENDING").notNull(),
		total_items: integer("total_items").default(0).notNull(),
		total_expected_quantity: decimal("total_expected_quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.default("0")
			.notNull(),
		total_putaway_quantity: decimal("total_putaway_quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.default("0")
			.notNull(),
		assigned_putter_id: varchar("assigned_putter_id", { length: 255 }),
		assigned_putter_name: varchar("assigned_putter_name", { length: 255 }),
		verified_by: varchar("verified_by", { length: 255 }),
		rejection_reason: text("rejection_reason"),
		notes: text("notes"),
		created_at: timestamp("created_at").defaultNow(),
		updated_at: timestamp("updated_at").defaultNow(),
		completed_at: timestamp("completed_at"),
	},
	(table) => ({
		branchIdx: index("idx_putaway_tasks_branch").on(table.branch_id),
		sourceTypeIdx: index("idx_putaway_tasks_source_type").on(table.source_type),
		statusIdx: index("idx_putaway_tasks_status").on(table.status),
		sourceRefIdx: index("idx_putaway_tasks_source_ref").on(table.source_reference),
		createdAtIdx: index("idx_putaway_tasks_created_at").on(table.created_at),
	}),
);

export const putawayTasksRelations = relations(putawayTasks, ({ one, many }) => ({
	branch: one(branches, {
		fields: [putawayTasks.branch_id],
		references: [branches.id],
	}),
	purchase: one(purchases, {
		fields: [putawayTasks.purchase_id],
		references: [purchases.id],
	}),
	grn: one(goodsReceiptNotes, {
		fields: [putawayTasks.grn_id],
		references: [goodsReceiptNotes.id],
	}),
	items: many(putawayTaskItems),
	discrepancies: many(putawayDiscrepancies),
}));

// ── Putaway Task Items ───────────────────────────────────────────────────────
export const putawayTaskItems = pgTable(
	"putaway_task_items",
	{
		id: serial("id").primaryKey(),
		task_id: integer("task_id")
			.references(() => putawayTasks.id, { onDelete: "cascade" })
			.notNull(),
		product_id: integer("product_id")
			.references(() => products.id)
			.notNull(),
		product_name: varchar("product_name", { length: 255 }).notNull(),
		sku: varchar("sku", { length: 100 }),
		expected_quantity: decimal("expected_quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.notNull(),
		verified_quantity: decimal("verified_quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.default("0")
			.notNull(),
		putaway_quantity: decimal("putaway_quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.default("0")
			.notNull(),
		remaining_quantity: decimal("remaining_quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.default("0")
			.notNull(),
		damaged_quantity: decimal("damaged_quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.default("0")
			.notNull(),
		rejected_quantity: decimal("rejected_quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.default("0")
			.notNull(),
		unit_cost: decimal("unit_cost", { precision: 10, scale: 2 }).default("0"),
		batch_number: varchar("batch_number", { length: 100 }),
		expiry_date: timestamp("expiry_date"),
		condition: varchar("condition", { length: 50 }).default("USABLE"), // 'USABLE', 'DAMAGED', 'EXPIRED', 'DISPUTED'
		location_id: integer("location_id").references(() => branchLocations.id),
		location_name: varchar("location_name", { length: 150 }).default("Warehouse Main Bay"),
		discrepancy_reason: text("discrepancy_reason"),
		// 'PENDING', 'PARTIALLY_PUTAWAY', 'COMPLETED', 'DISCREPANCY'
		status: varchar("status", { length: 40 }).default("PENDING").notNull(),
		putaway_by: varchar("putaway_by", { length: 255 }),
		putaway_at: timestamp("putaway_at"),
		notes: text("notes"),
		created_at: timestamp("created_at").defaultNow(),
	},
	(table) => ({
		taskIdIdx: index("idx_putaway_items_task_id").on(table.task_id),
		productIdIdx: index("idx_putaway_items_product_id").on(table.product_id),
		statusIdx: index("idx_putaway_items_status").on(table.status),
	}),
);

export const putawayTaskItemsRelations = relations(putawayTaskItems, ({ one, many }) => ({
	task: one(putawayTasks, {
		fields: [putawayTaskItems.task_id],
		references: [putawayTasks.id],
	}),
	product: one(products, {
		fields: [putawayTaskItems.product_id],
		references: [products.id],
	}),
	location: one(branchLocations, {
		fields: [putawayTaskItems.location_id],
		references: [branchLocations.id],
	}),
	discrepancies: many(putawayDiscrepancies),
}));

// ── Putaway Discrepancies & Issues ──────────────────────────────────────────
export const putawayDiscrepancies = pgTable(
	"putaway_discrepancies",
	{
		id: serial("id").primaryKey(),
		task_id: integer("task_id")
			.references(() => putawayTasks.id, { onDelete: "cascade" })
			.notNull(),
		task_item_id: integer("task_item_id")
			.references(() => putawayTaskItems.id, { onDelete: "cascade" }),
		product_id: integer("product_id")
			.references(() => products.id)
			.notNull(),
		source_type: varchar("source_type", { length: 50 }).notNull(),
		expected_qty: decimal("expected_qty", { precision: 10, scale: 3 })
			.$type<number | string>()
			.notNull(),
		actual_qty: decimal("actual_qty", { precision: 10, scale: 3 })
			.$type<number | string>()
			.notNull(),
		difference_qty: decimal("difference_qty", { precision: 10, scale: 3 })
			.$type<number | string>()
			.notNull(),
		// 'QUANTITY_MISMATCH', 'DAMAGED_GOODS', 'WRONG_ITEM', 'EXPIRED_GOODS', 'DISPUTED'
		discrepancy_type: varchar("discrepancy_type", { length: 50 }).notNull(),
		reason: text("reason").notNull(),
		responsible_role: varchar("responsible_role", { length: 50 }).default("PUTTER"), // 'PROCUREMENT', 'DRIVER', 'SALES', 'PUTTER'
		reported_by: varchar("reported_by", { length: 255 }).notNull(),
		// 'REPORTED', 'INVESTIGATING', 'RESOLVED', 'WRITTEN_OFF'
		status: varchar("status", { length: 40 }).default("REPORTED").notNull(),
		resolution_notes: text("resolution_notes"),
		resolved_by: varchar("resolved_by", { length: 255 }),
		resolved_at: timestamp("resolved_at"),
		created_at: timestamp("created_at").defaultNow(),
	},
	(table) => ({
		taskIdIdx: index("idx_putaway_disc_task_id").on(table.task_id),
		productIdIdx: index("idx_putaway_disc_prod_id").on(table.product_id),
		statusIdx: index("idx_putaway_disc_status").on(table.status),
	}),
);

export const putawayDiscrepanciesRelations = relations(putawayDiscrepancies, ({ one }) => ({
	task: one(putawayTasks, {
		fields: [putawayDiscrepancies.task_id],
		references: [putawayTasks.id],
	}),
	taskItem: one(putawayTaskItems, {
		fields: [putawayDiscrepancies.task_item_id],
		references: [putawayTaskItems.id],
	}),
	product: one(products, {
		fields: [putawayDiscrepancies.product_id],
		references: [products.id],
	}),
}));
