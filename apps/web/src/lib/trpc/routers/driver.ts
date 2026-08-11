import { deliveryTrips, tripCollections, vehicles } from "@evaluna/db/schema/delivery";
import { orders, branches } from "@evaluna/db/schema";
import { desc, eq, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { protectedProcedure, router } from "../init";

export const driverRouter = router({
	getMobileDashboard: protectedProcedure
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ input, ctx }) => {
			let trip = await db.query.deliveryTrips.findFirst({
				where: or(
					eq(deliveryTrips.status, "active"),
					eq(deliveryTrips.status, "pending"),
				),
				orderBy: [desc(deliveryTrips.created_at)],
				with: {
					stops: {
						orderBy: (deliveryStops: any, { asc }: any) => [
							asc(deliveryStops.sequence),
						],
						with: {
							customer: true,
						},
					},
				},
			});

			if (!trip) {
				trip = await db.query.deliveryTrips.findFirst({
					orderBy: [desc(deliveryTrips.created_at)],
					with: {
						stops: {
							orderBy: (deliveryStops: any, { asc }: any) => [
								asc(deliveryStops.sequence),
							],
							with: {
								customer: true,
							},
						},
					},
				});
			}

			if (!trip) {
				return {
					driverName: ctx.user?.name ?? "Driver",
					status: "Offline",
					batteryLevel: 100,
					assignedOrders: 0,
					delivered: 0,
					pending: 0,
					codCollected: 0,
					distanceCovered: "0 km",
					rating: 0,
					nextDelivery: null,
					routeStops: [],
				};
			}

			const assignedOrders = trip.stops.length;
			const delivered = trip.stops.filter(
				(s: any) => s.status === "delivered",
			).length;
			const pending = trip.stops.filter(
				(s: any) => s.status === "pending",
			).length;

			const returnsProcessed = trip.stops.filter(
				(s: any) => s.status === "partially_delivered" || s.status === "failed",
			).length;

			const collections = await db
				.select({ amount: tripCollections.amount })
				.from(tripCollections)
				.where(eq(tripCollections.trip_id, trip.id));

			const codCollected = collections.reduce((acc, curr) => acc + Number(curr.amount), 0);
			const successfulCollections = collections.length;

			const nextStop = trip.stops.find((s: any) => s.status === "pending");

			let nextDelivery = null;
			if (nextStop) {
				const activeOrder = await db.query.orders.findFirst({
					where: eq(orders.customer_id, nextStop.customer_id),
					orderBy: [desc(orders.created_at)],
					with: {
						orderItems: true,
					}
				});

				nextDelivery = {
					id: `CUST-${nextStop.customer_id}`,
					order_id: activeOrder?.id,
					stop_id: nextStop.id,
					customerName: nextStop.customer?.name ?? "Unknown",
					phone: nextStop.customer?.phone ?? "N/A",
					address: nextStop.customer?.address ?? "N/A",
					landmark: "",
					paymentType: "Cash on Delivery",
					amountToCollect: activeOrder ? Number(activeOrder.total_amount) : 0,
					packages: activeOrder?.orderItems?.length ?? 1,
					eta: null,
					distance: null,
					isVerified: false,
				};
			}

			const routeStops = trip.stops.map((s: any) => ({
				id: s.id,
				status:
					s.status === "delivered"
						? "completed"
						: s.status === "pending" && s.id === nextStop?.id
							? "next"
							: "pending",
				time: s.status === "delivered" ? "Completed" : "--:--",
				address: s.customer?.address ?? s.customer?.name ?? "Unknown Location",
			}));

			return {
				driverName: ctx.user?.name ?? "Driver",
				status: trip.status === "active" ? "Online" : "Offline",
				batteryLevel: null,
				assignedOrders,
				delivered,
				pending,
				codCollected,
				successfulCollections,
				returnsProcessed,
				returnRate: assignedOrders > 0 ? Math.round((returnsProcessed / assignedOrders) * 100) : 0,
				customerRating: 4.8,
				positiveReviews: 124,
				distanceCovered: trip.total_distance
					? `${trip.total_distance} km`
					: null,
				rating: 4.8,
				nextDelivery,
				routeStops,
			};
		}),

	getSupportInfo: protectedProcedure
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ input }) => {
			if (input.branch_id) {
				const branch = await db.query.branches.findFirst({
					where: eq(branches.id, input.branch_id),
				});
				if (branch?.phone) return { dispatcherPhone: branch.phone };
			}
			return { dispatcherPhone: "+18005550199" };
		}),

	submitSupportTicket: protectedProcedure
		.input(z.object({ message: z.string().min(1) }))
		.mutation(async ({ input, ctx }) => {
			// In a real scenario, this would insert into a `support_tickets` or `messages` table.
			console.log(`[Support Ticket from ${ctx.user?.name}]: ${input.message}`);
			return { success: true };
		}),

	reportVehicleBreakdown: protectedProcedure
		.mutation(async ({ ctx }) => {
			// Find the active trip for this driver
			const trip = await db.query.deliveryTrips.findFirst({
				where: or(
					eq(deliveryTrips.status, "active"),
					eq(deliveryTrips.status, "pending"),
				),
				orderBy: [desc(deliveryTrips.created_at)],
			});

			if (!trip || !trip.vehicle_id) {
				throw new Error("No active vehicle found to report breakdown for.");
			}

			// Mark vehicle as maintenance
			await db.update(vehicles)
				.set({ status: "maintenance" })
				.where(eq(vehicles.id, trip.vehicle_id));

			// Optionally mark trip as failed or stalled
			await db.update(deliveryTrips)
				.set({ status: "pending" })
				.where(eq(deliveryTrips.id, trip.id));

			return { success: true };
		}),
});
