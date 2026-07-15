
import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(3, { message: "Supplier name must be at least 3 characters long" }),
  email: z.string().email({ message: "Invalid email address" }).optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  gstin: z.string().optional().nullable(),
  pan: z.string().optional().nullable(),
});
