import { UserManagement } from "@evaluna/db";
import { z } from "zod";
import {
	isAtLeastRole,
	ROLES,
	type Role,
} from "../../apps/web/src/lib/permissions";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "./trpc";

// =============================================================================
// SCHEMAS
// =============================================================================

const userCreateSchema = z.object({
	fullName: z.string().min(3),
	employeeId: z.string().min(1).max(50),
	email: z.string().email(),
	roleName: z.enum(ROLES),
	branchId: z.number().int(),
	warehouseId: z.number().int().optional(),
	initialPassword: z.string().min(8).optional(),
	forcePasswordChange: z.boolean(),
});

const userStatusUpdateSchema = z.object({
	userId: z.string(),
	newStatus: z.enum(["ACTIVE", "INACTIVE", "LOCKED", "SUSPENDED", "PENDING"]),
	reason: z.string().min(5),
});

const userCredentialUpdateSchema = z.object({
	userId: z.string(),
	newPassword: z.string().min(8).optional(),
	forceChange: z.boolean().optional(),
});

const userRoleAndScopeUpdateSchema = z.object({
	userId: z.string(),
	newRoleName: z.enum(ROLES),
	newBranchId: z.number().int(),
	newWarehouseId: z.number().int().optional().nullable(),
	reason: z.string().min(5),
});

const userRevokeSessionSchema = z.object({
	userId: z.string(),
	reason: z.string().min(5),
});

const userListQuerySchema = z.object({
	page: z.number().int().default(1),
	limit: z.number().int().default(10),
	roleName: z.enum(ROLES).optional(),
	status: z
		.enum(["ACTIVE", "INACTIVE", "LOCKED", "SUSPENDED", "PENDING"])
		.optional(),
	branchId: z.number().int().optional(),
	warehouseId: z.number().int().optional(),
	search: z.string().optional(),
});

const userGetByIdSchema = z.object({
	userId: z.string(),
});

// =============================================================================
// ROUTER DEFINITION
// =============================================================================

/**
 * URCAM Router: Handles all Super Admin operations for user, role, and credential management.
 * All procedures must be protected by appropriate permissions checks (Requirement 17).
 */
