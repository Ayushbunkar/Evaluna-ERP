import { z } from "zod";

export const expenseSchema = z.object({
	id: z.union([z.string(), z.number()]).optional(),
	description: z.string().min(1, "Description is required"),
	amount: z.coerce.number().positive("Amount must be greater than zero"),
	date: z.coerce.date().optional(),
	category: z.string().optional(),
	expense_category: z.string().optional(),
	branch_id: z.coerce.number().optional(),
	payment_method_id: z.coerce.number().optional(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

export type Expense = z.infer<typeof expenseSchema>;
