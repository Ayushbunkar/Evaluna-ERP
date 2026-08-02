import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import {
	approvalRules,
	approvalWorkflows,
	auditLogs,
	clientSettings,
	modulePermissions,
	modules,
	notificationTemplates,
	roleModuleAccess,
	rolePermissions,
	roles,
	staff,
	systemSettings,
} from "@evaluna/db/schema-client";
import { protectedProcedure, router } from "../init";

// Module definitions for the ERP
const _MODULE_DEFINITIONS = [
	{
		name: "Dashboard",
		slug: "dashboard",
		description: "Main dashboard with KPIs and quick actions",
		icon: "LayoutDashboard",
		is_core: true,
	},
	{
		name: "Products",
		slug: "products",
		description: "Product catalog and inventory management",
		icon: "Package",
	},
	{
		name: "Customers",
		slug: "customers",
		description: "Customer management and CRM",
		icon: "Users",
	},
	{
		name: "Sales",
		slug: "sales",
		description: "Sales orders and POS operations",
		icon: "ShoppingCart",
	},
	{
		name: "Purchases",
		slug: "purchases",
		description: "Purchase orders and supplier management",
		icon: "ShoppingBag",
	},
	{
		name: "Inventory",
		slug: "inventory",
		description: "Stock management and tracking",
		icon: "Warehouse",
	},
	{
		name: "Warehouse",
		slug: "warehouse",
		description: "Warehouse operations and management",
		icon: "Warehouse",
	},
	{
		name: "Delivery",
		slug: "delivery",
		description: "Delivery management and tracking",
		icon: "Truck",
	},
	{
		name: "Reports",
		slug: "reports",
		description: "Generate and view business reports",
		icon: "FileText",
	},
	{
		name: "Staff",
		slug: "staff",
		description: "Employee management and HR",
		icon: "UserCog",
	},
	{
		name: "Settings",
		slug: "settings",
		description: "System and business settings",
		icon: "Settings",
		is_core: true,
	},
	{
		name: "Finance",
		slug: "finance",
		description: "Financial operations and accounting",
		icon: "CreditCard",
	},
	{
		name: "Marketing",
		slug: "marketing",
		description: "Marketing campaigns and promotions",
		icon: "Megaphone",
	},
	{
		name: "Loyalty",
		slug: "loyalty",
		description: "Customer loyalty programs",
		icon: "Gift",
	},
	{
		name: "Suppliers",
		slug: "suppliers",
		description: "Supplier management",
		icon: "Truck",
	},
	{
		name: "Branches",
		slug: "branches",
		description: "Branch management",
		icon: "Building2",
	},
	{
		name: "Transfers",
		slug: "transfers",
		description: "Stock transfers between locations",
		icon: "Move",
	},
	{
		name: "Payroll",
		slug: "payroll",
		description: "Employee payroll processing",
		icon: "Receipt",
	},
	{
		name: "Attendance",
		slug: "attendance",
		description: "Employee attendance tracking",
		icon: "CalendarCheck",
	},
	{
		name: "POS",
		slug: "pos",
		description: "Point of Sale operations",
		icon: "CashRegister",
	},
	{
		name: "Auditor",
		slug: "auditor",
		description: "Inventory auditing tools",
		icon: "Eye",
	},
	{
		name: "Biller",
		slug: "biller",
		description: "Billing and invoicing",
		icon: "FileInvoice",
	},
];

