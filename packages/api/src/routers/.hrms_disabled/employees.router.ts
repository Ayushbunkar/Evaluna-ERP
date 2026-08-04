import { z } from "zod";
import { router, protectedProcedure } from "../../index";
import { db } from "@evaluna/db";
import { employees, departments, designations } from "@evaluna/db/src/schema/hrms";
import { eq, or, ilike, and, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const employeesRouter = router({
  list: protectedProcedure.query(async () => {
    return await db.query.employees.findMany({
      with: {
        department: true,
        designation: true,
        manager: true,
      },
      orderBy: (employees, { asc }) => [asc(employees.employeeCode)],
    });
  }),

  getById: protectedProcedure.input(z.number()).query(async ({ input }) => {
    const result = await db.query.employees.findFirst({
      where: eq(employees.id, input),
      with: {
        department: true,
        designation: true,
        manager: true,
      },
    });

    if (!result) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Employee not found",
      });
    }

    return result;
  }),

  create: protectedProcedure
    .input(
      z.object({
        employeeCode: z.string().min(1),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        address: z.string().optional(),
        hireDate: z.date(),
        status: z.enum(["active", "inactive", "on_leave", "terminated"]).default("active"),
        departmentId: z.number().optional(),
        designationId: z.number().optional(),
        managerId: z.number().optional(),
        userUid: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [employee] = await db
        .insert(employees)
        .values({
          ...input,
          employeeCode: input.employeeCode,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          address: input.address,
          hireDate: input.hireDate,
          status: input.status,
          departmentId: input.departmentId,
          designationId: input.designationId,
          managerId: input.managerId,
          userUid: input.userUid,
        })
        .returning();

      return employee;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        employeeCode: z.string().min(1).optional(),
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        hireDate: z.date().optional(),
        status: z.enum(["active", "inactive", "on_leave", "terminated"]).optional(),
        departmentId: z.number().optional(),
        designationId: z.number().optional(),
        managerId: z.number().optional(),
        userUid: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [employee] = await db
        .update(employees)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(employees.id, input.id))
        .returning();

      if (!employee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Employee not found",
        });
      }

      return employee;
    }),

  delete: protectedProcedure.input(z.number()).mutation(async ({ input }) => {
    const [employee] = await db
      .delete(employees)
      .where(eq(employees.id, input))
      .returning();

    if (!employee) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Employee not found",
      });
    }

    return employee;
  }),

  search: protectedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        departmentId: z.number().optional(),
        status: z.enum(["active", "inactive", "on_leave", "terminated"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ input }) => {
      const whereClause = [];

      if (input.query) {
        whereClause.push(
          or(
            ilike(employees.firstName, `%${input.query}%`),
            ilike(employees.lastName, `%${input.query}%`),
            ilike(employees.email, `%${input.query}%`),
            ilike(employees.employeeCode, `%${input.query}%`),
          ),
        );
      }

      if (input.departmentId) {
        whereClause.push(eq(employees.departmentId, input.departmentId));
      }

      if (input.status) {
        whereClause.push(eq(employees.status, input.status));
      }

      const result = await db.query.employees.findMany({
        where: whereClause.length > 0 ? and(...whereClause) : undefined,
        with: {
          department: true,
          designation: true,
        },
        limit: input.limit,
        offset: input.offset,
        orderBy: (employees, { asc }) => [asc(employees.employeeCode)],
      });

      const total = await db
        .select({ count: count() })
        .from(employees)
        .where(whereClause.length > 0 ? and(...whereClause) : undefined)
        .then((res) => res[0]?.count || 0);

      return {
        items: result,
        total,
        page: input.offset / input.limit + 1,
        pageSize: input.limit,
        totalPages: Math.ceil(total / input.limit),
      };
    }),
});