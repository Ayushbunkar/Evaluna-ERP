import { db } from "@evaluna/db";
import { designations } from "@evaluna/db/src/schema/hrms";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { procedure, router } from "../../trpc";

export const designationsRouter = router({
	list: procedure.query(async () => {
		return await db.query.designations.findMany({
			orderBy: (designations, { asc }) => [
				asc(designations.level),
				asc(designations.name),
			],
		});
	}),

	create: procedure
		.input(
			z.object({
				name: z.string().min(1),
				level: z.number().default(1),
				description: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const [designation] = await db
				.insert(designations)
				.values(input)
				.returning();

			return designation;
		}),

	update: procedure
		.input(
			z.object({
				id: z.number(),
				name: z.string().min(1).optional(),
				level: z.number().optional(),
				description: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const [designation] = await db
				.update(designations)
				.set(input)
				.where(eq(designations.id, input.id))
				.returning();

			if (!designation) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Designation not found",
				});
			}

			return designation;
		}),

	delete: procedure.input(z.number()).mutation(async ({ input }) => {
		const [designation] = await db
			.delete(designations)
			.where(eq(designations.id, input))
			.returning();

		if (!designation) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Designation not found",
			});
		}

		return designation;
	}),
});
