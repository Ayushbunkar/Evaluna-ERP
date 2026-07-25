'use client';

import { protectedProcedure, router } from '../init';
import { z } from 'zod';
import { db } from '@/lib/db';
import { expenses } from '@evaluna/db/schema';
import { count, eq } from 'drizzle-orm';
import { expenseSchema } from '@/lib/validation/expense';

export const expensesRouter = router({
  create: protectedProcedure
    .input(expenseSchema)
    .mutation(async ({ input, ctx }) => {
      const newExpense = await db
        .insert(expenses)
        .values({
          ...input,
          user_uid: ctx.user.id,
        })
        .returning();

      return newExpense[0];
    }),
  count: protectedProcedure.query(async () => {
    const [result] = await db.select({ count: count() }).from(expenses);
    return result.count;
  }),
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.number().nullish(),
      }),
    )
    .query(async ({ input }) => {
      const limit = input.limit ?? 10;
      const cursor = input.cursor ?? null;

      const items = await db.query.expenses.findMany({
        limit: limit + 1,
        offset: cursor ? cursor * limit : 0,
      });

      let nextCursor: typeof cursor | undefined = undefined;
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
    .input(expenseSchema.extend({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...expenseData } = input;
      const updatedExpense = await db
        .update(expenses)
        .set({
          ...expenseData,
          user_uid: ctx.user.id,
        })
        .where(eq(expenses.id, parseInt(id)))
        .returning();

      return updatedExpense[0];
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(expenses).where(eq(expenses.id, input.id));
      return { id: input.id };
    }),
});
