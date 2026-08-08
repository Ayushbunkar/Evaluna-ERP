import { z } from "zod";
import { router, protectedProcedure, roleProcedure } from "../init";
import { db } from "@/lib/db";
import { TRPCError } from "@trpc/server";
import {
	deliveryRoutes,
	deliveryTrips,
	gpsLogs,
	proofOfDeliveries,
	routeStops,
	tripCollections,
	tripStops,
} from "@evaluna/db/schema/delivery";
import { orders, salesReturns, salesReturnItems, products } from "@evaluna/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export const deliveryRouter = router({
	// ── Routes ─────────────────────────────────────────────────────────────
	listRoutes: roleProcedure(["admin", "manager", "delivery_manager"])
		.input(z.object({ branchId: z.number().optional() }))
		.query(async ({ input, ctx }) => {
			const branch = input.branchId || ctx.user?.branchId;
			if (!branch) throw new TRPCError({ code: "BAD_REQUEST" });
			return await db.query.deliveryRoutes.findMany({
				where: eq(deliveryRoutes.branch_id, branch),
				with: { stops: { with: { customer: true } } },
			});
		}),

	createRoute: roleProcedure(["admin", "manager", "delivery_manager"])
		.input(
			z.object({
				name: z.string(),
				description: z.string().optional(),
				branchId: z.number().optional(),
				stops: z.array(
					z.object({ customerId: z.number(), sequence: z.number() })
				),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const branch = input.branchId || ctx.user?.branchId;
			if (!branch) throw new TRPCError({ code: "BAD_REQUEST" });
			
			return await db.transaction(async (tx) => {
				const [route] = await tx
					.insert(deliveryRoutes)
					.values({
						name: input.name,
						description: input.description,
						branch_id: branch,
					})
					.returning();

				if (input.stops.length > 0) {
					await tx.insert(routeStops).values(
						input.stops.map((stop) => ({
							route_id: route.id,
							customer_id: stop.customerId,
							sequence: stop.sequence,
						}))
					);
				}
				return route;
			});
		}),

	// ── Trips ──────────────────────────────────────────────────────────────
	assignTrip: roleProcedure(["admin", "manager", "delivery_manager"])
		.input(
			z.object({
				routeId: z.number(),
				driverId: z.string(),
				vehicleId: z.number(),
			})
		)
		.mutation(async ({ input }) => {
			return await db.transaction(async (tx) => {
				// 1. Create Trip
				const [trip] = await tx
					.insert(deliveryTrips)
					.values({
						route_id: input.routeId,
						driver_id: input.driverId,
						vehicle_id: input.vehicleId,
						status: "pending",
					})
					.returning();

				// 2. Fetch Route Stops to mirror them into Trip Stops
				const stops = await tx.query.routeStops.findMany({
					where: eq(routeStops.route_id, input.routeId),
				});

				if (stops.length > 0) {
					await tx.insert(tripStops).values(
						stops.map((s) => ({
							trip_id: trip.id,
							customer_id: s.customer_id,
							sequence: s.sequence,
							status: "pending",
						}))
					);
				}
				return trip;
			});
		}),

	myTrips: protectedProcedure.query(async ({ ctx }) => {
		return await db.query.deliveryTrips.findMany({
			where: eq(deliveryTrips.driver_id, ctx.user.id),
			with: {
				route: true,
				stops: {
					with: { customer: true },
					orderBy: (s, { asc }) => [asc(s.sequence)],
				},
				vehicle: true,
			},
			orderBy: (t, { desc }) => [desc(t.created_at)],
		});
	}),

	// ── Live Execution ─────────────────────────────────────────────────────
	activeTrips: roleProcedure(["admin", "manager", "delivery_manager"]).query(
		async () => {
			const activeTripsList = await db.query.deliveryTrips.findMany({
				where: eq(deliveryTrips.status, "active"),
				with: {
					driver: true,
					stops: {
						with: { customer: true },
						orderBy: (s, { asc }) => [asc(s.sequence)],
					},
					vehicle: true,
				},
			});

			const tripIds = activeTripsList.map((t) => t.id);
			if (tripIds.length === 0) return [];

			// Fetch latest GPS log for each active trip
			const logs = await db.query.gpsLogs.findMany({
				where: (t, { inArray }) => inArray(t.trip_id, tripIds),
				orderBy: (t, { desc }) => [desc(t.timestamp)],
			});

			return activeTripsList.map((trip) => {
				const latestLog = logs.find((l) => l.trip_id === trip.id);
				return { ...trip, latestLog };
			});
		}
	),

	updateTripStatus: protectedProcedure
		.input(
			z.object({
				tripId: z.number(),
				status: z.enum(["pending", "active", "completed", "cancelled"]),
			})
		)
		.mutation(async ({ input }) => {
			await db
				.update(deliveryTrips)
				.set({
					status: input.status,
					...(input.status === "active" ? { start_time: new Date() } : {}),
					...(input.status === "completed" ? { end_time: new Date() } : {}),
				})
				.where(eq(deliveryTrips.id, input.tripId));
			return { success: true };
		}),

	updateStopStatus: protectedProcedure
		.input(
			z.object({
				stopId: z.number(),
				status: z.enum([
					"pending",
					"arrived",
					"delivered",
					"partially_delivered",
					"skipped",
					"failed",
				]),
				reason: z.string().optional(),
			})
		)
		.mutation(async ({ input }) => {
			await db
				.update(tripStops)
				.set({
					status: input.status,
					comments: input.reason,
					...(input.status === "arrived" ? { arrival_time: new Date() } : {}),
					...(["delivered", "partially_delivered", "skipped", "failed"].includes(
						input.status
					)
						? { departure_time: new Date() }
						: {}),
				})
				.where(eq(tripStops.id, input.stopId));
			return { success: true };
		}),

	logGps: protectedProcedure
		.input(
			z.object({
				tripId: z.number(),
				lat: z.number(),
				lng: z.number(),
				speed: z.number().optional(),
				batteryLevel: z.number().optional(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			await db.insert(gpsLogs).values({
				trip_id: input.tripId,
				latitude: input.lat.toString(),
				longitude: input.lng.toString(),
				speed: input.speed?.toString(),
			});
			return { success: true };
		}),

	getStopDetails: protectedProcedure
		.input(z.object({ stopId: z.number() }))
		.query(async ({ input }) => {
			const stop = await db.query.tripStops.findFirst({
				where: eq(tripStops.id, input.stopId),
				with: {
					customer: true,
				},
			});

			if (!stop) throw new TRPCError({ code: "NOT_FOUND" });

			// Find orders for this customer that are out for delivery or ready (simplified)
			const customerOrders = await db.query.orders.findMany({
				where: and(
					eq(orders.customer_id, stop.customer_id)
				),
			});

			const orderIds = customerOrders.map(o => o.id);
			let items: any[] = [];
			
			if (orderIds.length > 0) {
				// Mocked aggregation for demonstration:
				// Fetch products from these orders
				// In reality we would query package_items mapped to these orders
				items = [
					{
						product_id: 1,
						product: { name: "Wireless Mouse M330" },
						quantity: 5,
					}
				];
			}

			return {
				...stop,
				items,
			};
		}),

	processPartialReturn: protectedProcedure
		.input(
			z.object({
				stopId: z.number(),
				returnedItems: z.array(
					z.object({
						productId: z.number(),
						quantity: z.number(),
						reason: z.string(),
					})
				),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const stop = await db.query.tripStops.findFirst({
				where: eq(tripStops.id, input.stopId),
			});

			if (!stop) throw new TRPCError({ code: "NOT_FOUND" });

			// Find the active order for this customer
			const activeOrder = await db.query.orders.findFirst({
				where: and(
					eq(orders.customer_id, stop.customer_id)
				),
			});
			if (!activeOrder) throw new TRPCError({ code: "NOT_FOUND", message: "No active order found for this customer" });

			// Fetch product prices to calculate totals
			const productIds = input.returnedItems.map(i => i.productId);
			const productsData = await db.query.products.findMany({
				where: inArray(products.id, productIds.length ? productIds : [0]),
			});
			
			const productPriceMap = new Map(productsData.map(p => [p.id, Number(p.price || 0)]));
			
			let totalReturnAmount = 0;
			const returnItemsData = input.returnedItems.map((item) => {
				const price = productPriceMap.get(item.productId) || 0;
				const refundAmount = price * item.quantity;
				totalReturnAmount += refundAmount;
				return {
					product_id: item.productId,
					quantity: item.quantity,
					price: price.toString(),
					refund_amount: refundAmount.toString(),
					condition: "damaged",
					reason: item.reason,
				};
			});

			await db.transaction(async (tx) => {
				// 1. Create Sales Return Record
				const [salesReturn] = await tx
					.insert(salesReturns)
					.values({
						order_id: activeOrder.id,
						customer_id: stop.customer_id,
						status: "pending",
						total_amount: totalReturnAmount.toString(),
						user_uid: ctx.user?.id || "driver", 
					})
					.returning();

				// 2. Insert Return Items
				if (returnItemsData.length > 0) {
					await tx.insert(salesReturnItems).values(
						returnItemsData.map((item) => ({
							...item,
							return_id: salesReturn.id,
						}))
					);
				}

				// 3. Mark Stop as partially delivered
				await tx
					.update(tripStops)
					.set({
						status: "partially_delivered",
						comments: "Partial return processed",
						resolved_at: new Date(),
					})
					.where(eq(tripStops.id, input.stopId));
			});

			return { success: true };
		}),
});
