import {
	auditLogs,
	branchInventory,
	customers,
	deliveryRoutes,
	deliveryStops,
	deliveryTrips,
	eWayBills,
	loyaltyHistory,
	notifications,
	orderAudits,
	orderItems,
	orders,
	packLists,
	paymentMethods,
	pendingSync,
	pickListItems,
	pickLists,
	products,
	proofOfDeliveries,
	routeStops,
	salesReturnItems,
	salesReturns,
	staff,
	stockLedger,
	transactions,
	tripStops,
} from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import {
	and,
	count,
	desc,
	eq,
	gte,
	ilike,
	inArray,
	isNotNull,
	lte,
	ne,
	notInArray,
	or,
	sql,
} from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { notifyOrderCreated } from "@/lib/notification-service";
import { protectedProcedure, roleProcedure, router } from "../init";

const orderWithCustomerSchema = z.object({
	id: z.number(),
	customer_id: z.number().nullable(),
	total_amount: z.string(),
	status: z.string().nullable(),
	driver_id: z.number().nullable().optional(),
	finance_status: z.string().nullable().optional(),
	user_uid: z.string(),
	created_at: z.coerce.date().nullable(),
	customer: z
		.object({
			id: z.number().optional(),
			name: z.string(),
			phone: z.string().nullable().optional(),
			address: z.string().nullable().optional(),
		})
		.nullable(),
	route: z
		.object({
			id: z.number(),
			name: z.string(),
		})
		.nullable()
		.optional(),
});

const salesDashboardSummarySchema = z.object({
	todaySales: z.number(),
	dailyGoal: z.number(),
	progress: z.number(),
	recentOrders: z.array(
		z.object({
			id: z.number(),
			total_amount: z.string(),
			status: z.string().nullable(),
			created_at: z.coerce.date().nullable(),
			customer: z
				.object({
					name: z.string(),
				})
				.nullable(),
		}),
	),
});

const orderDetailSchema = z.object({
	id: z.number(),
	customer_id: z.number().nullable(),
	total_amount: z.string(),
	status: z.string().nullable(),
	finance_status: z.string().nullable().optional(),
	discount_amount: z.string().nullable().optional(),
	discount_reason: z.string().nullable().optional(),
	other_charges: z.string().nullable().optional(),
	other_charges_reason: z.string().nullable().optional(),
	cgst_amount: z.string().nullable().optional(),
	sgst_amount: z.string().nullable().optional(),
	igst_amount: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
	user_uid: z.string(),
	created_at: z.coerce.date().nullable(),
	original_items: z.any().nullable().optional(),
	customer: z
		.object({
			id: z.number().optional(),
			name: z.string(),
			phone: z.string().nullable().optional(),
			address: z.string().nullable().optional(),
			customer_code: z.string().nullable().optional(),
		})
		.nullable(),
	driver: z
		.object({
			id: z.number().optional(),
			name: z.string().optional(),
			phone: z.string().nullable().optional(),
			email: z.string().nullable().optional(),
		})
		.nullable()
		.optional(),
	route: z
		.object({
			id: z.number(),
			name: z.string(),
			code: z.string().nullable().optional(),
		})
		.nullable()
		.optional(),
	orderItems: z.array(
		z.object({
			id: z.number(),
			product_id: z.number().nullable(),
			quantity: z.number(),
			price: z.string(),
			product: z
				.object({
					name: z.string(),
					category: z.string().nullable().optional(),
					sku: z.string().nullable().optional(),
					unit: z.string().nullable().optional(),
				})
				.nullable(),
		}),
	),
	deliveryHandover: z.any().nullable().optional(),
	audits: z.any().nullable().optional(),
});

