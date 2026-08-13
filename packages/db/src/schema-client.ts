import { relations } from "drizzle-orm";
import {
	boolean,
	customType,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

// Custom bytea type for PGLite compatibility
export const bytea = customType<{ data: Buffer; driverData: Buffer }>({
	dataType() {
		return "bytea";
	},
});

// ── Client-Managed ERP Schema ──────────────────────────────────────────────────

// ── Module Definitions (Client can enable/disable modules) ────────────────────
export const modules = pgTable("modules", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull().unique(),
	slug: varchar("slug", { length: 100 }).notNull().unique(),
	description: text("description"),
	icon: varchar("icon", { length: 100 }),
	is_active: boolean("is_active").default(true),
	is_core: boolean("is_core").default(false),
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at")
		.defaultNow()
		.$onUpdateFn(() => new Date()),
});

export const moduleRelations = relations(modules, ({ many }) => ({
	permissions: many(modulePermissions),
}));

// ── Module Permissions (Granular permissions per module) ───────────────────────
export const modulePermissions = pgTable("module_permissions", {
	id: serial("id").primaryKey(),
	module_id: integer("module_id")
		.references(() => modules.id)
		.notNull(),
	action: varchar("action", { length: 50 }).notNull(), // view, create, update, delete, approve, export, import, etc.
	name: varchar("name", { length: 100 }).notNull(),
	description: text("description"),
	is_active: boolean("is_active").default(true),
	created_at: timestamp("created_at").defaultNow(),
});

export const modulePermissionsRelations = relations(
	modulePermissions,
	({ one }) => ({
		module: one(modules, {
			fields: [modulePermissions.module_id],
			references: [modules.id],
		}),
	}),
);

// ── Role-Based Module Access (Which roles can access which modules) ───────────
export const roleModuleAccess = pgTable("role_module_access", {
	id: serial("id").primaryKey(),
	role_name: varchar("role_name", { length: 100 }).notNull(),
	module_id: integer("module_id")
		.references(() => modules.id)
		.notNull(),
	is_allowed: boolean("is_allowed").default(false),
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at")
		.defaultNow()
		.$onUpdateFn(() => new Date()),
});

export const roleModuleAccessRelations = relations(
	roleModuleAccess,
	({ one }) => ({
		module: one(modules, {
			fields: [roleModuleAccess.module_id],
			references: [modules.id],
		}),
	}),
);

// ── User Module Access (Individual user overrides) ─────────────────────────────
export const userModuleAccess = pgTable("user_module_access", {
	id: serial("id").primaryKey(),
	user_id: integer("user_id").notNull(),
	module_id: integer("module_id")
		.references(() => modules.id)
		.notNull(),
	is_allowed: boolean("is_allowed").default(true),
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at")
		.defaultNow()
		.$onUpdateFn(() => new Date()),
});

export const userModuleAccessRelations = relations(
	userModuleAccess,
	({ one }) => ({
		module: one(modules, {
			fields: [userModuleAccess.module_id],
			references: [modules.id],
		}),
	}),
);

// ── Client Settings (Fully configurable by client) ────────────────────────────
export const clientSettings = pgTable("client_settings", {
	id: serial("id").primaryKey(),
	key: varchar("key", { length: 100 }).notNull().unique(),
	value: jsonb("value").notNull(),
	category: varchar("category", { length: 50 }).notNull(),
	description: text("description"),
	is_active: boolean("is_active").default(true),
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at")
		.defaultNow()
		.$onUpdateFn(() => new Date()),
});

// ── Audit Logs (Comprehensive tracking of all changes) ────────────────────────
export const auditLogs = pgTable("audit_logs", {
	id: serial("id").primaryKey(),
	user_id: integer("user_id").references(() => staff.id),
	action: varchar("action", { length: 100 }).notNull(),
	entity_type: varchar("entity_type", { length: 100 }).notNull(),
	entity_id: integer("entity_id"),
	old_values: jsonb("old_values"),
	new_values: jsonb("new_values"),
	ip_address: varchar("ip_address", { length: 45 }),
	user_agent: text("user_agent"),
	created_at: timestamp("created_at").defaultNow(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
	user: one(staff, {
		fields: [auditLogs.user_id],
		references: [staff.id],
	}),
}));

// ── User Roles (Extended for client management) ───────────────────────────────
export const roles = pgTable("roles", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 50 }).notNull().unique(),
	description: text("description"),
	is_active: boolean("is_active").default(true),
	is_default: boolean("is_default").default(false),
	can_edit_permissions: boolean("can_edit_permissions").default(false),
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at")
		.defaultNow()
		.$onUpdateFn(() => new Date()),
});

export const rolesRelations = relations(roles, ({ many }) => ({
	userRoles: many(userRoles),
	permissions: many(rolePermissions),
}));

// ── Role Permissions (Extended for client management) ────────────────────────
// Keep the canonical auth fields and the legacy client-management fields together so
// both role_name/domain/action checks and role_id/module/is_allowed screens work during
// the migration window.
export const rolePermissions = pgTable("role_permissions", {
	id: serial("id").primaryKey(),
	role_name: varchar("role_name", { length: 50 }),
	role_id: integer("role_id").references(() => roles.id),
	domain: varchar("domain", { length: 50 }),
	module: varchar("module", { length: 50 }),
	action: varchar("action", { length: 20 }).notNull(),
	is_allowed: boolean("is_allowed").default(false),
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at")
		.defaultNow()
		.$onUpdateFn(() => new Date()),
});

