import { z } from "zod";
import { protectedProcedure, router } from "../init";

export const hrRouter = router({
  getDashboardStats: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .query(async ({ input }) => {
      return {
        totalEmployees: 124,
        presentToday: 118,
        onLeave: 6,
        payrollPending: 2,
        recentActivity: [
          { name: "John Doe", action: "Checked In", time: "08:55 AM" },
          { name: "Sarah Smith", action: "Leave Approved", time: "Yesterday" }
        ]
      };
    }),
});
