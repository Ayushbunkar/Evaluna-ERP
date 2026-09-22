import { customerLedger, customers, deliveryRoutes, orders, routeStops, user } from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, ne } from "drizzle-orm";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { roleProcedure, router } from "../init";

const customerSchema = z
	.object({
		id: z.number(),
		customer_code: z.string().nullable(),
		name: z.string(),
		email: z.string().nullable().optional(),
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
		route_id: z.number().nullable().optional(),
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
			const rows = await db
				.select({
					id: customers.id,
					customer_code: customers.customer_code,
					name: customers.name,
					email: customers.email,
					phone: customers.phone,
					address: customers.address,
					status: customers.status,
					user_uid: customers.user_uid,
					branch_id: customers.branch_id,
					store_credit: customers.store_credit,
					loyalty_tier: customers.loyalty_tier,
					loyalty_points: customers.loyalty_points,
					tier_override: customers.tier_override,
					marketing_opt_in: customers.marketing_opt_in,
					created_at: customers.created_at,
					route_id: routeStops.route_id,
				})
				.from(customers)
				.leftJoin(routeStops, eq(customers.id, routeStops.customer_id))
				.where(
					ctx.user.branchId
						? eq(customers.branch_id, ctx.user.branchId)
						: undefined,
				);

			return rows.map((r) => ({
				...r,
				route_id: r.route_id || null,
			}));
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
						limit: 20,
						with: {
							orderItems: {
								with: {
									product: true,
								},
							},
						},
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
					lastOrderItems: [],
					route: null,
				};
			}

			// Get assigned route stop if any
			let route = null;
			try {
				const existingStops = await db
					.select()
					.from(routeStops)
					.where(eq(routeStops.customer_id, input.id))
					.limit(1);

				if (existingStops.length > 0 && existingStops[0].route_id) {
					const r = await db.query.deliveryRoutes.findFirst({
						where: eq(deliveryRoutes.id, existingStops[0].route_id),
					});
					if (r) {
						route = { id: r.id, name: r.name };
					}
				}
			} catch (e) {
				console.warn("[getById] Failed to query customer route:", e);
			}

			// Extract distinct last ordered items
			const lastOrderItemsMap = new Map<
				number,
				{
					id: number;
					productId: number;
					name: string;
					price: string;
					barcode?: string | null;
				}
			>();

			if (customer.orders) {
				for (const ord of customer.orders as any[]) {
					if (ord.orderItems) {
						for (const item of ord.orderItems) {
							if (item.product && !lastOrderItemsMap.has(item.product.id)) {
								lastOrderItemsMap.set(item.product.id, {
									id: item.product.id,
									productId: item.product.id,
									name: item.product.name,
									price: String(item.product.price || item.price || "0"),
									barcode: item.product.barcode,
								});
							}
						}
					}
				}
			}

			return {
				customer: {
					...customer,
					route_id: route?.id || null,
					route_name: route?.name || null,
				},
				ledger,
				lastOrderItems: Array.from(lastOrderItemsMap.values()),
				route,
			};
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
				email: z.string().email().optional().or(z.literal("")),
				phone: z.string().optional(),
				address: z.string().optional(),
				status: z.enum(["active", "inactive"]).optional(),
				marketing_opt_in: z.boolean().optional(),
				route_id: z.number().nullable().optional(),
			}),
		)
		.output(customerSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const { route_id, ...customerData } = input;
				const code = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
				const cleanEmail =
					customerData.email && customerData.email.trim().length > 0
						? customerData.email.trim().toLowerCase()
						: null;
				const [data] = await db
					.insert(customers)
					.values({
						...customerData,
						email: cleanEmail as any,
						customer_code: code,
						user_uid: ctx.user.id,
						branch_id: ctx.user.branchId ?? null,
					})
					.returning();

				if (route_id && data?.id) {
					try {
						await db.insert(routeStops).values({
							route_id: route_id,
							customer_id: data.id,
							sequence: 1,
						});
					} catch (routeErr) {
						console.warn("[customers.create] Failed to assign route:", routeErr);
					}
				}

				return { ...data, route_id: route_id || null };
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
				email: z.string().email().optional().or(z.literal("")),
				phone: z.string().optional(),
				address: z.string().optional(),
				status: z.enum(["active", "inactive"]).optional(),
				loyalty_tier: z.string().optional(),
				tier_override: z.boolean().optional(),
				marketing_opt_in: z.boolean().optional(),
				route_id: z.number().nullable().optional(),
			}),
		)
		.output(customerSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const { id, route_id, ...data } = input;
				const patch: any = { ...data, user_uid: ctx.user.id };
				if (data.email !== undefined) {
					patch.email =
						data.email && data.email.trim().length > 0
							? data.email.trim().toLowerCase()
							: null;
				}
				const [updated] = await db
					.update(customers)
					.set(patch)
					.where(
						and(
							eq(customers.id, id),
							ctx.user.branchId
								? eq(customers.branch_id, ctx.user.branchId)
								: undefined,
						),
					)
					.returning();

				if (route_id !== undefined && id) {
					try {
						const existingStops = await db
							.select()
							.from(routeStops)
							.where(eq(routeStops.customer_id, id))
							.limit(1);

						if (route_id) {
							if (existingStops.length > 0) {
								await db
									.update(routeStops)
									.set({ route_id: route_id })
									.where(eq(routeStops.id, existingStops[0].id));
							} else {
								await db.insert(routeStops).values({
									route_id: route_id,
									customer_id: id,
									sequence: 1,
								});
							}
						} else if (existingStops.length > 0) {
							await db
								.delete(routeStops)
								.where(eq(routeStops.id, existingStops[0].id));
						}
					} catch (routeErr) {
						console.warn("[customers.update] Failed to update route:", routeErr);
					}
				}

				return { ...updated, route_id: route_id || null };
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
		.input(
			z.object({
				id: z.number(),
				email: z.string().trim().toLowerCase().email().optional(),
			}),
		)
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

			let targetEmail = customer.email;
			if (!targetEmail && input.email) {
				const existingWithEmail = await db.query.customers.findFirst({
					where: and(
						eq(customers.email, input.email),
						ne(customers.id, input.id),
					),
				});
				if (existingWithEmail) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "This email is already associated with another customer",
					});
				}
				await db
					.update(customers)
					.set({ email: input.email })
					.where(eq(customers.id, input.id));
				targetEmail = input.email;
			}

			if (!targetEmail)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Customer has no email — please provide an email to create a login.",
				});

			const existing = await db
				.select({ id: user.id })
				.from(user)
				.where(eq(user.email, targetEmail))
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
					.where(eq(user.email, targetEmail));
				return {
					email: targetEmail,
					linked: true,
					temporaryPassword: null as string | null,
				};
			}

			// Create a fresh Better Auth login (same mechanism as user seeding).
			const temporaryPassword = `Ev-${crypto.randomUUID().slice(0, 8)}A9!`;
			const result = await auth.api.signUpEmail({
				body: {
					email: targetEmail,
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
				.where(eq(user.email, targetEmail));

			return { email: targetEmail, linked: false, temporaryPassword };
		}),
});
