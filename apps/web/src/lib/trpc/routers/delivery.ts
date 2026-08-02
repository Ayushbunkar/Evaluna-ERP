import { and, count, desc, eq, sum } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
	deliveryStops,
	deliveryTrips,
	deliveryVehicleTracking,
	orders,
	staff,
	transactions,
} from "@/lib/db/schema";
import { roleProcedure, router } from "../init";

export const deliveryRouter = router({
	getTrips: roleProcedure(["admin", "manager", "driver", "auditor"]).query(
		async () => {
			const trips = await db.query.deliveryTrips.findMany({
				orderBy: [desc(deliveryTrips.created_at)],
				with: {
					driver: true,
					stops: {
						with: {
							order: {
								with: {
									customer: true,
								},
							},
						},
					},
				},
			});

			return trips.map((t) => ({
				id: t.id,
				vehicle: t.vehicle ?? "N/A",
				driverName: t.driver?.name ?? "Unknown",
				status: t.status ?? "loading",
				warehouse: { lat: 12.9716, lng: 77.5946, name: "Main Hub" },
				stops: t.stops.map((s) => ({
					id: s.id,
					customer: s.order?.customer?.name ?? "Unknown",
					address: s.order?.customer?.address ?? "Unknown",
					lat: Number(s.lat) || 12.9784,
					lng: Number(s.lng) || 77.6408,
					status: s.status ?? "pending",
				})),
			}));
		},
	),

	createTrip: roleProcedure(["admin", "manager", "driver", "auditor"])
		.input(
			z.object({
				vehicle: z.string(),
				driver_id: z.number(),
			}),
		)
		.mutation(async ({ input }) => {
			const [trip] = await db
				.insert(deliveryTrips)
				.values({
					vehicle: input.vehicle,
					driver_id: input.driver_id,
					status: "loading",
				})
				.returning();
			return trip;
		}),

	assignOrders: roleProcedure(["admin", "manager", "driver", "auditor"])
		.input(
			z.object({
				trip_id: z.number(),
				order_ids: z.array(z.number()),
			}),
		)
		.mutation(async ({ input }) => {
			const values = input.order_ids.map((id: number, index: number) => ({
				trip_id: input.trip_id,
				order_id: id,
				sequence_no: index + 1,
				status: "pending",
			}));
			await db.insert(deliveryStops).values(values);
			return { success: true };
		}),

	updateStopStatus: roleProcedure(["admin", "manager", "driver", "auditor"])
		.input(
			z.object({
				stop_id: z.number(),
				status: z.enum([
					"reached",
					"delivered",
					"partial",
					"returned",
					"failed",
				]),
				reason: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const updateData: any = { status: input.status };
			if (input.status === "reached") updateData.reach_time = new Date();
			if (input.status === "delivered") updateData.delivery_time = new Date();
			if (input.reason) updateData.return_reason = input.reason;

			const [stop] = await db
				.update(deliveryStops)
				.set(updateData)
				.where(eq(deliveryStops.id, input.stop_id))
				.returning();

			if (input.status === "delivered") {
				await db
					.update(orders)
					.set({ locked: true, status: "completed" })
					.where(eq(orders.id, stop.order_id));
			}
			return stop;
		}),

	getDashboard: roleProcedure(["admin", "manager", "driver", "auditor"])
		.input(z.object({}))
		.query(async () => {
			const [stopsResult] = await db
				.select({
					total: count(deliveryStops.id),
				})
				.from(deliveryStops);

			const [completedResult] = await db
				.select({
					total: count(deliveryStops.id),
				})
				.from(deliveryStops)
				.where(eq(deliveryStops.status, "delivered"));

			const [pendingResult] = await db
				.select({
					total: count(deliveryStops.id),
				})
				.from(deliveryStops)
				.where(eq(deliveryStops.status, "pending"));

			const [failedResult] = await db
				.select({
					total: count(deliveryStops.id),
				})
				.from(deliveryStops)
				.where(eq(deliveryStops.status, "failed"));

			const [activeVehiclesResult] = await db
				.select({
					total: count(deliveryTrips.id),
				})
				.from(deliveryTrips)
				.where(eq(deliveryTrips.status, "dispatched"));

			const [codResult] = await db
				.select({
					total: sum(transactions.amount),
				})
				.from(transactions)
				.where(
					and(
						eq(transactions.status, "completed"),
						eq(transactions.type, "in"),
					),
				);

			const codAmount = Number(codResult.total) || 0;
			const totalDeliveries = stopsResult.total || 0;
			const completed = completedResult.total || 0;
			const successRate =
				totalDeliveries > 0
					? Math.round((completed / totalDeliveries) * 100)
					: 0;

			const drivers = await db
				.select({
					id: staff.id,
					name: staff.name,
				})
				.from(staff)
				.where(eq(staff.role, "driver"));

			const activeDrivers = drivers.map((d, index) => {
				// Mocking coordinates near Mumbai (19.0760, 72.8777)
				// Hub Location: 19.0760, 72.8777
				// Offset by index to spread them out
				const lat = 19.076 + (Math.random() - 0.5) * 0.1;
				const lng = 72.8777 + (Math.random() - 0.5) * 0.1;

				// Generate a mock route (Polyline) starting from hub to the driver's current location,
				// and ending at a destination
				const destination = { lat: lat + 0.05, lng: lng + 0.05 };
				const route = [
					{ lat: 19.076, lng: 72.8777 }, // Hub
					{ lat: lat, lng: lng }, // Current location
					destination, // Destination
				];

				return {
					id: d.id,
					name: d.name,
					status: "delivering",
					battery: 100 - index * 15, // Randomize battery a bit
					currentLocation: { lat, lng },
					destination,
					route,
				};
			});

			const recentStops = await db.query.deliveryStops.findMany({
				orderBy: [desc(deliveryStops.created_at)],
				limit: 5,
				with: {
					order: {
						with: { customer: true },
					},
					trip: {
						with: { driver: true },
					},
				},
			});

			const deliveryOrders = recentStops.map((s) => ({
				id: `TRP-${s.trip_id}-${s.order_id}`,
				customer: s.order?.customer?.name ?? "Unknown",
				address: s.order?.customer?.address ?? "Unknown",
				driver: s.trip?.driver?.name ?? "Unknown",
				amount: Number(s.order?.total_amount) || 0,
				status: s.status ?? "pending",
			}));

			return {
				todaysDeliveries: totalDeliveries,
				completedDeliveries: completed,
				pendingDeliveries: pendingResult.total || 0,
				failedDeliveries: failedResult.total || 0,
				vehiclesActive: activeVehiclesResult.total || 0,
				distanceTravelled: 0,
				deliverySuccessRate: successRate,
				averageDeliveryTime: "45 mins",
				codCollection: codAmount,
				activeDrivers,
				deliveryOrders,
			};
		}),

	getTrackingData: roleProcedure(["admin", "manager", "driver", "auditor"])
		.input(z.object({ trip_id: z.number() }))
		.query(async ({ input }) => {
			const tracking = await db.query.deliveryVehicleTracking.findFirst({
				where: eq(deliveryVehicleTracking.trip_id, input.trip_id),
				orderBy: [desc(deliveryVehicleTracking.timestamp)],
			});

			if (tracking) {
				return {
					trip_id: tracking.trip_id,
					lat: tracking.lat?.toString() ?? "19.0760",
					lng: tracking.lng?.toString() ?? "72.8777",
					timestamp: tracking.timestamp ?? new Date(),
				};
			}

			return {
				trip_id: input.trip_id,
				lat: "19.0760",
				lng: "72.8777",
				timestamp: new Date(),
			};
		}),

	updateVehicleLocation: roleProcedure([
		"admin",
		"manager",
		"driver",
		"auditor",
	])
		.input(
			z.object({
				trip_id: z.number(),
				lat: z.number(),
				lng: z.number(),
			}),
		)
		.mutation(async ({ input }) => {
			await db.insert(deliveryVehicleTracking).values({
				trip_id: input.trip_id,
				lat: input.lat.toString(),
				lng: input.lng.toString(),
			});
			return { success: true };
		}),
});
