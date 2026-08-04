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
import { eq, and, desc } from "drizzle-orm";

export const deliveryRouter = router({
	// ── Routes ─────────────────────────────────────────────────────────────
	listRoutes: roleProcedure(["admin", "manager", "delivery_manager"])
		.input(z.object({ branchId: z.number().optional() }))
		.query(async ({ input, ctx }) => {
			const branch = input.branchId || ctx.session?.user.branch_id;
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
			const branch = input.branchId || ctx.session?.user.branch_id;
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
			where: eq(deliveryTrips.driver_id, ctx.session.user.id),
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
					reason: input.reason,
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
				driver_id: ctx.session.user.id,
				lat: input.lat.toString(),
				lng: input.lng.toString(),
				speed: input.speed?.toString(),
				battery_level: input.batteryLevel,
			});
			return { success: true };
		}),
});
