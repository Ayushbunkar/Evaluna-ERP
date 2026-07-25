import { z } from "zod";
import { protectedProcedure, router } from "../init";

export const financeRouter = router({
  getDashboardStats: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .query(async ({ input }) => {
      // Mock data for Finance Dashboard
      return {
        // KPIs
        todaysCash: 12500.50,
        monthlyRevenue: 345000.00,
        totalExpenses: 89000.00,
        netProfit: 256000.00,
        gstLiability: 45000.00,
        totalReceivables: 112000.00,
        totalPayables: 34000.00,
        cashFlow: 154000.00,

        // Charts
        profitChart: [
          { month: "Jan", revenue: 280000, expenses: 75000 },
          { month: "Feb", revenue: 310000, expenses: 82000 },
          { month: "Mar", revenue: 295000, expenses: 78000 },
          { month: "Apr", revenue: 330000, expenses: 85000 },
          { month: "May", revenue: 350000, expenses: 88000 },
          { month: "Jun", revenue: 345000, expenses: 89000 },
        ],
        expenseBreakdown: [
          { category: "Payroll", amount: 45000 },
          { category: "Rent", amount: 15000 },
          { category: "Utilities", amount: 5000 },
          { category: "Marketing", amount: 12000 },
          { category: "Inventory", amount: 8000 },
          { category: "Misc", amount: 4000 },
        ],
        cashFlowData: [
          { day: "Mon", in: 15000, out: 5000 },
          { day: "Tue", in: 18000, out: 4000 },
          { day: "Wed", in: 12000, out: 8000 },
          { day: "Thu", in: 22000, out: 6000 },
          { day: "Fri", in: 25000, out: 12000 },
          { day: "Sat", in: 30000, out: 4000 },
          { day: "Sun", in: 28000, out: 3000 },
        ],
        
        // Summaries
        bankBalances: [
          { account: "HDFC Current", balance: 450000, type: "Current" },
          { account: "SBI Savings", balance: 125000, type: "Savings" },
          { account: "Petty Cash", balance: 15000, type: "Cash" },
        ],
        gstSummary: {
          inputTax: 12500,
          outputTax: 57500,
          netLiability: 45000
        },

        // Tables / Lists
        outstandingPayments: [
          { id: "INV-102", party: "Acme Corp", type: "Receivable", amount: 25000, due: "Today" },
          { id: "INV-105", party: "Global Tech", type: "Receivable", amount: 45000, due: "Tomorrow" },
          { id: "BILL-89", party: "Supplier Inc", type: "Payable", amount: 12000, due: "In 2 days" },
          { id: "BILL-92", party: "Office Depot", type: "Payable", amount: 4500, due: "Overdue" },
        ],
        recentTransactions: [
          { id: "TX-445", date: "Today, 10:30 AM", description: "Payment from Acme Corp", type: "credit", amount: 15000, status: "completed" },
          { id: "TX-446", date: "Today, 11:15 AM", description: "Office Rent", type: "debit", amount: 12000, status: "completed" },
          { id: "TX-447", date: "Today, 01:45 PM", description: "Cash Deposit", type: "credit", amount: 25000, status: "pending" },
          { id: "TX-448", date: "Yesterday", description: "Supplier Payment (ABC Ltd)", type: "debit", amount: 8500, status: "completed" },
        ]
      };
    }),
});
