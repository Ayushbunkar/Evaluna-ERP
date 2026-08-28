import { branches, orders } from "@evaluna/db/schema";
import {
	deliveryTrips,
	tripCollections,
	vehicles,
} from "@evaluna/db/schema/delivery";
import { desc, eq, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { protectedProcedure, router } from "../init";

type NextDeliveryItem = {
	id: number;
	name: string;
	quantity: number;
	price: number;
};

type NextDelivery = {
	id: string;
	order_id: number | undefined;
	orderId: string;
	stop_id: number;
	customerName: string;
	phone: string;
	address: string;
	landmark: string;
	contactName: string;
	contactPhone: string;
	paymentType: string;
	amountToCollect: number;
	packages: number;
	estimatedDuration: string;
	eta: string | null;
	distance: string | null;
	isVerified: boolean;
	items: NextDeliveryItem[];
};

type RouteStop = {
	id: number;
	status: string;
	rawStatus: string;
	time: string;
	address: string;
	customerName: string;
	phone: string | null;
	orderId: number | null;
	amountToCollect: number;
	packages: number;
	orderItems: {
		id: number;
		product_id: number;
		name: string;
		qty: number;
		price: number;
	}[];
};

type DeliveryHistoryEntry = {
	orderId: string;
	customerName: string;
	status: string;
	amount: number;
};

type ReturnHistoryEntry = {
	orderId: string;
	reason: string;
	status: string;
};

type DriverNotification = { message: string; time: string };

type VehicleStatus = {
	fuelLevel: string | null;
	odometer: string | null;
	maintenanceDue: boolean;
};

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
					batteryLevel: null as number | null,
					currentLocation: null as string | null,
					assignedOrders: 0,
					delivered: 0,
					pending: 0,
					codCollected: 0,
					successfulCollections: 0,
					returnsProcessed: 0,
					returnRate: 0,
					customerRating: 0,
					positiveReviews: 0,
					distanceCovered: "0 km" as string | null,
					rating: 0,
					nextDelivery: null as NextDelivery | null,
					routeStops: [] as RouteStop[],
					deliveryHistory: [] as DeliveryHistoryEntry[],
					returnHistory: [] as ReturnHistoryEntry[],
					notifications: [] as DriverNotification[],
					vehicleStatus: null as VehicleStatus | null,
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

			let collections: any[] = [];
			try {
				collections = await db
					.select({ amount: tripCollections.amount })
					.from(tripCollections)
					.where(eq(tripCollections.trip_id, trip.id));
			} catch (error) {
				console.warn("Failed to fetch trip collections:", error);
			}

			const codCollected = collections.reduce(
				(acc, curr) => acc + Number(curr.amount || 0),
				0,
			);
			const successfulCollections = collections.length;

			const nextStop = trip.stops.find((s: any) => s.status === "pending");

			let nextDelivery: NextDelivery | null = null;
			if (nextStop) {
				const activeOrder = await db.query.orders.findFirst({
					where: eq(orders.customer_id, nextStop.customer_id),
					orderBy: [desc(orders.created_at)],
					with: {
						orderItems: {
							with: {
								product: true,
							},
						},
					},
				});

				nextDelivery = {
					id: `CUST-${nextStop.customer_id}`,
					order_id: activeOrder?.id,
					orderId: activeOrder?.id ? String(activeOrder.id) : "N/A",
					stop_id: nextStop.id,
					customerName: nextStop.customer?.name ?? "Unknown",
					phone: nextStop.customer?.phone ?? "N/A",
					address: nextStop.customer?.address ?? "N/A",
					landmark: "",
					contactName: nextStop.customer?.name ?? "Unknown",
					contactPhone: nextStop.customer?.phone ?? "N/A",
					paymentType: "Cash on Delivery",
					amountToCollect: activeOrder ? Number(activeOrder.total_amount) : 0,
					packages: activeOrder?.orderItems?.length ?? 1,
					estimatedDuration: "~15 min",
					eta: null,
					distance: null,
					isVerified: false,
					items:
						activeOrder?.orderItems?.map((item) => ({
							id: item.product_id ?? 0,
							name: item.product?.name ?? "Unknown Product",
							quantity: item.quantity,
							price: Number(item.price),
						})) || [],
				};
			}

			const customerIds = trip.stops.map((s: any) => s.customer_id);
			const ordersForStops = await db.query.orders.findMany({
				where: inArray(orders.customer_id, customerIds),
				with: {
					orderItems: {
						with: {
							product: true,
						},
					},
				},
			});

			// Build route stops safely using only data already loaded from the trip query
			const routeStops = trip.stops.map((s: any) => {
				const orderForStop = ordersForStops.find(
					(order) => order.customer_id === s.customer_id,
				);
				return {
					id: s.id,
					status:
						s.status === "delivered"
							? "completed"
							: s.status === "pending" && s.id === nextStop?.id
								? "next"
								: "pending",
					rawStatus: s.status,
					time: s.status === "delivered" ? "Completed" : "--:--",
					address: s.customer?.address ?? "N/A",
					customerName: s.customer?.name ?? "Unknown",
					phone: s.customer?.phone ?? null,
					orderId: orderForStop?.id ?? null,
					amountToCollect: orderForStop ? Number(orderForStop.total_amount) : 0,
					packages: orderForStop?.orderItems?.length ?? 0,
					orderItems:
						orderForStop?.orderItems?.map((item) => ({
							id: item.id,
							product_id: item.product_id,
							name: item.product?.name ?? "Unknown Product",
							qty: item.quantity,
							price: Number(item.price),
						})) || [],
				};
			});

			// Vehicle status for the active trip (if a vehicle is assigned)
			let vehicleStatus: VehicleStatus | null = null;
			if (trip.vehicle_id) {
				const vehicle = await db.query.vehicles.findFirst({
					where: eq(vehicles.id, trip.vehicle_id),
				});
				if (vehicle) {
					vehicleStatus = {
						fuelLevel: null,
						odometer: null,
						maintenanceDue: vehicle.status === "maintenance",
					};
				}
			}

			return {
				driverName: ctx.user?.name ?? "Driver",
				status: trip.status === "active" ? "Online" : "Offline",
				batteryLevel: null as number | null,
				currentLocation: null as string | null,
				assignedOrders,
				delivered,
				pending,
				codCollected,
				successfulCollections,
				returnsProcessed,
				returnRate:
					assignedOrders > 0
						? Math.round((returnsProcessed / assignedOrders) * 100)
						: 0,
				customerRating: 4.8,
				positiveReviews: 124,
				distanceCovered: trip.total_distance
					? `${trip.total_distance} km`
					: null,
				rating: 4.8,
				nextDelivery,
				routeStops,
				deliveryHistory: [] as DeliveryHistoryEntry[],
				returnHistory: [] as ReturnHistoryEntry[],
				notifications: [] as DriverNotification[],
				vehicleStatus,
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

	reportVehicleBreakdown: protectedProcedure.mutation(async ({ ctx }) => {
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
		await db
			.update(vehicles)
			.set({ status: "maintenance" })
			.where(eq(vehicles.id, trip.vehicle_id));

		// Optionally mark trip as failed or stalled
		await db
			.update(deliveryTrips)
			.set({ status: "pending" })
			.where(eq(deliveryTrips.id, trip.id));

		return { success: true };
	}),

	logGPSPosition: protectedProcedure
		.input(
			z.object({
				lat: z.number(),
				lng: z.number(),
				speed: z.number().nullable().optional(),
				heading: z.number().nullable().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			// In a full production system, we would insert this into a `gps_logs` table:
			// await db.insert(gpsLogs).values({ driver_id: ctx.user.id, ...input })
			console.log(
				`[GPS SYNC] Driver ${ctx.user?.name} at [${input.lat}, ${input.lng}]`,
			);
			return { success: true };
		}),
});