export const rolePermissionsRelations = relations(
	rolePermissions,
	({ one }) => ({
		role: one(roles, {
			fields: [rolePermissions.role_id],
			references: [roles.id],
		}),
	}),
);

// ── Staff (Extended for client management) ───────────────────────────────────
export const staff = pgTable("staff", {
	id: serial("id").primaryKey(),
	staff_code: varchar("staff_code", { length: 50 }).unique(),
	name: varchar("name", { length: 255 }).notNull(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	phone: varchar("phone", { length: 20 }),
	address: text("address"),
	role: varchar("role", { length: 50 }).notNull(),
	department: varchar("department", { length: 50 }),
	join_date: timestamp("join_date").notNull(),
	salary: integer("salary").notNull(),
	pf_number: varchar("pf_number", { length: 50 }),
	pan: varchar("pan", { length: 10 }),
	aadhaar: varchar("aadhaar", { length: 12 }),
	bank_account: varchar("bank_account", { length: 50 }),
	bank_name: varchar("bank_name", { length: 100 }),
	ifsc: varchar("ifsc", { length: 11 }),
	status: varchar("status", { length: 20 }).default("active"),
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at")
		.defaultNow()
		.$onUpdateFn(() => new Date()),
	deleted_at: timestamp("deleted_at"),
	is_deleted: boolean("is_deleted").default(false),
});

export const staffRelations = relations(staff, ({ many }) => ({
	userRoles: many(userRoles),
	auditLogs: many(auditLogs),
}));

// ── User Roles (Extended) ─────────────────────────────────────────────────────
export const userRoles = pgTable("user_roles", {
	id: serial("id").primaryKey(),
	user_id: integer("user_id")
		.references(() => staff.id)
		.notNull(),
	role_id: integer("role_id")
		.references(() => roles.id)
		.notNull(),
	assigned_at: timestamp("assigned_at").defaultNow(),
	assigned_by: integer("assigned_by").references(() => staff.id),
	expires_at: timestamp("expires_at"),
	is_active: boolean("is_active").default(true),
	created_at: timestamp("created_at").defaultNow(),
});

export const userRolesRelations = relations(userRoles, ({ one }) => ({
	user: one(staff, {
		fields: [userRoles.user_id],
		references: [staff.id],
	}),
	role: one(roles, {
		fields: [userRoles.role_id],
		references: [roles.id],
	}),
	assignedBy: one(staff, {
		fields: [userRoles.assigned_by],
		references: [staff.id],
	}),
}));

// ── Workflow Approvals (Client-configurable workflows) ────────────────────────
export const approvalWorkflows = pgTable("approval_workflows", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
	entity_type: varchar("entity_type", { length: 100 }).notNull(), // order, purchase, discount, return, etc.
	min_amount: integer("min_amount"), // Minimum amount that requires approval
	max_approvers: integer("max_approvers").default(1),
	requires_multiple_levels: boolean("requires_multiple_levels").default(false),
	is_active: boolean("is_active").default(true),
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at")
		.defaultNow()
		.$onUpdateFn(() => new Date()),
});

export const approvalWorkflowsRelations = relations(
	approvalWorkflows,
	({ many }) => ({
		approvalRules: many(approvalRules),
	}),
);

// ── Approval Rules (Client-configurable rules) ───────────────────────────────
export const approvalRules = pgTable("approval_rules", {
	id: serial("id").primaryKey(),
	workflow_id: integer("workflow_id")
		.references(() => approvalWorkflows.id)
		.notNull(),
	role_id: integer("role_id")
		.references(() => roles.id)
		.notNull(),
	level: integer("level").notNull().default(1),
	can_approve: boolean("can_approve").default(true),
	can_reject: boolean("can_reject").default(true),
	created_at: timestamp("created_at").defaultNow(),
});

export const approvalRulesRelations = relations(approvalRules, ({ one }) => ({
	workflow: one(approvalWorkflows, {
		fields: [approvalRules.workflow_id],
		references: [approvalWorkflows.id],
	}),
	role: one(roles, {
		fields: [approvalRules.role_id],
		references: [roles.id],
	}),
}));

// ── Notification Templates (Client-configurable) ──────────────────────────────
export const notificationTemplates = pgTable("notification_templates", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull().unique(),
	type: varchar("type", { length: 50 }).notNull(), // email, sms, in_app, whatsapp, push
	subject: varchar("subject", { length: 255 }),
	body: text("body").notNull(),
	channel: varchar("channel", { length: 20 }).default("in_app"),
	is_active: boolean("is_active").default(true),
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at")
		.defaultNow()
		.$onUpdateFn(() => new Date()),
});

// ── System Settings (Client-configurable) ────────────────────────────────────
export const systemSettings = pgTable("system_settings", {
	id: serial("id").primaryKey(),
	key: varchar("key", { length: 100 }).notNull().unique(),
	value: jsonb("value").notNull(),
	category: varchar("category", { length: 50 }).notNull(),
	description: text("description"),
	is_active: boolean("is_active").default(true),
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at")
		.defaultNow()
		.$onUpdateFn(() => new Date()),
});

// Export all relations
export const clientSchemaRelations = {
	modules: moduleRelations,
	modulePermissions: modulePermissionsRelations,
	roleModuleAccess: roleModuleAccessRelations,
	userModuleAccess: userModuleAccessRelations,
	roles: rolesRelations,
	rolePermissions: rolePermissionsRelations,
	staff: staffRelations,
	userRoles: userRolesRelations,
	approvalWorkflows: approvalWorkflowsRelations,
	approvalRules: approvalRulesRelations,
	auditLogs: auditLogsRelations,
};
