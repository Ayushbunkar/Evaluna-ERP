import type { z } from "zod";
import type { supplierSchema } from "@/lib/validation/supplier";

export type Supplier = z.infer<typeof supplierSchema> & {
	id: number;
	user_uid: string;
	created_at: Date | null;
};
