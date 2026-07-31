import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { promotionSchemes } from "@/lib/db/schema";
import { protectedProcedure, router } from "../init";

export const schemesRouter = router({
	getActiveSchemes: protectedProcedure.query(async () => {
		const schemes = await db
			.select()
			.from(promotionSchemes)
			.where(eq(promotionSchemes.is_active, true));
		return schemes;
	}),
	createScheme: protectedProcedure
		.input(
			z.object({
				name: z.string(),
				type: z.enum([
					"BOGO",
					"flat_discount",
					"category_discount",
					"free_gift",
				]),
				rules_json: z.any(),
				start_date: z.string().optional(),
				end_date: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const [scheme] = await db
				.insert(promotionSchemes)
				.values({
					name: input.name,
					type: input.type,
					rules_json: input.rules_json,
					start_date: input.start_date ? new Date(input.start_date) : undefined,
					end_date: input.end_date ? new Date(input.end_date) : undefined,
					is_active: true,
				})
				.returning();
			return scheme;
		}),
	deactivateScheme: protectedProcedure
		.input(
			z.object({
				id: z.number(),
			}),
		)
		.mutation(async ({ input }) => {
			await db
				.update(promotionSchemes)
				.set({ is_active: false })
				.where(eq(promotionSchemes.id, input.id));
			return { success: true };
		}),
});
