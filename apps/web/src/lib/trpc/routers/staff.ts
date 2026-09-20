import { staff, user } from "@evaluna/db/schema";
import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../init";

export const staffRouter = router({
	list: protectedProcedure
		.input(
			z
				.object({
					branch_id: z.number().optional(),
					role: z.string().optional(),
					status: z.string().optional(),
					search: z.string().optional(),
					limit: z.number().min(1).max(100).default(50),
					page: z.number().min(1).default(1),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const branchId = input?.branch_id ?? ctx.user.branchId;
			const limit = input?.limit ?? 50;
			const page = input?.page ?? 1;
			const offset = (page - 1) * limit;

			const conds = [];
			if (branchId) {
				conds.push(eq(staff.branch_id, branchId));
			}
			if (input?.role) {
				conds.push(eq(staff.role, input.role));
			}
			if (input?.status) {
				conds.push(eq(staff.status, input.status));
			}
			if (input?.search) {
				const q = `%${input.search}%`;
				conds.push(
					sql`(${staff.name} ILIKE ${q} OR ${staff.email} ILIKE ${q} OR ${staff.staff_code} ILIKE ${q})`,
				);
			}

			const whereClause = conds.length > 0 ? and(...conds) : undefined;

			return ctx.db
				.select({
					id: staff.id,
					staff_code: staff.staff_code,
					name: staff.name,
					email: staff.email,
					phone: staff.phone,
					role: staff.role,
					department: staff.department,
					join_date: staff.join_date,
					status: staff.status,
					branch_id: staff.branch_id,
					created_at: staff.created_at,
				})
				.from(staff)
				.where(whereClause)
				.orderBy(asc(staff.id))
				.limit(limit)
				.offset(offset);
		}),

	me: protectedProcedure.query(async ({ ctx }) => {
		const result = await ctx.db
			.select()
			.from(staff)
			.where(eq(staff.email, ctx.user.email));
		return result[0] ?? null;
	}),

	getById: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const result = await ctx.db
				.select()
				.from(staff)
				.where(eq(staff.id, input.id));
			return result[0] ?? null;
		}),

	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				email: z.string().email(),
				phone: z.string().optional(),
				address: z.string().optional(),
				role: z.enum([
					"superadmin",
					"manager",
					"cashier",
					"inventory",
					"auditor",
				]),
				department: z.string().optional(),
				join_date: z.string(), // ISO string
				salary: z.number().min(0),
				monthly_sales_target: z.number().min(0).optional(),
				branch_id: z.number().optional(),
				pf_number: z.string().optional(),
				pan: z.string().optional(),
				aadhaar: z.string().optional(),
				bank_account: z.string().optional(),
				bank_name: z.string().optional(),
				ifsc: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffCode = `EMP-${Math.floor(100000 + Math.random() * 900000)}`;
			const [created] = await ctx.db
				.insert(staff)
				.values({
					...input,
					staff_code: staffCode,
					join_date: new Date(input.join_date),
					salary: input.salary.toString(),
					monthly_sales_target: input.monthly_sales_target?.toString() ?? "0",
					branch_id: input.branch_id ?? ctx.user.branchId,
					status: "active",
				})
				.returning();
			return created;
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				name: z.string().min(1).optional(),
				phone: z.string().optional(),
				address: z.string().optional(),
				role: z
					.enum(["superadmin", "manager", "cashier", "inventory", "auditor"])
					.optional(),
				department: z.string().optional(),
				salary: z.number().min(0).optional(),
				monthly_sales_target: z.number().min(0).optional(),
				branch_id: z.number().nullable().optional(),
				status: z.enum(["active", "inactive"]).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, salary, monthly_sales_target, ...rest } = input;
			const [updated] = await ctx.db
				.update(staff)
				.set({
					...rest,
					...(salary !== undefined ? { salary: salary.toString() } : {}),
					...(monthly_sales_target !== undefined
						? { monthly_sales_target: monthly_sales_target.toString() }
						: {}),
				})
				.where(eq(staff.id, id))
				.returning();

			// Cascadingly sync with Better-Auth user table to propagate name changes globally
			if (updated && updated.email && updated.name) {
				await ctx.db
					.update(user)
					.set({ name: updated.name })
					.where(eq(user.email, updated.email));
			}

			return updated;
		}),

	updateMyProfile: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1).optional(),
				email: z.string().email().optional(),
				phone: z.string().optional(),
				address: z.string().optional(),
				currentPassword: z.string().optional(),
				newPassword: z.string().min(6).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const callerEmail = ctx.user.email;
			if (!callerEmail) throw new Error("Unauthorized");

			// Fetch staff record
			const [staffRow] = await ctx.db
				.select()
				.from(staff)
				.where(eq(staff.email, callerEmail));

			// 1. If updating password, verify current password first
			if (input.newPassword) {
				if (!input.currentPassword) {
					throw new Error("Current password is required to set a new password.");
				}

				const { account } = await import("@evaluna/db/schema");
				const { comparePassword, hashPassword } = await import("@evaluna/db");

				const [userAccount] = await ctx.db
					.select()
					.from(account)
					.where(eq(account.userId, ctx.user.id));

				if (userAccount && userAccount.password) {
					const isMatch = await comparePassword(input.currentPassword, userAccount.password);
					if (!isMatch) {
						throw new Error("Incorrect current password.");
					}

					const newHash = await hashPassword(input.newPassword);
					await ctx.db
						.update(account)
						.set({ password: newHash })
						.where(eq(account.id, userAccount.id));
				}
			}

			// 2. Update staff row
			const updatesToStaff: any = {};
			if (input.name) updatesToStaff.name = input.name;
			if (input.email) updatesToStaff.email = input.email;
			if (input.phone !== undefined) updatesToStaff.phone = input.phone;
			if (input.address !== undefined) updatesToStaff.address = input.address;

			if (staffRow && Object.keys(updatesToStaff).length > 0) {
				await ctx.db
					.update(staff)
					.set(updatesToStaff)
					.where(eq(staff.id, staffRow.id));
			}

			// 3. Update Better-Auth user record
			const updatesToUser: any = {};
			if (input.name) updatesToUser.name = input.name;
			if (input.email) updatesToUser.email = input.email;

			if (Object.keys(updatesToUser).length > 0) {
				await ctx.db
					.update(user)
					.set(updatesToUser)
					.where(eq(user.id, ctx.user.id));
			}

			return { success: true };
		}),

	deactivate: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const [updated] = await ctx.db
				.update(staff)
				.set({ status: "inactive" })
				.where(eq(staff.id, input.id))
				.returning();
			return updated;
		}),

	count: protectedProcedure.query(async ({ ctx }) => {
		const all = await ctx.db.select({ id: staff.id }).from(staff);
		return all.length;
	}),

	lookupByCode: protectedProcedure
		.input(z.object({ code: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const result = await ctx.db
				.select()
				.from(staff)
				.where(eq(staff.staff_code, input.code));

			if (result.length === 0) {
				throw new Error("Invalid Staff Code");
			}
			return result[0];
		}),

	regenerateCode: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const newCode = `EMP-${Math.floor(100000 + Math.random() * 900000)}`;
			const [updated] = await ctx.db
				.update(staff)
				.set({ staff_code: newCode })
				.where(eq(staff.id, input.id))
				.returning();
			return updated;
		}),
});
