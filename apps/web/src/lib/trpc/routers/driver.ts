import { desc, eq, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { deliveryTrips } from "@evaluna/db/schema/delivery";
import { protectedProcedure, router } from "../init";

export const driverRouter = router({
	getMobileDashboard: protectedProcedure
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ input, ctx }) => {
			let trip = await db.query.deliveryTrips.findFirst({
				where: or(eq(deliveryTrips.status, "active"), eq(deliveryTrips.status, "pending")),
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
			const delivered = trip.stops.filter((s: any) => s.status === "delivered").length;
			const pending = trip.stops.filter((s: any) => s.status === "pending").length;

			// In a real scenario, COD would be calculated from tripCollections or orders related to the stops.
			// Since orders aren't directly linked to stops in the current schema (they are on proofOfDeliveries),
			// we'll leave COD at 0 or a mocked value based on trips.
			const codCollected = 0;

			const nextStop = trip.stops.find((s: any) => s.status === "pending");

			let nextDelivery = null;
			if (nextStop) {
				nextDelivery = {
					id: `CUST-${nextStop.customer_id}`,
					stop_id: nextStop.id,
					customerName: nextStop.customer?.name ?? "Unknown",
					phone: nextStop.customer?.phone ?? "N/A",
					address: nextStop.customer?.address ?? "N/A",
					landmark: "",
					paymentType: "Cash on Delivery", // Default mock
					amountToCollect: 0,
					packages: 1,
					eta: "14 mins",
					distance: "2.4 km",
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
				batteryLevel: 82,
				assignedOrders,
				delivered,
				pending,
				codCollected,
				distanceCovered: `${trip.total_distance ?? 0} km`,
				rating: 4.8,
				nextDelivery,
				routeStops,
			};
		}),
});
