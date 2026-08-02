import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { deliveryTrips } from "@/lib/db/schema";
import { protectedProcedure, router } from "../init";

export const driverRouter = router({
	getMobileDashboard: protectedProcedure
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ input, ctx }) => {
			let trip = await db.query.deliveryTrips.findFirst({
				where: eq(deliveryTrips.status, "dispatched"),
				orderBy: [desc(deliveryTrips.created_at)],
				with: {
					driver: true,
					stops: {
						orderBy: (deliveryStops: any, { asc }: any) => [
							asc(deliveryStops.sequence_no),
						],
						with: {
							order: {
								with: {
									customer: true,
									paymentMethod: true,
								},
							},
						},
					},
				},
			});

			if (!trip) {
				trip = await db.query.deliveryTrips.findFirst({
					orderBy: [desc(deliveryTrips.created_at)],
					with: {
						driver: true,
						stops: {
							orderBy: (deliveryStops: any, { asc }: any) => [
								asc(deliveryStops.sequence_no),
							],
							with: {
								order: {
									with: {
										customer: true,
										paymentMethod: true,
									},
								},
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
			const pending = trip.stops.filter((s: any) => s.status === "pending").length;

			const codCollected = trip.stops
				.filter(
					(s: any) =>
						s.status === "delivered" &&
						s.order?.paymentMethod?.payment_type === "cash",
				)
				.reduce((sum: number, s: any) => sum + Number(s.order?.total_amount || 0), 0);

			const nextStop = trip.stops.find((s: any) => s.status === "pending");

			let nextDelivery = null;
			if (nextStop?.order) {
				nextDelivery = {
					id: `ORD-${nextStop.order_id}`,
					stop_id: nextStop.id,
					customerName: nextStop.order.customer?.name ?? "Unknown",
					phone: nextStop.order.customer?.phone ?? "N/A",
					address: nextStop.order.customer?.address ?? "N/A",
					landmark: "",
					paymentType: nextStop.order.paymentMethod?.name ?? "N/A",
					amountToCollect: Number(nextStop.order.total_amount),
					packages: 1,
					eta: "14 mins",
					distance: "2.4 km",
					isVerified: false,
				};
			}

			const routeStops = trip.stops.map((s) => ({
				id: s.id,
				status:
					s.status === "delivered"
						? "completed"
						: s.status === "pending" && s.id === nextStop?.id
							? "next"
							: "pending",
				time: s.status === "delivered" ? "Completed" : "--:--",
				address: s.order?.customer?.address ?? "Unknown",
			}));

			return {
				driverName: trip.driver?.name ?? "Driver",
				status: trip.status === "dispatched" ? "Online" : "Offline",
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
