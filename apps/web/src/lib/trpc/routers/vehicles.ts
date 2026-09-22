import { vehicleStatusEnum, vehicles } from "@evaluna/db/schema/delivery";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { roleProcedure, router } from "../init";

export const vehiclesRouter = router({
	list: roleProcedure(["admin", "manager"])
		.input(z.object({ branchId: z.number().optional() }))
		.query(async ({ input, ctx }) => {
			const branch = input.branchId || ctx.user?.branchId || 1;
			if (!branch) throw new TRPCError({ code: "BAD_REQUEST" });
			return await db.query.vehicles.findMany({
				where: eq(vehicles.branch_id, branch),
			});
		}),

	create: roleProcedure(["admin", "manager"])
		.input(
			z.object({
				name: z.string(),
				registration_number: z.string(),
				type: z.string(),
				capacity_kg: z.number().optional(),
				branchId: z.number().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const branch = input.branchId || ctx.user?.branchId || 1;
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

	updateStatus: roleProcedure(["admin", "manager"])
		.input(
			z.object({
				id: z.number(),
				status: z.enum(vehicleStatusEnum.enumValues),
			}),
		)
		.mutation(async ({ input }) => {
			await db
				.update(vehicles)
				.set({ status: input.status })
				.where(eq(vehicles.id, input.id));
			return { success: true };
		}),

	update: roleProcedure(["admin", "manager"])
		.input(
			z.object({
				id: z.number(),
				name: z.string().optional(),
				registration_number: z.string().optional(),
				type: z.string().optional(),
				capacity_kg: z.number().optional().nullable(),
				status: z.enum(vehicleStatusEnum.enumValues).optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const updateData: any = {};
			if (input.name !== undefined) updateData.name = input.name;
			if (input.registration_number !== undefined) updateData.registration_number = input.registration_number;
			if (input.type !== undefined) updateData.type = input.type;
			if (input.capacity_kg !== undefined) updateData.capacity_kg = input.capacity_kg !== null ? input.capacity_kg.toString() : null;
			if (input.status !== undefined) updateData.status = input.status;

			const [updated] = await db
				.update(vehicles)
				.set(updateData)
				.where(eq(vehicles.id, input.id))
				.returning();
			return updated;
		}),

	delete: roleProcedure(["admin", "manager"])
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input }) => {
			await db.delete(vehicles).where(eq(vehicles.id, input.id));
			return { success: true };
		}),
});
