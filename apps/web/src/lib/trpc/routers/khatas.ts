import { z } from "zod";
import { db } from "../../../../db/db";
import { khata } from "../../../../db/schema";
import { khataSchema } from "../../../validation/khata";
import { publicProcedure, router } from "../trpc";
import { eq } from "drizzle-orm";

export const khatasRouter = router({
  list: publicProcedure.input(z.object({ customer_id: z.number() })).query(({ input }) => {
    return db.query.khata.findMany({
      where: eq(khata.customer_id, input.customer_id),
    });
  }),
  create: publicProcedure.input(khataSchema).mutation(({ input }) => {
    return db.insert(khata).values(input);
  }),
  update: publicProcedure.input(khataSchema).mutation(({ input }) => {
    return db.update(khata).set(input).where(eq(khata.id, input.id!));
  }),
  delete: publicProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => {
    return db.delete(khata).where(eq(khata.id, input.id));
  }),
});
