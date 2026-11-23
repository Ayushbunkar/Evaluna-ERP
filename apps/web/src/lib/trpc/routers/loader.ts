import {
	customers,
	deliveryRoutes,
	deliveryStops,
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
import { isDateInISTRange, parseDateFilterRange } from "@/lib/utils";
import { roleProcedure, router } from "../init";

export const loaderRouter = router({
	getDashboardStats: roleProcedure(["admin", "manager", "auditor", "loader"])
		.input(z.object({ branchId: z.number().optional() }).optional())
		.query(async ({ ctx }) => {
			const db = ctx.db || defaultDb;
			const todayStart = new Date();
			todayStart.setHours(0, 0, 0, 0);

			// Loaders see their assigned trips + unassigned loading queue trips
			const userRole = ctx.user?.roles?.[0] as unknown as string | undefined;
			const isLoaderRole = userRole === "loader";
			const callerId = ctx.user?.id;
			const callerEmail = ctx.user?.email;
			const callerStaffId = (ctx.user as any)?.staff_id ? String((ctx.user as any).staff_id) : undefined;

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
						? and(eq(deliveryTrips.status, "ready_for_loading"), loaderFilter)
						: eq(deliveryTrips.status, "ready_for_loading"),
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

			const [directPackedOrders] = await db
				.select({ count: count() })
				.from(orders)
				.where(inArray(orders.status, ["packed", "ready_for_dispatch", "ready_for_loading"]));

			let vanStockReadyCount = 0;
			try {
				const { vanStockPlans } = require("@evaluna/db/schema");
				const [vsRes] = await db
					.select({ count: count() })
					.from(vanStockPlans)
					.where(inArray(vanStockPlans.status, ["PENDING_LOADING", "LOADING_IN_PROGRESS"]));
				vanStockReadyCount = vsRes?.count || 0;
			} catch {
				// Fallback
			}

			return {
				readyForLoadingTrips: readyTrips?.count || 0,
				currentlyLoadingTrips: loadingTrips?.count || 0,
				loadedTodayTrips: loadedTodayTrips?.count || 0,
				pendingVerificationOrders: pendingVerificationOrders?.count || 0,
				directPackedOrders: directPackedOrders?.count || 0,
				vanStockReadyCount,
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
				statusFilter = eq(deliveryTrips.status, "ready_for_loading");
			} else if (input?.status && input.status !== "all") {
				statusFilter = eq(deliveryTrips.status, input.status);
			} else {
				statusFilter = inArray(deliveryTrips.status, ["ready_for_loading", "loading", "loaded"]);
			}

			// Loaders see trips assigned to them OR unassigned pool trips
			const userRole = ctx.user?.roles?.[0] as unknown as string | undefined;
			const isLoaderRole = userRole === "loader";
			const callerId = ctx.user?.id;
			const callerEmail = ctx.user?.email;
			const callerStaffId = (ctx.user as any)?.staff_id ? String((ctx.user as any).staff_id) : undefined;

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
				rawTrips.map(async (t: any) => {
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

					const customerIds = stops.map((s: any) => s.customerId).filter(Boolean);

					let tripOrders: any[] = [];
					if (customerIds.length > 0) {
						const tripCreatedAtBuffer = t.createdAt
							? new Date(new Date(t.createdAt).getTime() + 120_000)
							: null;

						const orderConditions = [
							inArray(orders.customer_id, customerIds),
							inArray(orders.status, [
								"ready_for_dispatch",
								"ready_for_loading",
								"packed",
								"loaded",
							]),
						];

						if (tripCreatedAtBuffer) {
							orderConditions.push(lte(orders.created_at, tripCreatedAtBuffer));
						}

						tripOrders = await db
							.select({
								id: orders.id,
								customerId: orders.customer_id,
								status: orders.status,
								totalAmount: orders.total_amount,
							})
							.from(orders)
							.where(and(...orderConditions));
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
				const tripCreatedAtBuffer = trip.createdAt
					? new Date(new Date(trip.createdAt).getTime() + 120_000)
					: null;

				const orderConditions = [
					inArray(orders.customer_id, customerIds),
					inArray(orders.status, [
						"ready_for_dispatch",
						"ready_for_loading",
						"packed",
						"loaded",
					]),
				];

				if (tripCreatedAtBuffer) {
					orderConditions.push(lte(orders.created_at, tripCreatedAtBuffer));
				}

				tripOrders = await db
					.select({
						id: orders.id,
						customerId: orders.customer_id,
						status: orders.status,
						totalAmount: orders.total_amount,
						createdAt: orders.created_at,
					})
					.from(orders)
					.where(and(...orderConditions));
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
							itemsCount:
								Math.round(
									items.reduce(
										(acc, i) =>
											acc + (Number.parseFloat(String(i.quantity)) || 1),
										0,
									) * 10,
								) / 10,
							items: items.map((it) => ({
								...it,
								quantity:
									Math.round(
										(Number.parseFloat(String(it.quantity)) || 1) * 10,
									) / 10,
							})),
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

			if (trip.status === "ready_for_loading") {
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
						inArray(deliveryTrips.status, ["ready_for_loading", "loading"]),
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
				const tripCreatedAtBuffer = trip.created_at
					? new Date(new Date(trip.created_at).getTime() + 120_000)
					: null;

				const orderConditions = [
					inArray(orders.customer_id, customerIds),
					inArray(orders.status, [
						"ready_for_dispatch",
						"ready_for_loading",
						"packed",
						"loaded",
					]),
				];

				if (tripCreatedAtBuffer) {
					orderConditions.push(lte(orders.created_at, tripCreatedAtBuffer));
				}

				tripOrders = await db
					.select({ id: orders.id, status: orders.status })
					.from(orders)
					.where(and(...orderConditions));
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
					title: `Trip #${input.tripId} — Loading Complete`,
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
					startDate: z.union([z.string(), z.coerce.date()]).optional(),
					endDate: z.union([z.string(), z.coerce.date()]).optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db || defaultDb;

			const conditions = [
				or(
					inArray(deliveryTrips.status, [
						"loaded",
						"loading",
						"active",
						"in_transit",
						"dispatched",
						"completed",
					]),
					isNotNull(deliveryTrips.loaded_at),
				),
			];

			const { fromDate, toDate, startIST, endIST } = parseDateFilterRange(input?.startDate, input?.endDate);
			const targetDateCol = sql`COALESCE(${deliveryTrips.loaded_at}, ${deliveryTrips.updated_at}, ${deliveryTrips.created_at})`;

			if (fromDate) {
				conditions.push(gte(targetDateCol, fromDate));
			}
			if (toDate) {
				conditions.push(lte(targetDateCol, toDate));
			}

			const rawTrips = await db
				.select({
					tripId: deliveryTrips.id,
					status: deliveryTrips.status,
					driverName: user.name,
					vehicleName: vehicles.name,
					vehicleReg: vehicles.registration_number,
					routeName: deliveryRoutes.name,
					updatedAt: deliveryTrips.updated_at,
					createdAt: deliveryTrips.created_at,
					loadedAt: deliveryTrips.loaded_at,
				})
				.from(deliveryTrips)
				.leftJoin(deliveryRoutes, eq(deliveryRoutes.id, deliveryTrips.route_id))
				.leftJoin(user, eq(user.id, deliveryTrips.driver_id))
				.leftJoin(vehicles, eq(vehicles.id, deliveryTrips.vehicle_id))
				.where(and(...conditions))
				.orderBy(desc(targetDateCol), desc(deliveryTrips.id))
				.limit(500);

			const historyTrips = (startIST || endIST)
				? rawTrips.filter((t) => isDateInISTRange(t.loadedAt || t.updatedAt || t.createdAt, startIST, endIST))
				: rawTrips;

			const enrichedHistory = await Promise.all(
				historyTrips.map(async (t) => {
					// 1. Direct deliveryStops linked to this trip
					const directStops = await db
						.select({ orderId: deliveryStops.order_id })
						.from(deliveryStops)
						.where(
							and(
								eq(deliveryStops.trip_id, t.tripId),
								isNotNull(deliveryStops.order_id),
							),
						);

					let ordersCount = directStops.length;

					if (ordersCount === 0) {
						// 2. Fallback to tripStops customers
						const stops = await db
							.select({ customerId: tripStops.customer_id })
							.from(tripStops)
							.where(eq(tripStops.trip_id, t.tripId));

						const customerIds = stops.map((s) => s.customerId).filter(Boolean);

						if (customerIds.length > 0) {
							const res = await db
								.select({ count: count() })
								.from(orders)
								.where(
									and(
										inArray(orders.customer_id, customerIds),
										inArray(orders.status, [
											"ready_for_dispatch",
											"ready_for_loading",
											"packed",
											"loaded",
											"out_for_delivery",
											"in_transit",
											"dispatched",
											"delivered",
											"completed",
										]),
									),
								);
							ordersCount = res[0]?.count || 0;
						}
					}

					return {
						tripId: t.tripId,
						routeName: t.routeName || `Trip #${t.tripId}`,
						driverName: t.driverName || "Assigned Driver",
						vehicle: t.vehicleName
							? `${t.vehicleName} (${t.vehicleReg || ""})`
							: t.vehicleReg || "N/A",
						ordersCount,
						loadedAt: t.loadedAt || t.updatedAt || t.createdAt,
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

	getPackedOrdersQueue: roleProcedure(["admin", "manager", "auditor", "loader"])
		.input(
			z
				.object({
					search: z.string().optional(),
					status: z
						.enum(["all", "packed", "ready_for_loading", "loaded"])
						.optional(),
					startDate: z.union([z.string(), z.coerce.date()]).optional(),
					endDate: z.union([z.string(), z.coerce.date()]).optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db || defaultDb;

			// Loaders only load orders that have been verified & approved by manager for loading
			let statusConditions = [
				inArray(orders.status, [
					"ready_for_loading",
					"ready_for_dispatch",
					"loaded",
				]),
			];

			if (input?.status === "loaded") {
				statusConditions = [eq(orders.status, "loaded")];
			} else if (input?.status === "packed" || input?.status === "ready_for_loading") {
				statusConditions = [
					inArray(orders.status, [
						"ready_for_loading",
						"ready_for_dispatch",
					]),
				];
			}

			if (input?.startDate || input?.endDate) {
				const { fromDate, toDate } = parseDateFilterRange(input?.startDate, input?.endDate);
				if (fromDate) statusConditions.push(gte(orders.created_at, fromDate));
				if (toDate) statusConditions.push(lte(orders.created_at, toDate));
			} else if (input?.status === "loaded") {
				const todayStart = new Date();
				todayStart.setHours(0, 0, 0, 0);
				statusConditions.push(gte(orders.created_at, todayStart));
			}

			const packedOrdersList = await db
				.select({
					id: orders.id,
					status: orders.status,
					customerId: orders.customer_id,
					totalAmount: orders.total_amount,
					createdAt: orders.created_at,
					customerName: customers.name,
					customerPhone: customers.phone,
					customerAddress: customers.address,
				})
				.from(orders)
				.leftJoin(customers, eq(orders.customer_id, customers.id))
				.where(and(...statusConditions))
				.orderBy(desc(orders.id))
				.limit(100);

			if (packedOrdersList.length === 0) {
				return [];
			}

			const orderIds = packedOrdersList.map((o) => o.id);
			const customerIds = packedOrdersList
				.map((o) => o.customerId)
				.filter(Boolean);

			// Fetch packages
			const pkgs = await db
				.select({
					id: packages.id,
					orderId: packages.order_id,
					packageNumber: packages.package_number,
					status: packages.status,
					packedBy: staff.name,
					packedAt: packages.packed_at,
					weight: packages.weight,
					dimensions: packages.dimensions,
				})
				.from(packages)
				.leftJoin(staff, eq(packages.packed_by, staff.id))
				.where(inArray(packages.order_id, orderIds));

			const pkgMap = new Map<number, any[]>();
			for (const p of pkgs) {
				const list = pkgMap.get(p.orderId) || [];
				list.push(p);
				pkgMap.set(p.orderId, list);
			}

			// Fetch items
			const items = await db
				.select({
					orderId: orderItems.order_id,
					productId: orderItems.product_id,
					productName: products.name,
					sku: products.sku,
					quantity: orderItems.quantity,
					price: orderItems.price,
				})
				.from(orderItems)
				.leftJoin(products, eq(products.id, orderItems.product_id))
				.where(inArray(orderItems.order_id, orderIds));

			const itemsMap = new Map<number, any[]>();
			for (const it of items) {
				const list = itemsMap.get(it.orderId) || [];
				list.push(it);
				itemsMap.set(it.orderId, list);
			}

			// Fetch route names from routeStops
			const routeMap = new Map<number, string>();
			if (customerIds.length > 0) {
				const rStops = await db
					.select({
						customerId: routeStops.customer_id,
						routeName: deliveryRoutes.name,
					})
					.from(routeStops)
					.leftJoin(deliveryRoutes, eq(deliveryRoutes.id, routeStops.route_id))
					.where(inArray(routeStops.customer_id, customerIds));

				for (const rs of rStops) {
					if (rs.customerId && rs.routeName) {
						routeMap.set(rs.customerId, rs.routeName);
					}
				}
			}

			// Check for active/pending delivery trips
			const tripOrderMap = new Map<
				number,
				{
					tripId: number;
					status: string;
					driverName?: string;
					vehicle?: string;
				}
			>();
			if (customerIds.length > 0) {
				const activeTripStops = await db
					.select({
						tripId: deliveryTrips.id,
						status: deliveryTrips.status,
						customerId: tripStops.customer_id,
						driverName: user.name,
						vehicleName: vehicles.name,
						vehicleReg: vehicles.registration_number,
					})
					.from(tripStops)
					.innerJoin(deliveryTrips, eq(deliveryTrips.id, tripStops.trip_id))
					.leftJoin(user, eq(user.id, deliveryTrips.driver_id))
					.leftJoin(vehicles, eq(vehicles.id, deliveryTrips.vehicle_id))
					.where(
						and(
							inArray(tripStops.customer_id, customerIds),
							inArray(deliveryTrips.status, [
								"pending",
								"ready_for_loading",
								"loading",
								"active",
								"loaded",
							]),
						),
					);

				for (const ts of activeTripStops) {
					if (ts.customerId) {
						tripOrderMap.set(ts.customerId, {
							tripId: ts.tripId,
							status: ts.status,
							driverName: ts.driverName || undefined,
							vehicle: ts.vehicleName
								? `${ts.vehicleName} (${ts.vehicleReg || ""})`
								: ts.vehicleReg || undefined,
						});
					}
				}
			}

			const enriched = packedOrdersList.map((ord) => {
				const orderPkgs = pkgMap.get(ord.id) || [];
				const orderItemsList = itemsMap.get(ord.id) || [];
				const tripInfo = ord.customerId
					? tripOrderMap.get(ord.customerId)
					: undefined;
				const village =
					ord.customerAddress?.split(",")[0]?.trim() || "Local Area";
				const routeName =
					(ord.customerId ? routeMap.get(ord.customerId) : undefined) ||
					village;

				return {
					orderId: ord.id,
					orderCode: `ORD-${ord.id}`,
					status: ord.status,
					customerName: ord.customerName || "Customer",
					customerPhone: ord.customerPhone || "N/A",
					customerAddress: ord.customerAddress || "N/A",
					village,
					routeName,
					totalAmount: ord.totalAmount,
					packageCount: orderPkgs.length || 1,
					packages: orderPkgs,
					itemsCount: orderItemsList.length,
					items: orderItemsList.map((it) => ({
						name: it.productName || "Product",
						sku: it.sku || `SKU-${it.productId}`,
						quantity: Number(it.quantity) || 1,
					})),
					packedBy: orderPkgs[0]?.packedBy || "Packer Staff",
					packedAt: orderPkgs[0]?.packedAt || ord.createdAt,
					tripId: tripInfo?.tripId || null,
					tripStatus: tripInfo?.status || null,
					driverName: tripInfo?.driverName || null,
					vehicle: tripInfo?.vehicle || null,
					isLoaded: ord.status === "loaded",
				};
			});

			if (input?.search?.trim()) {
				const q = input.search.toLowerCase().trim();
				return enriched.filter(
					(o) =>
						String(o.orderId).includes(q) ||
						o.orderCode.toLowerCase().includes(q) ||
						o.customerName.toLowerCase().includes(q) ||
						o.village.toLowerCase().includes(q) ||
						o.routeName.toLowerCase().includes(q),
				);
			}

			return enriched;
		}),

	markDirectOrderLoaded: roleProcedure(["admin", "manager", "loader"])
		.input(
			z.object({
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

			const targetStatus = input.loaded ? "loaded" : "ready_for_loading";

			await db
				.update(orders)
				.set({ status: targetStatus })
				.where(eq(orders.id, input.orderId));

			await db
				.update(packages)
				.set({ status: input.loaded ? "loaded" : "packed" })
				.where(eq(packages.order_id, input.orderId));

			return { success: true, orderId: input.orderId, status: targetStatus };
		}),
});
