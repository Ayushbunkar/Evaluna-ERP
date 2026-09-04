import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
	UserManagement,
	type UserStatus,
	securityAuditLog,
	session,
	ROLES,
	type Role,
} from "@evaluna/db";
import { and, desc, eq } from "drizzle-orm";
import { router, roleProcedure, protectedProcedure } from "../init";

// Convert ROLES array to a tuple of string literals for Zod
const zRole = z.enum(ROLES as unknown as [string, ...string[]]);

export const usersRouter = router({
	// ── List Users (Requirement 1 & 19) ───────────────────────────────────────
	list: roleProcedure(["admin", "super_admin", "manager"])
		.input(
			z.object({
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(10),
				search: z.string().optional(),
				status: z.enum(["ACTIVE", "INACTIVE", "LOCKED", "PENDING", "SUSPENDED"]).optional(),
				roleName: zRole.optional(),
				branchId: z.number().optional(),
				warehouseId: z.number().optional(),
			}).default({})
		)
		.query(async ({ input }) => {
			const result = await UserManagement.listUsers(input.page, input.limit, {
				roleName: input.roleName as Role | undefined,
				status: input.status as UserStatus | undefined,
				branchId: input.branchId,
				warehouseId: input.warehouseId,
				search: input.search,
			});
			return result;
		}),

	// ── Get Single User Details (Requirement 10) ──────────────────────────────
	get: roleProcedure(["admin", "super_admin", "manager"])
		.input(z.object({ userId: z.string() }))
		.query(async ({ ctx, input }) => {
			const userProfile = await UserManagement.getUserById(input.userId);
			if (!userProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found.",
				});
			}

			// Fetch active sessions for the user (Requirement 18)
			const activeSessions = await ctx.db
				.select()
				.from(session)
				.where(eq(session.userId, input.userId));

			// Fetch security audit logs for the user (Requirement 16)
			const auditLogs = await ctx.db
				.select()
				.from(securityAuditLog)
				.where(eq(securityAuditLog.target_user_id, input.userId))
				.orderBy(desc(securityAuditLog.created_at))
				.limit(50);

			return {
				profile: userProfile,
				sessions: activeSessions.map((s) => ({
					id: s.id,
					expiresAt: s.expiresAt,
					ipAddress: s.ipAddress,
					userAgent: s.userAgent,
					deviceName: s.device_name,
					createdAt: s.createdAt,
				})),
				auditLogs: auditLogs.map((log) => ({
					id: log.id,
					action: log.action,
					description: log.description,
					reason: log.reason,
					createdAt: log.created_at,
					actorId: log.actor_id,
				})),
			};
		}),

	// ── Create User Account (Requirement 2 & 13 & 15) ─────────────────────────
	create: roleProcedure(["admin", "super_admin"])
		.input(
			z.object({
				fullName: z.string().min(2, "Full Name is required."),
				employeeId: z.string().min(3, "Employee ID is required."),
				email: z.string().email("Invalid email address."),
				roleName: zRole,
				branchId: z.number().min(1, "Branch is required."),
				warehouseId: z.number().optional(),
				initialPassword: z.string().min(8, "Password must be at least 8 characters.").optional(),
				forcePasswordChange: z.boolean().default(true),
			})
		)
		.mutation(async ({ ctx, input }) => {
			// Privilege Escalation Prevention (Requirement 17)
			if (input.roleName === "super_admin" && !ctx.user.isSuperadmin) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only a Super Admin can create a Super Admin account.",
				});
			}

			try {
				const result = await UserManagement.createUserWithStaffAndRole({
					fullName: input.fullName,
					employeeId: input.employeeId,
					email: input.email,
					roleName: input.roleName as Role,
					branchId: input.branchId,
					warehouseId: input.warehouseId,
					initialPassword: input.initialPassword,
					forcePasswordChange: input.forcePasswordChange,
					actorId: ctx.user.id,
				});

				return {
					success: true,
					userId: result.userId,
					staffId: result.staffId,
					role: result.role,
				};
			} catch (error: any) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: error.message || "Failed to create user.",
				});
			}
		}),

	// ── Change Role and Scope (Requirement 9 & 14) ────────────────────────────
	changeRoleAndScope: roleProcedure(["admin", "super_admin"])
		.input(
			z.object({
				userId: z.string(),
				roleName: zRole,
				branchId: z.number().min(1),
				warehouseId: z.number().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			// Get target user to check if they are currently super_admin
			const target = await UserManagement.getUserById(input.userId);
			if (!target) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Target user not found.",
				});
			}

			// Privilege Escalation Prevention (Requirement 17)
			if (!ctx.user.isSuperadmin) {
				if (target.role === "super_admin" || input.roleName === "super_admin") {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only a Super Admin can assign or change the Super Admin role.",
					});
				}
			}

			try {
				await UserManagement.changeUserRoleAndScope(
					input.userId,
					input.roleName as Role,
					input.branchId,
					input.warehouseId,
					ctx.user.id
				);

				return { success: true };
			} catch (error: any) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: error.message || "Failed to update role and scope.",
				});
			}
		}),

	// ── Update User Status (Requirement 7 & 17) ───────────────────────────────
	updateStatus: roleProcedure(["admin", "super_admin"])
		.input(
			z.object({
				userId: z.string(),
				newStatus: z.enum(["ACTIVE", "INACTIVE", "LOCKED", "PENDING", "SUSPENDED"]),
				reason: z.string().min(5, "Reason for status change must be provided."),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const target = await UserManagement.getUserById(input.userId);
			if (!target) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Target user not found.",
				});
			}

			// Only Super Admin can modify another Super Admin status
			if (target.role === "super_admin" && !ctx.user.isSuperadmin) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only a Super Admin can modify another Super Admin's status.",
				});
			}

			try {
				await UserManagement.updateUserStatus(
					input.userId,
					input.newStatus as UserStatus,
					input.reason,
					ctx.user.id
				);

				return { success: true };
			} catch (error: any) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: error.message || "Failed to update user status.",
				});
			}
		}),

	// ── Reset Credentials (Requirement 6) ─────────────────────────────────────
	resetCredentials: roleProcedure(["admin", "super_admin"])
		.input(
			z.object({
				userId: z.string(),
				newPassword: z.string().min(8, "Password must be at least 8 characters."),
				forcePasswordChange: z.boolean().default(true),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const target = await UserManagement.getUserById(input.userId);
			if (!target) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Target user not found.",
				});
			}

			// Only Super Admin can reset credentials for another Super Admin
			if (target.role === "super_admin" && !ctx.user.isSuperadmin) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only a Super Admin can reset credentials for a Super Admin account.",
				});
			}

			try {
				await UserManagement.updateUserCredentials(
					input.userId,
					input.newPassword,
					input.forcePasswordChange,
					ctx.user.id
				);

				return { success: true };
			} catch (error: any) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: error.message || "Failed to reset password.",
				});
			}
		}),

	// ── Revoke User Sessions (Requirement 18) ──────────────────────────────────
	revokeSessions: roleProcedure(["admin", "super_admin"])
		.input(
			z.object({
				userId: z.string(),
				reason: z.string().min(5, "Reason for session revocation must be provided."),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const target = await UserManagement.getUserById(input.userId);
			if (!target) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Target user not found.",
				});
			}

			if (target.role === "super_admin" && !ctx.user.isSuperadmin) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only a Super Admin can revoke sessions for a Super Admin account.",
				});
			}

			try {
				await UserManagement.revokeUserSessions(
					input.userId,
					input.reason,
					ctx.user.id
				);

				return { success: true };
			} catch (error: any) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: error.message || "Failed to revoke sessions.",
				});
			}
		}),
});
