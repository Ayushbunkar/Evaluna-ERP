import { z } from "zod";
import { protectedProcedure, router } from "../init";
import { settings } from "@evaluna/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export const settingsRouter = router({
  /**
   * Get all settings merged (global + branch overrides)
   */
  getAll: protectedProcedure
    .input(z.object({ branch_id: z.number().nullable().optional() }))
    .query(async ({ ctx, input }) => {
      // First get global settings
      const globalSettings = await ctx.db
        .select()
        .from(settings)
        .where(isNull(settings.branch_id));

      const merged = Object.fromEntries(
        globalSettings.map((s) => [s.key, s.value])
      );

      // Then get branch settings and override
      const targetBranchId = input.branch_id ?? ctx.user.branch_id;
      if (targetBranchId) {
        const branchSettings = await ctx.db
          .select()
          .from(settings)
          .where(eq(settings.branch_id, targetBranchId));

        branchSettings.forEach((s) => {
          merged[s.key] = s.value;
        });
      }

      return merged;
    }),

  /**
   * Set multiple settings at once
   */
  setMany: protectedProcedure
    .input(
      z.object({
        branch_id: z.number().nullable().optional(),
        settings: z.record(z.any()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const targetBranchId = input.branch_id ?? ctx.user.branch_id ?? null;

      // Note: Superadmins can set global settings (targetBranchId = null)
      // Branch managers can only set their own branch settings

      const entries = Object.entries(input.settings);

      await ctx.db.transaction(async (tx) => {
        for (const [key, value] of entries) {
          // Check if setting exists
          let existing;
          if (targetBranchId) {
            const result = await tx
              .select()
              .from(settings)
              .where(
                and(
                  eq(settings.key, key),
                  eq(settings.branch_id, targetBranchId)
                )
              );
            existing = result[0];
          } else {
            const result = await tx
              .select()
              .from(settings)
              .where(
                and(eq(settings.key, key), isNull(settings.branch_id))
              );
            existing = result[0];
          }

          if (existing) {
            await tx
              .update(settings)
              .set({ value, updated_at: new Date() })
              .where(eq(settings.id, existing.id));
          } else {
            await tx.insert(settings).values({
              key,
              value,
              branch_id: targetBranchId,
            });
          }
        }
      });

      return { success: true };
    }),
});
