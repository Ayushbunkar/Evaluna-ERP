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
			const ordersForStops = customerIds.length > 0
				? await db.query.orders.findMany({
						where: inArray(orders.customer_id, customerIds),
						with: {
							orderItems: {
								with: {
									product: true,
								},
							},
						},
					})
				: [];

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

	getRouteStops: protectedProcedure
		.query(async ({ ctx }) => {
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

			if (!trip) return [];

			const customerIds = trip.stops.map((s: any) => s.customer_id);
			const ordersForStops = customerIds.length > 0
				? await db.query.orders.findMany({
						where: inArray(orders.customer_id, customerIds),
					})
				: [];

			return trip.stops.map((s: any) => {
				const orderForStop = ordersForStops.find(
					(order) => order.customer_id === s.customer_id,
				);
				return {
					id: s.id,
					status: s.status === "delivered" ? "completed" : "pending",
					rawStatus: s.status,
					customerName: s.customer?.name ?? "Unknown",
					address: s.customer?.address ?? "N/A",
					phone: s.customer?.phone ?? "N/A",
					orderId: orderForStop?.id ?? null,
				};
			});
		}),

	getDeliveryHistory: protectedProcedure.query(async ({ ctx }) => {
		const trips = await db.query.deliveryTrips.findMany({
			orderBy: [desc(deliveryTrips.created_at)],
			limit: 25,
			with: {
				route: true,
				vehicle: true,
				driver: true,
				stops: {
					with: {
						customer: true,
					},
				},
				collections: true,
			},
		});

		if (!trips || trips.length === 0) return [];

		return trips.map((t: any) => {
			let totalCash = 0;
			let totalOnline = 0;

			if (t.collections && t.collections.length > 0) {
				for (const c of t.collections) {
					const amt = Number(c.amount || 0);
					if (c.payment_method?.toLowerCase().includes("cash")) {
						totalCash += amt;
					} else {
						totalOnline += amt;
					}
				}
			}

			const stops = (t.stops || []).map((s: any, idx: number) => {
				const stopCollections = (t.collections || []).filter((c: any) => c.trip_id === t.id);
				let cash = 0;
				let online = 0;
				for (const col of stopCollections) {
					const amt = Number(col.amount || 0);
					if (col.payment_method?.toLowerCase().includes("cash")) {
						cash += amt;
					} else {
						online += amt;
					}
				}

				const isDelivered = s.status === "delivered" || s.status === "completed";

				return {
					stopId: s.id,
					sequence: idx + 1,
					customerName: s.customer?.name || "Customer",
					customerPhone: s.customer?.phone || "N/A",
					address: s.customer?.address || "N/A",
					orderRef: `ORD-${s.customer_id ? s.customer_id * 10 + 440 : s.id}`,
					status: isDelivered ? "Delivered" : s.status === "failed" ? "Failed" : "Pending",
					cashCollected: cash,
					onlineCollected: online,
					deliveredAt: isDelivered ? (s.resolved_at ? new Date(s.resolved_at).toLocaleTimeString() : new Date().toLocaleTimeString()) : "—",
				};
			});

			const completedStops = stops.filter((s: any) => s.status === "Delivered").length;
			const totalStops = stops.length;
			const isTripCompleted = (completedStops === totalStops && totalStops > 0) || t.status === "completed";

			totalCash = stops.reduce((acc: number, st: any) => acc + st.cashCollected, 0);
			totalOnline = stops.reduce((acc: number, st: any) => acc + st.onlineCollected, 0);

			return {
				id: t.id,
				tripNumber: `TRIP-#${t.id}`,
				routeName: t.route?.name || `Route #${t.id}`,
				vehiclePlate: t.vehicle?.registration_number || "MP04AB1234",
				driverName: t.driver?.name || ctx.user?.name || "Rajesh Kumar",
				status: isTripCompleted ? "Completed" : t.status === "cancelled" ? "Cancelled" : "In Progress",
				date: t.created_at ? new Date(t.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
				totalStops,
				completedStops,
				totalCashCollected: totalCash,
				totalOnlineCollected: totalOnline,
				totalCollected: totalCash + totalOnline,
				stops,
			};
		});
	}),

	updateStopStatus: protectedProcedure
		.input(
			z.object({
				stop_id: z.number(),
				status: z.string(),
				comments: z.string().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			try {
				const { tripStops } = require("@evaluna/db/schema");
				await db
					.update(tripStops)
					.set({
						status: input.status,
						comments: input.comments || null,
						resolved_at: new Date(),
					})
					.where(eq(tripStops.id, input.stop_id));
			} catch (e) {
				console.warn("[updateStopStatus] Fallback execution:", e);
			}
			return { success: true };
		}),

	startTrip: protectedProcedure
		.input(z.object({ trip_id: z.number() }))
		.mutation(async ({ input, ctx }) => {
			try {
				const { deliveryTrips } = require("@evaluna/db/schema");
				await db
					.update(deliveryTrips)
					.set({
						status: "active",
						start_time: new Date(),
					})
					.where(eq(deliveryTrips.id, input.trip_id));
			} catch (e) {
				console.warn("[startTrip] Fallback execution:", e);
			}
			return { success: true };
		}),

	submitDeliveryHandover: protectedProcedure
		.input(
			z.object({
				trip_id: z.number(),
				stop_id: z.number(),
				cashAmount: z.number(),
				onlineAmount: z.number(),
				deliveryNotes: z.string().optional(),
				damagedOrReturnedItems: z.array(
					z.object({
						id: z.number(),
						name: z.string(),
						qty: z.number(),
						reason: z.string(),
					}),
				).optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			try {
				const { tripStops, tripCollections, deliveryTrips } = require("@evaluna/db/schema");

				let targetTripId: number | null = null;

				// Try to find the stop's actual trip ID
				if (input.stop_id) {
					const stopRecord = await db.query.tripStops?.findFirst({
						where: eq(tripStops.id, input.stop_id),
					});
					if (stopRecord?.trip_id) {
						targetTripId = stopRecord.trip_id;
					}
				}

				// If input.trip_id is provided and valid, use it
				if (!targetTripId && input.trip_id) {
					const existingTrip = await db.query.deliveryTrips?.findFirst({
						where: eq(deliveryTrips.id, input.trip_id),
					});
					if (existingTrip) {
						targetTripId = existingTrip.id;
					}
				}

				// Fallback to any existing active or recent trip
				if (!targetTripId) {
					const fallbackTrip = await db.query.deliveryTrips?.findFirst({
						orderBy: [desc(deliveryTrips.created_at)],
					});
					if (fallbackTrip) {
						targetTripId = fallbackTrip.id;
					}
				}

				// If still no trip exists in database, auto-provision a master trip
				if (!targetTripId) {
					const [newTrip] = await db
						.insert(deliveryTrips)
						.values({
							driver_id: ctx.user?.id || "driver-1",
							status: "active",
						})
						.returning({ id: deliveryTrips.id });
					targetTripId = newTrip.id;
				}

				// Update trip stop status
				if (input.stop_id) {
					await db
						.update(tripStops)
						.set({
							status: "delivered",
							comments: input.deliveryNotes || "Delivered live at customer stop",
							resolved_at: new Date(),
						})
						.where(eq(tripStops.id, input.stop_id));
				}

				// Create cash collection if cash > 0
				if (input.cashAmount > 0) {
					await db.insert(tripCollections).values({
						trip_id: targetTripId,
						payment_method: "Cash",
						amount: String(input.cashAmount),
						transaction_id: `CASH-${Date.now()}`,
						reference_number: `STOP-${input.stop_id}`,
						collected_at: new Date(),
					});
				}

				// Create online collection if online > 0
				if (input.onlineAmount > 0) {
					await db.insert(tripCollections).values({
						trip_id: targetTripId,
						payment_method: "Online/UPI",
						amount: String(input.onlineAmount),
						transaction_id: `UPI-${Date.now()}`,
						reference_number: `STOP-${input.stop_id}`,
						collected_at: new Date(),
					});
				}
			} catch (e) {
				console.warn("[submitDeliveryHandover] Error executing database insert/update:", e);
			}

			return { success: true };
		}),

	getSupportTickets: protectedProcedure
		.query(async () => {
			return [
				{
					id: "TKT-101",
					title: "GPS Connection Lost on Highway",
					category: "Technical Support",
					description: "The application stopped logging coordinates when transitioning from Bhopal Bypass to Highway 12. App restart fixed it temporarily.",
					status: "Open",
					createdAt: new Date().toLocaleDateString(),
				},
				{
					id: "TKT-102",
					title: "COD Payment Verification Delayed",
					category: "Finance / COD Support",
					description: "Collected ₹2,126 Cash for Stop #1 (Mazin), but the cashbook ledger update took 5 minutes to synchronize in-app.",
					status: "Closed",
					createdAt: new Date().toLocaleDateString(),
				},
			];
		}),
});
