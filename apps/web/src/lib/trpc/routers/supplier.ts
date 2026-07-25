import { z } from "zod";
import { protectedProcedure, router } from "../init";

export const supplierRouter = router({
  getPortalStats: protectedProcedure
    .query(async () => {
      return {
        purchaseOrders: 8,
        pendingGRN: 2,
        pendingPayments: 45000.00,
        returns: 1,
        recentInvoices: [
          { id: "INV-2024-01", date: "2026-07-15", status: "Paid", amount: 15000.00 },
          { id: "INV-2024-02", date: "2026-07-22", status: "Processing", amount: 30000.00 }
        ]
      };
    }),
});
