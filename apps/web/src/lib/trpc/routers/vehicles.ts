import { z } from "zod";
import { router, roleProcedure } from "../init";
import { db } from "@/lib/db";
import { vehicles, vehicleStatusEnum } from "@evaluna/db/schema/delivery";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const vehiclesRouter = router({
	list: roleProcedure(["admin", "manager", "delivery_manager"])
		.input(z.object({ branchId: z.number().optional() }))
		.query(async ({ input, ctx }) => {
			const branch = input.branchId || ctx.session?.user.branch_id;
			if (!branch) throw new TRPCError({ code: "BAD_REQUEST" });
			return await db.query.vehicles.findMany({
				where: eq(vehicles.branch_id, branch),
			});
		}),

	create: roleProcedure(["admin", "manager", "delivery_manager"])
		.input(
			z.object({
				name: z.string(),
				registration_number: z.string(),
				type: z.string(),
				capacity_kg: z.number().optional(),
				branchId: z.number().optional(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const branch = input.branchId || ctx.session?.user.branch_id;
			if (!branch) throw new TRPCError({ code: "BAD_REQUEST" });
			const [vehicle] = await db
				.insert(vehicles)
				.values({
					name: input.name,
					registration_number: input.registration_number,
					type: input.type,
					capacity_kg: input.capacity_kg ? input.capacity_kg.toString() : null,
					branch_id: branch,
				})
				.returning();
			return vehicle;
		}),

	updateStatus: roleProcedure(["admin", "manager", "delivery_manager"])
		.input(
			z.object({
				id: z.number(),
				status: z.enum(vehicleStatusEnum.enumValues),
			})
		)
		.mutation(async ({ input }) => {
			await db
				.update(vehicles)
				.set({ status: input.status })
				.where(eq(vehicles.id, input.id));
			return { success: true };
		}),
});
