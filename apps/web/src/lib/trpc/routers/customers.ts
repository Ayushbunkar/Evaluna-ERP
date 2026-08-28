import { customerLedger, customers, orders, user } from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { roleProcedure, router } from "../init";

const customerSchema = z
	.object({
		id: z.number(),
		customer_code: z.string().nullable(),
		name: z.string(),
		email: z.string(),
		phone: z.string().nullable(),
		address: z.string().nullable(),
		status: z.string().nullable(),
		user_uid: z.string(),
		store_credit: z.string().nullable(),
		loyalty_tier: z.string().nullable(),
		loyalty_points: z.number().nullable(),
		tier_override: z.boolean().nullable(),
		marketing_opt_in: z.boolean().nullable(),
		created_at: z.coerce.date().nullable(),
	})
	.passthrough();

export const customersRouter = router({
	list: roleProcedure(["admin", "manager", "auditor", "sales_person"])
		.meta({
			openapi: {
				method: "GET",
				path: "/customers",
				tags: ["Customers"],
				summary: "List all customers",
			},
		})
		.input(z.void())
		.output(z.array(customerSchema))
		.query(async ({ ctx }) => {
			return db
				.select()
				.from(customers)
				.where(
					ctx.user.branchId
						? eq(customers.branch_id, ctx.user.branchId)
						: undefined,
				);
		}),

	getById: roleProcedure(["admin", "manager", "auditor", "sales_person"])
		.meta({
			openapi: {
				method: "GET",
				path: "/customers/{id}",
				tags: ["Customers"],
				summary: "Get customer by ID",
			},
		})
		.input(z.object({ id: z.number() }))
		.output(z.any()) // Using any for complex relation type temporarily
		.query(async ({ ctx, input }) => {
			const customer = await db.query.customers.findFirst({
				where: and(
					eq(customers.id, input.id),
					ctx.user.branchId
						? eq(customers.branch_id, ctx.user.branchId)
						: undefined,
				),
				with: {
					orders: {
						orderBy: [desc(orders.created_at)],
						limit: 50,
					},
				},
			});

			const ledger = await db.query.customerLedger.findMany({
				where: eq(customerLedger.customer_id, input.id),
				orderBy: [desc(customerLedger.created_at)],
			});

			if (!customer) {
				return {
					customer: null,
					ledger: [],
				};
			}

			return { customer, ledger };
		}),

	create: roleProcedure(["admin", "manager", "auditor", "sales_person"])
		.meta({
			openapi: {
				method: "POST",
				path: "/customers",
				tags: ["Customers"],
				summary: "Create a customer",
			},
		})
		.input(
			z.object({
				name: z.string().min(1),
				email: z.string().email(),
				phone: z.string().optional(),
				address: z.string().optional(),
				status: z.enum(["active", "inactive"]).optional(),
				marketing_opt_in: z.boolean().optional(),
			}),
		)
		.output(customerSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const code = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
				const [data] = await db
					.insert(customers)
					.values({
						...input,
						customer_code: code,
						user_uid: ctx.user.id,
						branch_id: ctx.user.branchId ?? null,
					})
					.returning();
				return data;
			} catch (error: any) {
				if (
					error?.code === "23505" &&
					error?.constraint === "customers_email_unique"
				) {
					throw new Error("A customer with this email already exists.");
				}
				throw new Error(error?.message || "Failed to create customer");
			}
		}),

	update: roleProcedure(["admin", "manager", "auditor", "sales_person"])
		.meta({
			openapi: {
				method: "PATCH",
				path: "/customers/{id}",
				tags: ["Customers"],
				summary: "Update a customer",
			},
		})
		.input(
			z.object({
				id: z.number(),
				name: z.string().min(1).optional(),
				email: z.string().email().optional(),
				phone: z.string().optional(),
				address: z.string().optional(),
				status: z.enum(["active", "inactive"]).optional(),
				loyalty_tier: z.string().optional(),
				tier_override: z.boolean().optional(),
				marketing_opt_in: z.boolean().optional(),
			}),
		)
		.output(customerSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const { id, ...data } = input;
				const [updated] = await db
					.update(customers)
					.set({ ...data, user_uid: ctx.user.id })
					.where(
						and(
							eq(customers.id, id),
							ctx.user.branchId
								? eq(customers.branch_id, ctx.user.branchId)
								: undefined,
						),
					)
					.returning();
				return updated;
			} catch (error: any) {
				if (
					error?.code === "23505" &&
					error?.constraint === "customers_email_unique"
				) {
					throw new Error("A customer with this email already exists.");
				}
				throw new Error(error?.message || "Failed to update customer");
			}
		}),

	adjustLedger: roleProcedure(["admin", "manager", "auditor", "sales_person"])
		.meta({
			openapi: {
				method: "POST",
				path: "/customers/{id}/ledger",
				tags: ["Customers"],
				summary: "Adjust customer ledger",
			},
		})
		.input(
			z.object({
				id: z.number(),
				type: z.enum(["points", "credit"]),
				amount: z.number(),
				reason: z.string().min(1),
			}),
		)
		.output(z.object({ success: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			const customer = await db.query.customers.findFirst({
				where: and(
					eq(customers.id, input.id),
					ctx.user.branchId
						? eq(customers.branch_id, ctx.user.branchId)
						: undefined,
				),
			});
			if (!customer) throw new Error("Customer not found");

			await db.insert(customerLedger).values({
				customer_id: input.id,
				type: input.type,
				amount: input.amount.toString(),
				reason: input.reason,
			});

			if (input.type === "credit") {
				const newCredit =
					Number.parseFloat(customer.store_credit || "0") + input.amount;
				await db
					.update(customers)
					.set({ store_credit: newCredit.toString() })
					.where(eq(customers.id, input.id));
			} else if (input.type === "points") {
				const newPoints = (customer.loyalty_points || 0) + input.amount;
				await db
					.update(customers)
					.set({ loyalty_points: newPoints })
					.where(eq(customers.id, input.id));
			}

			return { success: true };
		}),

	delete: roleProcedure(["admin", "manager", "auditor", "sales_person"])
		.meta({
			openapi: {
				method: "DELETE",
				path: "/customers/{id}",
				tags: ["Customers"],
				summary: "Delete a customer",
			},
		})
		.input(z.object({ id: z.number() }))
		.output(z.object({ success: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			await db
				.delete(customers)
				.where(
					and(
						eq(customers.id, input.id),
						ctx.user.branchId
							? eq(customers.branch_id, ctx.user.branchId)
							: undefined,
					),
				);
			return { success: true };
		}),

	// ── Provision a customer self-service login ───────────────────────────────
	// Creates (or links) a Better Auth `user` with role="customer" whose email
	// matches the customer record — this is the linkage `customerProcedure` uses
	// to resolve ctx.customer. Idempotent: if a login already exists for the email
	// it is (re)linked to role="customer" instead of erroring. The temporary
	// password is returned ONCE for the staff member to hand to the customer.
	provisionLogin: roleProcedure(["admin", "manager", "sales_person"])
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const customer = await db.query.customers.findFirst({
				where: and(
					eq(customers.id, input.id),
					ctx.user.branchId
						? eq(customers.branch_id, ctx.user.branchId)
						: undefined,
				),
			});
			if (!customer)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Customer not found",
				});
			if (!customer.email)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Customer has no email — add one before creating a login.",
				});

			const existing = await db
				.select({ id: user.id })
				.from(user)
				.where(eq(user.email, customer.email))
				.limit(1);

			// Already has a login → just (re)link it to the customer role + branch.
			if (existing.length > 0) {
				await db
					.update(user)
					.set({
						role: "customer",
						branch_id: customer.branch_id ?? null,
						is_active: true,
					} as any)
					.where(eq(user.email, customer.email));
				return {
					email: customer.email,
					linked: true,
					temporaryPassword: null as string | null,
				};
			}

			// Create a fresh Better Auth login (same mechanism as user seeding).
			const temporaryPassword = `Ev-${crypto.randomUUID().slice(0, 8)}A9!`;
			const result = await auth.api.signUpEmail({
				body: {
					email: customer.email,
					password: temporaryPassword,
					name: customer.name,
				},
			});
			if (!result)
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create the customer login.",
				});

			await db
				.update(user)
				.set({
					role: "customer",
					branch_id: customer.branch_id ?? null,
					is_active: true,
				} as any)
				.where(eq(user.email, customer.email));

			return { email: customer.email, linked: false, temporaryPassword };
		}),
});
