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
					limit: z.number().min(1).max(200).default(100),
					page: z.number().min(1).default(1),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const branchId = input?.branch_id ?? ctx.user.branchId;
			const limit = input?.limit ?? 100;
			const page = input?.page ?? 1;
			const offset = (page - 1) * limit;

			const conds = [eq(staff.is_deleted, false)];
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
					sql`(${staff.name} ILIKE ${q} OR ${staff.email} ILIKE ${q} OR ${staff.staff_code} ILIKE ${q} OR ${staff.role} ILIKE ${q} OR ${staff.department} ILIKE ${q})`,
				);
			}

			const whereClause = and(...conds);

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
				.orderBy(asc(staff.name))
				.limit(limit)
				.offset(offset);
		}),

	getPickers: protectedProcedure
		.input(
			z
				.object({
					branch_id: z.number().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const branchId = input?.branch_id ?? ctx.user.branchId;
			const conds = [
				eq(staff.is_deleted, false),
				sql`LOWER(${staff.status}) = 'active'`,
				sql`(LOWER(${staff.role}) = 'picker' OR ${staff.role} ILIKE '%picker%' OR ${staff.department} ILIKE '%picking%')`,
				sql`(${staff.email} NOT ILIKE '%@example.com' AND ${staff.email} NOT ILIKE '%@mock.com' AND ${staff.email} NOT ILIKE '%@seed.com' AND ${staff.name} NOT ILIKE 'fake%')`,
			];

			if (branchId) {
				conds.push(eq(staff.branch_id, branchId));
			}

			return ctx.db
				.select({
					id: staff.id,
					staff_code: staff.staff_code,
					name: staff.name,
					email: staff.email,
					phone: staff.phone,
					role: staff.role,
					department: staff.department,
					status: staff.status,
					branch_id: staff.branch_id,
				})
				.from(staff)
				.where(and(...conds))
				.orderBy(asc(staff.name));
		}),

	getPutters: protectedProcedure
		.input(
			z
				.object({
					branch_id: z.number().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const branchId = input?.branch_id ?? ctx.user.branchId;
			const conds = [
				eq(staff.is_deleted, false),
				sql`LOWER(${staff.status}) = 'active'`,
				sql`(LOWER(${staff.role}) = 'putter' OR ${staff.role} ILIKE '%putter%' OR ${staff.department} ILIKE '%put-away%' OR ${staff.department} ILIKE '%inbound%')`,
				sql`(${staff.email} NOT ILIKE '%@example.com' AND ${staff.email} NOT ILIKE '%@mock.com' AND ${staff.email} NOT ILIKE '%@seed.com')`,
			];

			if (branchId) {
				conds.push(eq(staff.branch_id, branchId));
			}

			return ctx.db
				.select({
					id: staff.id,
					staff_code: staff.staff_code,
					name: staff.name,
					email: staff.email,
					phone: staff.phone,
					role: staff.role,
					department: staff.department,
					status: staff.status,
					branch_id: staff.branch_id,
				})
				.from(staff)
				.where(and(...conds))
				.orderBy(asc(staff.name));
		}),

	getPackers: protectedProcedure
		.input(
			z
				.object({
					branch_id: z.number().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const branchId = input?.branch_id ?? ctx.user.branchId;
			const conds = [
				eq(staff.is_deleted, false),
				sql`LOWER(${staff.status}) = 'active'`,
				sql`(LOWER(${staff.role}) = 'packer' OR ${staff.role} ILIKE '%packer%' OR ${staff.department} ILIKE '%packing%')`,
				sql`(${staff.email} NOT ILIKE '%@example.com' AND ${staff.email} NOT ILIKE '%@mock.com' AND ${staff.email} NOT ILIKE '%@seed.com')`,
			];

			if (branchId) {
				conds.push(eq(staff.branch_id, branchId));
			}

			return ctx.db
				.select({
					id: staff.id,
					staff_code: staff.staff_code,
					name: staff.name,
					email: staff.email,
					phone: staff.phone,
					role: staff.role,
					department: staff.department,
					status: staff.status,
					branch_id: staff.branch_id,
				})
				.from(staff)
				.where(and(...conds))
				.orderBy(asc(staff.name));
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
				role: z.string().min(1),
				department: z.string().optional(),
				join_date: z.string(), // ISO string
				salary: z.number().min(0).default(0),
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
					branch_id: input.branch_id ?? ctx.user.branchId ?? 1,
					status: "active",
					is_deleted: false,
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
				role: z.string().optional(),
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
			if (updated?.email && updated.name) {
				await ctx.db
					.update(user)
					.set({ name: updated.name })
					.where(eq(user.email, updated.email));
			}

			return updated;
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const [deleted] = await ctx.db
				.update(staff)
				.set({ is_deleted: true, status: "inactive" })
				.where(eq(staff.id, input.id))
				.returning();
			return { success: true, deleted };
		}),

	cleanAndSeedRealStaff: protectedProcedure.mutation(async ({ ctx }) => {
		const db = ctx.db;
		// 1. Mark fake / mock seed emails and placeholder names as deleted
		await db
			.update(staff)
			.set({ is_deleted: true, status: "inactive" })
			.where(
				sql`(${staff.email} ILIKE '%hotmail.com' OR ${staff.email} ILIKE '%yahoo.com' OR ${staff.email} ILIKE '%example%' OR ${staff.email} ILIKE '%seed%' OR ${staff.email} ILIKE '%mock%' OR ${staff.name} IN ('Albertha Kovacek', 'Angeline Runte', 'Chris Halvorson', 'Ernestine Rolfson', 'Gilberto Mitchell', 'Carol O''Conner', 'ADMIN', 'Customer', 'DRIVERFINAL', 'EXECUTIVE', 'BILLING', 'FINANCE', 'Executive', 'Auditor Desk', 'Pooja Sharma', 'Suresh Kumar', 'Rahul Yadav', 'Vikram Patel', 'Anita Verma', 'Rahul Sharma (Packing)'))`,
			);

		// 2. Real Official Evaluna Depot Team Members
		const realStaffList = [
			{
				name: "Rupesh Sharma",
				email: "rupesh@evaluna.com",
				role: "warehouse_manager",
				department: "Warehouse Administration",
				phone: "+91 98765 43210",
				salary: "45000",
			},
			{
				name: "Kailash Bharati",
				email: "kailash.bharati@evaluna.com",
				role: "picker",
				department: "Outbound Picking",
				phone: "+91 98765 43211",
				salary: "28000",
			},
			{
				name: "Ayush Bunkar",
				email: "ayush.bunkar@evaluna.com",
				role: "manager",
				department: "Depot Operations",
				phone: "+91 98765 43212",
				salary: "50000",
			},
			{
				name: "Narendra Vishwakarma",
				email: "narendravishwakarma378@gmail.com",
				role: "driver",
				department: "Logistics",
				phone: "+91 98765 43213",
				salary: "25000",
			},
			{
				name: "Naitik Sahu",
				email: "naitiksahu6323@gmail.com",
				role: "driver",
				department: "Logistics",
				phone: "+91 98765 43214",
				salary: "25000",
			},
			{
				name: "Anuj “Bana”",
				email: "anujrajput6232@gmail.com",
				role: "staff",
				department: "Operations",
				phone: "+91 98765 43215",
				salary: "26000",
			},
			{
				name: "Rajesh Kumar",
				email: "driver@evaluna.com",
				role: "driver",
				department: "Logistics",
				phone: "+91 98765 43216",
				salary: "25000",
			},
			{
				name: "Manager sahab",
				email: "manager@evaluna.com",
				role: "manager",
				department: "Warehouse",
				phone: "+91 98765 43217",
				salary: "40000",
			},
		];

		for (const st of realStaffList) {
			const [existing] = await db
				.select()
				.from(staff)
				.where(eq(staff.email, st.email))
				.limit(1);

			if (existing) {
				await db
					.update(staff)
					.set({
						name: st.name,
						role: st.role,
						department: st.department,
						is_deleted: false,
						status: "active",
					})
					.where(eq(staff.id, existing.id));
			} else {
				const staffCode = `EMP-${Math.floor(100000 + Math.random() * 900000)}`;
				await db.insert(staff).values({
					staff_code: staffCode,
					name: st.name,
					email: st.email,
					phone: st.phone,
					role: st.role,
					department: st.department,
					salary: st.salary,
					branch_id: ctx.user.branchId ?? 1,
					join_date: new Date(),
					status: "active",
					is_deleted: false,
				});
			}
		}

		return { success: true };
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
					throw new Error(
						"Current password is required to set a new password.",
					);
				}

				const { account } = await import("@evaluna/db/schema");
				const { comparePassword, hashPassword } = await import("@evaluna/db");

				const [userAccount] = await ctx.db
					.select()
					.from(account)
					.where(eq(account.userId, ctx.user.id));

				if (userAccount?.password) {
					const isMatch = await comparePassword(
						input.currentPassword,
						userAccount.password,
					);
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
			const updatesToStaff: Record<string, unknown> = {};
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
			const updatesToUser: Record<string, unknown> = {};
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
		const all = await ctx.db
			.select({ id: staff.id })
			.from(staff)
			.where(eq(staff.is_deleted, false));
		return all.length;
	}),

	lookupByCode: protectedProcedure
		.input(z.object({ code: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const result = await ctx.db
				.select()
				.from(staff)
				.where(
					and(eq(staff.staff_code, input.code), eq(staff.is_deleted, false)),
				);

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
