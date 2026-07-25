import { z } from "zod";

export const khataSchema = z.object({
  id: z.number().optional(),
  customer_id: z.number(),
  amount: z.number(),
  type: z.string(),
  description: z.string().optional(),
  user_uid: z.string(),
  created_at: z.string().optional(),
});