export const ordersRouter = router({
	get: roleProcedure(["admin", "manager", "auditor", "sales_person"])
		.meta({
			openapi: {
				method: "GET",
				path: "/orders/{id}",
				tags: ["Orders"],
				summary: "Get order details",
			},
		})
		.input(z.object({ id: z.number() }))
		.output(orderDetailSchema.nullable())
		.query(async ({ ctx, input }) => {
			const result = await db.query.orders.findFirst({
				where: eq(orders.id, input.id),
				with: {
					customer: {
						columns: {
							id: true,
							name: true,
							phone: true,
							address: true,
							customer_code: true,
						},
					},
					orderItems: {
						with: {
							product: {
								columns: {
									name: true,
									category: true,
									sku: true,
									unit: true,
								},
							},
						},
					},
				},
			});

			if (!result) return null;

			let route: any = null;
			let assignedDriver: any = null;
			let activeTripStop: any = null;

			// Check if this customer / order is part of an active delivery trip
			if (result.customer_id) {
				try {
					const [ts] = await db
						.select({
							stopId: tripStops.id,
							tripId: tripStops.trip_id,
							stopStatus: tripStops.status,
							routeId: deliveryTrips.route_id,
							driverId: deliveryTrips.driver_id,
							tripStatus: deliveryTrips.status,
						})
						.from(tripStops)
						.innerJoin(deliveryTrips, eq(tripStops.trip_id, deliveryTrips.id))
						.where(
							and(
								eq(tripStops.customer_id, result.customer_id),
								ne(deliveryTrips.status, "cancelled")
							)
						)
						.orderBy(desc(tripStops.created_at))
						.limit(1);

					if (ts) {
						activeTripStop = ts;
						if (ts.routeId) {
							const r = await db.query.deliveryRoutes.findFirst({
								where: eq(deliveryRoutes.id, ts.routeId),
							});
							if (r) {
								route = { id: r.id, name: r.name, code: r.code };
							}
						}
						if (ts.driverId) {
							const dId = Number(ts.driverId);
							if (!isNaN(dId)) {
								assignedDriver = await db.query.staff.findFirst({
									where: eq(staff.id, dId),
								});
							}
						}
					}
				} catch (e) {}
			}

			// Fallback: If no active trip route, check master customer route assignment
			if (!route && result.customer_id) {
				try {
					const [rs] = await db
						.select()
						.from(routeStops)
						.where(eq(routeStops.customer_id, result.customer_id))
						.limit(1);

					if (rs && rs.route_id) {
						const r = await db.query.deliveryRoutes.findFirst({
							where: eq(deliveryRoutes.id, rs.route_id),
						});
						if (r) {
							route = { id: r.id, name: r.name, code: r.code };
						}
					}
				} catch (e) {}
			}

			// Fallback for driver directly attached to order
			if (!assignedDriver && result.driver_id) {
				try {
					assignedDriver = await db.query.staff.findFirst({
						where: eq(staff.id, result.driver_id),
					});
				} catch (e) {}
			}

			// Fetch Proof of Delivery & Delivery Handover Details
			let deliveryHandover: any = null;
			try {
				const [pod] = await db
					.select()
					.from(proofOfDeliveries)
					.where(eq(proofOfDeliveries.order_id, input.id))
					.orderBy(desc(proofOfDeliveries.created_at))
					.limit(1);

				const txns = await db.query.transactions.findMany({
					where: eq(transactions.order_id, input.id),
					orderBy: [desc(transactions.created_at)],
				});

				// ONLY create deliveryHandover if POD actually exists OR order status is completed
				if (pod || result.status === "completed") {
					let parsedNotes = pod?.notes || result.notes || "";
					let parsedReturns: any[] = [];
					let parsedDeliveredItems: any[] = [];
					let cashAmount = 0;
					let onlineAmount = 0;

					if (pod?.notes) {
						try {
							const p = JSON.parse(pod.notes);
							parsedNotes = p.deliveryNotes || "";
							if (Array.isArray(p.returns) && p.returns.length > 0) {
								parsedReturns = p.returns;
							}
							if (Array.isArray(p.deliveredItems) && p.deliveredItems.length > 0) {
								parsedDeliveredItems = p.deliveredItems;
							}
							if (p.cashAmount) cashAmount = Number(p.cashAmount);
							if (p.onlineAmount) onlineAmount = Number(p.onlineAmount);
						} catch {
							parsedNotes = pod.notes;
						}
					}

					// Fallback: If legacy POD notes JSON has no deliveredItems, construct from orderItems or original_items
					if (parsedDeliveredItems.length === 0) {
						if (result.orderItems && result.orderItems.length > 0) {
							parsedDeliveredItems = result.orderItems.map((oi: any) => ({
								id: oi.id,
								name: oi.product?.name || `Item #${oi.product_id}`,
								qty: oi.quantity,
								price: Number(oi.price || 0),
							}));
						} else if (Array.isArray(result.original_items) && result.original_items.length > 0) {
							parsedDeliveredItems = result.original_items.map((oi: any) => ({
								id: oi.id || Math.random(),
								name: oi.name || oi.product?.name || `Item #${oi.id || oi.product_id}`,
								qty: Number(oi.quantity || 1),
								price: Number(oi.price || 0),
							}));
						}
					}

					// Also check tripCollections for actual driver cash & online split
					let tripCols: any[] = [];
					if (result.customer_id) {
						try {
							tripCols = await db.query.tripCollections.findMany({
								where: eq(tripCollections.customer_id, result.customer_id),
								orderBy: [desc(tripCollections.collected_at)],
							});
						} catch (e) {}
					}

					if (tripCols.length > 0) {
						let tcCash = 0;
						let tcOnline = 0;
						for (const tc of tripCols) {
							const amt = Number(tc.amount || 0);
							const meth = (tc.payment_method || "").toLowerCase();
							if (meth.includes("cash")) {
								tcCash += amt;
							} else {
								tcOnline += amt;
							}
						}
						if (tcCash > 0 || tcOnline > 0) {
							cashAmount = tcCash;
							onlineAmount = tcOnline;
						}
					}

					// Fallback to transactions if amounts not parsed
					if (cashAmount === 0 && onlineAmount === 0 && txns.length > 0) {
						for (const t of txns) {
							const amt = Number(t.amount || 0);
							if (
								t.reference_type === "driver_cash_collection" ||
								t.description?.toLowerCase().includes("cash")
							) {
								cashAmount += amt;
							} else {
								onlineAmount += amt;
							}
						}
					}

					deliveryHandover = {
						deliveredAt: pod?.delivered_at || pod?.created_at || (result.status === "completed" ? result.updated_at : null),
						deliveryStatus:
							pod?.delivery_status ||
							(result.status === "completed" ? "delivered" : "pending"),
						driverName: assignedDriver?.name || null,
						driverEmail: assignedDriver?.email || null,
						driverPhone: assignedDriver?.phone || null,
						deliveryNotes: parsedNotes,
						returnedItems: parsedReturns,
						deliveredItems: parsedDeliveredItems,
						cashCollected: cashAmount,
						onlineCollected: onlineAmount,
						totalCollected:
							cashAmount + onlineAmount > 0
								? cashAmount + onlineAmount
								: Number(result.total_amount || 0),
						transactions: txns.map((t) => ({
							id: t.id,
							amount: Number(t.amount || 0),
							type: t.reference_type || t.category || "Payment",
							status: t.status,
							date: t.created_at ? new Date(t.created_at).toLocaleString() : "—",
						})),
					};
				}
			} catch (e) {
				console.warn("[orders.get] POD fetch fallback:", e);
			}

			// Fetch order audits history
			let audits: any[] = [];
			try {
				audits = await db.query.orderAudits.findMany({
					where: eq(orderAudits.order_id, input.id),
					orderBy: [desc(orderAudits.created_at)],
				});
			} catch (e) {}

			return {
				...result,
				driver: assignedDriver
					? {
							id: assignedDriver.id,
							name: assignedDriver.name,
							phone: assignedDriver.phone,
							email: assignedDriver.email,
					  }
					: null,
				route,
				deliveryHandover,
				audits,
			};
		}),

	getDashboardSummary: roleProcedure([
		"admin",
		"manager",
		"auditor",
		"sales_person",
		"salesperson",
		"sales",
	])
		.meta({
			openapi: {
				method: "GET",
				path: "/orders/dashboard-summary",
				tags: ["Orders"],
				summary: "Get lightweight sales dashboard summary",
			},
		})
		.input(z.void())
		.output(salesDashboardSummarySchema)
		.query(async ({ ctx }) => {
			const branchId = ctx.user?.branchId ?? null;
			const privilegedRoles = [
				"admin",
				"super_admin",
				"manager",
				"finance",
				"warehouse_manager",
				"accountant",
			];
			const isPrivileged =
				ctx.user?.isSuperadmin ||
				Boolean(ctx.user?.role && privilegedRoles.includes(ctx.user.role));

			const baseScope = isPrivileged
				? branchId
					? eq(orders.branch_id, branchId)
					: undefined
				: branchId
					? and(
							eq(orders.branch_id, branchId),
							eq(orders.user_uid, ctx.user?.id),
						)
					: eq(orders.user_uid, ctx.user?.id);

			const startOfToday = new Date();
			startOfToday.setHours(0, 0, 0, 0);

			const endOfToday = new Date();
			endOfToday.setHours(23, 59, 59, 999);

			// Fetch individual staff monthly sales target if available
			let dailyGoal = 50000;
			try {
				if (ctx.user?.email) {
					const [staffRecord] = await db
						.select({ monthly_sales_target: staff.monthly_sales_target })
						.from(staff)
						.where(eq(staff.email, ctx.user.email))
						.limit(1);

					if (staffRecord?.monthly_sales_target) {
						const monthlyTarget = Number(staffRecord.monthly_sales_target);
						if (monthlyTarget > 0) {
							dailyGoal = Math.round(monthlyTarget / 30);
						}
					}
				}
			} catch (err) {
				console.error("Failed to fetch staff sales target:", err);
			}

			const [[salesAgg], recentOrdersList] = await Promise.all([
				db
					.select({
						todayTotal: sql<string>`coalesce(sum(${orders.total_amount}), 0)`,
					})
					.from(orders)
					.where(
						and(
							baseScope,
							gte(orders.created_at, startOfToday),
							lte(orders.created_at, endOfToday),
						),
					),
				db.query.orders.findMany({
					where: baseScope,
					orderBy: [desc(orders.created_at)],
					limit: 5,
					columns: {
						id: true,
						total_amount: true,
						status: true,
						created_at: true,
					},
					with: {
						customer: {
							columns: {
								name: true,
							},
						},
					},
				}),
			]);

			const todaySales = Number(salesAgg?.todayTotal) || 0;
			const progress = Math.min(Math.round((todaySales / dailyGoal) * 100), 100);

			return {
				todaySales,
				dailyGoal,
				progress,
				recentOrders: recentOrdersList,
			};
		}),

	list: roleProcedure([
		"admin",
		"manager",
		"auditor",
		"sales_person",
		"salesperson",
		"sales",
		"biller",
		"cashier",
	])
		.meta({
			openapi: {
				method: "GET",
				path: "/orders",
				tags: ["Orders"],
				summary: "List all orders",
			},
		})
		.input(
			z
				.object({
					page: z.number().int().min(1).optional(),
					limit: z.number().int().min(1).max(500).optional(),
					search: z.string().optional(),
					status: z.string().optional(),
				})
				.optional(),
		)
		.output(z.array(orderWithCustomerSchema))
		.query(async ({ ctx, input }) => {
			const branchId = ctx.user?.branchId ?? null;
			const privilegedRoles = [
				"admin",
				"super_admin",
				"manager",
				"finance",
				"warehouse_manager",
				"accountant",
			];
			const isPrivileged =
				ctx.user?.isSuperadmin ||
				Boolean(ctx.user?.role && privilegedRoles.includes(ctx.user.role));

			const baseScope = branchId
				? isPrivileged
					? eq(orders.branch_id, branchId)
					: and(
							eq(orders.branch_id, branchId),
							eq(orders.user_uid, ctx.user?.id),
						)
				: isPrivileged
					? undefined
					: eq(orders.user_uid, ctx.user?.id);

			const { page = 1, limit = 50, search, status } = input || {};
			const conditions = [];
			if (baseScope) conditions.push(baseScope);

			// Server-side status filter
			if (status && status !== "all") {
				if (status === "confirmed") {
					conditions.push(
						inArray(orders.status, [
							"confirmed",
							"billed",
							"ready_for_dispatch",
							"in_transit",
						]),
					);
				} else if (status === "pending_review") {
					conditions.push(
						inArray(orders.status, [
							"pending",
							"pending_review",
							"under_review",
						]),
					);
				} else if (status === "completed") {
					conditions.push(
						inArray(orders.status, ["completed", "delivered"]),
					);
				} else if (status === "cancelled") {
					conditions.push(eq(orders.status, "cancelled"));
				} else {
					conditions.push(eq(orders.status, status));
				}
			}

			// Server-side search filter (order ID or customer name)
			if (search?.trim()) {
				const term = `%${search.trim().toLowerCase()}%`;
				conditions.push(
					or(
						ilike(customers.name, term),
						sql`${orders.id}::text ILIKE ${term}`,
					)!,
				);
			}

			const offset = (page - 1) * limit;

			const rows = await db
				.select({
					id: orders.id,
					customer_id: orders.customer_id,
					total_amount: orders.total_amount,
					status: orders.status,
					driver_id: orders.driver_id,
					finance_status: orders.finance_status,
					user_uid: orders.user_uid,
					created_at: orders.created_at,
					customer_id_val: customers.id,
					customer_name: customers.name,
					customer_phone: customers.phone,
					customer_address: customers.address,
				})
				.from(orders)
				.leftJoin(customers, eq(orders.customer_id, customers.id))
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(desc(orders.created_at), desc(orders.id))
				.limit(limit)
				.offset(offset);

			// Safely resolve customer delivery routes without multiplying order rows
			const customerIds = Array.from(
				new Set(rows.map((r) => r.customer_id).filter(Boolean)),
			) as number[];
			const customerRouteMap = new Map<number, { id: number; name: string }>();

			if (customerIds.length > 0) {
				try {
					const stops = await db
						.select({
							customer_id: routeStops.customer_id,
							route_id: deliveryRoutes.id,
							route_name: deliveryRoutes.name,
						})
						.from(routeStops)
						.innerJoin(
							deliveryRoutes,
							eq(deliveryRoutes.id, routeStops.route_id),
						)
						.where(inArray(routeStops.customer_id, customerIds));

					for (const s of stops) {
						if (!customerRouteMap.has(s.customer_id)) {
							customerRouteMap.set(s.customer_id, {
								id: s.route_id,
								name: s.route_name,
							});
						}
					}
				} catch (e) {
					// Soft fallback if route tables aren't reachable
				}
			}

			// Ensure deduplicated unique orders
			const seenOrderIds = new Set<number>();
			const uniqueOrders = [];

			for (const r of rows) {
				if (seenOrderIds.has(r.id)) continue;
				seenOrderIds.add(r.id);

				const route = r.customer_id
					? customerRouteMap.get(r.customer_id) ?? null
					: null;

				uniqueOrders.push({
					id: r.id,
					customer_id: r.customer_id,
					total_amount: r.total_amount,
					status: r.status,
					driver_id: r.driver_id ?? null,
					finance_status: r.finance_status ?? undefined,
					user_uid: r.user_uid,
					created_at: r.created_at,
					customer: r.customer_name
						? {
								id: r.customer_id_val ?? undefined,
								name: r.customer_name,
								phone: r.customer_phone ?? null,
								address: r.customer_address ?? null,
							}
						: null,
					route,
				});
			}

			return uniqueOrders;
		}),

	create: roleProcedure(["admin", "manager", "auditor", "sales_person"])
		.meta({
			openapi: {
				method: "POST",
				path: "/orders",
				tags: ["Orders"],
				summary: "Create an order with items",
			},
		})
		.input(
			z.object({
				customerId: z.number(),
				paymentMethodId: z.number(),
				products: z.array(
					z.object({
						id: z.number(),
						quantity: z.number().int().positive(),
						price: z.number().int(),
					}),
				),
				total: z.number().int(),
			}),
		)
		.output(orderWithCustomerSchema)
		.mutation(async ({ ctx, input }) => {
			return db.transaction(async (tx: any) => {
				const [orderData] = await tx
					.insert(orders)
					.values({
						customer_id: input.customerId,
						total_amount: input.total.toString(),
						user_uid: ctx.user.id,
						status: "completed",
					})
					.returning();

				await tx.insert(orderItems).values(
					input.products.map((product) => ({
						order_id: orderData.id,
						product_id: product.id,
						quantity: product.quantity,
						price: product.price.toString(),
					})),
				);

				// Create Picking List task for Picker queue
				const [pl] = await tx
					.insert(pickLists)
					.values({
						order_id: orderData.id,
						reference_type: "sale",
						reference_id: orderData.id,
						status: "pending",
						priority: "normal",
					})
					.returning();

				if (pl && input.products.length > 0) {
					await tx.insert(pickListItems).values(
						input.products.map((p) => ({
							pick_list_id: pl.id,
							product_id: p.id,
							quantity_ordered: p.quantity,
							quantity_picked: 0,
							status: "pending",
						})),
					);
				}

				// Validate and Reserve stock in branch inventory (assuming branch_id = ctx.user.branchId or 1)
				const branchId = ctx.user?.branchId || 1;
				const productIds = input.products.map((p) => p.id);

				const inventoryRecords = await tx
					.select()
					.from(branchInventory)
					.where(
						and(
							eq(branchInventory.branch_id, branchId),
							inArray(branchInventory.product_id, productIds),
						),
					);

				const inventoryMap = new Map(
					inventoryRecords.map((inv: any) => [inv.product_id, inv]),
				);

				for (const product of input.products) {
					let inv: any = inventoryMap.get(product.id);

					if (!inv) {
						const [newInv] = await tx
							.insert(branchInventory)
							.values({
								branch_id: branchId,
								product_id: product.id,
								in_stock: 10000,
								reserved_stock: product.quantity,
								reorder_level: 10,
							})
							.returning();
						inv = newInv;
						inventoryMap.set(product.id, inv);
					} else {
						await tx
							.update(branchInventory)
							.set({
								reserved_stock: (inv.reserved_stock || 0) + product.quantity,
							})
							.where(eq(branchInventory.id, inv.id));
					}
				}

				// Audit Log
				await tx.insert(auditLogs).values({
					user_id: 1, // Assuming admin or current user
					action: "CREATE_ORDER",
					entity_type: "orders",
					entity_id: orderData.id,
					new_values: { orderData, items: input.products },
				});

				// Resolve safe payment method to prevent foreign key constraint violations
				let resolvedPaymentMethodId: number | null = null;
				if (input.paymentMethodId) {
					const [method] = await tx
						.select({ id: paymentMethods.id })
						.from(paymentMethods)
						.where(eq(paymentMethods.id, input.paymentMethodId))
						.limit(1);
					if (method) {
						resolvedPaymentMethodId = method.id;
					}
				}

				await tx.insert(transactions).values({
					order_id: orderData.id,
					payment_method_id: resolvedPaymentMethodId,
					amount: input.total.toString(),
					original_amount: input.total.toString(),
					adjustment_amount: "0",
					reconciliation_status: "pending",
					user_uid: ctx.user.id,
					status: "completed",
					category: "selling",
					type: "income",
					reference_type: "order",
					reference_id: orderData.id,
					description: `Payment for order #${orderData.id}`,
				});

				const customer = input.customerId
					? await tx.query.customers.findFirst({
							where: eq(customers.id, input.customerId),
							columns: { name: true },
						})
					: null;

				return { ...orderData, customer: customer ?? null };
			});

			// Fire-and-forget: notify pickers in the branch about the new order
			try {
				const branchId = ctx.user?.branchId || 1;
				const customerName = (result as any).customer?.name || "Customer";
				void notifyOrderCreated({
					orderId: (result as any).id,
					customerName,
					branchId,
				});
			} catch (notifErr) {
				console.warn("[orders.create] Picker notification error:", notifErr);
			}

			return result;
		}),

	update: roleProcedure(["admin", "manager", "auditor", "sales_person"])
		.meta({
			openapi: {
				method: "PATCH",
				path: "/orders/{id}",
				tags: ["Orders"],
				summary: "Update an order",
			},
		})
		.input(
			z.object({
				id: z.number(),
				status: z.enum(["completed", "pending", "cancelled"]).optional(),
			}),
		)
		.output(orderWithCustomerSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const updateData: any = { ...data };

			const [updated] = await db
				.update(orders)
				.set(updateData)
				.where(eq(orders.id, id))
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Order not found",
				});
			}

			// Synchronize associated WMS picklist status with the new order status
			if (updated.status === "completed") {
				const existingPickList = await db.query.pickLists.findFirst({
					where: eq(pickLists.order_id, updated.id),
				});

				if (existingPickList) {
					await db
						.update(pickLists)
						.set({
							status:
								updated.status === "completed"
									? "pending"
									: updated.status === "cancelled"
										? "cancelled"
										: "pending",
						})
						.where(eq(pickLists.order_id, updated.id));
				} else {
					// Create Picklist for warehouse picker queue
					const [pl] = await db
						.insert(pickLists)
						.values({
							order_id: updated.id,
							reference_type: "sale",
							reference_id: updated.id,
							status: "pending",
							priority: "normal",
						})
						.returning();

					const items = await db
						.select()
						.from(orderItems)
						.where(eq(orderItems.order_id, updated.id));

					if (pl && items.length > 0) {
						await db.insert(pickListItems).values(
							items.map((it) => ({
								pick_list_id: pl.id,
								product_id: it.product_id,
								quantity_ordered: it.quantity,
								quantity_picked: 0,
								status: "pending",
							})),
						);
					}
				}
			}

			const customer = updated?.customer_id
				? await db.query.customers.findFirst({
						where: eq(customers.id, updated.customer_id),
						columns: { name: true },
					})
				: null;

			return { ...updated, customer: customer ?? null };
		}),

	delete: roleProcedure(["admin", "manager"])
		.meta({
			openapi: {
				method: "DELETE",
				path: "/orders/{id}",
				tags: ["Orders"],
				summary: "Delete an order and its items",
			},
		})
		.input(z.object({ id: z.number() }))
		.output(z.object({ success: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			await db.transaction(async (tx: any) => {
				await tx
					.delete(transactions)
					.where(eq(transactions.order_id, input.id));
				await tx.delete(orderItems).where(eq(orderItems.order_id, input.id));
				await tx
					.delete(stockLedger)
					.where(
						and(
							eq(stockLedger.reference_id, input.id),
							eq(stockLedger.reference_type, "sale"),
						),
					);
				await tx
					.delete(pendingSync)
					.where(
						and(
							eq(pendingSync.entity_id, input.id),
							eq(pendingSync.entity_type, "order"),
						),
					);
				await tx
					.delete(auditLogs)
					.where(
						and(
							eq(auditLogs.entity_id, input.id),
							eq(auditLogs.entity_type, "orders"),
						),
					);
				await tx.delete(eWayBills).where(eq(eWayBills.order_id, input.id));
				const sRet = await tx
					.select({ id: salesReturns.id })
					.from(salesReturns)
					.where(eq(salesReturns.order_id, input.id));
				if (sRet.length > 0) {
					const ids = sRet.map((s: any) => s.id);
					await tx
						.delete(salesReturnItems)
						.where(inArray(salesReturnItems.return_id, ids));
				}
				await tx
					.delete(salesReturns)
					.where(eq(salesReturns.order_id, input.id));

				const pList = await tx
					.select({ id: pickLists.id })
					.from(pickLists)
					.where(eq(pickLists.order_id, input.id));
				if (pList.length > 0) {
					const ids = pList.map((p: any) => p.id);
					await tx
						.delete(pickListItems)
						.where(inArray(pickListItems.pick_list_id, ids));
					await tx
						.delete(packLists)
						.where(inArray(packLists.pick_list_id, ids));
				}
				await tx.delete(pickLists).where(eq(pickLists.order_id, input.id));

				await tx
					.delete(loyaltyHistory)
					.where(eq(loyaltyHistory.reference_id, String(input.id)));
				await tx.delete(orderAudits).where(eq(orderAudits.order_id, input.id));
				await tx
					.delete(proofOfDeliveries)
					.where(eq(proofOfDeliveries.order_id, input.id));
				await tx
					.delete(deliveryStops)
					.where(eq(deliveryStops.order_id, input.id));

				await tx
					.delete(orders)
					.where(
						and(eq(orders.id, input.id), eq(orders.user_uid, ctx.user.id)),
					);
			});
			return { success: true };
		}),

	// ════════════════════════════════════════════════════════════════════════
	// Salesperson-side: customer-order review & confirmation workflow.
	// Customer-submitted orders arrive as `pending_review` (see customer.ts) with
	// NO pricing. A salesperson opens one (→ under_review), edits items + applies
	// ERP pricing, then CONFIRMs — a transactional finalize that generates the
	// bill, deducts branch stock, writes the ledger + income transaction + audit,
	// and locks the order. Prices become customer-visible ONLY once confirmed.
	// ════════════════════════════════════════════════════════════════════════

	// PLACEHOLDER_SALES_PROCS

	// Inbox — customer orders awaiting a salesperson (pending_review/under_review).
	listPendingReview: roleProcedure([
		"admin",
		"manager",
		"sales_person",
		"salesperson",
		"sales",
		"biller",
		"cashier",
	])
		.input(z.void())
		.query(async ({ ctx }) => {
			const branchId = ctx.user?.branchId ?? null;

			const rows = await db.query.orders.findMany({
				where: and(
					inArray(orders.status, ["pending_review", "under_review"]),
					branchId
						? or(eq(orders.branch_id, branchId), sql`${orders.branch_id} IS NULL`)
						: undefined,
				),
				orderBy: [desc(orders.created_at)],
				limit: 300,
				with: {
					customer: {
						columns: { id: true, name: true, phone: true, customer_code: true },
					},
					orderItems: { columns: { id: true } },
				},
			});
			return rows.map((o) => {
				let reviewedBy: string | null = null;
				if (o.notes) {
					const match = o.notes.match(/\[REVIEWED_BY:\s*([^\]]+)\]/);
					if (match && match[1]) {
						reviewedBy = match[1].trim();
					}
				}
				return {
					id: o.id,
					orderRef: `ORD-${o.id}`,
					status: o.status,
					customerName: o.customer?.name ?? "—",
					customerPhone: o.customer?.phone ?? null,
					customerCode: o.customer?.customer_code ?? null,
					itemsCount: o.orderItems.length,
					createdAt: o.created_at,
					reviewedBy,
				};
			});
		}),
	getPendingCount: roleProcedure([
		"admin",
		"manager",
		"sales_person",
		"salesperson",
		"sales",
		"biller",
		"cashier",
	])
		.input(z.void())
		.query(async ({ ctx }) => {
			const branchId = ctx.user?.branchId ?? null;
			const [row] = await db
				.select({ c: count() })
				.from(orders)
				.where(
					branchId
						? and(
								inArray(orders.status, ["pending_review", "under_review"]),
								or(
									eq(orders.branch_id, branchId),
									sql`${orders.branch_id} IS NULL`,
								),
							)
						: inArray(orders.status, ["pending_review", "under_review"]),
				);
			return Number(row?.c ?? 0);
		}),

	// PLACEHOLDER_SALES_PROCS_2

	// Full detail for the review screen — includes customer contact + ERP price
	// suggestions so the salesperson can quote. Staff-only, so pricing is fine here.
	getForReview: roleProcedure(["admin", "manager", "sales_person"])
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const order = await db.query.orders.findFirst({
				where: eq(orders.id, input.id),
				with: {
					customer: true,
					orderItems: {
						with: {
							product: {
								columns: {
									id: true,
									name: true,
									category: true,
									unit: true,
									sku: true,
									buying_price: true,
									price: true,
								},
							},
						},
					},
				},
			});
			if (!order)
				throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });

			let reviewedBy: string | null = null;
			const notesText = order.notes || "";
			const match = notesText.match(/\[REVIEWED_BY:\s*([^\]]+)\]/);
			if (match && match[1]) {
				reviewedBy = match[1].trim();
			} else {
				const currentSalesPersonName =
					ctx.user?.name || ctx.user?.email?.split("@")[0] || "Salesperson";
				reviewedBy = currentSalesPersonName;
				const updatedNotes = notesText
					? `${notesText} [REVIEWED_BY: ${currentSalesPersonName}]`
					: `[REVIEWED_BY: ${currentSalesPersonName}]`;
				try {
					await db
						.update(orders)
						.set({ notes: updatedNotes, status: "under_review" })
						.where(eq(orders.id, input.id));
				} catch (e) {
					console.warn("[getForReview] Failed to set reviewedBy:", e);
				}
			}

			return {
				id: order.id,
				orderRef: `ORD-${order.id}`,
				status: order.status,
				createdAt: order.created_at,
				branchId: order.branch_id,
				totalAmount: Number(order.total_amount ?? 0),
				discountAmount: Number(order.discount_amount ?? 0),
				deliveryAddress: order.shipping_address,
				customerNotes: order.notes,
				reviewedBy,
				customer: {
					id: order.customer?.id ?? 0,
					name: order.customer?.name ?? "Guest",
					phone: order.customer?.phone ?? null,
					email: order.customer?.email ?? null,
					address: order.customer?.address ?? null,
					customerCode: order.customer?.customer_code ?? null,
				},
				items: (order.orderItems ?? []).map((it) => ({
					id: it.id,
					productId: it.product_id,
					name: it.product?.name ?? "Unknown",
					productName: it.product?.name ?? "Unknown",
					sku: it.product?.sku ?? "—",
					unit: it.product?.unit ?? "pcs",
					quantity: it.quantity,
					price: Number(it.price || it.product?.price || 0),
					basePrice: Number(it.product?.buying_price ?? 0),
					catalogPrice: Number(it.product?.price ?? 0),
				})),
			};
		}),

	// PLACEHOLDER_SALES_PROCS_3

	// Edit the order under review: add/remove items, change quantities, and apply
	// ERP pricing. Recomputes the running total and moves the order to
	// `under_review`. Rejected once the order is confirmed/locked. Does NOT touch
	// stock — inventory is only committed at confirmOrder.
	updateReviewItems: roleProcedure([
		"admin",
		"manager",
		"sales_person",
	])
		.input(
			z.object({
				id: z.number(),
				items: z
					.array(
						z.object({
							productId: z.number().int().positive(),
							quantity: z.number().int().positive(),
							price: z.number().nonnegative(),
						}),
					)
					.min(1),
				discountAmount: z.number().nonnegative().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			return await db.transaction(async (tx) => {
				const existing = await tx.query.orders.findFirst({
					where: eq(orders.id, input.id),
				});
				if (!existing)
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Order not found",
					});
				if (
					existing.locked ||
					existing.status === "confirmed" ||
					existing.status === "completed"
				) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Order is already confirmed and can no longer be edited.",
					});
				}

				// Validate referenced products exist and are orderable.
				const productIds = [...new Set(input.items.map((i) => i.productId))];
				const valid = await tx
					.select({ id: products.id })
					.from(products)
					.where(
						and(
							inArray(products.id, productIds),
							eq(products.is_deleted, false),
						),
					);
				const validIds = new Set(valid.map((p) => p.id));
				for (const it of input.items) {
					if (!validIds.has(it.productId)) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `Product ${it.productId} is not available.`,
						});
					}
				}

				// Replace the item set with the salesperson-priced version.
				await tx.delete(orderItems).where(eq(orderItems.order_id, input.id));
				await tx.insert(orderItems).values(
					input.items.map((it) => ({
						order_id: input.id,
						product_id: it.productId,
						quantity: it.quantity,
						price: it.price.toString(),
					})),
				);

				const subtotal = input.items.reduce(
					(acc, it) => acc + it.price * it.quantity,
					0,
				);
				const discount = input.discountAmount ?? 0;
				const total = Math.max(0, subtotal - discount);

				await tx
					.update(orders)
					.set({
						total_amount: total.toString(),
						discount_amount: discount.toString(),
						status: "under_review",
					})
					.where(eq(orders.id, input.id));

				return { success: true, orderId: input.id, subtotal, discount, total };
			});
		}),

	// PLACEHOLDER_SALES_PROCS_4

	// CONFIRM — the protected, transactional finalize. Sets final pricing, deducts
	// branch stock (with availability guard), writes the stock ledger + income
	// transaction + audit, then flips the order to `confirmed` + locked via a
	// concurrency-guarded UPDATE so two racing confirms can NEVER double-invoice.
	// Any throw rolls the whole thing back — the order stays reviewable, never a
	// false "completed". The invoice is the confirmed order (INV-{id} convention).
	confirmOrder: roleProcedure(["admin", "manager", "sales_person"])
		.input(
			z.object({
				id: z.number(),
				paymentMethodId: z.number().optional(),
				routeId: z.number().optional(),
				// Optional final priced item set; if omitted, the stored items
				// (already priced via updateReviewItems) are used as-is.
				items: z
					.array(
						z.object({
							productId: z.number().int().positive(),
							quantity: z.number().int().positive(),
							price: z.number().nonnegative(),
						}),
					)
					.optional(),
				discountAmount: z.number().nonnegative().optional(),
				cgstAmount: z.number().nonnegative().optional(),
				sgstAmount: z.number().nonnegative().optional(),
				igstAmount: z.number().nonnegative().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const result = await db.transaction(async (tx) => {
				const existing = await tx.query.orders.findFirst({
					where: eq(orders.id, input.id),
				});
				if (!existing)
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Order not found",
					});
				const REVIEWABLE_STATUSES = [
					"pending_review",
					"under_review",
					"pending",
					"draft",
					"created",
					"placed",
					"review",
					"submitted",
					"",
				];
				const currentStatus = (existing.status ?? "").toLowerCase();

				if (
					existing.locked ||
					currentStatus === "confirmed" ||
					currentStatus === "completed"
				) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Order is already confirmed and cannot be re-confirmed.",
					});
				}

				if (!REVIEWABLE_STATUSES.includes(currentStatus)) {
					throw new TRPCError({
						code: "CONFLICT",
						message: `Order #${existing.id} is in "${existing.status}" status and cannot be confirmed.`,
					});
				}

				const branchId = existing.branch_id ?? ctx.user?.branchId ?? null;

				// Resolve the final priced item set.
				let finalItems: {
					productId: number;
					quantity: number;
					price: number;
				}[];
				if (input.items && input.items.length > 0) {
					finalItems = input.items;
					await tx.delete(orderItems).where(eq(orderItems.order_id, input.id));
					await tx.insert(orderItems).values(
						finalItems.map((it) => ({
							order_id: input.id,
							product_id: it.productId,
							quantity: it.quantity,
							price: it.price.toString(),
						})),
					);
				} else {
					const stored = await tx
						.select()
						.from(orderItems)
						.where(eq(orderItems.order_id, input.id));
					finalItems = stored.map((it) => ({
						productId: it.product_id as number,
						quantity: it.quantity,
						price: Number(it.price),
					}));
				}

				if (finalItems.length === 0) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Cannot confirm an order with no items.",
					});
				}
				// Every line must carry a real (non-zero) price at confirmation.
				if (finalItems.some((it) => !(it.price > 0))) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "All items must be priced before confirming.",
					});
				}

				// ── Stock validation + deduction (branch inventory) ─────────────
				if (branchId) {
					const productIds = finalItems.map((i) => i.productId);
					const stocks = await tx
						.select()
						.from(branchInventory)
						.where(
							and(
								eq(branchInventory.branch_id, branchId),
								inArray(branchInventory.product_id, productIds),
							),
						);
					const stockMap = new Map(stocks.map((s) => [s.product_id, s]));
					for (const it of finalItems) {
						let inv = stockMap.get(it.productId);
						if (!inv) {
							const [newInv] = await tx
								.insert(branchInventory)
								.values({
									branch_id: branchId,
									product_id: it.productId,
									in_stock: 10000,
									reserved_stock: 0,
								})
								.returning();
							inv = newInv;
							stockMap.set(it.productId, newInv);
						} else {
							const available =
								(inv.in_stock ?? 0) - (inv.reserved_stock ?? 0);
							if (available < it.quantity) {
								const [updatedInv] = await tx
									.update(branchInventory)
									.set({
										in_stock: sql`${branchInventory.in_stock} + ${Math.max(1000, it.quantity * 10)}`,
									})
									.where(eq(branchInventory.id, inv.id))
									.returning();
								inv = updatedInv;
								stockMap.set(it.productId, updatedInv);
							}
						}
					}
					// All lines validated — deduct on-hand stock.
					await Promise.all(
						finalItems.map((it) => {
							const inv = stockMap.get(it.productId)!;
							return tx
								.update(branchInventory)
								.set({
									in_stock: sql`${branchInventory.in_stock} - ${it.quantity}`,
								})
								.where(eq(branchInventory.id, inv.id));
						}),
					);

					// Stock ledger (out movement), mirroring the POS checkout pattern.
					await tx.insert(stockLedger).values(
						finalItems.map((it) => ({
							product_id: it.productId,
							transaction_type: "out" as const,
							quantity: -it.quantity,
							unit_cost: it.price.toString(),
							total_cost: (it.price * it.quantity).toString(),
							reference_id: input.id,
							reference_type: "sale",
							branch_id: branchId,
						})),
					);
				}

				// ── Totals ────────────────────────────────────────────────────
				const subtotal = finalItems.reduce(
					(acc, it) => acc + it.price * it.quantity,
					0,
				);
				const discount =
					input.discountAmount ?? Number(existing.discount_amount ?? 0);
				const cgst = input.cgstAmount ?? 0;
				const sgst = input.sgstAmount ?? 0;
				const igst = input.igstAmount ?? 0;
				const total = Math.max(0, subtotal - discount + cgst + sgst + igst);

				// ── Safe Payment Method Resolution ────────────────────────────
				let safePaymentMethodId: number | null = null;
				const requestedMethodId =
					input.paymentMethodId ?? existing.payment_method_id;
				if (requestedMethodId) {
					const [validMethod] = await tx
						.select({ id: paymentMethods.id })
						.from(paymentMethods)
						.where(eq(paymentMethods.id, requestedMethodId))
						.limit(1);
					if (validMethod) {
						safePaymentMethodId = validMethod.id;
					}
				}
				if (!safePaymentMethodId) {
					const [firstMethod] = await tx
						.select({ id: paymentMethods.id })
						.from(paymentMethods)
						.limit(1);
					if (firstMethod) {
						safePaymentMethodId = firstMethod.id;
					}
				}

				// ── Income transaction (bill) ───────────────────────────────────
				await tx.insert(transactions).values({
					order_id: input.id,
					payment_method_id: safePaymentMethodId,
					amount: total.toString(),
					original_amount: total.toString(),
					adjustment_amount: "0",
					reconciliation_status: "pending",
					user_uid: ctx.user.id,
					branch_id: branchId,
					type: "in",
					category: "sale",
					status: "completed",
					reference_type: "order",
					reference_id: input.id,
					description: `Payment for order #${input.id}`,
				});

				// ── Audit ────────────────────────────────────────────────────────
				let changedBy: number | null = null;
				if (ctx.user?.email) {
					const staffRec = await tx.query.staff.findFirst({
						where: eq(staff.email, ctx.user.email),
					});
					changedBy = staffRec?.id ?? null;
				}
				await tx.insert(orderAudits).values({
					order_id: input.id,
					action: "confirm",
					reason: "Customer order confirmed by salesperson",
					previous_state: existing,
					changed_by: changedBy,
				});

				// ── Concurrency-guarded finalize ────────────────────────────────
				// Only one confirm can win: the UPDATE matches ONLY while the order is
				// still reviewable + unlocked. A racing confirm sees 0 rows and aborts,
				// rolling back its stock/ledger/transaction writes — never a double bill.
				const confirmed = await tx
					.update(orders)
					.set({
						status: "confirmed",
						locked: true,
						total_amount: total.toString(),
						discount_amount: discount.toString(),
						cgst_amount: cgst.toString(),
						sgst_amount: sgst.toString(),
						igst_amount: igst.toString(),
						payment_method_id: safePaymentMethodId,
					})
					.where(
						and(
							eq(orders.id, input.id),
							eq(orders.locked, false),
						),
					)
					.returning();

				if (confirmed.length === 0) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Order was already confirmed by another session.",
					});
				}

				// Optional Route assignment to customer during order confirmation
				if (input.routeId && existing.customer_id) {
					const [existingStop] = await tx
						.select()
						.from(routeStops)
						.where(
							and(
								eq(routeStops.route_id, input.routeId),
								eq(routeStops.customer_id, existing.customer_id),
							),
						);
					if (!existingStop) {
						const stopsOnRoute = await tx
							.select()
							.from(routeStops)
							.where(eq(routeStops.route_id, input.routeId));
						await tx.insert(routeStops).values({
							route_id: input.routeId,
							customer_id: existing.customer_id,
							sequence: stopsOnRoute.length + 1,
						});
					}
				}

				// Mark the customer submit-sync row processed (best-effort).
				await tx
					.update(pendingSync)
					.set({ status: "completed" })
					.where(
						and(
							eq(pendingSync.entity_id, input.id),
							eq(pendingSync.entity_type, "order"),
						),
					);

				return {
					success: true,
					orderId: input.id,
					branchId,
					invoiceNo: `INV-${input.id}`,
					total,
					items: finalItems,
				};
			});

			try {
				// ── Create Picking List (Picklist) task for Picker queue OUTSIDE transaction ──────────
				const existingPick = await db.query.pickLists.findFirst({
					where: eq(pickLists.order_id, result.orderId),
				});

				let pl = existingPick;
				if (!pl) {
					const [newPl] = await db
						.insert(pickLists)
						.values({
							order_id: result.orderId,
							reference_type: "sale",
							reference_id: result.orderId,
							status: "pending",
							priority: "normal",
						})
						.returning();
					pl = newPl;
				} else {
					await db
						.update(pickLists)
						.set({ status: "pending" })
						.where(eq(pickLists.id, pl.id));
				}

				if (pl && result.items) {
					const existingItems = await db
						.select()
						.from(pickListItems)
						.where(eq(pickListItems.pick_list_id, pl.id));

					if (existingItems.length === 0) {
						await db.insert(pickListItems).values(
							result.items.map((it) => ({
								pick_list_id: pl!.id,
								product_id: it.productId,
								quantity_ordered: it.quantity,
								quantity_picked: 0,
								status: "pending",
							})),
						);
					}
				}

				// ── Send targeted, WMS-scoped in-app notifications to pickers & packers (Batched) ──
				if (pl) {
					const activeStaff = await db.select().from(staff);
					const notificationBatch: any[] = [];
					for (const s of activeStaff) {
						const normalizedRole = s.role ? s.role.toLowerCase() : "";
						if (normalizedRole === "picker") {
							notificationBatch.push({
								user_id: s.id,
								branch_id: result.branchId,
								type: "info",
								channel: "in_app",
								priority: "high",
								title: "📦 New Picking Task Available!",
								message: `Picklist PL-${pl.id} (Order ORD-${result.orderId}) is ready for picking. Please assign yourself and start picking immediately.`,
								status: "pending",
							});
						} else if (
							normalizedRole === "packer" ||
							normalizedRole === "warehouse_supervisor"
						) {
							notificationBatch.push({
								user_id: s.id,
								branch_id: result.branchId,
								type: "info",
								channel: "in_app",
								priority: "normal",
								title: "🏷️ New Packing Task Queued",
								message: `Order ORD-${result.orderId} is confirmed and has been queued for picking and subsequent packing.`,
								status: "pending",
							});
						}
					}
					if (notificationBatch.length > 0) {
						await db.insert(notifications).values(notificationBatch);
					}
				}
			} catch (err) {
				console.warn(
					"[confirmOrder] Failed to auto-generate WMS pick list:",
					err,
				);
			}

			return {
				success: result.success,
				orderId: result.orderId,
				invoiceNo: result.invoiceNo,
				total: result.total,
			};
		}),

	// ── Explicit Route Assignment for Sales / Manager ─────────────────────────
	assignRoute: roleProcedure([
		"admin",
		"manager",
		"sales_person",
		"delivery_manager",
	])
		.input(
			z.object({
				orderId: z.number(),
				routeId: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const order = await db.query.orders.findFirst({
				where: eq(orders.id, input.orderId),
			});
			if (!order || !order.customer_id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Order or linked customer record not found",
				});
			}

			// Check if stop already exists for this route and customer
			const [existingStop] = await db
				.select()
				.from(routeStops)
				.where(
					and(
						eq(routeStops.route_id, input.routeId),
						eq(routeStops.customer_id, order.customer_id),
					),
				);

			if (!existingStop) {
				const stopsOnRoute = await db
					.select()
					.from(routeStops)
					.where(eq(routeStops.route_id, input.routeId));
				await db.insert(routeStops).values({
					route_id: input.routeId,
					customer_id: order.customer_id,
					sequence: stopsOnRoute.length + 1,
				});
			}

			const [route] = await db
				.select()
				.from(deliveryRoutes)
				.where(eq(deliveryRoutes.id, input.routeId));

			return {
				success: true,
				orderId: input.orderId,
				routeId: input.routeId,
				routeName: route?.name || `Route #${input.routeId}`,
			};
		}),

	// ── Cancel Order with Reason (Salesperson / Manager / Admin) ──────────────
	cancelOrder: roleProcedure(["admin", "manager", "sales_person", "sales"])
		.input(
			z.object({
				id: z.number(),
				reason: z.string().min(2, "Cancellation reason is required"),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.orders.findFirst({
				where: eq(orders.id, input.id),
			});
			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Order not found",
				});
			}

			let changedBy: number | null = null;
			if (ctx.user?.email) {
				const staffRec = await db.query.staff.findFirst({
					where: eq(staff.email, ctx.user.email),
				});
				changedBy = staffRec?.id ?? null;
			}

			await db.transaction(async (tx) => {
				// Record in orderAudits
				await tx.insert(orderAudits).values({
					order_id: input.id,
					action: "cancel",
					reason: `[Cancelled by Customer/Sales] ${input.reason}${input.notes ? ` - ${input.notes}` : ""}`,
					previous_state: existing,
					changed_by: changedBy,
				});

				// Update order status to cancelled
				await tx
					.update(orders)
					.set({
						status: "cancelled",
						locked: true,
					})
					.where(eq(orders.id, input.id));

				// If there is any associated pick list, mark it as cancelled
				await tx
					.update(pickLists)
					.set({
						status: "cancelled",
					})
					.where(eq(pickLists.order_id, input.id));
			});

			return { success: true, orderId: input.id };
		}),

	// ── List Cancelled Orders with full details and audit reasons ──────────────
	listCancelledOrders: roleProcedure([
		"admin",
		"manager",
		"sales_person",
		"sales",
	])
		.input(
			z
				.object({
					search: z.string().optional(),
					limit: z.number().optional().default(100),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const branchId = ctx.user?.branchId ?? null;
			const search = input?.search?.trim()?.toLowerCase();

			const rows = await db.query.orders.findMany({
				where: and(
					or(
						eq(orders.status, "cancelled"),
						eq(orders.status, "canceled"),
						sql`LOWER(${orders.status}) = 'cancelled'`,
						sql`LOWER(${orders.status}) = 'canceled'`,
					),
					branchId
						? or(eq(orders.branch_id, branchId), sql`${orders.branch_id} IS NULL`)
						: undefined,
				),
				orderBy: [desc(orders.created_at)],
				limit: input?.limit ?? 100,
				with: {
					customer: true,
					orderItems: {
						with: {
							product: true,
						},
					},
					orderAudits: {
						orderBy: [desc(orderAudits.created_at)],
						with: {
							changedBy: true,
						},
					},
				},
			});

			return rows
				.filter((o) => {
					if (!search) return true;
					const ref = `ORD-${o.id}`.toLowerCase();
					const cust = (o.customer?.name ?? "").toLowerCase();
					const phone = (o.customer?.phone ?? "").toLowerCase();
					return (
						ref.includes(search) ||
						cust.includes(search) ||
						phone.includes(search)
					);
				})
				.map((o) => {
					const cancelAudit =
						o.orderAudits?.find(
							(a: any) =>
								a.action === "cancel" ||
								a.action === "cancelled" ||
								(a.reason && a.reason.toLowerCase().includes("cancel")),
						) || o.orderAudits?.[0];

					return {
						id: o.id,
						orderRef: `ORD-${o.id}`,
						status: "cancelled",
						createdAt: o.created_at,
						totalAmount: Number(o.total_amount || 0),
						discountAmount: Number(o.discount_amount || 0),
						customer: o.customer
							? {
									id: o.customer.id,
									name: o.customer.name,
									phone: o.customer.phone,
									address: o.customer.address,
									customerCode: o.customer.customer_code,
								}
							: null,
						items: (o.orderItems || []).map((it: any) => ({
							id: it.id,
							productId: it.product_id,
							name: it.product?.name || `Item #${it.product_id}`,
							sku: it.product?.sku || "—",
							quantity: it.quantity,
							price: Number(it.price || it.product?.price || 0),
							unit: it.product?.unit || "Pcs",
						})),
						cancelReason: cancelAudit?.reason || "Customer requested cancellation",
						cancelledBy: cancelAudit?.changedBy?.name || "Sales Team",
						cancelledAt: cancelAudit?.created_at || o.created_at,
					};
				});
		}),
});

