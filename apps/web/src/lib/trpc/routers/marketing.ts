import { z } from "zod";
import { router, protectedProcedure } from "../init";
import { db } from "@/lib/db";
import { coupons, campaigns, campaignAudiences, customers } from "@evaluna/db/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export const marketingRouter = router({
  // ── Coupons ────────────────────────────────────────────────────────────
  listCoupons: protectedProcedure.query(async () => {
    return await db.select().from(coupons).orderBy(desc(coupons.created_at));
  }),

  createCoupon: protectedProcedure
    .input(z.object({
      code: z.string(),
      discount_type: z.enum(["percentage", "flat"]),
      discount_value: z.number(),
      min_order_value: z.number().optional(),
      usage_limit: z.number().optional().nullable(),
      valid_from: z.string().optional().nullable(),
      valid_until: z.string().optional().nullable(),
      is_active: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const [newCoupon] = await db.insert(coupons).values({
        code: input.code.toUpperCase(),
        discount_type: input.discount_type,
        discount_value: input.discount_value.toString(),
        min_order_value: input.min_order_value ? input.min_order_value.toString() : "0",
        usage_limit: input.usage_limit,
        valid_from: input.valid_from ? new Date(input.valid_from) : null,
        valid_until: input.valid_until ? new Date(input.valid_until) : null,
        is_active: input.is_active,
      }).returning();
      return newCoupon;
    }),

  updateCoupon: protectedProcedure
    .input(z.object({
      id: z.number(),
      code: z.string().optional(),
      discount_type: z.enum(["percentage", "flat"]).optional(),
      discount_value: z.number().optional(),
      min_order_value: z.number().optional(),
      usage_limit: z.number().optional().nullable(),
      valid_from: z.string().optional().nullable(),
      valid_until: z.string().optional().nullable(),
      is_active: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      const dbUpdates: any = { ...updates };
      
      if (updates.code) dbUpdates.code = updates.code.toUpperCase();
      if (updates.discount_value !== undefined) dbUpdates.discount_value = updates.discount_value.toString();
      if (updates.min_order_value !== undefined) dbUpdates.min_order_value = updates.min_order_value.toString();
      if (updates.valid_from !== undefined) dbUpdates.valid_from = updates.valid_from ? new Date(updates.valid_from) : null;
      if (updates.valid_until !== undefined) dbUpdates.valid_until = updates.valid_until ? new Date(updates.valid_until) : null;

      const [updated] = await db.update(coupons).set(dbUpdates).where(eq(coupons.id, id)).returning();
      return updated;
    }),

  validateCoupon: protectedProcedure
    .input(z.object({
      code: z.string(),
      cartTotal: z.number(),
    }))
    .mutation(async ({ input }) => {
      const [coupon] = await db.select().from(coupons).where(eq(coupons.code, input.code.toUpperCase()));
      
      if (!coupon) throw new Error("Coupon not found");
      if (!coupon.is_active) throw new Error("Coupon is not active");
      
      const now = new Date();
      if (coupon.valid_from && new Date(coupon.valid_from) > now) throw new Error("Coupon is not valid yet");
      if (coupon.valid_until && new Date(coupon.valid_until) < now) throw new Error("Coupon has expired");
      
      if (coupon.usage_limit && coupon.usage_count !== null && coupon.usage_count >= coupon.usage_limit) {
        throw new Error("Coupon usage limit reached");
      }
      
      const minOrder = parseFloat(coupon.min_order_value as string || "0");
      if (minOrder > 0 && input.cartTotal < minOrder) {
        throw new Error(`Minimum order amount of ₹${minOrder} required`);
      }

      let discountAmount = 0;
      const discountValue = parseFloat(coupon.discount_value as string);
      
      if (coupon.discount_type === "percentage") {
        discountAmount = input.cartTotal * (discountValue / 100);
      } else {
        discountAmount = discountValue;
      }

      return {
        id: coupon.id,
        code: coupon.code,
        discountAmount: Math.min(discountAmount, input.cartTotal), // Cannot discount more than cart total
        type: coupon.discount_type,
      };
    }),

  // ── Campaigns ──────────────────────────────────────────────────────────
  listCampaigns: protectedProcedure.query(async () => {
    return await db.select().from(campaigns).orderBy(desc(campaigns.created_at));
  }),

  estimateAudience: protectedProcedure
    .input(z.object({
      tier: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // In a real app, this would dynamically build SQL query from jsonb target_segment
      // We keep it simple: filter by tier if provided, otherwise all active customers
      
      let conditions = [eq(customers.status, "active")];
      if (input.tier && input.tier !== "all") {
        conditions.push(eq(customers.loyalty_tier, input.tier));
      }

      const result = await db.select({ count: sql<number>`count(*)::int` })
        .from(customers)
        .where(and(...conditions));
        
      return result[0].count;
    }),

  createCampaign: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      type: z.enum(["discount", "announcement"]),
      target_segment: z.any(),
      coupon_id: z.number().optional().nullable(),
      channel: z.enum(["whatsapp", "sms", "in_app", "email"]),
      message_template: z.string(),
      status: z.enum(["draft", "scheduled", "active", "completed"]).default("draft"),
    }))
    .mutation(async ({ input }) => {
      const [newCampaign] = await db.insert(campaigns).values({
        ...input,
        target_segment: input.target_segment,
      }).returning();
      return newCampaign;
    }),

  launchCampaign: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, input.id));
      if (!campaign) throw new Error("Campaign not found");
      
      // Update status to active
      await db.update(campaigns).set({ status: "active" }).where(eq(campaigns.id, input.id));

      // Build target conditions
      let conditions = [eq(customers.status, "active"), eq(customers.marketing_opt_in, true)];
      const segment = campaign.target_segment as any;
      if (segment && segment.tier && segment.tier !== "all") {
        conditions.push(eq(customers.loyalty_tier, segment.tier));
      }

      // Find eligible customers
      const eligibleCustomers = await db.select({ id: customers.id }).from(customers).where(and(...conditions));
      
      // Seed the audiences table
      if (eligibleCustomers.length > 0) {
        await db.insert(campaignAudiences).values(
          eligibleCustomers.map(c => ({
            campaign_id: campaign.id,
            customer_id: c.id,
            status: "pending"
          }))
        );
      }

      // (In a real system, a queue processor would pick up 'pending' audiences and call Twilio/Meta API)
      return { success: true, targeted: eligibleCustomers.length };
    }),
});
