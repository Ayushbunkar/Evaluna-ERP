import { z } from "zod";
import { protectedProcedure, router } from "../init";

export const pickerRouter = router({
  getDashboardStats: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .query(async ({ input }) => {
      return {
        activePickLists: 14,
        completedPicks: 42,
        pendingPicks: 8,
        exceptions: 2,
        tasks: [
          { id: "PL-001", items: 45, area: "Rack A", status: "In Progress" },
          { id: "PL-002", items: 12, area: "Rack C", status: "Pending" }
        ]
      };
    }),
});
