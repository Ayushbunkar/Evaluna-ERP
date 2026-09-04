// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { eq, and } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { buildDDL } from "./helpers";

// In-memory PGLite database for testing
const pg = new PGlite();
const db = drizzle({ client: pg, schema });

// Mock both @/lib/db and packages/db/src/db to use our test in-memory PGLite instance
mock.module("@/lib/db", () => ({ db, pglite: pg }));
mock.module("../../../../../../../packages/db/src/db", () => ({ db }));

// Import the actual TRPC router and caller factory
const { usersRouter } = await import("../users");
const { createCallerFactory } = await import("../../init");

// DDL for all tables required for user and role management testing
const URCAM_TABLES = [
	schema.branches,
	schema.staff,
	schema.user,
	schema.account,
	schema.session,
	schema.roles,
	schema.userRoles,
	schema.securityAuditLog,
];

const URCAM_SCHEMA_DDL = buildDDL(URCAM_TABLES, false);

beforeAll(async () => {
	// Initialize in-memory database schema
	await pg.exec(URCAM_SCHEMA_DDL);

	// Insert default branches
	await db.insert(schema.branches).values([
		{ id: 1, name: "Bhopal Branch", city: "Bhopal" },
		{ id: 2, name: "Indore Branch", city: "Indore" },
	]);

	// Seed standard application roles
	await db.insert(schema.roles).values([
		{ id: 1, name: "super_admin", description: "Super Admin", permissions: {} },
		{ id: 2, name: "admin", description: "Admin", permissions: {} },
		{ id: 3, name: "manager", description: "Manager", permissions: {} },
		{ id: 4, name: "putter", description: "Putter", permissions: {} },
		{ id: 5, name: "picker", description: "Picker", permissions: {} },
		{ id: 6, name: "finance", description: "Finance", permissions: {} },
	]);
});

afterAll(async () => {
	await pg.close();
});

// Helper to create callers with specific contexts
const createCaller = (userId: string, role: string, isSuperadmin = false) => {
	return createCallerFactory(usersRouter)({
		user: {
			id: userId,
			name: "Actor User",
			email: `${userId}@test.com`,
			role: role,
			branchId: 1,
			isSuperadmin: isSuperadmin,
			isActive: true,
			permissions: [],
			primaryRole: { name: role, dashboardRoute: "/admin", permissions: [] },
			roles: [{ name: role, dashboardRoute: "/admin", permissions: [] }],
			forcePasswordChange: false,
		},
		db,
	});
};

