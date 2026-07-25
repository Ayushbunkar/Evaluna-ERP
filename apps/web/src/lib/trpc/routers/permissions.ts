import { z } from "zod";
import { protectedProcedure, router } from "../init";
import { rolePermissions } from "@evaluna/db/schema";
import { eq, and } from "drizzle-orm";

// All modules and their allowed actions
const MODULES = ["products", "customers", "sales", "purchases", "inventory", "payroll", "staff", "attendance", "reports", "settings", "branches", "transfers"] as const;
const ACTIONS = ["view", "create", "update", "delete"] as const;

// Default permissions per role
const DEFAULT_PERMISSIONS: Record<string, Record<string, Record<string, boolean>>> = {
  manager: {
    products: { view: true, create: true, update: true, delete: false },
    customers: { view: true, create: true, update: true, delete: false },
    sales: { view: true, create: true, update: true, delete: false },
    purchases: { view: true, create: true, update: true, delete: false },
    inventory: { view: true, create: true, update: true, delete: false },
    payroll: { view: true, create: false, update: false, delete: false },
    staff: { view: true, create: false, update: false, delete: false },
    attendance: { view: true, create: true, update: true, delete: false },
    reports: { view: true, create: false, update: false, delete: false },
    settings: { view: false, create: false, update: false, delete: false },
    branches: { view: true, create: false, update: false, delete: false },
    transfers: { view: true, create: true, update: false, delete: false },
  },
  cashier: {
    products: { view: true, create: false, update: false, delete: false },
    customers: { view: true, create: true, update: false, delete: false },
    sales: { view: true, create: true, update: false, delete: false },
    purchases: { view: false, create: false, update: false, delete: false },
    inventory: { view: true, create: false, update: false, delete: false },
    payroll: { view: false, create: false, update: false, delete: false },
    staff: { view: false, create: false, update: false, delete: false },
    attendance: { view: false, create: false, update: false, delete: false },
    reports: { view: false, create: false, update: false, delete: false },
    settings: { view: false, create: false, update: false, delete: false },
    branches: { view: false, create: false, update: false, delete: false },
    transfers: { view: false, create: false, update: false, delete: false },
  },
  inventory: {
    products: { view: true, create: true, update: true, delete: false },
    customers: { view: false, create: false, update: false, delete: false },
    sales: { view: true, create: false, update: false, delete: false },
    purchases: { view: true, create: true, update: true, delete: false },
    inventory: { view: true, create: true, update: true, delete: false },
    payroll: { view: false, create: false, update: false, delete: false },
    staff: { view: false, create: false, update: false, delete: false },
    attendance: { view: false, create: false, update: false, delete: false },
    reports: { view: true, create: false, update: false, delete: false },
    settings: { view: false, create: false, update: false, delete: false },
    branches: { view: false, create: false, update: false, delete: false },
    transfers: { view: true, create: true, update: true, delete: false },
  },
  auditor: {
    products: { view: true, create: false, update: false, delete: false },
    customers: { view: true, create: false, update: false, delete: false },
    sales: { view: true, create: false, update: false, delete: false },
    purchases: { view: true, create: false, update: false, delete: false },
    inventory: { view: true, create: false, update: false, delete: false },
    payroll: { view: true, create: false, update: false, delete: false },
    staff: { view: true, create: false, update: false, delete: false },
    attendance: { view: true, create: false, update: false, delete: false },
    reports: { view: true, create: false, update: false, delete: false },
    settings: { view: false, create: false, update: false, delete: false },
    branches: { view: true, create: false, update: false, delete: false },
    transfers: { view: true, create: false, update: false, delete: false },
  },
};

export const permissionsRouter = router({
  getMatrix: protectedProcedure
    .input(z.object({ role: z.string() }))
    .query(async ({ ctx, input }) => {
      // superadmin always gets full access
      if (input.role === "superadmin") {
        const matrix: Record<string, Record<string, boolean>> = {};
        for (const module of MODULES) {
          matrix[module] = {};
          for (const action of ACTIONS) {
            matrix[module][action] = true;
          }
        }
        return { role: "superadmin", matrix, modules: MODULES, actions: ACTIONS };
      }

      // Fetch stored permissions
      const stored = await ctx.db
        .select()
        .from(rolePermissions)
        .where(eq(rolePermissions.role, input.role));

      // Start from defaults, overlay stored values
      const defaults = DEFAULT_PERMISSIONS[input.role] ?? {};
      const matrix: Record<string, Record<string, boolean>> = {};

      for (const module of MODULES) {
        matrix[module] = {};
        for (const action of ACTIONS) {
          const storedEntry = stored.find(
            (p) => p.module === module && p.action === action
          );
          if (storedEntry) {
            matrix[module][action] = storedEntry.is_allowed ?? false;
          } else {
            matrix[module][action] = defaults[module]?.[action] ?? false;
          }
        }
      }

      return { role: input.role, matrix, modules: MODULES, actions: ACTIONS };
    }),

  updateMatrix: protectedProcedure
    .input(
      z.object({
        role: z.string(),
        module: z.string(),
        action: z.string(),
        is_allowed: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.role === "superadmin") {
        throw new Error("Cannot modify superadmin permissions");
      }

      // Upsert the permission
      const existing = await ctx.db
        .select()
        .from(rolePermissions)
        .where(
          and(
            eq(rolePermissions.role, input.role),
            eq(rolePermissions.module, input.module),
            eq(rolePermissions.action, input.action)
          )
        );

      if (existing.length > 0) {
        await ctx.db
          .update(rolePermissions)
          .set({ is_allowed: input.is_allowed, updated_at: new Date() })
          .where(eq(rolePermissions.id, existing[0].id));
      } else {
        await ctx.db.insert(rolePermissions).values({
          role: input.role,
          module: input.module,
          action: input.action,
          is_allowed: input.is_allowed,
        });
      }

      return { success: true };
    }),

  seedDefaults: protectedProcedure
    .input(z.object({ role: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const defaults = DEFAULT_PERMISSIONS[input.role];
      if (!defaults) throw new Error("No defaults for this role");

      for (const [module, actions] of Object.entries(defaults)) {
        for (const [action, is_allowed] of Object.entries(actions)) {
          await ctx.db.insert(rolePermissions).values({
            role: input.role,
            module,
            action,
            is_allowed,
          }).onConflictDoNothing();
        }
      }
      return { success: true };
    }),
});
