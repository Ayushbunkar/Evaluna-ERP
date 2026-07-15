
import { z } from 'zod';

export const purchaseReturnItemInsertSchema = z.object({
  product_id: z.number(),
  quantity: z.number().min(1),
  price: z.number().min(0),
});

export const purchaseReturnInsertSchema = z.object({
  purchase_id: z.number(),
  return_date: z.date(),
  total_amount: z.number(),
  reason: z.string().optional(),
  status: z.string().optional(),
  items: z.array(purchaseReturnItemInsertSchema).optional(),
});