describe("User, Role, Credential, and Access Management (URCAM) System", () => {
	// Let's create actors
	const superAdminCaller = createCaller("sa1", "super_admin", true);
	const adminCaller = createCaller("ad1", "admin", false);
	const managerCaller = createCaller("mg1", "manager", false);

	describe("Requirement 2 & 13 & 15: Create User Account & Link Employee Record", () => {
		it("Super Admin creates a Putter user account successfully (transactional, duplicates prevented)", async () => {
			const result = await superAdminCaller.create({
				fullName: "Rahul Sharma",
				employeeId: "EMP-204",
				email: "rahul@example.com",
				roleName: "putter",
				branchId: 1,
				warehouseId: 10,
				initialPassword: "secure_password_123",
				forcePasswordChange: true,
			});

			expect(result.success).toBe(true);
			expect(result.userId).toBeString();
			expect(result.staffId).toBeInteger();
			expect(result.role).toBe("putter");

			// Verify Employee (Staff) record links correctly
			const [linkedStaff] = await db
				.select()
				.from(schema.staff)
				.where(eq(schema.staff.id, result.staffId));
			expect(linkedStaff).toBeDefined();
			expect(linkedStaff.name).toBe("Rahul Sharma");
			expect(linkedStaff.staff_code).toBe("EMP-204");
			expect(linkedStaff.email).toBe("rahul@example.com");

			// Verify User Auth record exists
			const [createdUser] = await db
				.select()
				.from(schema.user)
				.where(eq(schema.user.id, result.userId));
			expect(createdUser).toBeDefined();
			expect(createdUser.staff_id).toBe(result.staffId);
			expect(createdUser.branch_id).toBe(1);
			expect(createdUser.warehouse_id).toBe(10);
			expect(createdUser.force_password_change).toBe(true);

			// Verify User Role maps correctly
			const [userRole] = await db
				.select()
				.from(schema.userRoles)
				.where(eq(schema.userRoles.user_id, result.userId));
			expect(userRole).toBeDefined();
			expect(userRole.role_id).toBe(4); // Putter role ID is 4

			// Verify secure password hash exists (not plaintext)
			const [userCreds] = await db
				.select()
				.from(schema.account)
				.where(eq(schema.account.userId, result.userId));
			expect(userCreds).toBeDefined();
			expect(userCreds.password).toBeString();
			expect(userCreds.password).not.toBe("secure_password_123"); // Hashed!

			// Verify Audit Log entry is created
			const [auditLog] = await db
				.select()
				.from(schema.securityAuditLog)
				.where(eq(schema.securityAuditLog.target_user_id, result.userId));
			expect(auditLog).toBeDefined();
			expect(auditLog.action).toBe("USER_CREATED");
			expect(auditLog.actor_id).toBe("sa1");
		});

		it("Rejects duplicate employee ID and duplicate email", async () => {
			// Duplicate employee ID
			await expect(
				superAdminCaller.create({
					fullName: "Duplicate ID Employee",
					employeeId: "EMP-204", // Already used
					email: "other@example.com",
					roleName: "picker",
					branchId: 1,
					forcePasswordChange: true,
				})
			).rejects.toThrow(/Duplicate employee ID/);

			// Duplicate email
			await expect(
				superAdminCaller.create({
					fullName: "Duplicate Email Employee",
					employeeId: "EMP-999",
					email: "rahul@example.com", // Already used
					roleName: "picker",
					branchId: 1,
					forcePasswordChange: true,
				})
			).rejects.toThrow(/Duplicate email/);
		});
	});

	describe("Requirement 4 & 5: Role to Canonical Dashboard Mapping & Verification", () => {
		const { UserManagement } = require("@evaluna/db");

		it("Correctly resolves dashboard routes for diverse roles", async () => {
			const res = await superAdminCaller.create({
				fullName: "Dashboard Tester Putter",
				employeeId: "EMP-DS1",
				email: "ds1@example.com",
				roleName: "putter",
				branchId: 1,
				forcePasswordChange: false,
			});
			const putterProfile = await UserManagement.getSecurityProfileByUserId(res.userId);
			expect(putterProfile).toBeDefined();
			expect(putterProfile.canonicalDashboard).toBe("/dashboard/warehouse/put-away");
		});
	});

	describe("Requirement 17: Privilege Escalation & Access Control Prevention", () => {
		it("Manager caller attempts to access list/get -> allowed (with read permissions)", async () => {
			const list = await managerCaller.list();
			expect(list.users).toBeArray();
		});

		it("Manager caller attempts to execute create -> throws FORBIDDEN error", async () => {
			await expect(
				managerCaller.create({
					fullName: "Privilege Escalator",
					employeeId: "EMP-333",
					email: "escalate@example.com",
					roleName: "super_admin",
					branchId: 1,
					forcePasswordChange: true,
				})
			).rejects.toThrow(); // Manager has no write permissions in roleProcedure list
		});

		it("Admin caller (non-superadmin) attempts to create a Super Admin account -> throws FORBIDDEN error", async () => {
			await expect(
				adminCaller.create({
					fullName: "Fake Super Admin",
					employeeId: "EMP-444",
					email: "fake_sa@example.com",
					roleName: "super_admin",
					branchId: 1,
					forcePasswordChange: true,
				})
			).rejects.toThrow(/Only a Super Admin can create/);
		});
	});

	describe("Requirement 7 & 18: Account Status Enforcement, Sessions Revocation & Security Audit", () => {
		let userId: string;

		beforeAll(async () => {
			// Create a user to test status changes, sessions, and audits
			const userRes = await superAdminCaller.create({
				fullName: "Lockable User",
				employeeId: "EMP-555",
				email: "lock@example.com",
				roleName: "picker",
				branchId: 1,
				initialPassword: "temporary_password",
				forcePasswordChange: true,
			});
			userId = userRes.userId;

			// Insert some active sessions for this user
			await db.insert(schema.session).values([
				{ id: "sess_1", userId: userId, expiresAt: new Date(Date.now() + 10000000), token: "tok1", updatedAt: new Date() },
				{ id: "sess_2", userId: userId, expiresAt: new Date(Date.now() + 10000000), token: "tok2", updatedAt: new Date() },
			]);
		});

		it("Single User details view retrieves profile, active sessions, and recent security logs", async () => {
			const details = await superAdminCaller.get({ userId });
			expect(details.profile).toBeDefined();
			expect(details.profile.name).toBe("Lockable User");
			expect(details.sessions.length).toBe(2);
			expect(details.auditLogs.some((l) => l.action === "USER_CREATED")).toBe(true);
		});

		it("Super Admin deactivates account -> status is INACTIVE, active sessions are deleted, status audited", async () => {
			const res = await superAdminCaller.updateStatus({
				userId,
				newStatus: "INACTIVE",
				reason: "Terminated contract.",
			});

			expect(res.success).toBe(true);

			// Verify status updated in DB
			const [userRow] = await db
				.select()
				.from(schema.user)
				.where(eq(schema.user.id, userId));
			expect(userRow.status).toBe("INACTIVE");

			// Verify active sessions revoked (cascade delete or manual)
			const sessions = await db
				.select()
				.from(schema.session)
				.where(eq(schema.session.userId, userId));
			expect(sessions.length).toBe(0);

			// Verify audit log has deactivate action
			const audits = await db
				.select()
				.from(schema.securityAuditLog)
				.where(and(
					eq(schema.securityAuditLog.target_user_id, userId),
					eq(schema.securityAuditLog.action, "USER_STATUS_CHANGE_INACTIVE")
				));
			expect(audits.length).toBe(1);
			expect(audits[0].reason).toBe("Terminated contract.");
		});
	});

	describe("Requirement 6: Credential Management & Hashing", () => {
		let userId: string;

		beforeAll(async () => {
			const res = await superAdminCaller.create({
				fullName: "Credential User",
				employeeId: "EMP-666",
				email: "creds@example.com",
				roleName: "finance",
				branchId: 1,
				initialPassword: "initial_pass_1",
				forcePasswordChange: true,
			});
			userId = res.userId;
		});

		it("Super Admin resets password -> credentials hashed, old password invalidated, action audited", async () => {
			const [oldCreds] = await db
				.select()
				.from(schema.account)
				.where(eq(schema.account.userId, userId));
			const oldHash = oldCreds.password;

			// Perform reset
			const res = await superAdminCaller.resetCredentials({
				userId,
				newPassword: "super_new_password_999",
				forcePasswordChange: true,
			});

			expect(res.success).toBe(true);

			// Verify credentials changed and are hashed
			const [newCreds] = await db
				.select()
				.from(schema.account)
				.where(eq(schema.account.userId, userId));
			expect(newCreds.password).not.toBe("super_new_password_999");
			expect(newCreds.password).not.toBe(oldHash);

			// Verify password audit log
			const audits = await db
				.select()
				.from(schema.securityAuditLog)
				.where(and(
					eq(schema.securityAuditLog.target_user_id, userId),
					eq(schema.securityAuditLog.action, "PASSWORD_RESET")
				));
			expect(audits.length).toBe(1);
		});
	});

	describe("Requirement 14: Dynamic Role & Scope Changing", () => {
		let userId: string;

		beforeAll(async () => {
			const res = await superAdminCaller.create({
				fullName: "Changing Role User",
				employeeId: "EMP-777",
				email: "changerole@example.com",
				roleName: "putter",
				branchId: 1,
				forcePasswordChange: false,
			});
			userId = res.userId;

			// Add active session
			await db.insert(schema.session).values({
				id: "sess_changerole",
				userId,
				expiresAt: new Date(Date.now() + 1000000),
				token: "tok_changerole",
				updatedAt: new Date(),
			});
		});

		it("Super Admin changes user role Putter -> Manager (scope changes, active sessions revoked, role audited)", async () => {
			const res = await superAdminCaller.changeRoleAndScope({
				userId,
				roleName: "manager",
				branchId: 2,
				warehouseId: 44,
			});

			expect(res.success).toBe(true);

			// Verify role changed in userRoles mapping
			const [userRoleRow] = await db
				.select()
				.from(schema.userRoles)
				.where(eq(schema.userRoles.user_id, userId));
			expect(userRoleRow.role_id).toBe(3); // Manager role ID is 3

			// Verify scope updated in User Auth record
			const [userRow] = await db
				.select()
				.from(schema.user)
				.where(eq(schema.user.id, userId));
			expect(userRow.branch_id).toBe(2);
			expect(userRow.warehouse_id).toBe(44);

			// Verify Employee record legacy role field updated
			const [staffRow] = await db
				.select()
				.from(schema.staff)
				.where(eq(schema.staff.id, userRow.staff_id));
			expect(staffRow.role).toBe("manager");

			// Verify sessions revoked
			const sessions = await db
				.select()
				.from(schema.session)
				.where(eq(schema.session.userId, userId));
			expect(sessions.length).toBe(0);

			// Verify audit log
			const audits = await db
				.select()
				.from(schema.securityAuditLog)
				.where(and(
					eq(schema.securityAuditLog.target_user_id, userId),
					eq(schema.securityAuditLog.action, "ROLE_CHANGED")
				));
			expect(audits.length).toBe(1);
			expect(JSON.stringify(audits[0].new_value)).toContain("manager");
		});
	});
});
