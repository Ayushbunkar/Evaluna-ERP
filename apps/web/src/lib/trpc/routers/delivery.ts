import {
	orders,
	products,
	salesReturnItems,
	salesReturns,
	user,
} from "@evaluna/db/schema";
import {
	deliveryRoutes,
	deliveryTrips,
	gpsLogs,
	proofOfDeliveries,
	routeStops,
	tripCollections,
	tripStops,
} from "@evaluna/db/schema/delivery";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { protectedProcedure, roleProcedure, router } from "../init";

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
					z.object({ customerId: z.number(), sequence: z.number() }),
				),
			}),
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
						})),
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
			}),
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
						})),
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
		},
	),

	updateTripStatus: protectedProcedure
		.input(
			z.object({
				tripId: z.number(),
				status: z.enum(["pending", "active", "completed", "cancelled"]),
			}),
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
			}),
		)
		.mutation(async ({ input }) => {
			await db
				.update(tripStops)
				.set({
					status: input.status,
					comments: input.reason,
					...(input.status === "arrived" ? { arrival_time: new Date() } : {}),
					...([
						"delivered",
						"partially_delivered",
						"skipped",
						"failed",
					].includes(input.status)
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
			}),
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
				where: and(eq(orders.customer_id, stop.customer_id)),
			});

			const orderIds = customerOrders.map((o) => o.id);
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
					},
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
					}),
				),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const stop = await db.query.tripStops.findFirst({
				where: eq(tripStops.id, input.stopId),
			});

			if (!stop) throw new TRPCError({ code: "NOT_FOUND" });

			// Find the active order for this customer
			const activeOrder = await db.query.orders.findFirst({
				where: and(eq(orders.customer_id, stop.customer_id)),
			});
			if (!activeOrder)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "No active order found for this customer",
				});

			// Fetch product prices to calculate totals
			const productIds = input.returnedItems.map((i) => i.productId);
			const productsData = await db.query.products.findMany({
				where: inArray(products.id, productIds.length ? productIds : [0]),
			});

			const productPriceMap = new Map(
				productsData.map((p) => [p.id, Number(p.price || 0)]),
			);

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
						})),
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

	// New endpoint for vehicle location updates
	updateVehicleLocation: protectedProcedure
		.input(
			z.object({
				tripId: z.number(),
				latitude: z.number(),
				longitude: z.number(),
				speed: z.number().optional(),
				batteryLevel: z.number().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			await db.insert(gpsLogs).values({
				trip_id: input.tripId,
				latitude: input.latitude.toString(),
				longitude: input.longitude.toString(),
				speed: input.speed?.toString(),
				battery_level: input.batteryLevel?.toString(),
				timestamp: new Date(),
			});
			return { success: true };
		}),

	// New endpoint to get trips for driver
	getTrips: protectedProcedure
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ input, ctx }) => {
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

	// ── Dispatcher Panel ────────────────────────────────────────────────────
	listDrivers: roleProcedure(["admin", "manager", "delivery_manager"])
		.input(z.object({ branchId: z.number().optional() }))
		.query(async ({ input, ctx }) => {
			const branch = input.branchId || ctx.user?.branchId;
			return await db.query.user.findMany({
				where: (u, { eq, or }) => or(
					eq(u.role, "delivery"),
					eq(u.role, "driver"),
					eq(u.role, "delivery_boy"),
				),
				columns: { id: true, name: true, email: true, role: true, image: true },
			});
		}),

	listAllTrips: roleProcedure(["admin", "manager", "delivery_manager"])
		.input(z.object({ branchId: z.number().optional(), status: z.string().optional() }))
		.query(async ({ input, ctx }) => {
			return await db.query.deliveryTrips.findMany({
				with: {
					route: true,
					driver: { columns: { id: true, name: true, email: true, image: true } },
					vehicle: true,
					stops: {
						with: { customer: { columns: { id: true, name: true, phone: true, address: true } } },
						orderBy: (s, { asc }) => [asc(s.sequence)],
					},
				},
				orderBy: (t, { desc }) => [desc(t.created_at)],
			});
		}),

	cancelTrip: roleProcedure(["admin", "manager", "delivery_manager"])
		.input(z.object({ tripId: z.number() }))
		.mutation(async ({ input }) => {
			await db
				.update(deliveryTrips)
				.set({ status: "cancelled" })
				.where(eq(deliveryTrips.id, input.tripId));
			return { success: true };
		}),

	optimizeRouteSequence: roleProcedure(["admin", "manager", "delivery_manager"])
		.input(z.object({ customerIds: z.array(z.number()) }))
		.mutation(async ({ input }) => {
			if (input.customerIds.length <= 1) return input.customerIds;

			// Fetch customers to get their coordinates
			const customersData = await db.query.customers.findMany({
				where: inArray(customers.id, input.customerIds),
				columns: { id: true, latitude: true, longitude: true },
			});

			// Haversine distance function
			const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
				const R = 6371; // Radius of the earth in km
				const dLat = (lat2 - lat1) * (Math.PI / 180);
				const dLon = (lon2 - lon1) * (Math.PI / 180);
				const a =
					Math.sin(dLat / 2) * Math.sin(dLat / 2) +
					Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
					Math.sin(dLon / 2) * Math.sin(dLon / 2);
				const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
				return R * c; // Distance in km
			};

			// Default coordinates if missing (Mumbai center)
			const parseCoord = (c: string | null) => c ? parseFloat(c) : 19.0760;
			const parseLon = (c: string | null) => c ? parseFloat(c) : 72.8777;

			// Implement Nearest Neighbor TSP Algorithm
			let unvisited = [...customersData];
			const optimizedIds: number[] = [];
			
			// Start from the first selected customer (or we could use branch coordinates)
			let current = unvisited.find(c => c.id === input.customerIds[0]) || unvisited[0];
			optimizedIds.push(current.id);
			unvisited = unvisited.filter(c => c.id !== current.id);

			while (unvisited.length > 0) {
				let nearestIdx = 0;
				let minDistance = Infinity;

				for (let i = 0; i < unvisited.length; i++) {
					const node = unvisited[i];
					const dist = getDistance(
						parseCoord(current.latitude), parseLon(current.longitude),
						parseCoord(node.latitude), parseLon(node.longitude)
					);
					if (dist < minDistance) {
						minDistance = dist;
						nearestIdx = i;
					}
				}

				current = unvisited[nearestIdx];
				optimizedIds.push(current.id);
				unvisited.splice(nearestIdx, 1);
			}

			return optimizedIds;
		}),

	createTripDirect: roleProcedure(["admin", "manager", "delivery_manager"])
		.input(
			z.object({
				driverId: z.string(),
				vehicleId: z.number().optional(),
				stops: z.array(
					z.object({
						customerId: z.number(),
						sequence: z.number(),
						notes: z.string().optional(),
					}),
				),
				routeName: z.string().optional(),
				branchId: z.number().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const branch = input.branchId || ctx.user?.branchId;
			return await db.transaction(async (tx) => {
				// 1. Create a route for this trip
				const [route] = await tx
					.insert(deliveryRoutes)
					.values({
						name: input.routeName || `Trip ${new Date().toLocaleDateString("en-IN")}`,
						branch_id: branch || null,
					})
					.returning();

				// 2. Insert route stops
				if (input.stops.length > 0) {
					await tx.insert(routeStops).values(
						input.stops.map((s) => ({
							route_id: route.id,
							customer_id: s.customerId,
							sequence: s.sequence,
						})),
					);
				}

				// 3. Create the trip
				const [trip] = await tx
					.insert(deliveryTrips)
					.values({
						route_id: route.id,
						driver_id: input.driverId,
						vehicle_id: input.vehicleId || null,
						status: "pending",
					})
					.returning();

				// 4. Create trip stops
				if (input.stops.length > 0) {
					await tx.insert(tripStops).values(
						input.stops.map((s) => ({
							trip_id: trip.id,
							customer_id: s.customerId,
							sequence: s.sequence,
							status: "pending",
						})),
					);
				}

				return trip;
			});
		}),
});