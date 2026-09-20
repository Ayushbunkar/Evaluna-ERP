import {
	customers,
	deliveryRoutes,
	deliveryTrips,
	orderItems,
	orders,
	packageItems,
	packages,
	products,
	routeStops,
	staff,
	tripStops,
	user,
	vehicles,
} from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import { and, count, countDistinct, desc, eq, gte, inArray, isNotNull, isNull, lte, not, notInArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db as defaultDb } from "@/lib/db";
import { dispatchNotification } from "@/lib/notification-service";
import { roleProcedure, router } from "../init";

export const loaderRouter = router({
	getDashboardStats: roleProcedure(["admin", "manager", "auditor", "loader"])
		.input(z.object({ branchId: z.number().optional() }).optional())
		.query(async ({ ctx }) => {
			const db = ctx.db || defaultDb;
			const todayStart = new Date();
			todayStart.setHours(0, 0, 0, 0);

			// Loaders see their assigned trips + unassigned loading queue trips
			const userRole = ctx.user?.role || ctx.user?.roles?.[0];
			const isLoaderRole = userRole === "loader";
			const callerId = ctx.user?.id;
			const callerEmail = ctx.user?.email;
			const callerStaffId = ctx.user?.staff_id ? String(ctx.user.staff_id) : undefined;

			let loaderFilter = undefined;
			if (isLoaderRole) {
				const idConditions = [];
				if (callerId) idConditions.push(eq(deliveryTrips.loader_id, callerId));
				if (callerEmail) idConditions.push(sql`LOWER(TRIM(${deliveryTrips.loader_id})) = LOWER(TRIM(${callerEmail}))`);
				if (callerStaffId) idConditions.push(eq(deliveryTrips.loader_id, callerStaffId));

				loaderFilter = or(
					isNull(deliveryTrips.loader_id),
					sql`${deliveryTrips.loader_id} = ''`,
					...idConditions,
				);
			}

			const [readyTrips] = await db
				.select({ count: count() })
				.from(deliveryTrips)
				.where(
					loaderFilter
						? and(inArray(deliveryTrips.status, ["ready_for_loading", "pending"]), loaderFilter)
						: inArray(deliveryTrips.status, ["ready_for_loading", "pending"]),
				);

			const [loadingTrips] = await db
				.select({ count: count() })
				.from(deliveryTrips)
				.where(
					loaderFilter
						? and(eq(deliveryTrips.status, "loading"), loaderFilter)
						: eq(deliveryTrips.status, "loading"),
				);

			const [loadedTodayTrips] = await db
				.select({ count: count() })
				.from(deliveryTrips)
				.where(
					loaderFilter
						? and(
								inArray(deliveryTrips.status, ["loaded", "active", "completed"]),
								gte(deliveryTrips.updated_at, todayStart),
								loaderFilter,
						  )
						: and(
								inArray(deliveryTrips.status, ["loaded", "active", "completed"]),
								gte(deliveryTrips.updated_at, todayStart),
						  ),
				);

			const [pendingVerificationOrders] = await db
				.select({ count: count() })
				.from(orders)
				.where(inArray(orders.status, ["packed", "ready_for_loading"]));

			return {
				readyForLoadingTrips: readyTrips?.count || 0,
				currentlyLoadingTrips: loadingTrips?.count || 0,
				loadedTodayTrips: loadedTodayTrips?.count || 0,
				pendingVerificationOrders: pendingVerificationOrders?.count || 0,
			};
		}),

	getLoadingQueue: roleProcedure(["admin", "manager", "auditor", "loader"])
		.input(
			z
				.object({
					search: z.string().optional(),
					status: z.enum(["all", "ready_for_loading", "loading", "loaded"]).optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db || defaultDb;

			let statusFilter;
			if (input?.status === "ready_for_loading") {
				statusFilter = inArray(deliveryTrips.status, ["ready_for_loading", "pending"]);
			} else if (input?.status && input.status !== "all") {
				statusFilter = eq(deliveryTrips.status, input.status);
			} else {
				statusFilter = inArray(deliveryTrips.status, ["ready_for_loading", "pending", "loading", "loaded"]);
			}

			// Loaders see trips assigned to them OR unassigned pool trips
			const userRole = ctx.user?.role || ctx.user?.roles?.[0];
			const isLoaderRole = userRole === "loader";
			const callerId = ctx.user?.id;
			const callerEmail = ctx.user?.email;
			const callerStaffId = ctx.user?.staff_id ? String(ctx.user.staff_id) : undefined;

			let loaderIdFilter = undefined;
			if (isLoaderRole) {
				const idConditions = [];
				if (callerId) idConditions.push(eq(deliveryTrips.loader_id, callerId));
				if (callerEmail) idConditions.push(sql`LOWER(TRIM(${deliveryTrips.loader_id})) = LOWER(TRIM(${callerEmail}))`);
				if (callerStaffId) idConditions.push(eq(deliveryTrips.loader_id, callerStaffId));

				loaderIdFilter = or(
					isNull(deliveryTrips.loader_id),
					sql`${deliveryTrips.loader_id} = ''`,
					...idConditions,
				);
			}

			const whereClause = loaderIdFilter ? and(statusFilter, loaderIdFilter) : statusFilter;

			const rawTrips = await db
				.select({
					tripId: deliveryTrips.id,
					status: deliveryTrips.status,
					driverId: deliveryTrips.driver_id,
					driverName: user.name,
					vehicleId: deliveryTrips.vehicle_id,
					vehicleName: vehicles.name,
					vehicleReg: vehicles.registration_number,
					routeId: deliveryTrips.route_id,
					routeName: deliveryRoutes.name,
					createdAt: deliveryTrips.created_at,
					updatedAt: deliveryTrips.updated_at,
				})
				.from(deliveryTrips)
				.leftJoin(deliveryRoutes, eq(deliveryRoutes.id, deliveryTrips.route_id))
				.leftJoin(user, eq(user.id, deliveryTrips.driver_id))
				.leftJoin(vehicles, eq(vehicles.id, deliveryTrips.vehicle_id))
				.where(whereClause)
				.orderBy(desc(deliveryTrips.created_at));

			const enrichedTrips = await Promise.all(
				rawTrips.map(async (t) => {
					const stops = await db
						.select({
							customerId: tripStops.customer_id,
							sequence: tripStops.sequence,
							status: tripStops.status,
							customerName: customers.name,
							customerAddress: customers.address,
							customerPhone: customers.phone,
						})
						.from(tripStops)
						.leftJoin(customers, eq(customers.id, tripStops.customer_id))
						.where(eq(tripStops.trip_id, t.tripId))
						.orderBy(tripStops.sequence);

					const customerIds = stops.map((s) => s.customerId).filter(Boolean);

					let tripOrders: any[] = [];
					if (customerIds.length > 0) {
						tripOrders = await db
							.select({
								id: orders.id,
								customerId: orders.customer_id,
								status: orders.status,
								totalAmount: orders.total_amount,
							})
							.from(orders)
							.where(
								and(
									inArray(orders.customer_id, customerIds),
									notInArray(orders.status, ["cancelled", "completed", "delivered"]),
								),
							);
					}

					const totalOrdersCount = tripOrders.length;
					const loadedOrdersCount = tripOrders.filter((o) => o.status === "loaded").length;
					const readyOrdersCount = tripOrders.filter(
						(o) => o.status === "packed" || o.status === "ready_for_loading" || o.status === "loaded",
					).length;

					const villagesSet = new Set(
						stops.map((s) => s.customerAddress?.split(",")[0]?.trim()).filter(Boolean),
					);

					return {
						tripId: t.tripId,
						routeId: t.routeId,
						routeName: t.routeName || `Trip #${t.tripId}`,
						driverId: t.driverId,
						driverName: t.driverName || "Assigned Driver",
						vehicleId: t.vehicleId,
						vehicle: t.vehicleName
							? `${t.vehicleName} (${t.vehicleReg || ""})`
							: t.vehicleReg || "N/A",
						status: t.status,
						createdAt: t.createdAt,
						updatedAt: t.updatedAt,
						ordersCount: totalOrdersCount,
						stopsCount: stops.length,
						villagesCount: villagesSet.size || stops.length,
						readyOrdersCount,
						loadedOrdersCount,
					};
				}),
			);

			if (input?.search?.trim()) {
				const q = input.search.toLowerCase().trim();
				return enrichedTrips.filter(
					(t) =>
						String(t.tripId).includes(q) ||
						t.routeName.toLowerCase().includes(q) ||
						t.driverName.toLowerCase().includes(q) ||
						t.vehicle.toLowerCase().includes(q),
				);
			}

			return enrichedTrips;
		}),

	getTripLoadingDetails: roleProcedure(["admin", "manager", "auditor", "loader"])
		.input(z.object({ tripId: z.number() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db || defaultDb;

			const [trip] = await db
				.select({
					tripId: deliveryTrips.id,
					status: deliveryTrips.status,
					driverId: deliveryTrips.driver_id,
					driverName: user.name,
					vehicleId: deliveryTrips.vehicle_id,
					vehicleName: vehicles.name,
					vehicleReg: vehicles.registration_number,
					routeId: deliveryTrips.route_id,
					routeName: deliveryRoutes.name,
					createdAt: deliveryTrips.created_at,
					updatedAt: deliveryTrips.updated_at,
				})
				.from(deliveryTrips)
				.leftJoin(deliveryRoutes, eq(deliveryRoutes.id, deliveryTrips.route_id))
				.leftJoin(user, eq(user.id, deliveryTrips.driver_id))
				.leftJoin(vehicles, eq(vehicles.id, deliveryTrips.vehicle_id))
				.where(eq(deliveryTrips.id, input.tripId));

			if (!trip) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: `Trip #${input.tripId} not found`,
				});
			}

			const stops = await db
				.select({
					stopId: tripStops.id,
					customerId: tripStops.customer_id,
					sequence: tripStops.sequence,
					status: tripStops.status,
					customerName: customers.name,
					customerPhone: customers.phone,
					customerAddress: customers.address,
				})
				.from(tripStops)
				.leftJoin(customers, eq(customers.id, tripStops.customer_id))
				.where(eq(tripStops.trip_id, input.tripId))
				.orderBy(tripStops.sequence);

			const customerIds = stops.map((s) => s.customerId).filter(Boolean);

			let tripOrders: any[] = [];
			if (customerIds.length > 0) {
				tripOrders = await db
					.select({
						id: orders.id,
						customerId: orders.customer_id,
						status: orders.status,
						totalAmount: orders.total_amount,
						createdAt: orders.created_at,
					})
					.from(orders)
					.where(
						and(
							inArray(orders.customer_id, customerIds),
							notInArray(orders.status, ["cancelled", "completed", "delivered"]),
						),
					);
			}

			const orderIds = tripOrders.map((o) => o.id);
			let orderPackagesMap = new Map<number, any[]>();
			let orderItemsMap = new Map<number, any[]>();

			if (orderIds.length > 0) {
				const pkgs = await db
					.select({
						id: packages.id,
						orderId: packages.order_id,
						packageNumber: packages.package_number,
						status: packages.status,
						weight: packages.weight,
						dimensions: packages.dimensions,
					})
					.from(packages)
					.where(inArray(packages.order_id, orderIds));

				for (const p of pkgs) {
					const list = orderPackagesMap.get(p.orderId) || [];
					list.push(p);
					orderPackagesMap.set(p.orderId, list);
				}

				const items = await db
					.select({
						id: orderItems.id,
						orderId: orderItems.order_id,
						productId: orderItems.product_id,
						productName: products.name,
						quantity: orderItems.quantity,
						price: orderItems.price,
					})
					.from(orderItems)
					.leftJoin(products, eq(products.id, orderItems.product_id))
					.where(inArray(orderItems.order_id, orderIds));

				for (const item of items) {
					const list = orderItemsMap.get(item.orderId) || [];
					list.push(item);
					orderItemsMap.set(item.orderId, list);
				}
			}

			// Group stops by village/address
			const stopsWithOrders = stops.map((stop) => {
				const cOrders = tripOrders
					.filter((o) => o.customerId === stop.customerId)
					.map((o) => {
						const pkgs = orderPackagesMap.get(o.id) || [];
						const items = orderItemsMap.get(o.id) || [];
						return {
							orderId: o.id,
							orderCode: `ORD-${o.id}`,
							status: o.status,
							isLoaded: o.status === "loaded",
							totalAmount: o.totalAmount,
							packageCount: pkgs.length || 1,
							packages: pkgs,
							itemsCount: items.reduce((acc, i) => acc + (i.quantity || 1), 0),
							items: items,
						};
					});

				const village =
					stop.customerAddress?.split(",")[0]?.trim() || stop.customerName || "Route Stop";

				return {
					stopId: stop.stopId,
					customerId: stop.customerId,
					sequence: stop.sequence,
					villageName: village,
					customerName: stop.customerName || "Customer",
					customerPhone: stop.customerPhone || "",
					customerAddress: stop.customerAddress || "",
					orders: cOrders,
				};
			});

			const allOrders = stopsWithOrders.flatMap((s) => s.orders);
			const totalOrders = allOrders.length;
			const loadedOrders = allOrders.filter((o) => o.isLoaded).length;
			const remainingOrders = totalOrders - loadedOrders;

			return {
				trip: {
					tripId: trip.tripId,
					routeId: trip.routeId,
					routeName: trip.routeName || `Trip #${trip.tripId}`,
					driverId: trip.driverId,
					driverName: trip.driverName || "Assigned Driver",
					vehicleId: trip.vehicleId,
					vehicle: trip.vehicleName
						? `${trip.vehicleName} (${trip.vehicleReg || ""})`
						: trip.vehicleReg || "N/A",
					status: trip.status,
					createdAt: trip.createdAt,
					updatedAt: trip.updatedAt,
				},
				stops: stopsWithOrders,
				summary: {
					totalOrders,
					loadedOrders,
					remainingOrders,
					isCompleteEligible: totalOrders > 0 && remainingOrders === 0,
				},
			};
		}),

	startLoadingTrip: roleProcedure(["admin", "manager", "loader"])
		.input(z.object({ tripId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db || defaultDb;

			const [trip] = await db
				.select()
				.from(deliveryTrips)
				.where(eq(deliveryTrips.id, input.tripId));

			if (!trip) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: `Trip #${input.tripId} not found`,
				});
			}

			if (trip.status === "ready_for_loading" || trip.status === "pending") {
				await db
					.update(deliveryTrips)
					.set({
						status: "loading",
						loader_id: trip.loader_id || ctx.user?.id || null,
						updated_at: new Date(),
					})
					.where(eq(deliveryTrips.id, input.tripId));
			}

			return { success: true, tripId: input.tripId, status: "loading" };
		}),

	markOrderLoaded: roleProcedure(["admin", "manager", "loader"])
		.input(
			z.object({
				tripId: z.number(),
				orderId: z.number(),
				loaded: z.boolean().default(true),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db || defaultDb;

			const [order] = await db
				.select()
				.from(orders)
				.where(eq(orders.id, input.orderId));

			if (!order) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: `Order #${input.orderId} not found`,
				});
			}

			const targetStatus = input.loaded ? "loaded" : "packed";

			// Idempotency check: if order already has target status, return success
			if (order.status === targetStatus) {
				return { success: true, orderId: input.orderId, status: targetStatus };
			}

			await db
				.update(orders)
				.set({ status: targetStatus })
				.where(eq(orders.id, input.orderId));

			// Update associated packages status
			await db
				.update(packages)
				.set({ status: input.loaded ? "loaded" : "packed" })
				.where(eq(packages.order_id, input.orderId));

			// Also ensure trip status is in "loading" phase
			await db
				.update(deliveryTrips)
				.set({ status: "loading", updated_at: new Date() })
				.where(
					and(
						eq(deliveryTrips.id, input.tripId),
						inArray(deliveryTrips.status, ["ready_for_loading", "pending"]),
					),
				);

			return { success: true, orderId: input.orderId, status: targetStatus };
		}),

	completeTripLoading: roleProcedure(["admin", "manager", "loader"])
		.input(
			z.object({
				tripId: z.number(),
				forceWithExceptions: z.boolean().optional(),
				exceptionReason: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db || defaultDb;

			const [trip] = await db
				.select()
				.from(deliveryTrips)
				.where(eq(deliveryTrips.id, input.tripId));

			if (!trip) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: `Trip #${input.tripId} not found`,
				});
			}

			const stops = await db
				.select({ customerId: tripStops.customer_id })
				.from(tripStops)
				.where(eq(tripStops.trip_id, input.tripId));

			const customerIds = stops.map((s) => s.customerId).filter(Boolean);

			let tripOrders: any[] = [];
			if (customerIds.length > 0) {
				tripOrders = await db
					.select({ id: orders.id, status: orders.status })
					.from(orders)
					.where(
						and(
							inArray(orders.customer_id, customerIds),
							notInArray(orders.status, ["cancelled", "completed", "delivered"]),
						),
					);
			}

			const pendingOrders = tripOrders.filter((o) => o.status !== "loaded");

			if (pendingOrders.length > 0 && !input.forceWithExceptions) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `${pendingOrders.length} orders are still pending loading. Please confirm all orders are physically loaded before completing.`,
				});
			}

			// Update trip status to "loaded" and record loaded_at timestamp
			await db
				.update(deliveryTrips)
				.set({ status: "loaded", loaded_at: new Date(), updated_at: new Date() })
				.where(eq(deliveryTrips.id, input.tripId));

			// Update all assigned orders for this trip to "loaded"
			const orderIds = tripOrders.map((o) => o.id);
			if (orderIds.length > 0) {
				await db
					.update(orders)
					.set({ status: "loaded" })
					.where(inArray(orders.id, orderIds));

				await db
					.update(packages)
					.set({ status: "loaded" })
					.where(inArray(packages.order_id, orderIds));
			}

			// Re-fetch the trip to get route name for notification
			const [updatedTrip] = await db
				.select({ id: deliveryTrips.id, routeId: deliveryTrips.route_id })
				.from(deliveryTrips)
				.where(eq(deliveryTrips.id, input.tripId));

			// 🔔 Notify Manager: Trip loading is complete — ready to dispatch
			try {
				const loaderName = ctx.user?.name || ctx.user?.email || "Loader";
				await dispatchNotification({
					type: "info",
					priority: "high",
					title: `✅ Trip #${input.tripId} — Loading Complete`,
					message: `Trip #${input.tripId} has been fully loaded by ${loaderName}. All ${orderIds.length} order(s) are loaded into the vehicle. Please review and dispatch the trip.`,
					branchId: (ctx.user?.branchId as number) || 1,
					channels: ["in_app"],
					referenceType: "trips",
					referenceId: input.tripId,
					metadata: {
						trip_id: input.tripId,
						loaded_by: loaderName,
						loaded_orders: orderIds.length,
						action_required: "dispatch",
					},
				});
			} catch (notifErr) {
				// Non-critical — notification failure does not block loading completion
				console.warn("[completeTripLoading] Manager notification failed (non-critical):", notifErr);
			}

			return {
				success: true,
				tripId: input.tripId,
				status: "loaded",
				loadedOrdersCount: orderIds.length,
			};
		}),

	getLoadingHistory: roleProcedure(["admin", "manager", "auditor", "loader"])
		.input(
			z
				.object({
					search: z.string().optional(),
					startDate: z.coerce.date().optional(),
					endDate: z.coerce.date().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db || defaultDb;

			const historyTrips = await db
				.select({
					tripId: deliveryTrips.id,
					status: deliveryTrips.status,
					driverName: user.name,
					vehicleName: vehicles.name,
					vehicleReg: vehicles.registration_number,
					routeName: deliveryRoutes.name,
					updatedAt: deliveryTrips.updated_at,
					createdAt: deliveryTrips.created_at,
				})
				.from(deliveryTrips)
				.leftJoin(deliveryRoutes, eq(deliveryRoutes.id, deliveryTrips.route_id))
				.leftJoin(user, eq(user.id, deliveryTrips.driver_id))
				.leftJoin(vehicles, eq(vehicles.id, deliveryTrips.vehicle_id))
				.where(inArray(deliveryTrips.status, ["loaded", "active", "completed"]))
				.orderBy(desc(deliveryTrips.updated_at));

			const enrichedHistory = await Promise.all(
				historyTrips.map(async (t) => {
					const stops = await db
						.select({ customerId: tripStops.customer_id })
						.from(tripStops)
						.where(eq(tripStops.trip_id, t.tripId));

					const customerIds = stops.map((s) => s.customerId).filter(Boolean);

					let ordersCount = 0;
					if (customerIds.length > 0) {
						const res = await db
							.select({ count: count() })
							.from(orders)
							.where(inArray(orders.customer_id, customerIds));
						ordersCount = res[0]?.count || 0;
					}

					return {
						tripId: t.tripId,
						routeName: t.routeName || `Trip #${t.tripId}`,
						driverName: t.driverName || "Assigned Driver",
						vehicle: t.vehicleName
							? `${t.vehicleName} (${t.vehicleReg || ""})`
							: t.vehicleReg || "N/A",
						ordersCount,
						loadedAt: t.updatedAt || t.createdAt,
						status: t.status,
					};
				}),
			);

			if (input?.search?.trim()) {
				const q = input.search.toLowerCase().trim();
				return enrichedHistory.filter(
					(h) =>
						String(h.tripId).includes(q) ||
						h.routeName.toLowerCase().includes(q) ||
						h.driverName.toLowerCase().includes(q) ||
						h.vehicle.toLowerCase().includes(q),
				);
			}

			return enrichedHistory;
		}),
});
