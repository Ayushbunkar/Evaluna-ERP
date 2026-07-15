import { z } from "zod";
import { protectedProcedure, router } from "../init";
import { loyaltyHistory, customers } from "@evaluna/db/schema";
import { eq, desc, sql } from "drizzle-orm";

// Tier rules: minimum total_spent to qualify
const TIER_THRESHOLDS = {
  gold: 50000,   // ₹50,000+
  silver: 10000, // ₹10,000+
  bronze: 0,     // default
};

// Points earned per ₹10 spent, by tier
const TIER_MULTIPLIER: Record<string, number> = {
  gold: 2,
  silver: 1.5,
  bronze: 1,
};

function evaluateTier(totalSpent: number): "bronze" | "silver" | "gold" {
  if (totalSpent >= TIER_THRESHOLDS.gold) return "gold";
  if (totalSpent >= TIER_THRESHOLDS.silver) return "silver";
  return "bronze";
}

export const loyaltyRouter = router({
  getCustomerLoyalty: protectedProcedure
    .input(z.object({ customer_id: z.number() }))
    .query(async ({ ctx, input }) => {
      const customer = await ctx.db.query.customers.findFirst({
        where: eq(customers.id, input.customer_id),
      });

      const history = await ctx.db
        .select()
        .from(loyaltyHistory)
        .where(eq(loyaltyHistory.customer_id, input.customer_id))
        .orderBy(desc(loyaltyHistory.created_at))
        .limit(30);

      return {
        customer,
        history,
        tier_thresholds: TIER_THRESHOLDS,
      };
    }),

  adjustPoints: protectedProcedure
    .input(
      z.object({
        customer_id: z.number(),
        points_change: z.number(),
        reason: z.string(),
        reference_id: z.string().optional(),
        branch_id: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const customer = await tx.query.customers.findFirst({
          where: eq(customers.id, input.customer_id),
        });
        if (!customer) throw new Error("Customer not found");

        const newPoints = Math.max(0, (customer.loyalty_points ?? 0) + input.points_change);

        await tx.update(customers)
          .set({ loyalty_points: newPoints })
          .where(eq(customers.id, input.customer_id));

        await tx.insert(loyaltyHistory).values({
          customer_id: input.customer_id,
          branch_id: input.branch_id ?? ctx.user.branch_id,
          points_change: input.points_change,
          reason: input.reason,
          reference_id: input.reference_id,
        });

        return { new_balance: newPoints };
      });
    }),

  awardForPurchase: protectedProcedure
    .input(
      z.object({
        customer_id: z.number(),
        order_total: z.number(),
        order_id: z.string(),
        branch_id: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const customer = await tx.query.customers.findFirst({
          where: eq(customers.id, input.customer_id),
        });
        if (!customer) return null;

        // Don't double-award
        const alreadyAwarded = await tx
          .select()
          .from(loyaltyHistory)
          .where(eq(loyaltyHistory.reference_id, `order-${input.order_id}`));
        if (alreadyAwarded.length > 0) return null;

        const currentTier = (customer.loyalty_tier ?? "bronze") as "bronze" | "silver" | "gold";
        const multiplier = TIER_MULTIPLIER[currentTier] ?? 1;
        const pointsEarned = Math.floor((input.order_total / 10) * multiplier);

        const newTotalSpent = parseFloat(customer.total_spent as string ?? "0") + input.order_total;
        const newTier = customer.tier_override ? currentTier : evaluateTier(newTotalSpent);
        const newPoints = (customer.loyalty_points ?? 0) + pointsEarned;

        await tx.update(customers).set({
          loyalty_points: newPoints,
          total_spent: newTotalSpent.toFixed(2),
          loyalty_tier: newTier,
        }).where(eq(customers.id, input.customer_id));

        await tx.insert(loyaltyHistory).values({
          customer_id: input.customer_id,
          branch_id: input.branch_id ?? ctx.user.branch_id,
          points_change: pointsEarned,
          reason: `Purchase +${pointsEarned} pts (${currentTier} tier)`,
          reference_id: `order-${input.order_id}`,
        });

        return {
          points_earned: pointsEarned,
          new_balance: newPoints,
          new_tier: newTier,
          tier_upgraded: newTier !== currentTier,
        };
      });
    }),

  redeemPoints: protectedProcedure
    .input(
      z.object({
        customer_id: z.number(),
        points_to_redeem: z.number().positive(),
        order_id: z.string(),
        branch_id: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const customer = await tx.query.customers.findFirst({
          where: eq(customers.id, input.customer_id),
        });
        if (!customer) throw new Error("Customer not found");
        if ((customer.loyalty_points ?? 0) < input.points_to_redeem) {
          throw new Error("Insufficient loyalty points");
        }

        const discount = input.points_to_redeem; // 1 point = ₹1 discount
        const newPoints = (customer.loyalty_points ?? 0) - input.points_to_redeem;

        await tx.update(customers)
          .set({ loyalty_points: newPoints })
          .where(eq(customers.id, input.customer_id));

        await tx.insert(loyaltyHistory).values({
          customer_id: input.customer_id,
          branch_id: input.branch_id ?? ctx.user.branch_id,
          points_change: -input.points_to_redeem,
          reason: `Redemption -${input.points_to_redeem} pts (₹${discount} discount)`,
          reference_id: `order-${input.order_id}`,
        });

        return { discount_amount: discount, new_balance: newPoints };
      });
    }),
});
