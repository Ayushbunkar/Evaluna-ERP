import { branches, branchInventory, products } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../init";

export const branchesRouter = router({
	/** List all branches */
	list: protectedProcedure.input(z.void()).query(async () => {
		return [
			{
				id: 1,
				name: "Mumbai Central Hub",
				code: "BR-MUM01",
				address: "Lower Parel, Mumbai, MH",
				manager: "Rajesh Patil",
				contact: "+91 9876543210",
				email: "mumbai@evaluna.in",
				status: "active",
				is_headquarters: true,
			},
			{
				id: 2,
				name: "Delhi North Distribution",
				code: "BR-DEL02",
				address: "Okhla Phase 2, New Delhi, DL",
				manager: "Amit Sharma",
				contact: "+91 9876543211",
				email: "delhi@evaluna.in",
				status: "active",
				is_headquarters: false,
			},
			{
				id: 3,
				name: "Bangalore Tech Park",
				code: "BR-BLR03",
				address: "Whitefield, Bangalore, KA",
				manager: "Kavita Reddy",
				contact: "+91 9876543212",
				email: "bangalore@evaluna.in",
				status: "active",
				is_headquarters: false,
			},
			{
				id: 4,
				name: "Chennai Port",
				code: "BR-CHN04",
				address: "Guindy, Chennai, TN",
				manager: "Srinivasan Iyer",
				contact: "+91 9876543213",
				email: "chennai@evaluna.in",
				status: "maintenance",
				is_headquarters: false,
			},
			{
				id: 5,
				name: "Hyderabad Cyber Center",
				code: "BR-HYD05",
				address: "HITEC City, Hyderabad, TS",
				manager: "Priya Das",
				contact: "+91 9876543214",
				email: "hyderabad@evaluna.in",
				status: "active",
				is_headquarters: false,
			},
			{
				id: 6,
				name: "Pune West Zone",
				code: "BR-PUN06",
				address: "Hinjewadi, Pune, MH",
				manager: "Vikram Joshi",
				contact: "+91 9876543215",
				email: "pune@evaluna.in",
				status: "active",
				is_headquarters: false,
			},
			{
				id: 7,
				name: "Kolkata East Depot",
				code: "BR-KOL07",
				address: "Salt Lake Sector V, Kolkata, WB",
				manager: "Sneha Chatterjee",
				contact: "+91 9876543216",
				email: "kolkata@evaluna.in",
				status: "inactive",
				is_headquarters: false,
			},
			{
				id: 8,
				name: "Ahmedabad Trade Center",
				code: "BR-AHM08",
				address: "SG Highway, Ahmedabad, GJ",
				manager: "Karan Patel",
				contact: "+91 9876543217",
				email: "ahmedabad@evaluna.in",
				status: "active",
				is_headquarters: false,
			},
		];
	}),

	/** Create a new branch */
	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				code: z.string().optional(),
				address: z.string().optional(),
				phone: z.string().optional(),
				email: z.string().email().optional(),
				is_headquarters: z.boolean().optional().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Auto-generate code as BR-XXXX if not provided
			const code =
				input.code ??
				`BR-${Math.floor(1000 + Math.random() * 9000).toString()}`;

			const result = await ctx.db
				.insert(branches)
				.values({
					name: input.name,
					code,
					address: input.address ?? null,
					phone: input.phone ?? null,
					email: input.email ?? null,
					is_headquarters: input.is_headquarters ?? false,
				})
				.returning();

			return result[0];
		}),

	/** Get a branch by ID */
	getById: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const result = await ctx.db
				.select()
				.from(branches)
				.where(eq(branches.id, input.id));

			if (!result[0]) {
				throw new Error("Branch not found");
			}

			return result[0];
		}),

	/** Update a branch */
	update: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				name: z.string().min(1).optional(),
				code: z.string().optional(),
				address: z.string().optional(),
				phone: z.string().optional(),
				email: z.string().email().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, name, code, address, phone, email } = input;

			const updateData: Record<string, unknown> = {};
			if (name !== undefined) updateData.name = name;
			if (code !== undefined) updateData.code = code;
			if (address !== undefined) updateData.address = address;
			if (phone !== undefined) updateData.phone = phone;
			if (email !== undefined) updateData.email = email;

			if (Object.keys(updateData).length === 0) {
				throw new Error("No fields to update");
			}

			const result = await ctx.db
				.update(branches)
				.set(updateData)
				.where(eq(branches.id, id))
				.returning();

			if (!result[0]) {
				throw new Error("Branch not found");
			}

			return result[0];
		}),

	/** Delete a branch */
	delete: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const result = await ctx.db
				.delete(branches)
				.where(eq(branches.id, input.id))
				.returning();

			if (!result[0]) {
				throw new Error("Branch not found");
			}

			return result[0];
		}),

	/** Get branch inventory (joined with products) */
	getInventory: protectedProcedure
		.input(z.object({ branch_id: z.number() }))
		.query(async ({ ctx, input }) => {
			return ctx.db
				.select({
					id: branchInventory.id,
					branch_id: branchInventory.branch_id,
					product_id: branchInventory.product_id,
					in_stock: branchInventory.in_stock,
					reorder_level: branchInventory.reorder_level,
					created_at: branchInventory.created_at,
					product_name: products.name,
					product_sku: products.sku,
					product_price: products.price,
				})
				.from(branchInventory)
				.innerJoin(products, eq(branchInventory.product_id, products.id))
				.where(eq(branchInventory.branch_id, input.branch_id));
		}),
});
