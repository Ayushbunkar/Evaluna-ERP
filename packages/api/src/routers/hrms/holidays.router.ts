import { z } from "zod";
import { router, procedure } from "../../trpc";
import { db } from "@evaluna/db";
import { holidays } from "@evaluna/db/src/schema/hrms";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const holidaysRouter = router({
  list: procedure
    .input(
      z.object({
        year: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      const whereClause = [];

      if (input.year) {
        whereClause.push(
          sql`EXTRACT(YEAR FROM ${holidays.date}) = ${input.year}`,
        );
      }

      return await db.query.holidays.findMany({
        where: whereClause.length > 0 ? and(...whereClause) : undefined,
        orderBy: (holidays, { asc }) => [asc(holidays.date)],
      });
    }),

  create: procedure
    .input(
      z.object({
        date: z.date(),
        name: z.string().min(1),
        description: z.string().optional(),
        isRecurring: z.boolean().default(false),
        recurringType: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [holiday] = await db
        .insert(holidays)
        .values(input)
        .returning();

      return holiday;
    }),

  update: procedure
    .input(
      z.object({
        id: z.number(),
        date: z.date().optional(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        isRecurring: z.boolean().optional(),
        recurringType: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [holiday] = await db
        .update(holidays)
        .set(input)
        .where(eq(holidays.id, input.id))
        .returning();

      if (!holiday) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Holiday not found",
        });
      }

      return holiday;
    }),

  delete: procedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const [holiday] = await db
        .delete(holidays)
        .where(eq(holidays.id, input))
        .returning();

      if (!holiday) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Holiday not found",
        });
      }

      return holiday;
    }),

  checkHoliday: procedure
    .input(
      z.object({
        date: z.date(),
      }),
    )
    .query(async ({ input }) => {
      const dateStr = input.date.toISOString().split("T")[0];

      return await db.query.holidays.findFirst({
        where: eq(holidays.date, dateStr),
      });
    }),
});