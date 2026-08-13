import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { user } from "../auth-schema";

// Permission Domain Enum
export const permissionDomainEnum = pgEnum("permission_domain", [
	"system",
	"company",
	"users",
	"roles",
	"permissions",
	"attendance",
	"leave",
	"payroll",
	"shifts",
	"holidays",
	"departments",
	"designations",
	"employees",
	"reports",
	"settings",
	"audit",
	"billing",
	"subscriptions",
	"integrations",
	"backup",
	"security",
]);

// Permission Action Enum
export const permissionActionEnum = pgEnum("permission_action", [
	"view",
	"create",
	"read",
	"update",
	"delete",
	"manage",
	"approve",
	"reject",
	"export",
	"import",
	"assign",
	"configure",
	"monitor",
	"restore",
]);

// Roles Table
export const roles = pgTable("roles", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 50 }).notNull().unique(),
	description: text("description"),
	isSystemRole: boolean("is_system_role").default(false),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Permissions Table
export const permissions = pgTable("permissions", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull().unique(),
	description: text("description"),
	domain: permissionDomainEnum("domain").notNull(),
	action: permissionActionEnum("action").notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Role Permissions (Many-to-Many)
// Keep compatibility with the app's canonical role_permissions table while allowing
// legacy client-management screens to continue using role_id/module/is_allowed.
export const rolePermissions = pgTable("role_permissions", {
	id: serial("id").primaryKey(),
	role_name: varchar("role_name", { length: 50 }),
	roleId: integer("role_id").references(() => roles.id),
	domain: varchar("domain", { length: 50 }),
	module: varchar("module", { length: 50 }),
	action: varchar("action", { length: 20 }).notNull(),
	is_allowed: boolean("is_allowed").default(false),
	permissionId: integer("permission_id").references(() => permissions.id),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// User Roles (Many-to-Many)
export const userRoles = pgTable("user_roles", {
	userId: varchar("user_id", { length: 100 }).references(() => user.id),
	roleId: integer("role_id").references(() => roles.id),
	assignedBy: varchar("assigned_by", { length: 100 }),
	assignedAt: timestamp("assigned_at").defaultNow(),
});

// Relations
export const rolesRelations = relations(roles, ({ many }) => ({
	permissions: many(rolePermissions),
	users: many(userRoles),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
	roles: many(rolePermissions),
}));

export const usersRelations = relations(user, ({ many }) => ({
	roles: many(userRoles),
}));

// Predefined Roles Configuration
export const ROLE_DEFINITIONS = {
	SUPER_ADMIN: {
		name: "super_admin",
		description:
			"System Administrator with full access to all system functions",
		isSystemRole: true,
		permissions: [
			"system:view",
			"system:configure",
			"system:monitor",
			"system:backup",
			"system:restore",
			"company:create",
			"company:update",
			"company:delete",
			"company:view",
			"users:create",
			"users:update",
			"users:delete",
			"users:view",
			"roles:create",
			"roles:update",
			"roles:delete",
			"roles:view",
			"permissions:create",
			"permissions:update",
			"permissions:delete",
			"permissions:view",
			"billing:manage",
			"subscriptions:manage",
			"integrations:configure",
			"audit:view",
			"security:configure",
			"settings:configure",
		],
	},
	ADMIN: {
		name: "admin",
		description: "Company Administrator with full access to company functions",
		isSystemRole: false,
		permissions: [
			"users:create",
			"users:update",
			"users:view",
			"employees:create",
			"employees:update",
			"employees:delete",
			"employees:view",
			"attendance:view",
			"attendance:manage",
			"attendance:approve",
			"leave:view",
			"leave:manage",
			"leave:approve",
			"leave:reject",
			"payroll:view",
			"payroll:manage",
			"payroll:process",
			"shifts:create",
			"shifts:update",
			"shifts:delete",
			"shifts:view",
			"holidays:create",
			"holidays:update",
			"holidays:delete",
			"holidays:view",
			"departments:create",
			"departments:update",
			"departments:delete",
			"departments:view",
			"designations:create",
			"designations:update",
			"designations:delete",
			"designations:view",
			"reports:view",
			"reports:export",
			"settings:view",
			"settings:update",
		],
	},
	HR: {
		name: "hr",
		description:
			"Human Resources Manager with access to employee and HR functions",
		isSystemRole: false,
		permissions: [
			"employees:view",
			"employees:create",
			"employees:update",
			"attendance:view",
			"attendance:manage",
			"attendance:approve",
			"leave:view",
			"leave:manage",
			"leave:approve",
			"leave:reject",
			"payroll:view",
			"payroll:manage",
			"shifts:view",
			"shifts:assign",
			"holidays:view",
			"departments:view",
			"designations:view",
			"reports:view",
			"reports:export",
		],
	},
	MANAGER: {
		name: "manager",
		description: "Team Manager with access to team-related functions",
		isSystemRole: false,
		permissions: [
			"attendance:view",
			"attendance:approve",
			"leave:view",
			"leave:approve",
			"leave:reject",
			"reports:view",
		],
	},
	EMPLOYEE: {
		name: "employee",
		description: "Regular employee with self-service access",
		isSystemRole: false,
		permissions: [
			"attendance:view",
			"attendance:create",
			"leave:view",
			"leave:create",
			"users:view",
			"users:update",
		],
	},
};