// Module permissions definitions
const _MODULE_PERMISSIONS = [
	// Dashboard permissions
	{
		module: "dashboard",
		action: "view",
		name: "View Dashboard",
		description: "Access the main dashboard",
	},
	{
		module: "dashboard",
		action: "manage_widgets",
		name: "Manage Widgets",
		description: "Add, remove, and configure dashboard widgets",
	},

	// Products permissions
	{
		module: "products",
		action: "view",
		name: "View Products",
		description: "View product catalog",
	},
	{
		module: "products",
		action: "create",
		name: "Create Products",
		description: "Add new products",
	},
	{
		module: "products",
		action: "update",
		name: "Update Products",
		description: "Edit existing products",
	},
	{
		module: "products",
		action: "delete",
		name: "Delete Products",
		description: "Remove products",
	},
	{
		module: "products",
		action: "import",
		name: "Import Products",
		description: "Import products from CSV/Excel",
	},
	{
		module: "products",
		action: "export",
		name: "Export Products",
		description: "Export product catalog",
	},
	{
		module: "products",
		action: "manage_categories",
		name: "Manage Categories",
		description: "Create and edit product categories",
	},
	{
		module: "products",
		action: "manage_brands",
		name: "Manage Brands",
		description: "Create and edit product brands",
	},

	// Customers permissions
	{
		module: "customers",
		action: "view",
		name: "View Customers",
		description: "View customer list",
	},
	{
		module: "customers",
		action: "create",
		name: "Create Customers",
		description: "Add new customers",
	},
	{
		module: "customers",
		action: "update",
		name: "Update Customers",
		description: "Edit customer details",
	},
	{
		module: "customers",
		action: "delete",
		name: "Delete Customers",
		description: "Remove customers",
	},
	{
		module: "customers",
		action: "manage_credit",
		name: "Manage Credit",
		description: "Set and manage customer credit limits",
	},

	// Sales permissions
	{
		module: "sales",
		action: "view",
		name: "View Sales",
		description: "View sales orders",
	},
	{
		module: "sales",
		action: "create",
		name: "Create Sales",
		description: "Create new sales orders",
	},
	{
		module: "sales",
		action: "update",
		name: "Update Sales",
		description: "Edit sales orders",
	},
	{
		module: "sales",
		action: "delete",
		name: "Delete Sales",
		description: "Cancel sales orders",
	},
	{
		module: "sales",
		action: "approve",
		name: "Approve Sales",
		description: "Approve sales orders",
	},
	{
		module: "sales",
		action: "pos",
		name: "POS Operations",
		description: "Perform POS transactions",
	},

	// Purchases permissions
	{
		module: "purchases",
		action: "view",
		name: "View Purchases",
		description: "View purchase orders",
	},
	{
		module: "purchases",
		action: "create",
		name: "Create Purchases",
		description: "Create new purchase orders",
	},
	{
		module: "purchases",
		action: "update",
		name: "Update Purchases",
		description: "Edit purchase orders",
	},
	{
		module: "purchases",
		action: "delete",
		name: "Delete Purchases",
		description: "Cancel purchase orders",
	},
	{
		module: "purchases",
		action: "approve",
		name: "Approve Purchases",
		description: "Approve purchase orders",
	},
	{
		module: "purchases",
		action: "manage_suppliers",
		name: "Manage Suppliers",
		description: "Add and edit suppliers",
	},

	// Inventory permissions
	{
		module: "inventory",
		action: "view",
		name: "View Inventory",
		description: "View inventory levels",
	},
	{
		module: "inventory",
		action: "update",
		name: "Update Inventory",
		description: "Adjust inventory levels",
	},
	{
		module: "inventory",
		action: "audit",
		name: "Perform Audits",
		description: "Run inventory audits",
	},
	{
		module: "inventory",
		action: "manage_locations",
		name: "Manage Locations",
		description: "Create and edit warehouse locations",
	},

	// Warehouse permissions
	{
		module: "warehouse",
		action: "view",
		name: "View Warehouse",
		description: "View warehouse operations",
	},
	{
		module: "warehouse",
		action: "manage_picking",
		name: "Manage Picking",
		description: "Create and manage pick lists",
	},
	{
		module: "warehouse",
		action: "manage_putting",
		name: "Manage Putting",
		description: "Create and manage put lists",
	},
	{
		module: "warehouse",
		action: "manage_damage",
		name: "Manage Damage",
		description: "Report and manage damaged items",
	},

	// Delivery permissions
	{
		module: "delivery",
		action: "view",
		name: "View Delivery",
		description: "View delivery operations",
	},
	{
		module: "delivery",
		action: "manage_trips",
		name: "Manage Trips",
		description: "Create and manage delivery trips",
	},
	{
		module: "delivery",
		action: "assign_deliveries",
		name: "Assign Deliveries",
		description: "Assign deliveries to drivers",
	},
	{
		module: "delivery",
		action: "track_deliveries",
		name: "Track Deliveries",
		description: "Track delivery status",
	},

	// Reports permissions
	{
		module: "reports",
		action: "view",
		name: "View Reports",
		description: "View all reports",
	},
	{
		module: "reports",
		action: "export",
		name: "Export Reports",
		description: "Export reports to PDF/Excel",
	},
	{
		module: "reports",
		action: "custom",
		name: "Custom Reports",
		description: "Create custom reports",
	},

	// Staff permissions
	{
		module: "staff",
		action: "view",
		name: "View Staff",
		description: "View employee list",
	},
	{
		module: "staff",
		action: "create",
		name: "Create Staff",
		description: "Add new employees",
	},
	{
		module: "staff",
		action: "update",
		name: "Update Staff",
		description: "Edit employee details",
	},
	{
		module: "staff",
		action: "delete",
		name: "Delete Staff",
		description: "Remove employees",
	},
	{
		module: "staff",
		action: "manage_roles",
		name: "Manage Roles",
		description: "Create and edit roles",
	},
	{
		module: "staff",
		action: "assign_roles",
		name: "Assign Roles",
		description: "Assign roles to employees",
	},

	// Settings permissions
	{
		module: "settings",
		action: "view",
		name: "View Settings",
		description: "View system settings",
	},
	{
		module: "settings",
		action: "update_business",
		name: "Update Business Settings",
		description: "Update business profile and branding",
	},
	{
		module: "settings",
		action: "update_system",
		name: "Update System Settings",
		description: "Update system configuration",
	},
	{
		module: "settings",
		action: "manage_modules",
		name: "Manage Modules",
		description: "Enable/disable system modules",
	},
	{
		module: "settings",
		action: "manage_permissions",
		name: "Manage Permissions",
		description: "Configure role permissions",
	},

	// Finance permissions
	{
		module: "finance",
		action: "view",
		name: "View Finance",
		description: "View financial data",
	},
	{
		module: "finance",
		action: "create_transactions",
		name: "Create Transactions",
		description: "Record financial transactions",
	},
	{
		module: "finance",
		action: "approve_transactions",
		name: "Approve Transactions",
		description: "Approve financial transactions",
	},
	{
		module: "finance",
		action: "manage_accounts",
		name: "Manage Accounts",
		description: "Create and edit chart of accounts",
	},

	// Marketing permissions
	{
		module: "marketing",
		action: "view",
		name: "View Marketing",
		description: "View marketing campaigns",
	},
	{
		module: "marketing",
		action: "create_campaigns",
		name: "Create Campaigns",
		description: "Create new marketing campaigns",
	},
	{
		module: "marketing",
		action: "send_campaigns",
		name: "Send Campaigns",
		description: "Send marketing campaigns",
	},

	// Loyalty permissions
	{
		module: "loyalty",
		action: "view",
		name: "View Loyalty",
		description: "View loyalty programs",
	},
	{
		module: "loyalty",
		action: "manage_program",
		name: "Manage Loyalty Program",
		description: "Configure loyalty program rules",
	},
	{
		module: "loyalty",
		action: "award_points",
		name: "Award Points",
		description: "Manually award loyalty points",
	},

	// Suppliers permissions
	{
		module: "suppliers",
		action: "view",
		name: "View Suppliers",
		description: "View supplier list",
	},
	{
		module: "suppliers",
		action: "create",
		name: "Create Suppliers",
		description: "Add new suppliers",
	},
	{
		module: "suppliers",
		action: "update",
		name: "Update Suppliers",
		description: "Edit supplier details",
	},
	{
		module: "suppliers",
		action: "delete",
		name: "Delete Suppliers",
		description: "Remove suppliers",
	},

	// Branches permissions
	{
		module: "branches",
		action: "view",
		name: "View Branches",
		description: "View branch list",
	},
	{
		module: "branches",
		action: "create",
		name: "Create Branches",
		description: "Add new branches",
	},
	{
		module: "branches",
		action: "update",
		name: "Update Branches",
		description: "Edit branch details",
	},
	{
		module: "branches",
		action: "delete",
		name: "Delete Branches",
		description: "Remove branches",
	},

	// Transfers permissions
	{
		module: "transfers",
		action: "view",
		name: "View Transfers",
		description: "View stock transfers",
	},
	{
		module: "transfers",
		action: "create",
		name: "Create Transfers",
		description: "Create new stock transfers",
	},
	{
		module: "transfers",
		action: "approve",
		name: "Approve Transfers",
		description: "Approve stock transfers",
	},
	{
		module: "transfers",
		action: "complete",
		name: "Complete Transfers",
		description: "Complete stock transfers",
	},

	// Payroll permissions
	{
		module: "payroll",
		action: "view",
		name: "View Payroll",
		description: "View payroll data",
	},
	{
		module: "payroll",
		action: "create",
		name: "Create Payroll",
		description: "Create payroll entries",
	},
	{
		module: "payroll",
		action: "approve",
		name: "Approve Payroll",
		description: "Approve payroll",
	},
	{
		module: "payroll",
		action: "process",
		name: "Process Payroll",
		description: "Process payroll payments",
	},

	// Attendance permissions
	{
		module: "attendance",
		action: "view",
		name: "View Attendance",
		description: "View attendance records",
	},
	{
		module: "attendance",
		action: "create",
		name: "Create Attendance",
		description: "Record attendance",
	},
	{
		module: "attendance",
		action: "update",
		name: "Update Attendance",
		description: "Edit attendance records",
	},
	{
		module: "attendance",
		action: "approve",
		name: "Approve Attendance",
		description: "Approve attendance records",
	},

	// POS permissions
	{
		module: "pos",
		action: "view",
		name: "View POS",
		description: "Access POS interface",
	},
	{
		module: "pos",
		action: "create_sale",
		name: "Create Sales",
		description: "Process POS sales",
	},
	{
		module: "pos",
		action: "refund",
		name: "Process Refunds",
		description: "Process refunds",
	},
	{
		module: "pos",
		action: "close_shift",
		name: "Close Shift",
		description: "Close POS shift",
	},

	// Auditor permissions
	{
		module: "auditor",
		action: "view",
		name: "View Auditor",
		description: "Access auditor tools",
	},
	{
		module: "auditor",
		action: "run_audit",
		name: "Run Audits",
		description: "Run inventory audits",
	},
	{
		module: "auditor",
		action: "approve_discrepancies",
		name: "Approve Discrepancies",
		description: "Approve audit discrepancies",
	},

	// Biller permissions
	{
		module: "biller",
		action: "view",
		name: "View Biller",
		description: "Access billing tools",
	},
	{
		module: "biller",
		action: "create_invoice",
		name: "Create Invoices",
		description: "Create billing invoices",
	},
	{
		module: "biller",
		action: "send_invoice",
		name: "Send Invoices",
		description: "Send invoices to customers",
	},
];

