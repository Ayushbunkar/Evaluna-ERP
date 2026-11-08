import { count, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { productCategories } from "@/lib/db/schema";
import { publicProcedure, router } from "@/lib/trpc/init";

export const categoriesRouter = router({
	list: publicProcedure
		.input(
			z
				.object({
					search: z.string().optional(),
					limit: z.number().optional(),
					offset: z.number().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const { search, limit, offset } = input || {};
			let query = db.select().from(productCategories);

			if (search) {
				const searchTerm = `%${search}%`;
				query = query.where(
					or(
						ilike(productCategories.name, searchTerm),
						ilike(productCategories.description, searchTerm),
					),
				);
			}

			// Apply pagination
			if (limit !== undefined) {
				query = query.limit(limit);
			}
			if (offset !== undefined) {
				query = query.offset(offset);
			}

			const categories = await query.orderBy(productCategories.name);

			const total = await db
				.select({ count: count() })
				.from(productCategories)
				.where(
					search
						? or(
								ilike(productCategories.name, `%${search}%`),
								ilike(productCategories.description, `%${search}%`),
							)
						: undefined,
				);

			return {
				categories: categories.map((c) => ({
					id: c.id,
					name: c.name,
					description: c.description ?? "",
					item_count: 0, // We don't have a direct count of products per category here; we could join with productCategoryMapping but that might be heavy. We'll leave 0 or compute separately if needed.
					status: "active", // We don't have a status field in productCategories; we can assume active or add a status field later.
				})),
				total: total[0]?.count || 0,
			};
		}),

	getById: publicProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const category = await db
				.select()
				.from(productCategories)
				.where(eq(productCategories.id, input.id));

			return category[0];
		}),

	create: publicProcedure
		.input(
			z.object({
				name: z.string().min(1),
				slug: z.string().optional(),
				description: z.string().optional(),
				parent_id: z.number().optional().nullable(),
				image_url: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const cleanName = input.name.trim();

			// Check if category with this name already exists (case-insensitive)
			const existingByName = await db
				.select()
				.from(productCategories)
				.where(ilike(productCategories.name, cleanName))
				.limit(1);

			if (existingByName.length > 0) {
				return existingByName[0];
			}

			const baseSlug =
				input.slug?.trim() ||
				cleanName
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, "-")
					.replace(/(^-|-$)/g, "") ||
				`cat-${Date.now()}`;

			// Check if slug already exists to prevent duplicate key violation
			const existing = await db
				.select({ id: productCategories.id })
				.from(productCategories)
				.where(eq(productCategories.slug, baseSlug))
				.limit(1);

			const finalSlug =
				existing.length > 0
					? `${baseSlug}-${Date.now().toString().slice(-4)}`
					: baseSlug;

			const [category] = await db
				.insert(productCategories)
				.values({
					name: cleanName,
					slug: finalSlug,
					description: input.description ?? null,
					parent_id: input.parent_id,
					image_url: input.image_url ?? null,
				})
				.returning();
			return category;
		}),

	update: publicProcedure
		.input(
			z.object({
				id: z.number(),
				name: z.string().min(1).optional(),
				slug: z.string().min(1).optional(),
				description: z.string().optional(),
				parent_id: z.number().optional().nullable(),
				image_url: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const { id, ...data } = input;
			const [category] = await db
				.update(productCategories)
				.set(data)
				.where(eq(productCategories.id, id))
				.returning();
			return category;
		}),

	delete: publicProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			await db
				.delete(productCategories)
				.where(eq(productCategories.id, input.id));
			return { success: true };
		}),
});
