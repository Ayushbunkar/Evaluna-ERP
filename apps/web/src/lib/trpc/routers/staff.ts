import { z } from "zod";
import { protectedProcedure, router } from "../init";
import { staff } from "@evaluna/db/schema";
import { eq, and } from "drizzle-orm";

export const staffRouter = router({
  list: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const branchId = input?.branch_id ?? ctx.user.branch_id;
      if (branchId) {
        return ctx.db.select().from(staff).where(eq(staff.branch_id, branchId));
      }
      return ctx.db.select().from(staff);
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
        role: z.enum(["superadmin", "manager", "cashier", "inventory", "auditor"]),
        department: z.string().optional(),
        join_date: z.string(), // ISO string
        salary: z.number().min(0),
        branch_id: z.number().optional(),
        pf_number: z.string().optional(),
        pan: z.string().optional(),
        aadhaar: z.string().optional(),
        bank_account: z.string().optional(),
        bank_name: z.string().optional(),
        ifsc: z.string().optional(),
      })
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
          branch_id: input.branch_id ?? ctx.user.branch_id,
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
        role: z.enum(["superadmin", "manager", "cashier", "inventory", "auditor"]).optional(),
        department: z.string().optional(),
        salary: z.number().min(0).optional(),
        branch_id: z.number().nullable().optional(),
        status: z.enum(["active", "inactive"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, salary, ...rest } = input;
      const [updated] = await ctx.db
        .update(staff)
        .set({
          ...rest,
          ...(salary !== undefined ? { salary: salary.toString() } : {}),
        })
        .where(eq(staff.id, id))
        .returning();
      return updated;
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