export const clientSettingsRouter = router({
	// ========== MODULE MANAGEMENT ========== //

	/**
	 * Get all available modules (core and optional)
	 */
	getAllModules: protectedProcedure.query(async ({ ctx }) => {
		const result = await ctx.db
			.select()
			.from(modules)
			.orderBy(asc(modules.is_core), asc(modules.name));

		return result;
	}),

	/**
	 * Get module by ID or slug
	 */
	getModule: protectedProcedure
		.input(z.object({ id: z.number().optional(), slug: z.string().optional() }))
		.query(async ({ ctx, input }) => {
			if (input.id) {
				return ctx.db
					.select()
					.from(modules)
					.where(eq(modules.id, input.id))
					.then((res) => res[0] || null);
			}

			if (input.slug) {
				return ctx.db
					.select()
					.from(modules)
					.where(eq(modules.slug, input.slug))
					.then((res) => res[0] || null);
			}

			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Either id or slug must be provided",
			});
		}),

	/**
	 * Enable or disable a module
	 */
	toggleModule: protectedProcedure
		.input(
			z.object({
				module_id: z.number(),
				is_active: z.boolean(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [updated] = await ctx.db
				.update(modules)
				.set({ is_active: input.is_active, updated_at: new Date() })
				.where(eq(modules.id, input.module_id))
				.returning();

			// Log the change
			await ctx.db.insert(auditLogs).values({
				user_id: ctx.user.id,
				action: `MODULE_${input.is_active ? "ENABLED" : "DISABLED"}`,
				entity_type: "modules",
				entity_id: input.module_id,
				new_values: { is_active: input.is_active },
			});

			return updated;
		}),

	/**
	 * Create a new custom module
	 */
	createModule: protectedProcedure
		.input(
			z.object({
				name: z.string().min(3).max(100),
				slug: z.string().min(3).max(100),
				description: z.string().optional(),
				icon: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [created] = await ctx.db
				.insert(modules)
				.values({
					...input,
					is_active: true,
					is_core: false,
				})
				.returning();

			// Log the change
			await ctx.db.insert(auditLogs).values({
				user_id: ctx.user.id,
				action: "MODULE_CREATED",
				entity_type: "modules",
				entity_id: created.id,
				new_values: { ...input },
			});

			return created;
		}),

	// ========== MODULE PERMISSIONS ========== //

	/**
	 * Get all permissions for a module
	 */
	getModulePermissions: protectedProcedure
		.input(z.object({ module_id: z.number() }))
		.query(async ({ ctx, input }) => {
			const result = await ctx.db
				.select()
				.from(modulePermissions)
				.where(eq(modulePermissions.module_id, input.module_id))
				.orderBy(asc(modulePermissions.name));

			return result;
		}),

	/**
	 * Create a new permission for a module
	 */
	createModulePermission: protectedProcedure
		.input(
			z.object({
				module_id: z.number(),
				action: z.string().min(3).max(50),
				name: z.string().min(3).max(100),
				description: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [created] = await ctx.db
				.insert(modulePermissions)
				.values({
					...input,
					is_active: true,
				})
				.returning();

			// Log the change
			await ctx.db.insert(auditLogs).values({
				user_id: ctx.user.id,
				action: "PERMISSION_CREATED",
				entity_type: "module_permissions",
				entity_id: created.id,
				new_values: { ...input },
			});

			return created;
		}),

	/**
	 * Update a permission
	 */
	updateModulePermission: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				name: z.string().min(3).max(100).optional(),
				description: z.string().optional(),
				is_active: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const [updated] = await ctx.db
				.update(modulePermissions)
				.set({ ...data, updated_at: new Date() })
				.where(eq(modulePermissions.id, id))
				.returning();

			// Log the change
			await ctx.db.insert(auditLogs).values({
				user_id: ctx.user.id,
				action: "PERMISSION_UPDATED",
				entity_type: "module_permissions",
				entity_id: id,
				old_values: { ...data },
				new_values: { ...data },
			});

			return updated;
		}),

	// ========== ROLE MANAGEMENT ========== //

	/**
	 * Get all roles
	 */
	getAllRoles: protectedProcedure.query(async ({ ctx }) => {
		const result = await ctx.db.select().from(roles).orderBy(asc(roles.name));

		return result;
	}),

	/**
	 * Get role by ID
	 */
	getRole: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const result = await ctx.db
				.select()
				.from(roles)
				.where(eq(roles.id, input.id))
				.limit(1);

			return result[0] || null;
		}),

	/**
	 * Create a new role
	 */
	createRole: protectedProcedure
		.input(
			z.object({
				name: z.string().min(3).max(50),
				description: z.string().optional(),
				can_edit_permissions: z.boolean().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [created] = await ctx.db
				.insert(roles)
				.values({
					...input,
					is_active: true,
				})
				.returning();

			// Log the change
			await ctx.db.insert(auditLogs).values({
				user_id: ctx.user.id,
				action: "ROLE_CREATED",
				entity_type: "roles",
				entity_id: created.id,
				new_values: { ...input },
			});

			return created;
		}),

	/**
	 * Update a role
	 */
	updateRole: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				name: z.string().min(3).max(50).optional(),
				description: z.string().optional(),
				is_active: z.boolean().optional(),
				can_edit_permissions: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const [updated] = await ctx.db
				.update(roles)
				.set({ ...data, updated_at: new Date() })
				.where(eq(roles.id, id))
				.returning();

			// Log the change
			await ctx.db.insert(auditLogs).values({
				user_id: ctx.user.id,
				action: "ROLE_UPDATED",
				entity_type: "roles",
				entity_id: id,
				old_values: { ...data },
				new_values: { ...data },
			});

			return updated;
		}),

	/**
	 * Delete a role
	 */
	deleteRole: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const [deleted] = await ctx.db
				.delete(roles)
				.where(eq(roles.id, input.id))
				.returning();

			// Log the change
			await ctx.db.insert(auditLogs).values({
				user_id: ctx.user.id,
				action: "ROLE_DELETED",
				entity_type: "roles",
				entity_id: input.id,
				old_values: { ...deleted },
			});

			return deleted;
		}),

	/**
	 * Clone a role
	 */
	cloneRole: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				new_name: z.string().min(3).max(50),
				new_description: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Get the original role
			const original = await ctx.db
				.select()
				.from(roles)
				.where(eq(roles.id, input.id))
				.then((res) => res[0]);

			if (!original) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Role not found" });
			}

			// Create the cloned role
			const [cloned] = await ctx.db
				.insert(roles)
				.values({
					name: input.new_name,
					description: input.new_description || `${original.name} (Clone)`,
					is_active: true,
					can_edit_permissions: false,
				})
				.returning();

			// Clone permissions
			const permissions = await ctx.db
				.select()
				.from(rolePermissions)
				.where(eq(rolePermissions.role_id, input.id));

			for (const perm of permissions) {
				await ctx.db.insert(rolePermissions).values({
					role_id: cloned.id,
					module: perm.module,
					action: perm.action,
					is_allowed: perm.is_allowed,
				});
			}

			// Log the change
			await ctx.db.insert(auditLogs).values({
				user_id: ctx.user.id,
				action: "ROLE_CLONED",
				entity_type: "roles",
				entity_id: cloned.id,
				new_values: { original_id: input.id, new_name: input.new_name },
			});

			return cloned;
		}),

	// ========== ROLE PERMISSIONS ========== //

	/**
	 * Get permissions for a role
	 */
	getRolePermissions: protectedProcedure
		.input(z.object({ role_id: z.number() }))
		.query(async ({ ctx, input }) => {
			const result = await ctx.db
				.select()
				.from(rolePermissions)
				.where(eq(rolePermissions.role_id, input.role_id))
				.orderBy(asc(rolePermissions.module), asc(rolePermissions.action));

			return result;
		}),

	/**
	 * Update role permissions
	 */
	updateRolePermissions: protectedProcedure
		.input(
			z.object({
				role_id: z.number(),
				permissions: z.array(
					z.object({
						module: z.string(),
						action: z.string(),
						is_allowed: z.boolean(),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await ctx.db.transaction(async (tx) => {
				// Delete existing permissions
				await tx
					.delete(rolePermissions)
					.where(eq(rolePermissions.role_id, input.role_id));

				// Insert new permissions
				for (const perm of input.permissions) {
					await tx.insert(rolePermissions).values({
						role_id: input.role_id,
						module: perm.module,
						action: perm.action,
						is_allowed: perm.is_allowed,
					});
				}
			});

			// Log the change
			await ctx.db.insert(auditLogs).values({
				user_id: ctx.user.id,
				action: "ROLE_PERMISSIONS_UPDATED",
				entity_type: "role_permissions",
				entity_id: input.role_id,
				new_values: { permissions_count: input.permissions.length },
			});

			return { success: true };
		}),

	/**
	 * Set default permissions for a role
	 */
	setDefaultPermissions: protectedProcedure
		.input(z.object({ role_id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			// Get all module permissions
			const allPermissions = await ctx.db.select().from(modulePermissions);

			// Create default permissions based on module permissions
			const permissionsToInsert = allPermissions.map((perm) => ({
				role_id: input.role_id,
				module: perm.module_id.toString(),
				action: perm.action,
				is_allowed: false, // Default to false
			}));

			await ctx.db.transaction(async (tx) => {
				// Delete existing permissions
				await tx
					.delete(rolePermissions)
					.where(eq(rolePermissions.role_id, input.role_id));

				// Insert new permissions
				for (const perm of permissionsToInsert) {
					await tx.insert(rolePermissions).values(perm);
				}
			});

			// Log the change
			await ctx.db.insert(auditLogs).values({
				user_id: ctx.user.id,
				action: "ROLE_PERMISSIONS_RESET",
				entity_type: "role_permissions",
				entity_id: input.role_id,
			});

			return { success: true };
		}),

	// ========== USER MANAGEMENT ========== //

	/**
	 * Get all staff/users
	 */
	getAllStaff: protectedProcedure.query(async ({ ctx }) => {
		const result = await ctx.db
			.select()
			.from(staff)
			.where(eq(staff.is_deleted, false))
			.orderBy(asc(staff.name));

		return result;
	}),

	/**
	 * Get staff by ID
	 */
	getStaff: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const result = await ctx.db
				.select()
				.from(staff)
				.where(and(eq(staff.id, input.id), eq(staff.is_deleted, false)))
				.limit(1);

			return result[0] || null;
		}),

	/**
	 * Create a new staff/user
	 */
	createStaff: protectedProcedure
		.input(
			z.object({
				name: z.string().min(2).max(255),
				email: z.string().email(),
				phone: z.string().min(10).max(20).optional(),
				role: z.string().min(2).max(50),
				department: z.string().min(2).max(50).optional(),
				status: z.enum(["active", "inactive"]).default("active"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [created] = await ctx.db
				.insert(staff)
				.values({
					...input,
					staff_code: `EMP-${Date.now()}`,
					join_date: new Date(),
					salary: 0,
				})
				.returning();

			// Log the change
			await ctx.db.insert(auditLogs).values({
				user_id: ctx.user.id,
				action: "STAFF_CREATED",
				entity_type: "staff",
				entity_id: created.id,
				new_values: { ...input },
			});

			return created;
		}),

	/**
	 * Update staff
	 */
	updateStaff: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				name: z.string().min(2).max(255).optional(),
				email: z.string().email().optional(),
				phone: z.string().min(10).max(20).optional(),
				role: z.string().min(2).max(50).optional(),
				department: z.string().min(2).max(50).optional(),
				status: z.enum(["active", "inactive"]).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const [updated] = await ctx.db
				.update(staff)
				.set({ ...data, updated_at: new Date() })
				.where(and(eq(staff.id, id), eq(staff.is_deleted, false)))
				.returning();

			// Log the change
			await ctx.db.insert(auditLogs).values({
				user_id: ctx.user.id,
				action: "STAFF_UPDATED",
				entity_type: "staff",
				entity_id: id,
				old_values: { ...data },
				new_values: { ...data },
			});

			return updated;
		}),

	/**
	 * Delete staff (soft delete)
	 */
	deleteStaff: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const [deleted] = await ctx.db
				.update(staff)
				.set({ is_deleted: true, deleted_at: new Date() })
				.where(and(eq(staff.id, input.id), eq(staff.is_deleted, false)))
				.returning();

			// Log the change
			await ctx.db.insert(auditLogs).values({
				user_id: ctx.user.id,
				action: "STAFF_DELETED",
				entity_type: "staff",
				entity_id: input.id,
				old_values: { ...deleted },
			});

			return deleted;
		}),

	// ========== USER ROLES ========== //

	/**
	 * Assign role to user
	 */
	assignRoleToUser: protectedProcedure
		.input(
			z.object({
				user_id: z.number(),
				role_id: z.number(),
				expires_at: z.date().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [assigned] = await ctx.db
				.insert(userRoles)
				.values({
					user_id: input.user_id,
					role_id: input.role_id,
					assigned_by: ctx.user.id,
					expires_at: input.expires_at,
				})
				.returning();

			// Log the change
			await ctx.db.insert(auditLogs).values({
				user_id: ctx.user.id,
				action: "ROLE_ASSIGNED_TO_USER",
				entity_type: "user_roles",
				entity_id: assigned.id,
				new_values: { user_id: input.user_id, role_id: input.role_id },
			});

			return assigned;
		}),

	/**
	 * Remove role from user
	 */
	removeRoleFromUser: protectedProcedure
		.input(
			z.object({
				user_id: z.number(),
				role_id: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [removed] = await ctx.db
				.delete(userRoles)
				.where(
					and(
						eq(userRoles.user_id, input.user_id),
						eq(userRoles.role_id, input.role_id),
					),
				)
				.returning();

			// Log the change
			await ctx.db.insert(auditLogs).values({
				user_id: ctx.user.id,
				action: "ROLE_REMOVED_FROM_USER",
				entity_type: "user_roles",
				entity_id: removed?.id || 0,
				old_values: { user_id: input.user_id, role_id: input.role_id },
			});

			return removed;
		}),

	/**
	 * Get roles for a user
	 */
	getUserRoles: protectedProcedure
		.input(z.object({ user_id: z.number() }))
		.query(async ({ ctx, input }) => {
			const result = await ctx.db
				.select()
				.from(userRoles)
				.where(eq(userRoles.user_id, input.user_id))
				.innerJoin(roles, eq(userRoles.role_id, roles.id));

			return result.map((ur) => ({
				...ur.user_roles,
				role: ur.roles,
			}));
		}),

	// ========== MODULE ACCESS CONTROL ========== //

	/**
	 * Get module access for a role
	 */
	getRoleModuleAccess: protectedProcedure
		.input(z.object({ role_name: z.string() }))
		.query(async ({ ctx, input }) => {
			const result = await ctx.db
				.select()
				.from(roleModuleAccess)
				.where(eq(roleModuleAccess.role_name, input.role_name))
				.innerJoin(modules, eq(roleModuleAccess.module_id, modules.id));

			return result.map((rma) => ({
				...rma.role_module_access,
				module: rma.modules,
			}));
		}),

	/**
	 * Update module access for a role
	 */
	updateRoleModuleAccess: protectedProcedure
		.input(
			z.object({
				role_name: z.string(),
				module_access: z.array(
					z.object({
						module_id: z.number(),
						is_allowed: z.boolean(),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await ctx.db.transaction(async (tx) => {
				// Delete existing access
				await tx
					.delete(roleModuleAccess)
					.where(eq(roleModuleAccess.role_name, input.role_name));

				// Insert new access
				for (const access of input.module_access) {
					await tx.insert(roleModuleAccess).values({
						role_name: input.role_name,
						module_id: access.module_id,
						is_allowed: access.is_allowed,
					});
				}
			});

			// Log the change
			await ctx.db.insert(auditLogs).values({
				user_id: ctx.user.id,
				action: "ROLE_MODULE_ACCESS_UPDATED",
				entity_type: "role_module_access",
				new_values: {
					role_name: input.role_name,
					modules_count: input.module_access.length,
				},
			});

			return { success: true };
		}),

	// ========== CLIENT SETTINGS ========== //

	/**
	 * Get all client settings
	 */
	getAllClientSettings: protectedProcedure.query(async ({ ctx }) => {
		const result = await ctx.db
			.select()
			.from(clientSettings)
			.orderBy(asc(clientSettings.category), asc(clientSettings.key));

		return result;
	}),

	/**
	 * Get settings by category
	 */
	getSettingsByCategory: protectedProcedure
		.input(z.object({ category: z.string() }))
		.query(async ({ ctx, input }) => {
			const result = await ctx.db
				.select()
				.from(clientSettings)
				.where(eq(clientSettings.category, input.category))
				.orderBy(asc(clientSettings.key));

			return result;
		}),

	/**
	 * Update client settings
	 */
	updateClientSettings: protectedProcedure
		.input(
			z.object({
				key: z.string(),
				value: z.any(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [updated] = await ctx.db
				.update(clientSettings)
				.set({ value: input.value, updated_at: new Date() })
				.where(eq(clientSettings.key, input.key))
				.returning();

			// Log the change
			await ctx.db.insert(auditLogs).values({
				user_id: ctx.user.id,
				action: "CLIENT_SETTING_UPDATED",
				entity_type: "client_settings",
				entity_id: updated.id,
				old_values: { value: updated.value },
				new_values: { value: input.value },
			});

			return updated;
		}),

	// ========== SYSTEM SETTINGS ========== //

	/**
	 * Get all system settings
	 */
	getAllSystemSettings: protectedProcedure.query(async ({ ctx }) => {
		const result = await ctx.db
			.select()
			.from(systemSettings)
			.orderBy(asc(systemSettings.category), asc(systemSettings.key));

		return result;
	}),

	/**
	 * Update system settings
	 */
	updateSystemSettings: protectedProcedure
		.input(
			z.object({
				key: z.string(),
				value: z.any(),
				category: z.string(),
				description: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [updated] = await ctx.db
				.update(systemSettings)
				.set({
					value: input.value,
					category: input.category,
					description: input.description,
					updated_at: new Date(),
				})
				.where(eq(systemSettings.key, input.key))
				.returning();

			// Log the change
			await ctx.db.insert(auditLogs).values({
				user_id: ctx.user.id,
				action: "SYSTEM_SETTING_UPDATED",
				entity_type: "system_settings",
				entity_id: updated.id,
				old_values: { value: updated.value },
				new_values: { value: input.value },
			});

			return updated;
		}),

	// ========== APPROVAL WORKFLOWS ========== //

	/**
	 * Get all approval workflows
	 */
	getAllApprovalWorkflows: protectedProcedure.query(async ({ ctx }) => {
		const result = await ctx.db
			.select()
			.from(approvalWorkflows)
			.orderBy(
				asc(approvalWorkflows.is_active),
				desc(approvalWorkflows.created_at),
			);

		return result;
	}),

	/**
	 * Create a new approval workflow
	 */
	createApprovalWorkflow: protectedProcedure
		.input(
			z.object({
				name: z.string().min(3).max(255),
				description: z.string().optional(),
				entity_type: z.string().min(3).max(100),
				min_amount: z.number().int().positive().optional(),
				max_approvers: z.number().int().min(1).max(10).default(1),
				requires_multiple_levels: z.boolean().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [created] = await ctx.db
				.insert(approvalWorkflows)
				.values({
					...input,
					is_active: true,
				})
				.returning();

			// Log the change
			await ctx.db.insert(auditLogs).values({
				user_id: ctx.user.id,
				action: "APPROVAL_WORKFLOW_CREATED",
				entity_type: "approval_workflows",
				entity_id: created.id,
				new_values: { ...input },
			});

			return created;
		}),

	/**
	 * Update an approval workflow
	 */
	updateApprovalWorkflow: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				name: z.string().min(3).max(255).optional(),
				description: z.string().optional(),
				min_amount: z.number().int().positive().optional(),
				max_approvers: z.number().int().min(1).max(10).optional(),
				requires_multiple_levels: z.boolean().optional(),
				is_active: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const [updated] = await ctx.db
				.update(approvalWorkflows)
				.set({ ...data, updated_at: new Date() })
				.where(eq(approvalWorkflows.id, id))
				.returning();

			// Log the change
			await ctx.db.insert(auditLogs).values({
				user_id: ctx.user.id,
				action: "APPROVAL_WORKFLOW_UPDATED",
				entity_type: "approval_workflows",
				entity_id: id,
				old_values: { ...data },
				new_values: { ...data },
			});

			return updated;
		}),

	/**
	 * Add approval rule to workflow
	 */
	addApprovalRule: protectedProcedure
		.input(
			z.object({
				workflow_id: z.number(),
				role_id: z.number(),
				level: z.number().int().min(1).default(1),
				can_approve: z.boolean().default(true),
				can_reject: z.boolean().default(true),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [created] = await ctx.db
				.insert(approvalRules)
				.values({
					...input,
				})
				.returning();

			// Log the change
			await ctx.db.insert(auditLogs).values({
				user_id: ctx.user.id,
				action: "APPROVAL_RULE_ADDED",
				entity_type: "approval_rules",
				entity_id: created.id,
				new_values: { ...input },
			});

			return created;
		}),

	// ========== NOTIFICATION TEMPLATES ========== //

	/**
	 * Get all notification templates
	 */
	getAllNotificationTemplates: protectedProcedure.query(async ({ ctx }) => {
		const result = await ctx.db
			.select()
			.from(notificationTemplates)
			.orderBy(
				asc(notificationTemplates.is_active),
				asc(notificationTemplates.name),
			);

		return result;
	}),

	/**
	 * Create a new notification template
	 */
	createNotificationTemplate: protectedProcedure
		.input(
			z.object({
				name: z.string().min(3).max(100),
				type: z.enum(["email", "sms", "in_app", "whatsapp", "push"]),
				subject: z.string().min(3).max(255).optional(),
				body: z.string().min(10),
				channel: z
					.enum(["in_app", "email", "sms", "whatsapp", "push"])
					.default("in_app"),
				is_active: z.boolean().default(true),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [created] = await ctx.db
				.insert(notificationTemplates)
				.values({
					...input,
				})
				.returning();

			// Log the change
			await ctx.db.insert(auditLogs).values({
				user_id: ctx.user.id,
				action: "NOTIFICATION_TEMPLATE_CREATED",
				entity_type: "notification_templates",
				entity_id: created.id,
				new_values: { ...input },
			});

			return created;
		}),

	/**
	 * Update a notification template
	 */
	updateNotificationTemplate: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				name: z.string().min(3).max(100).optional(),
				subject: z.string().min(3).max(255).optional(),
				body: z.string().min(10).optional(),
				is_active: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const [updated] = await ctx.db
				.update(notificationTemplates)
				.set({ ...data, updated_at: new Date() })
				.where(eq(notificationTemplates.id, id))
				.returning();

			// Log the change
			await ctx.db.insert(auditLogs).values({
				user_id: parseInt(ctx.user.id) || null,
				action: "NOTIFICATION_TEMPLATE_UPDATED",
				entity_type: "notification_templates",
				entity_id: id,
				old_values: { ...data },
				new_values: { ...data },
			});

			return updated;
		}),

	// ========== AUDIT LOGS ========== //

	/**
	 * Get audit logs
	 */
	getAuditLogs: protectedProcedure
		.input(
			z.object({
				limit: z.number().int().min(1).max(1000).default(100),
				offset: z.number().int().min(0).default(0),
				action: z.string().optional(),
				entity_type: z.string().optional(),
				user_id: z.number().optional(),
				start_date: z.date().optional(),
				end_date: z.date().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const conditions = [];

			if (input.action) {
				conditions.push(ilike(auditLogs.action, `%${input.action}%`));
			}

			if (input.entity_type) {
				conditions.push(eq(auditLogs.entity_type, input.entity_type));
			}

			if (input.user_id) {
				conditions.push(eq(auditLogs.user_id, input.user_id));
			}

			if (input.start_date && input.end_date) {
				conditions.push(
					and(
						gte(auditLogs.created_at, input.start_date),
						lte(auditLogs.created_at, input.end_date),
					),
				);
			}

			const result = await ctx.db
				.select()
				.from(auditLogs)
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(desc(auditLogs.created_at))
				.limit(input.limit)
				.offset(input.offset);

			// Get user details for each log
			const userIds = [
				...new Set(result.map((log) => log.user_id).filter(Boolean)),
			] as number[];
			const users =
				userIds.length > 0
					? await ctx.db
							.select({ id: staff.id, name: staff.name })
							.from(staff)
							.where(inArray(staff.id, userIds))
					: [];

			return result.map((log) => ({
				...log,
				user_name: users.find((u) => u.id === log.user_id)?.name || "System",
			}));
		}),

	/**
	 * Get audit log by ID
	 */
	getAuditLog: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const result = await ctx.db
				.select()
				.from(auditLogs)
				.where(eq(auditLogs.id, input.id))
				.limit(1);

			if (result[0]?.user_id) {
				const user = await ctx.db
					.select({ name: staff.name })
					.from(staff)
					.where(eq(staff.id, result[0].user_id))
					.limit(1);

				return { ...result[0], user_name: user[0]?.name || "System" };
			}

			return result[0] || null;
		}),
});

// Helper function for case-insensitive like
function ilike(column: any, value: string) {
	return sql`${column} ILIKE ${value}`;
}
