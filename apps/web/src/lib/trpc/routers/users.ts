import {
	ROLES,
	type Role,
	securityAuditLog,
	session,
	UserManagement,
	type UserStatus,
} from "@evaluna/db";
import { staff, user } from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, roleProcedure, router } from "../init";

// Convert ROLES array to a tuple of string literals for Zod
const zRole = z.enum(ROLES as unknown as [string, ...string[]]);

export const usersRouter = router({
	// ── List Users (Requirement 1 & 19) ───────────────────────────────────────
	list: roleProcedure(["admin", "super_admin", "manager"])
		.input(
			z
				.object({
					page: z.number().min(1).default(1),
					limit: z.number().min(1).max(100).default(10),
					search: z.string().optional(),
					status: z
						.enum(["ACTIVE", "INACTIVE", "LOCKED", "PENDING", "SUSPENDED"])
						.optional(),
					roleName: zRole.optional(),
					branchId: z.number().optional(),
					warehouseId: z.number().optional(),
				})
				.default({}),
		)
		.query(async ({ ctx, input }) => {
			const isSuperAdmin = Boolean(ctx.user.isSuperadmin || ctx.user.role === "super_admin");
			const effectiveBranchId = isSuperAdmin
				? input.branchId
				: ctx.user.branchId
					? Number(ctx.user.branchId)
					: input.branchId;

			const result = await UserManagement.listUsers(input.page, input.limit, {
				roleName: input.roleName as Role | undefined,
				status: input.status as UserStatus | undefined,
				branchId: effectiveBranchId,
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
				initialPassword: z
					.string()
					.min(8, "Password must be at least 8 characters.")
					.optional(),
				forcePasswordChange: z.boolean().default(true),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const isSuperAdmin = Boolean(ctx.user.isSuperadmin || ctx.user.role === "super_admin");

			// Privilege Escalation Prevention (Requirement 17)
			if (input.roleName === "super_admin" && !isSuperAdmin) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only a Super Admin can create a Super Admin account.",
				});
			}

			// Branch Admin can only create users for their assigned branch
			const targetBranchId = isSuperAdmin
				? input.branchId
				: ctx.user.branchId
					? Number(ctx.user.branchId)
					: input.branchId;

			try {
				const result = await UserManagement.createUserWithStaffAndRole({
					fullName: input.fullName,
					employeeId: input.employeeId,
					email: input.email,
					roleName: input.roleName as Role,
					branchId: targetBranchId,
					warehouseId: input.warehouseId,
					initialPassword: input.initialPassword,
					forcePasswordChange: input.forcePasswordChange,
					actorId: ctx.user.id,
				});

				return {
					success: true,
					userId: result?.userId,
					staffId: result?.staffId,
					role: result?.role ?? input.roleName,
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
			}),
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
						message:
							"Only a Super Admin can assign or change the Super Admin role.",
					});
				}
			}

			try {
				await UserManagement.changeUserRoleAndScope(
					input.userId,
					input.roleName as Role,
					input.branchId,
					input.warehouseId,
					ctx.user.id,
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
				newStatus: z.enum([
					"ACTIVE",
					"INACTIVE",
					"LOCKED",
					"PENDING",
					"SUSPENDED",
				]),
				reason: z.string().min(5, "Reason for status change must be provided."),
			}),
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
					message:
						"Only a Super Admin can modify another Super Admin's status.",
				});
			}

			try {
				await UserManagement.updateUserStatus(
					input.userId,
					input.newStatus as UserStatus,
					input.reason,
					ctx.user.id,
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
				newPassword: z
					.string()
					.min(8, "Password must be at least 8 characters."),
				forcePasswordChange: z.boolean().default(true),
			}),
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
					message:
						"Only a Super Admin can reset credentials for a Super Admin account.",
				});
			}

			try {
				await UserManagement.updateUserCredentials(
					input.userId,
					input.newPassword,
					input.forcePasswordChange,
					ctx.user.id,
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
				reason: z
					.string()
					.min(5, "Reason for session revocation must be provided."),
			}),
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
					message:
						"Only a Super Admin can revoke sessions for a Super Admin account.",
				});
			}

			try {
				await UserManagement.revokeUserSessions(
					input.userId,
					input.reason,
					ctx.user.id,
				);

				return { success: true };
			} catch (error: any) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: error.message || "Failed to revoke sessions.",
				});
			}
		}),

	// ── Delete User Account ──────────────────────────────────────────────────
	delete: roleProcedure(["super_admin"])
		.input(z.object({ userId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			if (input.userId === ctx.user.id) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "You cannot delete your own active account.",
				});
			}

			try {
				await UserManagement.deleteUser(input.userId, ctx.user.id);
				return { success: true };
			} catch (error: any) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: error.message || "Failed to delete user.",
				});
			}
		}),

	// ── Backfill Staff & HRMS Employee Profiles for Unlinked Accounts ───────
	ensureProfiles: roleProcedure(["admin", "super_admin", "manager"]).mutation(
		async ({ ctx }) => {
			try {
				const { employees } = await import("@evaluna/db/schema/hrms");
				const allUsers = await ctx.db.query.user.findMany();
				let fixedCount = 0;

				for (const u of allUsers) {
					if (!u.email) continue;

					try {
						// 1. Ensure staff row exists
						let [staffRow] = await ctx.db
							.select()
							.from(staff)
							.where(eq(staff.email, u.email))
							.limit(1);

						if (!staffRow) {
							const [newStaff] = await ctx.db
								.insert(staff)
								.values({
									name: u.name || u.email.split("@")[0].toUpperCase(),
									staff_code: `STAFF-${u.id.slice(0, 6).toUpperCase()}`,
									email: u.email,
									branch_id: u.branch_id || 1,
									role: (u as any).role || "staff",
									department: "General",
									join_date: new Date(),
									salary: "0.00",
								})
								.onConflictDoNothing()
								.returning();
							if (newStaff) {
								staffRow = newStaff;
								fixedCount++;
							} else {
								const [existing] = await ctx.db
									.select()
									.from(staff)
									.where(eq(staff.email, u.email))
									.limit(1);
								staffRow = existing;
							}
						}

						if (staffRow && u.staff_id !== staffRow.id) {
							await ctx.db
								.update(user)
								.set({ staff_id: staffRow.id } as any)
								.where(eq(user.id, u.id));
						}

						// 2. Ensure HRMS employees row exists
						const [empRow] = await ctx.db
							.select()
							.from(employees)
							.where(eq(employees.email, u.email))
							.limit(1);

						if (!empRow) {
							const nameParts = (u.name || u.email.split("@")[0])
								.trim()
								.split(/\s+/);
							const firstName = nameParts[0] || "User";
							const lastName = nameParts.slice(1).join(" ") || "Employee";

							await ctx.db
								.insert(employees)
								.values({
									employeeCode: `EMP-${u.id.slice(0, 6).toUpperCase()}`,
									firstName,
									lastName,
									email: u.email,
									hireDate: new Date().toISOString().split("T")[0] as string,
									status: "active",
									userUid: u.id,
								})
								.onConflictDoNothing();
							fixedCount++;
						}
					} catch (userError) {
						console.error(`Failed backfill for user ${u.email}:`, userError);
					}
				}

				return { success: true, fixedCount };
			} catch (err: any) {
				console.error("ensureProfiles Mutation Error:", err);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: err?.message || "Failed to synchronize profiles.",
				});
			}
		},
	),

	// ── Get Logged-In User Profile ─────────────────────────────────────────────
	getMyProfile: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.user.id;
		const [u] = await ctx.db
			.select()
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		if (!u) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "User profile not found.",
			});
		}

		let phone = "";
		if (u.staff_id) {
			const [s] = await ctx.db
				.select()
				.from(staff)
				.where(eq(staff.id, u.staff_id))
				.limit(1);
			if (s?.phone) phone = s.phone;
		} else if (u.email) {
			const [s] = await ctx.db
				.select()
				.from(staff)
				.where(eq(staff.email, u.email))
				.limit(1);
			if (s?.phone) phone = s.phone;
		}

		return {
			id: u.id,
			name: u.name,
			email: u.email,
			phone: phone,
			role: (ctx.user as any).role || "staff",
			status: u.status,
		};
	}),

	// ── Update Logged-In User Profile ──────────────────────────────────────────
	updateMyProfile: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1, "Full Name is required."),
				email: z.string().email("Invalid email address."),
				phone: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.user.id;

			// Check email uniqueness if email is changed
			if (input.email !== ctx.user.email) {
				const existing = await ctx.db
					.select()
					.from(user)
					.where(eq(user.email, input.email))
					.limit(1);
				if (existing.length > 0 && existing[0].id !== userId) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "An account with this email address already exists.",
					});
				}
			}

			// Update user table (name, email)
			await ctx.db
				.update(user)
				.set({
					name: input.name,
					email: input.email,
					updatedAt: new Date(),
				})
				.where(eq(user.id, userId));

			// Update associated staff table record
			const [userRecord] = await ctx.db
				.select()
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);

			const staffId = userRecord?.staff_id;

			if (staffId) {
				await ctx.db
					.update(staff)
					.set({
						name: input.name,
						email: input.email,
						...(input.phone !== undefined ? { phone: input.phone } : {}),
						updated_at: new Date(),
					})
					.where(eq(staff.id, staffId));
			} else if (ctx.user.email) {
				await ctx.db
					.update(staff)
					.set({
						name: input.name,
						email: input.email,
						...(input.phone !== undefined ? { phone: input.phone } : {}),
						updated_at: new Date(),
					})
					.where(eq(staff.email, ctx.user.email));
			}

			return { success: true };
		}),
});