export const usersRouter = createTRPCRouter({
	/**
	 * Lists all users with filtering and pagination (Requirement 1, 19).
	 * Requires 'users.read' permission.
	 */
	list: protectedProcedure
		.input(userListQuerySchema)
		.query(async ({ input, ctx }) => {
			// **Authorization Check:** Must have permission to read user list
			if (!ctx.session.permissions.includes("users.read")) {
				throw new Error(
					"FORBIDDEN: You lack permission to view user accounts.",
				);
			}

			// Repository handles the logic
			return UserManagement.listUsers(input.page, input.limit, input);
		}),

	/**
	 * Retrieves a single user's detailed information (Requirement 10).
	 * Requires 'users.read' permission.
	 */
	getById: protectedProcedure
		.input(userGetByIdSchema)
		.query(async ({ input, ctx }) => {
			// **Authorization Check:** Must have permission to read user details
			if (!ctx.session.permissions.includes("users.read")) {
				throw new Error("FORBIDDEN: You lack permission to view user details.");
			}

			// Repository handles the logic
			const user = await UserManagement.getUserById(input.userId);
			if (!user) {
				throw new Error("NOT_FOUND: User not found.");
			}
			return user;
		}),

	/**
	 * Creates a new user account, staff record, and assigns a role.
	 * Requires 'users.write' permission.
	 */
	create: protectedProcedure
		.input(userCreateSchema)
		.mutation(async ({ input, ctx }) => {
			// **Authorization Check:** Must have permission to create users (Requirement 17)
			if (!ctx.session.permissions.includes("users.write")) {
				throw new Error(
					"FORBIDDEN: You lack permission to create user accounts.",
				);
			}

			// **Privilege Escalation Check:** Cannot create a user with a higher role than self (Requirement 17)
			if (!isAtLeastRole(ctx.session.role as Role, input.roleName as Role)) {
				throw new Error(
					"PRIVILEGE_ESCALATION_ATTEMPT: Cannot create a user with a higher role hierarchy.",
				);
			}

			// The repository handles the transactional multi-table creation (Requirement 2, 15)
			const result = await UserManagement.createUserWithStaffAndRole({
				...input,
				actorId: ctx.session.user.id,
			});

			return { success: true, ...result };
		}),

	/**
	 * Updates a user's status (Activate, Deactivate, Lock, Unlock, Suspend).
	 * Requires 'users.lock' permission.
	 */
	updateStatus: protectedProcedure
		.input(userStatusUpdateSchema)
		.mutation(async ({ input, ctx }) => {
			// **Authorization Check:** Must have permission to lock/change user status
			if (!ctx.session.permissions.includes("users.lock")) {
				throw new Error(
					"FORBIDDEN: You lack permission to change user status.",
				);
			}

			// **Self-Exclusion Check:** Cannot change own status (prevent self-lockout)
			if (input.userId === ctx.session.user.id) {
				throw new Error("FORBIDDEN: Cannot change your own account status.");
			}

			// The repository handles the status change, session revocation, and audit logging (Requirement 7, 16)
			await UserManagement.updateUserStatus(
				input.userId,
				input.newStatus,
				input.reason,
				ctx.session.user.id,
			);

			return { success: true };
		}),

	/**
	 * Resets a user's password or toggles the force password change flag.
	 * Requires 'users.reset_password' permission.
	 */
	updateCredentials: protectedProcedure
		.input(userCredentialUpdateSchema)
		.mutation(async ({ input, ctx }) => {
			// **Authorization Check:** Must have permission to reset credentials
			if (!ctx.session.permissions.includes("users.reset_password")) {
				throw new Error("FORBIDDEN: You lack permission to reset credentials.");
			}

			// **Self-Exclusion Check:** Cannot reset own password via Admin UI
			if (input.userId === ctx.session.user.id) {
				throw new Error(
					"FORBIDDEN: Use the dedicated profile area to change your own password.",
				);
			}

			// The repository handles the hashing, credential update, and audit logging (Requirement 6, 16)
			await UserManagement.updateUserCredentials(
				input.userId,
				input.newPassword,
				input.forceChange,
				ctx.session.user.id,
			);

			return { success: true };
		}),

	/**
	 * Updates a user's role and branch/warehouse scope.
	 * Requires 'users.change_role' permission (Super Admin only).
	 */
	changeRoleAndScope: protectedProcedure
		.input(userRoleAndScopeUpdateSchema)
		.mutation(async ({ input, ctx }) => {
			// **Authorization Check:** Must have permission to change roles (Requirement 17)
			if (!ctx.session.permissions.includes("users.change_role")) {
				throw new Error("FORBIDDEN: You lack permission to change user roles.");
			}

			// **Self-Exclusion Check:** Cannot change own role
			if (input.userId === ctx.session.user.id) {
				throw new Error(
					"FORBIDDEN: Cannot change your own role via this administrative interface.",
				);
			}

			// **Privilege Escalation Check:** Cannot assign a role higher than the actor's current role
			if (!isAtLeastRole(ctx.session.role as Role, input.newRoleName as Role)) {
				throw new Error(
					"PRIVILEGE_ESCALATION_ATTEMPT: Cannot assign a role with a higher hierarchy than your own.",
				);
			}

			// Repository handles the role update, scope update, session revocation, and audit logging (Req. 14, 16)
			await UserManagement.changeUserRoleAndScope(
				input.userId,
				input.newRoleName,
				input.newBranchId,
				input.newWarehouseId ?? undefined, // Convert nullable to undefined if null
				ctx.session.user.id,
			);

			return { success: true };
		}),

	/**
	 * Revokes all active sessions for a user, forcing immediate log out.
	 * Requires 'users.session_revoke' permission.
	 */
	revokeSessions: protectedProcedure
		.input(userRevokeSessionSchema)
		.mutation(async ({ input, ctx }) => {
			// **Authorization Check:** Must have permission to revoke sessions (Requirement 17)
			if (!ctx.session.permissions.includes("users.session_revoke")) {
				throw new Error(
					"FORBIDDEN: You lack permission to revoke user sessions.",
				);
			}

			// Repository handles the session deletion and audit logging (Req. 18, 16)
			await UserManagement.revokeUserSessions(
				input.userId,
				input.reason,
				ctx.session.user.id,
			);

			return { success: true };
		}),
});
