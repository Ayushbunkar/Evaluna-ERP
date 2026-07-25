import { z } from "zod";
import { protectedProcedure, router } from "../init";

export const putterRouter = router({
  getDashboardStats: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .query(async ({ input }) => {
      return {
        receivingTasks: 5,
        putAwayTasks: 12,
        missingStock: 1,
        damagesRaised: 3,
        tasks: [
          { id: "RCV-01", items: 100, origin: "Supplier X", status: "Unloading" },
          { id: "PUT-05", items: 45, destination: "Rack B", status: "Pending" }
        ]
      };
    }),
});
