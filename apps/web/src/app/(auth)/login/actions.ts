"use server";

import { UserManagement } from "@evaluna/db";
// DB tables for auto-profile creation
import {
	roles,
	staff as staffTable,
	userRoles,
	user as userTable,
} from "@evaluna/db/schema";
import { employees as employeesTable } from "@evaluna/db/schema/hrms";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLE_DASHBOARD_MAP, type Role } from "@/lib/permissions";
import { getCanonicalDashboardRoute } from "@/lib/rbac-config";
import { invalidateCachedSession } from "@/lib/session-cache";

export async function login(formData: FormData) {
	const rawEmail = formData.get("email") as string;
	const password = formData.get("password") as string;
	const email = (rawEmail || "").toLowerCase().trim();
	const rememberMe = true;

	const predefinedAccounts: Record<string, string> = {
		"superadmin@evaluna.com": "super_admin",
		"superadmin@evaluna.dev": "super_admin",
		"admin@evaluna.com": "admin",
		"admin@evaluna.dev": "admin",
		"executive@evaluna.dev": "admin",
		"manager@evaluna.com": "manager",
		"manager@evaluna.dev": "manager",
		"finance@evaluna.dev": "finance",
		"finance@evaluna.com": "finance",
		"hr@evaluna.com": "hr",
		"hr@evaluna.dev": "hr",
		"auditor@evaluna.com": "auditor",
		"auditor@evaluna.dev": "auditor",
		"sales@evaluna.com": "sales_person",
		"sales@evaluna.dev": "sales_person",
		"billing@evaluna.com": "biller",
		"billing@evaluna.dev": "biller",
		"picker@evaluna.com": "picker",
		"picker@evaluna.dev": "picker",
		"packer@evaluna.com": "packer",
		"packer@evaluna.dev": "packer",
		"loader@evaluna.com": "loader",
		"loader@evaluna.dev": "loader",
		"checker@evaluna.com": "checker",
		"checker@evaluna.dev": "checker",
		"putter@evaluna.com": "putter",
		"putter@evaluna.dev": "putter",
		"driver@evaluna.com": "driver",
		"driver@evaluna.dev": "driver",
		"sunil.driver@evaluna.com": "driver",
		"vikram.driver@evaluna.com": "driver",
		"amit.driver@evaluna.com": "driver",
		"rajesh.driver@evaluna.com": "driver",
		"marketing@evaluna.com": "marketing",
		"marketing@evaluna.dev": "marketing",
		"procurement@evaluna.com": "procurement",
		"procurement@evaluna.dev": "procurement",
		"warehouse@evaluna.com": "warehouse_supervisor",
		"warehouse@evaluna.dev": "warehouse_supervisor",
		"inventory@evaluna.dev": "warehouse_supervisor",
		"dispatch@evaluna.dev": "packer",
		"verma.berasia@gmail.com": "customer",
		"patel.lalariya@gmail.com": "customer",
		"sharma.runaha@gmail.com": "customer",
		"choudhary.gunga@gmail.com": "customer",
		"bundela.harrakheda@gmail.com": "customer",
		"customer@evaluna.dev": "customer",
	};

	let user:
		| Awaited<ReturnType<typeof auth.api.signInEmail>>["user"]
		| undefined;

	let reqHeaders: Headers | undefined;
	try {
		reqHeaders = await headers();
	} catch {
		reqHeaders = undefined;
	}

	try {
		// Sign out any existing session first to avoid stale session redirect loops
		try {
			await auth.api.signOut({ headers: reqHeaders });
		} catch {
			// Ignore - no active session to sign out
		}

		const resolvedRole =
			predefinedAccounts[email] ||
			(email.includes("superadmin")
				? "super_admin"
				: email.includes("finance")
					? "finance"
					: email.includes("auditor")
						? "auditor"
						: email.includes("sales")
							? "sales_person"
							: email.includes("billing")
								? "biller"
								: email.includes("procurement")
									? "procurement"
									: email.includes("warehouse")
										? "warehouse_supervisor"
										: email.includes("hr")
											? "hr"
											: email.includes("loader")
												? "loader"
												: email.includes("driver")
													? "driver"
													: email.includes("manager")
														? "manager"
														: email.includes("picker")
															? "picker"
															: email.includes("packer")
																? "packer"
																: email.includes("checker")
																	? "checker"
																	: email.includes("putter")
																		? "putter"
																		: email.includes("admin")
																			? "admin"
																			: email.includes("customer")
																				? "customer"
																				: "customer");

		const isEvalunaAccount =
			!!predefinedAccounts[email] ||
			email.endsWith("@evaluna.com") ||
			email.endsWith("@evaluna.dev");

		// Auto-signup logic for test / organization accounts
		if (isEvalunaAccount && password === "Password@123") {
			try {
				// Try to login first
				const res = await auth.api.signInEmail({
					body: { email, password, rememberMe },
					headers: reqHeaders,
				});
				user = res.user;
			} catch (err: any) {
				// Check if user already exists before attempting signup
				const [existingUser] = await db
					.select()
					.from(userTable)
					.where(eq(userTable.email, email))
					.limit(1);

				if (!existingUser) {
					const res = await auth.api.signUpEmail({
						body: {
							email,
							password,
							name: (email.split("@")[0] || "USER").toUpperCase(),
						},
						headers: reqHeaders,
					});
					user = res.user;
				} else {
					throw err;
				}
			}

			// Force their role in DB
			await db
				.update(userTable)
				.set({
					role: resolvedRole,
					status: "ACTIVE",
					is_superadmin:
						resolvedRole === "superadmin" || resolvedRole === "super_admin",
				} as any)
				.where(eq(userTable.email, email));

			// Sync with RBAC tables to ensure Next.js middleware and auth-guard resolve the role successfully
			if (user) {
				const assignedRole =
					resolvedRole === "superadmin" ? "super_admin" : resolvedRole;

				// 1. Find or create the role record
				let [roleRecord] = await db
					.select()
					.from(roles)
					.where(eq(roles.name, assignedRole))
					.limit(1);

				if (!roleRecord) {
					const [newRole] = await db
						.insert(roles)
						.values({
							name: assignedRole,
							description: `${assignedRole.toUpperCase()} Role`,
							permissions: {},
						})
						.returning();
					roleRecord = newRole;
				}

				// 2. Assign or update role for user in user_roles table
				const [existingUserRole] = await db
					.select()
					.from(userRoles)
					.where(eq(userRoles.user_id, user.id))
					.limit(1);

				if (!existingUserRole) {
					await db.insert(userRoles).values({
						user_id: user.id,
						role_id: roleRecord.id,
					});
				} else if (existingUserRole.role_id !== roleRecord.id) {
					await db
						.update(userRoles)
						.set({ role_id: roleRecord.id })
						.where(eq(userRoles.user_id, user.id));
				}

				// 3. Ensure staff record exists and user.staff_id is linked
				let [staffRecord] = await db
					.select()
					.from(staffTable)
					.where(eq(staffTable.email, email))
					.limit(1);

				if (!staffRecord) {
					const [newStaff] = await db
						.insert(staffTable)
						.values({
							name: user.name || email.split("@")[0].toUpperCase(),
							staff_code: `STAFF-${user.id.slice(0, 6).toUpperCase()}`,
							email: email,
							branch_id: 1,
							role: assignedRole,
							department: assignedRole === "finance" ? "Finance" : "General",
							join_date: new Date(),
							salary: "0.00",
						})
						.returning();
					staffRecord = newStaff;
				}

				if (staffRecord) {
					await db
						.update(userTable)
						.set({ staff_id: staffRecord.id } as any)
						.where(eq(userTable.id, user.id));
				}

				// 4. Ensure HRMS employees record exists (used by resolveEmployeeId for attendance)
				const [empRecord] = await db
					.select()
					.from(employeesTable)
					.where(eq(employeesTable.email, email))
					.limit(1);

				if (!empRecord) {
					const nameParts = (user.name || email.split("@")[0])
						.trim()
						.split(/\s+/);
					const firstName = nameParts[0] || "User";
					const lastName = nameParts.slice(1).join(" ") || "Employee";
					await db
						.insert(employeesTable)
						.values({
							employeeCode: `EMP-${user.id.slice(0, 6).toUpperCase()}`,
							firstName,
							lastName,
							email,
							hireDate: new Date().toISOString().split("T")[0] as string,
							status: "active",
							userUid: user.id,
						})
						.onConflictDoNothing();
				}
			}
		} else {
			// Normal login for regular users
			const res = await auth.api.signInEmail({
				body: { email, password, rememberMe },
				headers: reqHeaders,
			});
			user = res.user;
		}
	} catch (err: any) {
		console.error("Login Server Action Error:", err);
		const msg = err.body?.message || "invalid-credentials";
		if (msg.includes("suspended")) {
			return { success: false, error: "suspended" };
		}
		if (msg.includes("locked")) {
			return { success: false, error: "locked" };
		}
		return { success: false, error: "invalid-credentials" };
	}

	if (!user) {
		return { success: false, error: "invalid-credentials" };
	}

	// Superadmins are globally scoped and get their own dashboard
	if (
		user?.is_superadmin ||
		predefinedAccounts[email] === "superadmin" ||
		predefinedAccounts[email] === "super_admin" ||
		(user as any)?.role === "super_admin" ||
		(user as any)?.role === "superadmin"
	) {
		return { success: true, redirectUrl: "/superadmin" };
	}

	// Fetch role directly from DB security profile to bypass session caching issues
	const profile = await UserManagement.getSecurityProfileByUserId(user.id);
	let role = predefinedAccounts[email] || profile?.role || (user as any)?.role || "customer";

	const destination = getCanonicalDashboardRoute(role);
	try {
		revalidatePath(destination, "layout");
	} catch {}
	return { success: true, redirectUrl: destination };
}

export async function logout() {
	try {
		const cookieStore = await cookies();
		const token =
			cookieStore.get("evaluna.session_token")?.value ||
			cookieStore.get("__Secure-evaluna.session_token")?.value ||
			cookieStore.get("better-auth.session_token")?.value ||
			cookieStore.get("__Secure-better-auth.session_token")?.value;

		if (token) {
			invalidateCachedSession(token);
		}
	} catch (err) {
		console.error("Failed to invalidate cached session on logout:", err);
	}

	try {
		await auth.api.signOut({
			headers: await headers(),
		});
	} catch {}

	try {
		revalidatePath("/", "layout");
	} catch {}
	redirect("/");
}
