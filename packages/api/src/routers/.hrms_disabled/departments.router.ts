import { z } from "zod";
import { router, procedure } from "../../trpc";
import { db } from "@evaluna/db";
import { departments, employees } from "@evaluna/db/src/schema/hrms";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const departmentsRouter = router({
  list: procedure.query(async () => {
    return await db.query.departments.findMany({
      with: {
        head: true,
      },
      orderBy: (departments, { asc }) => [asc(departments.name)],
    });
  }),

  create: procedure
    .input(
      z.object({
        name: z.string().min(1),
        code: z.string().min(1),
        description: z.string().optional(),
        headId: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [department] = await db
        .insert(departments)
        .values(input)
        .returning();

      return department;
    }),

  update: procedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        code: z.string().min(1).optional(),
        description: z.string().optional(),
        headId: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [department] = await db
        .update(departments)
        .set(input)
        .where(eq(departments.id, input.id))
        .returning();

      if (!department) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Department not found",
        });
      }

      return department;
    }),

  delete: procedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const [department] = await db
        .delete(departments)
        .where(eq(departments.id, input))
        .returning();

      if (!department) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Department not found",
        });
      }

      return department;
    }),

  getEmployees: procedure
    .input(z.number())
    .query(async ({ input }) => {
      return await db.query.employees.findMany({
        where: eq(employees.departmentId, input),
        with: {
          designation: true,
          manager: true,
        },
        orderBy: (employees, { asc }) => [asc(employees.firstName)],
      });
    }),
});