import { eq } from "drizzle-orm";
import { z } from "zod";
import { productCategories } from "@/lib/db/schema";
import { publicProcedure, router } from "@/lib/trpc/init";

export const categoriesRouter = router({
	list: publicProcedure
		.input(
			z.object({
				search: z.string().optional(),
				limit: z.number().optional(),
				offset: z.number().optional(),
			}),
		)
		.query(async () => {
			const data = [
				{
					id: 1,
					name: "Groceries",
					description: "Daily essentials and staples",
					item_count: 1250,
					status: "active",
				},
				{
					id: 2,
					name: "Dairy",
					description: "Milk, butter, cheese and dairy products",
					item_count: 85,
					status: "active",
				},
				{
					id: 3,
					name: "Snacks",
					description: "Chips, biscuits, namkeen",
					item_count: 420,
					status: "active",
				},
				{
					id: 4,
					name: "Beverages",
					description: "Tea, coffee, soft drinks",
					item_count: 150,
					status: "active",
				},
				{
					id: 5,
					name: "Cleaning",
					description: "Detergents and cleaning supplies",
					item_count: 95,
					status: "active",
				},
				{
					id: 6,
					name: "Personal Care",
					description: "Soaps, shampoos, cosmetics",
					item_count: 340,
					status: "active",
				},
				{
					id: 7,
					name: "Frozen Foods",
					description: "Ice creams, frozen peas",
					item_count: 45,
					status: "maintenance",
				},
				{
					id: 8,
					name: "Spices",
					description: "Whole and powdered spices",
					item_count: 210,
					status: "active",
				},
			];
			return {
				categories: data,
				total: data.length,
			};
		}),

	getById: publicProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const category = await ctx.db
				.select()
				.from(productCategories)
				.where(eq(productCategories.id, input.id));

			return category[0];
		}),

	create: publicProcedure.mutation(async ({ ctx }) => {
		// TODO: Implement create category
		return { success: true };
	}),

	update: publicProcedure.mutation(async ({ ctx }) => {
		// TODO: Implement update category
		return { success: true };
	}),

	delete: publicProcedure.mutation(async ({ ctx }) => {
		// TODO: Implement delete category
		return { success: true };
	}),
});
