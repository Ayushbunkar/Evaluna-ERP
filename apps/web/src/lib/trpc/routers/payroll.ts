import { z } from "zod";
import { protectedProcedure, router } from "../init";
import { payroll, staff, transactions } from "@evaluna/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const payrollRouter = router({
  list: protectedProcedure
    .input(z.object({ branch_id: z.number().nullable().optional(), month: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const branchId = input.branch_id ?? ctx.user.branch_id;
      const currentMonth = input.month ?? new Date().toISOString().slice(0, 7); // YYYY-MM

      let conditions = [eq(payroll.month, currentMonth)];
      if (branchId) {
        conditions.push(eq(payroll.branch_id, branchId));
      }

      return ctx.db.query.payroll.findMany({
        where: and(...conditions),
        with: {
          staff: true,
          paymentMethod: true,
        },
        orderBy: [desc(payroll.created_at)],
      });
    }),

  generate: protectedProcedure
    .input(z.object({ branch_id: z.number().nullable().optional(), month: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const branchId = input.branch_id ?? ctx.user.branch_id;
      
      let staffConditions = [];
      if (branchId) {
        staffConditions.push(eq(staff.branch_id, branchId));
      }
      staffConditions.push(eq(staff.status, "active"));

      const activeStaff = await ctx.db.query.staff.findMany({
        where: staffConditions.length ? and(...staffConditions) : undefined,
      });

      const generated = [];

      for (const employee of activeStaff) {
        // Check if payroll record already exists
        const existing = await ctx.db.query.payroll.findFirst({
          where: and(
            eq(payroll.staff_id, employee.id),
            eq(payroll.month, input.month)
          )
        });

        if (!existing) {
          const [draft] = await ctx.db.insert(payroll).values({
            staff_id: employee.id,
            branch_id: employee.branch_id,
            month: input.month,
            base_salary: employee.salary,
            net_payable: employee.salary, // initially net = base
            status: "draft",
          }).returning();
          generated.push(draft);
        }
      }

      return { generated: generated.length };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        overtime_pay: z.string().optional(),
        bonus: z.string().optional(),
        deductions: z.string().optional(),
        advance_deduction: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.payroll.findFirst({
        where: eq(payroll.id, input.id)
      });
      if (!existing) throw new Error("Payroll record not found");

      const base = parseFloat(existing.base_salary as string);
      const ot = input.overtime_pay !== undefined ? parseFloat(input.overtime_pay) : parseFloat(existing.overtime_pay as string);
      const bonus = input.bonus !== undefined ? parseFloat(input.bonus) : parseFloat(existing.bonus as string);
      const deductions = input.deductions !== undefined ? parseFloat(input.deductions) : parseFloat(existing.deductions as string);
      const advance = input.advance_deduction !== undefined ? parseFloat(input.advance_deduction) : parseFloat(existing.advance_deduction as string);

      const netPayable = (base + ot + bonus) - (deductions + advance);

      const [updated] = await ctx.db.update(payroll).set({
        ...(input.overtime_pay !== undefined && { overtime_pay: input.overtime_pay }),
        ...(input.bonus !== undefined && { bonus: input.bonus }),
        ...(input.deductions !== undefined && { deductions: input.deductions }),
        ...(input.advance_deduction !== undefined && { advance_deduction: input.advance_deduction }),
        ...(input.notes !== undefined && { notes: input.notes }),
        net_payable: netPayable.toFixed(2),
        updated_at: new Date()
      })
      .where(eq(payroll.id, input.id))
      .returning();

      return updated;
    }),

  approve: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [approved] = await ctx.db.update(payroll)
        .set({ status: "approved", updated_at: new Date() })
        .where(eq(payroll.id, input.id))
        .returning();
      return approved;
    }),

  pay: protectedProcedure
    .input(z.object({ id: z.number(), payment_method_id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const record = await ctx.db.query.payroll.findFirst({
        where: eq(payroll.id, input.id),
        with: { staff: true }
      });
      if (!record) throw new Error("Payroll not found");

      return await ctx.db.transaction(async (tx) => {
        // Mark as paid
        const [paid] = await tx.update(payroll)
          .set({ 
            status: "paid", 
            payment_date: new Date(),
            payment_method_id: input.payment_method_id,
            updated_at: new Date()
          })
          .where(eq(payroll.id, input.id))
          .returning();

        // Deduct from transactions (financial integration)
        await tx.insert(transactions).values({
          amount: record.net_payable,
          type: "out",
          category: "expense",
          reference_type: "payroll",
          reference_id: paid.id.toString(),
          payment_method_id: input.payment_method_id,
          branch_id: record.branch_id,
          user_uid: ctx.user.id, // The user processing the payroll
          status: "success",
          notes: `Salary payment for ${record.staff.name} (${record.month})`
        });

        return paid;
      });
    }),
});
