import { z } from "zod";
import { protectedProcedure, router } from "../init";

export const auditorRouter = router({
  getDashboardStats: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .query(async ({ input }) => {
      // Mock data for Auditor Dashboard
      return {
        // KPIs
        pendingAudits: 14,
        completedAudits: 45,
        mismatchCount: 8,
        damageCount: 22,
        expiryCount: 15,
        stockAccuracy: 98.4,

        // Charts
        damageTimeline: [
          { month: "Jan", count: 12 },
          { month: "Feb", count: 18 },
          { month: "Mar", count: 15 },
          { month: "Apr", count: 25 },
          { month: "May", count: 19 },
          { month: "Jun", count: 22 },
        ],
        expiryTimeline: [
          { month: "Jul", count: 5 },
          { month: "Aug", count: 12 },
          { month: "Sep", count: 15 },
          { month: "Oct", count: 30 },
          { month: "Nov", count: 8 },
          { month: "Dec", count: 45 },
        ],
        warehouseIssues: [
          { name: "Damage", value: 22 },
          { name: "Expiry", value: 15 },
          { name: "Missing", value: 8 },
          { name: "PNA", value: 5 },
        ],

        // Summaries / Tables
        auditQueue: [
          { id: "ADT-081", area: "Rack A (Electronics)", date: "Today", assignedTo: "Mike", status: "pending" },
          { id: "ADT-082", area: "Rack B (Furniture)", date: "Tomorrow", assignedTo: "Sarah", status: "scheduled" },
          { id: "ADT-083", area: "Cold Storage", date: "Tomorrow", assignedTo: "John", status: "scheduled" },
        ],
        productMismatch: [
          { id: "SKU-110", expected: 150, actual: 145, diff: -5, location: "Rack A4" },
          { id: "SKU-205", expected: 40, actual: 42, diff: 2, location: "Rack C2" },
          { id: "SKU-332", expected: 85, actual: 80, diff: -5, location: "Rack B1" },
        ],
        recentAudits: [
          { id: "ADT-078", area: "Rack C (Apparel)", completedBy: "Mike", accuracy: "99.5%", issues: 2 },
          { id: "ADT-079", area: "Receiving Bay", completedBy: "John", accuracy: "100%", issues: 0 },
          { id: "ADT-080", area: "Return Area", completedBy: "Sarah", accuracy: "95.2%", issues: 12 },
        ],
        notifications: [
          { id: 1, type: "alert", title: "High Mismatch", message: "SKU-110 missing 5 units", time: "10m ago" },
          { id: 2, type: "warning", title: "Upcoming Expiry", message: "15 items expiring next week", time: "1h ago" },
          { id: 3, type: "info", title: "Audit Completed", message: "ADT-080 completed by Sarah", time: "2h ago" },
        ]
      };
    }),
});
