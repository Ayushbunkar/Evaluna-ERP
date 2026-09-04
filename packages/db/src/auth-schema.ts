import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { staff } from "./schema";

// ─────────────────────────────────────────────────────────────────────────────
// Better Auth core tables — extended for Evaluna ERP
// ─────────────────────────────────────────────────────────────────────────────

export const user = pgTable("user", {
	// ── Better Auth core ───────────────────────────────────────────────────────
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
	twoFactorEnabled: boolean("twoFactorEnabled").default(false),

	// ── Evaluna ERP extensions ─────────────────────────────────────────────────
	/** Link to the staff/employee record. Unique constraint ensures 1:1. */
	staff_id: integer("staff_id")
		.unique()
		.references(() => staff.id, { onDelete: "set null" }),
	/** Branch this user primarily belongs to. NULL = organization-wide/superadmin. */
	branch_id: integer("branch_id"),
	/** Warehouse this user primarily belongs to. NULL = all warehouses in branch scope. */
	warehouse_id: integer("warehouse_id"),
	/** Account status: PENDING | ACTIVE | INACTIVE | LOCKED | SUSPENDED. Replaces is_active/locked_until logic. */
	status: varchar("status", { length: 20 })
		.default("PENDING") // Initial state as per requirement 13
		.notNull(),
	/** Cross-branch superadmin flag */
	is_superadmin: boolean("is_superadmin").default(false).notNull(),
	/** Flag to force password change on next login (Requirement 2) */
	force_password_change: boolean("force_password_change")
		.default(false)
		.notNull(),

	// ── Security ───────────────────────────────────────────────────────────────
	/** Increments on each failed login attempt */
	failed_login_count: integer("failed_login_count").default(0).notNull(),
	/** Account locked until this timestamp after too many failures */
	locked_until: timestamp("locked_until"),
	/** When the password was last changed (for expiry policies) */
	password_changed_at: timestamp("password_changed_at"),
	/** Tracks last activity for idle session detection */
	last_active_at: timestamp("last_active_at"),

	// ── Offline Authentication ─────────────────────────────────────────────────
	/** SHA-256 hash of the offline token stored on device */
	offline_token_hash: text("offline_token_hash"),
	/** Offline token expiry (max 72h from last online login) */
	offline_token_expires_at: timestamp("offline_token_expires_at"),

	// ── Remember Me ────────────────────────────────────────────────────────────
	/** Opaque remember-me token (hashed) for long-lived sessions */
	remember_me_token: text("remember_me_token"),

	// ── 2FA ────────────────────────────────────────────────────────────────────
	two_factor_enabled: boolean("two_factor_enabled").default(false),
	two_factor_secret: text("two_factor_secret"),
	two_factor_backup_codes: text("two_factor_backup_codes"),
});

export const session = pgTable(
	"session",
	{
		// ── Better Auth core ─────────────────────────────────────────────────────
		id: text("id").primaryKey(),
		expiresAt: timestamp("expires_at").notNull(),
		token: text("token").notNull().unique(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => new Date())
			.notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		// ── Evaluna ERP extensions ───────────────────────────────────────────────
		/** Branch context for this session (may differ from user.branch_id for superadmins) */
		branch_id: integer("branch_id"),
		/** Warehouse context for this session */
		warehouse_id: integer("warehouse_id"),
		/** Human-readable device name, e.g. "Chrome on Windows" */
		device_name: text("device_name"),
		/** Canvas fingerprint or navigator hash for device tracking */
		device_fingerprint: text("device_fingerprint"),
		/** True when session was created/validated offline */
		is_offline: boolean("is_offline").default(false),
		/** Extends session expiry to 30 days */
		remember_me: boolean("remember_me").default(false),
	},
	(table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at"),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("account_userId_idx").on(table.userId)],
);

// ── Security Audit Log ────────────────────────────────────────────────────────
export const securityAuditLog = pgTable("security_audit_log", {
	id: serial("id").primaryKey(),
	/** User who performed the action (Super Admin) */
	actor_id: text("actor_id").references(() => user.id, {
		onDelete: "set null",
	}),
	/** User who was affected by the action */
	target_user_id: text("target_user_id").references(() => user.id, {
		onDelete: "set null",
	}),
	/** Action taken (e.g., USER_CREATED, PASSWORD_RESET) */
	action: varchar("action", { length: 50 }).notNull(),
	/** Audit log event description */
	description: text("description"),
	/** Previous value of the affected field(s) - stores JSON of old data */
	previous_value: jsonb("previous_value"),
	/** New value of the affected field(s) - stores JSON of new data */
	new_value: jsonb("new_value"),
	/** Reason for the action, if provided */
	reason: text("reason"),
	/** IP address of the actor */
	ip_address: varchar("ip_address", { length: 45 }),
	created_at: timestamp("created_at").defaultNow().notNull(),
});

export const verification = pgTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

// ─────────────────────────────────────────────────────────────────────────────
// Relations
// ─────────────────────────────────────────────────────────────────────────────

export const securityAuditLogRelations = relations(
	securityAuditLog,
	({ one }) => ({
		actor: one(user, {
			fields: [securityAuditLog.actor_id],
			references: [user.id],
			relationName: "actor_logs",
		}),
		targetUser: one(user, {
			fields: [securityAuditLog.target_user_id],
			references: [user.id],
			relationName: "target_user_logs",
		}),
	}),
);

export const userRelations = relations(user, ({ many, one }) => ({
	sessions: many(session),
	accounts: many(account),
	staff: one(staff, {
		fields: [user.staff_id],
		references: [staff.id],
	}),
	auditLogsAsActor: many(securityAuditLog, {
		relationName: "actor_logs",
	}),
	auditLogsAsTarget: many(securityAuditLog, {
		relationName: "target_user_logs",
	}),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));
