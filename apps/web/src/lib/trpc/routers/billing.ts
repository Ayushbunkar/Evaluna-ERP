import { z } from "zod";
import { protectedProcedure, router } from "../init";

export const billingRouter = router({
  getDashboardStats: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .query(async ({ input }) => {
      // Mock data for Billing Dashboard
      return {
        // KPIs
        todaysBills: 142,
        revenue: 84500.50,
        averageBill: 595.00,
        refunds: 1250.00,
        cashCollected: 25000.00,
        cardCollected: 38000.00,
        upiCollected: 21500.50,
        pendingBills: 5,

        // Charts
        salesChart: [
          { day: "8 AM", sales: 2500 },
          { day: "10 AM", sales: 12000 },
          { day: "12 PM", sales: 18500 },
          { day: "2 PM", sales: 14000 },
          { day: "4 PM", sales: 11000 },
          { day: "6 PM", sales: 19500 },
          { day: "8 PM", sales: 7000 },
        ],
        paymentDistribution: [
          { name: "Cash", value: 25000 },
          { name: "Card", value: 38000 },
          { name: "UPI", value: 21500 },
        ],
        hourlySales: [
          { hour: "8AM", amount: 2500 },
          { hour: "10AM", amount: 12000 },
          { hour: "12PM", amount: 18500 },
          { hour: "2PM", amount: 14000 },
          { hour: "4PM", amount: 11000 },
          { hour: "6PM", amount: 19500 },
        ],
        
        // Summaries
        topCashiers: [
          { name: "Alice Smith", bills: 65, revenue: 42000 },
          { name: "John Doe", bills: 48, revenue: 28500 },
          { name: "Sarah Lee", bills: 29, revenue: 14000 },
        ],

        // Tables / Lists
        recentBills: [
          { id: "INV-9021", customer: "Walk-in Customer", items: 4, amount: 1250.00, status: "paid", payment: "UPI" },
          { id: "INV-9022", customer: "Acme Corp", items: 12, amount: 8400.00, status: "paid", payment: "Card" },
          { id: "INV-9023", customer: "Jane Doe", items: 2, amount: 450.50, status: "pending", payment: "Cash" },
          { id: "INV-9024", customer: "Walk-in Customer", items: 1, amount: 120.00, status: "paid", payment: "Cash" },
        ]
      };
    }),
});
