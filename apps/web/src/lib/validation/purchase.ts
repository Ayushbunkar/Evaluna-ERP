import { z } from 'zod';

export const purchaseSchema = z.object({
  id: z.string().optional(),
  supplierId: z.string(),
  total: z.number(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number(),
      price: z.number(),
    }),
  ),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Purchase = z.infer<typeof purchaseSchema>;
