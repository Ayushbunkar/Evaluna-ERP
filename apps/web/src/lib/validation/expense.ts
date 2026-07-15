import { z } from 'zod';

export const expenseSchema = z.object({
  id: z.string().optional(),
  description: z.string(),
  amount: z.number(),
  date: z.date(),
  category: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Expense = z.infer<typeof expenseSchema>;
