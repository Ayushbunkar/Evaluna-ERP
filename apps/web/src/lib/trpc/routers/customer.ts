import { z } from "zod";
import { protectedProcedure, router } from "../init";

export const customerRouter = router({
  getPortalStats: protectedProcedure
    .query(async () => {
      return {
        totalOrders: 15,
        pendingDeliveries: 1,
        loyaltyPoints: 1250,
        walletBalance: 450.00,
        recentOrders: [
          { id: "ORD-992", date: "2026-07-20", status: "Delivered", total: 1499.00 },
          { id: "ORD-993", date: "2026-07-24", status: "Out for Delivery", total: 899.00 }
        ]
      };
    }),
});
