// ── System Monitoring (Phase 41) ───────────────────────────────────────────────
import { relations } from "drizzle-orm";
import { pgTable, serial, integer, decimal, varchar, text, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { branches } from "./schema";

// ── System Metrics Snapshots ────────────────────────────────────────────────────
export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  // Server vitals
  cpu_usage: decimal("cpu_usage", { precision: 5, scale: 2 }), // percentage
  memory_used_mb: integer("memory_used_mb"),
  memory_total_mb: integer("memory_total_mb"),
  // Database
  db_size_mb: decimal("db_size_mb", { precision: 10, scale: 2 }),
  db_connection_count: integer("db_connection_count"),
  db_slow_query_count: integer("db_slow_query_count").default(0),
  // API
  api_requests_per_min: integer("api_requests_per_min").default(0),
  api_avg_response_ms: integer("api_avg_response_ms"),
  api_error_count: integer("api_error_count").default(0),
  // Queue
  notification_queue_pending: integer("notification_queue_pending").default(0),
  import_jobs_pending: integer("import_jobs_pending").default(0),
  // Storage
  storage_used_mb: decimal("storage_used_mb", { precision: 10, scale: 2 }),
  // Sync
  offline_sync_pending: integer("offline_sync_pending").default(0),
  // Snapshot time
  recorded_at: timestamp("recorded_at").defaultNow().notNull(),
});

// ── Application Event Log ──────────────────────────────────────────────────────
export const eventLogs = pgTable("event_logs", {
  id: serial("id").primaryKey(),
  branch_id: integer("branch_id").references(() => branches.id),
  user_id: varchar("user_id", { length: 255 }),
  // severity: info | warning | error | critical
  severity: varchar("severity", { length: 20 }).default("info").notNull(),
  // category: auth | api | sync | db | import | inventory | payment | system
  category: varchar("category", { length: 50 }).notNull(),
  event: varchar("event", { length: 255 }).notNull(),
  message: text("message"),
  metadata: jsonb("metadata"), // stack trace, request id, entity ids
  duration_ms: integer("duration_ms"), // for performance events
  status_code: integer("status_code"),  // for API events
  ip_address: varchar("ip_address", { length: 45 }),
  user_agent: text("user_agent"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// ── Login / Device History ─────────────────────────────────────────────────────
export const loginHistory = pgTable("login_history", {
  id: serial("id").primaryKey(),
  user_id: varchar("user_id", { length: 255 }).notNull(),
  user_email: varchar("user_email", { length: 255 }),
  status: varchar("status", { length: 20 }).default("success"), // success | failed | blocked
  ip_address: varchar("ip_address", { length: 45 }),
  device_type: varchar("device_type", { length: 50 }),  // desktop | mobile | tablet
  browser: varchar("browser", { length: 100 }),
  os: varchar("os", { length: 100 }),
  location: varchar("location", { length: 255 }),
  failure_reason: text("failure_reason"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// ── Branch Health Snapshot ─────────────────────────────────────────────────────
export const branchHealthSnapshots = pgTable("branch_health_snapshots", {
  id: serial("id").primaryKey(),
  branch_id: integer("branch_id").references(() => branches.id).notNull(),
  // Connectivity
  is_online: boolean("is_online").default(true),
  last_seen_at: timestamp("last_seen_at").defaultNow(),
  // Sync status
  pending_sync_items: integer("pending_sync_items").default(0),
  last_sync_at: timestamp("last_sync_at"),
  sync_error: text("sync_error"),
  // Device count
  active_devices: integer("active_devices").default(0),
  offline_devices: integer("offline_devices").default(0),
  // Inventory
  low_stock_count: integer("low_stock_count").default(0),
  expiry_alert_count: integer("expiry_alert_count").default(0),
  recorded_at: timestamp("recorded_at").defaultNow().notNull(),
});

export const branchHealthRelations = relations(branchHealthSnapshots, ({ one }) => ({
  branch: one(branches, {
    fields: [branchHealthSnapshots.branch_id],
    references: [branches.id],
  }),
}));
