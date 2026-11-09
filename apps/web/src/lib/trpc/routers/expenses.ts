import { employeeExpenses, expenses, transactions } from "@evaluna/db/schema";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateDocNumber } from "@/lib/finance/service";
import { expenseSchema } from "@/lib/validation/expense";
import { requireStaff } from "./employee-expenses";
import { protectedProcedure, router } from "../init";

export const expensesRouter = router({
	create: protectedProcedure
		.input(expenseSchema)
		.mutation(async ({ input, ctx }) => {
			const category = input.expense_category || input.category || "General";
			const expenseDate = input.date ? new Date(input.date) : new Date();
			const branchId = input.branch_id || ctx.user?.branchId || 1;

			const [newExpense] = await db
				.insert(expenses)
				.values({
					description: input.description,
					amount: input.amount.toFixed(2),
					expense_category: category,
					branch_id: branchId,
					payment_method_id: input.payment_method_id ?? null,
					user_uid: ctx.user.id,
					created_at: expenseDate,
				})
				.returning();

			// Record financial transaction ledger entry (Cash Book)
			try {
				await db.insert(transactions).values({
					branch_id: branchId,
					amount: input.amount.toFixed(2),
					original_amount: input.amount.toFixed(2),
					adjustment_amount: "0",
					user_uid: ctx.user.id,
					type: "out",
					category: "expense",
					reference_type: "expense",
					reference_id: newExpense.id,
					status: "completed",
					reconciliation_status: "pending",
					description: `[Expense: ${category}] ${input.description}`,
					payment_method_id: input.payment_method_id ?? null,
					created_at: expenseDate,
				});
			} catch (txErr) {
				console.warn(
					"[expenses.create] Failed to record transaction ledger:",
					txErr,
				);
			}

			// Synchronize with Employee Expenses claims ledger & category breakdown
			try {
				const me = await requireStaff(ctx.user.email, ctx.user?.name);
				const docNumber = generateDocNumber("EXP");
				await db.insert(employeeExpenses).values({
					branch_id: branchId,
					expense_number: docNumber,
					staff_id: me.id,
					amount: input.amount.toFixed(2),
					custom_category_name: category,
					expense_date: expenseDate,
					description: input.description,
					business_purpose: input.description,
					payment_method: "Cash",
					status: "paid",
					submitted_at: expenseDate,
					reviewed_by: me.id,
					reviewed_at: expenseDate,
					review_notes: "Direct expense logged via Console",
					paid_at: expenseDate,
					created_by: ctx.user.id,
					created_at: expenseDate,
				});
			} catch (empErr) {
				console.warn(
					"[expenses.create] Failed to sync employee_expenses:",
					empErr,
				);
			}

			return newExpense;
		}),

	recordTransportFuelExpense: protectedProcedure
		.input(
			z.object({
				vehicleId: z.coerce.number().optional().nullable(),
				vehicleRegistration: z
					.string()
					.min(1, "Vehicle registration number is required"),
				driverName: z.string().optional().nullable(),
				fuelType: z
					.enum(["Diesel", "Petrol", "CNG", "Electric"])
					.default("Diesel"),
				liters: z.coerce.number().positive("Fuel liters must be positive"),
				ratePerLiter: z.coerce
					.number()
					.positive("Rate per liter must be positive"),
				totalAmount: z.coerce
					.number()
					.positive("Total amount must be positive"),
				odometerReading: z.coerce.number().optional().nullable(),
				fuelStation: z.string().optional().nullable(),
				billNumber: z.string().optional().nullable(),
				notes: z.string().optional().nullable(),
				date: z.string().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const branchId = ctx.user?.branchId || 1;
			const expenseDate = input.date ? new Date(input.date) : new Date();
			const descText = `Transport & Fuel: ${input.vehicleRegistration} | ${input.fuelType} ${input.liters}L @ ₹${input.ratePerLiter}/L${input.driverName ? ` | Driver: ${input.driverName}` : ""}${input.odometerReading ? ` | Odometer: ${input.odometerReading}km` : ""}${input.fuelStation ? ` | Station: ${input.fuelStation}` : ""}${input.billNumber ? ` | Bill: ${input.billNumber}` : ""}${input.notes ? ` (${input.notes})` : ""}`;

			const [newExpense] = await db
				.insert(expenses)
				.values({
					description: descText,
					amount: input.totalAmount.toFixed(2),
					expense_category: "Transport & Fuel",
					branch_id: branchId,
					user_uid: ctx.user.id,
					created_at: expenseDate,
				})
				.returning();

			// Record financial transaction ledger entry (Cash Book)
			try {
				await db.insert(transactions).values({
					branch_id: branchId,
					amount: input.totalAmount.toFixed(2),
					original_amount: input.totalAmount.toFixed(2),
					adjustment_amount: "0",
					user_uid: ctx.user.id,
					type: "out",
					category: "expense",
					reference_type: "expense",
					reference_id: newExpense.id,
					status: "completed",
					reconciliation_status: "pending",
					description: `[Fuel Expense] ${input.vehicleRegistration} - ${input.liters}L ${input.fuelType}`,
					created_at: expenseDate,
				});
			} catch (txErr) {
				console.warn(
					"[recordTransportFuelExpense] transaction log fallback:",
					txErr,
				);
			}

			// Synchronize with Employee Expenses claims ledger & category breakdown
			try {
				const me = await requireStaff(ctx.user.email, ctx.user?.name);
				const docNumber = generateDocNumber("EXP");
				await db.insert(employeeExpenses).values({
					branch_id: branchId,
					expense_number: docNumber,
					staff_id: me.id,
					amount: input.totalAmount.toFixed(2),
					custom_category_name: "Fuel & Logistics",
					expense_date: expenseDate,
					description: descText,
					business_purpose: `Vehicle Fuel: ${input.vehicleRegistration} (${input.liters}L ${input.fuelType})`,
					payment_method: "Cash",
					status: "paid",
					submitted_at: expenseDate,
					reviewed_by: me.id,
					reviewed_at: expenseDate,
					review_notes: "Transport & fuel expense logged via Console",
					paid_at: expenseDate,
					created_by: ctx.user.id,
					created_at: expenseDate,
				});
			} catch (empErr) {
				console.warn(
					"[recordTransportFuelExpense] employee_expenses sync fallback:",
					empErr,
				);
			}

			return {
				success: true,
				expense: newExpense,
			};
		}),

	count: protectedProcedure.query(async () => {
		const [result] = await db.select({ count: count() }).from(expenses);
		return Number(result?.count ?? 0);
	}),

	list: protectedProcedure
		.input(
			z
				.object({
					limit: z.number().min(1).max(500).default(50),
					cursor: z.number().nullish(),
					search: z.string().optional(),
					category: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ input }) => {
			const limit = input?.limit ?? 50;
			const cursor = input?.cursor ?? null;
			const search = input?.search?.trim()?.toLowerCase();
			const category = input?.category;

			const conditions: any[] = [];
			if (category && category !== "all") {
				conditions.push(eq(expenses.expense_category, category));
			}
			if (search) {
				conditions.push(
					or(
						ilike(expenses.description, `%${search}%`),
						ilike(expenses.expense_category, `%${search}%`),
					),
				);
			}

			const items = await db.query.expenses.findMany({
				where: conditions.length > 0 ? and(...conditions) : undefined,
				limit: limit + 1,
				offset: cursor ? cursor * limit : 0,
				orderBy: [desc(expenses.created_at)],
			});

			let nextCursor: typeof cursor | undefined;
			if (items.length > limit) {
				items.pop();
				nextCursor = (cursor ?? 0) + 1;
			}
			return {
				items,
				nextCursor,
			};
		}),

	get: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ input }) => {
			const expense = await db.query.expenses.findFirst({
				where: eq(expenses.id, input.id),
			});
			return expense;
		}),

	update: protectedProcedure
		.input(expenseSchema.extend({ id: z.union([z.string(), z.number()]) }))
		.mutation(async ({ input, ctx }) => {
			const { id, ...expenseData } = input;
			const category =
				expenseData.expense_category || expenseData.category || "General";
			const numericId = typeof id === "number" ? id : Number.parseInt(id, 10);

			const [updatedExpense] = await db
				.update(expenses)
				.set({
					description: expenseData.description,
					amount: expenseData.amount.toFixed(2),
					expense_category: category,
					payment_method_id: expenseData.payment_method_id ?? null,
					user_uid: ctx.user.id,
				})
				.where(eq(expenses.id, numericId))
				.returning();

			return updatedExpense;
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input }) => {
			await db.delete(expenses).where(eq(expenses.id, input.id));
			return { id: input.id };
		}),
});
