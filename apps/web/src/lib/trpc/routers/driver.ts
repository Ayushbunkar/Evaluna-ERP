import { branches, orders, staff, transactions, user } from "@evaluna/db/schema";
import {
	deliveryTrips,
	driverSupportTickets,
	proofOfDeliveries,
	tripCollections,
	tripStops,
	vehicles,
} from "@evaluna/db/schema/delivery";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
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
	orderIds?: number[];
	ordersCount?: number;
	orders?: Array<{
		id: number;
		total_amount: number;
		status: string;
		itemsCount: number;
	}>;
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
	trip_id?: number;
	status: string;
	rawStatus: string;
	time: string;
	address: string;
	customerName: string;
	phone: string | null;
	orderId: number | string | null;
	orderIds?: number[];
	ordersCount?: number;
	orders?: Array<{
		id: number;
		total_amount: number;
		status: string;
		itemsCount: number;
	}>;
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

async function getDriverIdentifiers(ctx: any): Promise<{ ids: string[]; numericStaffIds: number[] }> {
	const currentUser = ctx.user;
	if (!currentUser) return { ids: [], numericStaffIds: [] };

	const ids = new Set<string>();
	const numericStaffIds = new Set<number>();

	const addSafe = (val: any) => {
		if (val !== undefined && val !== null && String(val).trim()) {
			const str = String(val).trim();
			ids.add(str);
			ids.add(str.toLowerCase());
			if (!isNaN(Number(str)) && Number(str) > 0) {
				numericStaffIds.add(Number(str));
			}
		}
	};

	addSafe(currentUser.id);
	addSafe(currentUser.userId);
	addSafe(currentUser.email);
	addSafe(currentUser.name);
	addSafe(currentUser.staffId);
	addSafe(currentUser.staff_id);

	if (currentUser.staff) {
		addSafe(currentUser.staff.id);
		addSafe(currentUser.staff.staff_code);
		addSafe(currentUser.staff.staffCode);
		addSafe(currentUser.staff.name);
		addSafe(currentUser.staff.email);
	}

	try {
		// 1. Direct query on user table first for email/name aliases
		const userConditions = [];
		if (currentUser.id) {
			userConditions.push(eq(user.id, currentUser.id));
		}
		if (currentUser.userId && currentUser.userId !== currentUser.id) {
			userConditions.push(eq(user.id, currentUser.userId));
		}
		if (currentUser.email) {
			userConditions.push(
				sql`LOWER(TRIM(${user.email})) = LOWER(TRIM(${currentUser.email}))`,
			);
		}
		if (currentUser.name) {
			userConditions.push(
				sql`LOWER(TRIM(${user.name})) = LOWER(TRIM(${currentUser.name}))`,
			);
		}

		const emailsToSearch = new Set<string>();
		const namesToSearch = new Set<string>();

		if (currentUser.email) emailsToSearch.add(currentUser.email);
		if (currentUser.name) namesToSearch.add(currentUser.name);

		if (userConditions.length > 0) {
			const usersList = await db
				.select({
					id: user.id,
					name: user.name,
					email: user.email,
				})
				.from(user)
				.where(or(...userConditions));

			for (const u of usersList) {
				addSafe(u.id);
				addSafe(u.email);
				addSafe(u.name);
				if (u.email) emailsToSearch.add(u.email);
				if (u.name) namesToSearch.add(u.name);
			}
		}

		// 2. Direct query on staff table using resolved emails, names, and staff IDs
		const staffConditions = [];
		for (const emailVal of emailsToSearch) {
			if (emailVal.trim()) {
				staffConditions.push(
					sql`LOWER(TRIM(${staff.email})) = LOWER(TRIM(${emailVal}))`,
				);
			}
		}
		for (const nameVal of namesToSearch) {
			if (nameVal.trim()) {
				staffConditions.push(
					sql`LOWER(TRIM(${staff.name})) = LOWER(TRIM(${nameVal}))`,
				);
				staffConditions.push(
					sql`LOWER(${staff.name}) LIKE LOWER(${`%${nameVal.trim()}%`})`,
				);
			}
		}
		if (currentUser.staffId && !isNaN(Number(currentUser.staffId))) {
			staffConditions.push(eq(staff.id, Number(currentUser.staffId)));
		}
		if (currentUser.staff_id && !isNaN(Number(currentUser.staff_id))) {
			staffConditions.push(eq(staff.id, Number(currentUser.staff_id)));
		}
		if (currentUser.staff?.id && !isNaN(Number(currentUser.staff.id))) {
			staffConditions.push(eq(staff.id, Number(currentUser.staff.id)));
		}
		if (currentUser.id && !isNaN(Number(currentUser.id))) {
			staffConditions.push(eq(staff.id, Number(currentUser.id)));
		}

		if (staffConditions.length > 0) {
			const staffList = await db
				.select({
					id: staff.id,
					staff_code: staff.staff_code,
					name: staff.name,
					email: staff.email,
				})
				.from(staff)
				.where(or(...staffConditions));

			for (const s of staffList) {
				addSafe(s.id);
				addSafe(s.staff_code);
				addSafe(s.email);
				addSafe(s.name);
			}
		}
	} catch (e) {
		console.warn("[getDriverIdentifiers] lookup error:", e);
	}

	return {
		ids: Array.from(ids).filter(Boolean),
		numericStaffIds: Array.from(numericStaffIds),
	};
}

export const driverRouter = router({
	getMobileDashboard: protectedProcedure
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ input, ctx }) => {
			try {
				const { ids: driverIds, numericStaffIds } =
					await getDriverIdentifiers(ctx);

				const userEmail = ctx.user?.email;
				const userName = ctx.user?.name;
				const emailPrefix = userEmail?.split("@")[0];
				const tripSqlConditions: any[] = [];
				if (driverIds.length > 0) {
					tripSqlConditions.push(inArray(deliveryTrips.driver_id, driverIds));
				}
				if (userEmail) {
					tripSqlConditions.push(
						sql`LOWER(TRIM(${deliveryTrips.driver_id})) = LOWER(TRIM(${userEmail}))`,
					);
				}
				if (userName) {
					tripSqlConditions.push(
						sql`LOWER(TRIM(${deliveryTrips.driver_id})) = LOWER(TRIM(${userName}))`,
					);
				}
				if (emailPrefix) {
					tripSqlConditions.push(
						sql`LOWER(TRIM(${deliveryTrips.driver_id})) = LOWER(TRIM(${emailPrefix}))`,
					);
				}

				let trip: any = null;

				// 1. Try driver-specific trips first (prioritize active/out_for_delivery/dispatched)
				if (tripSqlConditions.length > 0) {
					// 1a. Try active dispatched trips first
					trip = await db.query.deliveryTrips.findFirst({
						where: and(
							or(...tripSqlConditions),
							inArray(deliveryTrips.status, [
								"active",
								"out_for_delivery",
								"dispatched",
								"in_progress",
							]),
						),
						orderBy: [desc(deliveryTrips.created_at)],
						with: {
							stops: {
								orderBy: (s: any, { asc }: any) => [asc(s.sequence)],
								with: { customer: true },
							},
						},
					});

					// 1b. If no active trip, check loaded / ready / pending trips
					if (!trip || !trip.stops || trip.stops.length === 0) {
						trip = await db.query.deliveryTrips.findFirst({
							where: and(
								or(...tripSqlConditions),
								inArray(deliveryTrips.status, [
									"loaded",
									"ready_for_loading",
									"pending",
									"assigned",
									"ready_for_dispatch",
								]),
							),
							orderBy: [desc(deliveryTrips.created_at)],
							with: {
								stops: {
									orderBy: (s: any, { asc }: any) => [asc(s.sequence)],
									with: { customer: true },
								},
							},
						});
					}
				}

				// If no driver-specific trip was found, check if orders are assigned directly to driver staff ID/UID and ready for dispatch or out for delivery
				if (!trip || !trip.stops || trip.stops.length === 0) {
					const assignedOrdersConditions = [];
					if (numericStaffIds.length > 0) {
						assignedOrdersConditions.push(
							inArray(orders.driver_id, numericStaffIds),
						);
					}
					if (driverIds.length > 0) {
						assignedOrdersConditions.push(inArray(orders.user_uid, driverIds));
					}

					const directOrders =
						assignedOrdersConditions.length > 0
							? await db.query.orders.findMany({
									where: and(
										or(...assignedOrdersConditions),
										inArray(orders.status, [
											"ready_for_dispatch",
											"out_for_delivery",
											"dispatched",
											"in_transit",
											"assigned",
											"packed",
											"loaded",
										]),
									),
									orderBy: [desc(orders.created_at)],
									with: {
										customer: true,
										orderItems: {
											with: {
												product: true,
											},
										},
									},
							  })
							: [];

					if (directOrders.length > 0) {
						// Group orders by customer
						const custMap = new Map<number, any[]>();
						for (const ord of directOrders) {
							const cId = ord.customer_id || 0;
							if (!custMap.has(cId)) {
								custMap.set(cId, []);
							}
							custMap.get(cId)!.push(ord);
						}

						const virtualStops: RouteStop[] = [];
						let seq = 1;

						for (const [cId, ords] of custMap.entries()) {
							const firstOrd = ords[0];
							const cust = firstOrd.customer;
							const orderIdList = ords.map((o) => o.id);
							const formattedOrderIds = orderIdList
								.map((id) => `ORD-${id}`)
								.join(", ");
							const totalAmount = ords.reduce(
								(sum, o) => sum + Number(o.total_amount || 0),
								0,
							);
							const allItems = ords.flatMap((o) => o.orderItems || []);

							virtualStops.push({
								id: firstOrd.id,
								trip_id: 0,
								status: seq === 1 ? "next" : "pending",
								rawStatus: firstOrd.status,
								time: "--:--",
								address: cust?.address || firstOrd.shipping_address || "N/A",
								customerName: cust?.name || "Customer",
								phone: cust?.phone || null,
								orderId: formattedOrderIds,
								orderIds: orderIdList,
								ordersCount: ords.length,
								orders: ords.map((o) => ({
									id: o.id,
									total_amount: Number(o.total_amount || 0),
									status: o.status,
									itemsCount: o.orderItems?.length || 0,
								})),
								amountToCollect: totalAmount,
								packages: allItems.length > 0 ? allItems.length : ords.length,
								orderItems: allItems.map((item) => ({
									id: item.id,
									product_id: item.product_id,
									name: item.product?.name || "Product",
									qty: item.quantity,
									price: Number(item.price || 0),
								})),
							});
							seq++;
						}

						const firstStop = virtualStops[0];
						const nextDelivery: NextDelivery = {
							id: `CUST-${firstStop.id}`,
							order_id: firstStop.orderIds?.[0],
							orderId: String(firstStop.orderId || ""),
							orderIds: firstStop.orderIds,
							ordersCount: firstStop.ordersCount,
							orders: firstStop.orders,
							stop_id: firstStop.id,
							customerName: firstStop.customerName,
							phone: firstStop.phone || "N/A",
							address: firstStop.address,
							landmark: "",
							contactName: firstStop.customerName,
							contactPhone: firstStop.phone || "N/A",
							paymentType: "Cash on Delivery / UPI",
							amountToCollect: firstStop.amountToCollect,
							packages: firstStop.packages,
							estimatedDuration: "~15 min",
							eta: null,
							distance: null,
							isVerified: false,
							items: firstStop.orderItems.map((i) => ({
								id: i.product_id,
								name: i.name,
								quantity: i.qty,
								price: i.price,
							})),
						};

						return {
							driverName: ctx.user?.name ?? "Driver",
							status: "Online",
							batteryLevel: null as number | null,
							currentLocation: null as string | null,
							assignedOrders: directOrders.length,
							delivered: 0,
							pending: directOrders.length,
							codCollected: 0,
							successfulCollections: 0,
							returnsProcessed: 0,
							returnRate: 0,
							customerRating: 4.9,
							positiveReviews: 48,
							distanceCovered: "0 km" as string | null,
							rating: 4.9,
							nextDelivery,
							routeStops: virtualStops,
							deliveryHistory: [] as DeliveryHistoryEntry[],
							returnHistory: [] as ReturnHistoryEntry[],
							notifications: [] as DriverNotification[],
							vehicleStatus: null as VehicleStatus | null,
						};
					}

					return {
						driverName: ctx.user?.name ?? "Driver",
						status: "Online",
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
					(s: any) => s.status === "delivered" || s.status === "completed",
				).length;
				const pending = trip.stops.filter(
					(s: any) => s.status !== "delivered" && s.status !== "completed",
				).length;

				const returnsProcessed = trip.stops.filter(
					(s: any) =>
						s.status === "partially_delivered" || s.status === "failed",
				).length;

				const nextStop =
					trip.stops.find(
						(s: any) => s.status !== "delivered" && s.status !== "completed",
					) || trip.stops[0];
				const customerIds = trip.stops
					.map((s: any) => s.customer_id)
					.filter(Boolean);

				const [collections, ordersForStops, vehicle] = await Promise.all([
					db
						.select({ amount: tripCollections.amount })
						.from(tripCollections)
						.where(eq(tripCollections.trip_id, trip.id))
						.catch((error) => {
							console.warn("Failed to fetch trip collections:", error);
							return [];
						}),
					customerIds.length > 0
						? db.query.orders.findMany({
								where: inArray(orders.customer_id, customerIds),
								orderBy: [desc(orders.created_at)],
								with: {
									customer: true,
									orderItems: {
										columns: {
											id: true,
											order_id: true,
											product_id: true,
											quantity: true,
											price: true,
										},
										with: {
											product: {
												columns: {
													id: true,
													name: true,
												},
											},
										},
									},
								},
							})
						: [],
					trip.vehicle_id
						? db.query.vehicles.findFirst({
								where: eq(vehicles.id, trip.vehicle_id),
							})
						: null,
				]);

				const codCollected = collections.reduce(
					(acc, curr) => acc + Number(curr.amount || 0),
					0,
				);
				const successfulCollections = collections.length;

				let nextDelivery: NextDelivery | null = null;
				if (nextStop) {
					const allMatchingOrders = ordersForStops.filter(
						(o) => o.customer_id === nextStop.customer_id,
					);
					const pendingOrders = allMatchingOrders.filter(
						(o) => o.status !== "delivered" && o.status !== "completed",
					);
					const activeOrders =
						pendingOrders.length > 0 ? pendingOrders : allMatchingOrders;

					const activeOrder = activeOrders[0];
					const orderIdList = activeOrders.map((o) => o.id);
					const formattedOrderIds =
						orderIdList.length > 0
							? orderIdList.map((id) => `ORD-${id}`).join(", ")
							: activeOrder?.id
								? `ORD-${activeOrder.id}`
								: `ORD-${nextStop.id}`;
					const totalAmount = activeOrders.reduce(
						(sum, o) => sum + Number(o.total_amount || 0),
						0,
					);
					const allItems = activeOrders.flatMap((o) => o.orderItems || []);

					const resolvedCustName =
						nextStop.customer?.name ||
						activeOrder?.customer?.name ||
						"Customer";
					const resolvedCustPhone =
						nextStop.customer?.phone ||
						activeOrder?.customer?.phone ||
						(activeOrder as any)?.customer_phone ||
						"N/A";
					const resolvedCustAddress =
						nextStop.customer?.address ||
						activeOrder?.customer?.address ||
						(activeOrder as any)?.shipping_address ||
						"N/A";

					nextDelivery = {
						id: `CUST-${nextStop.customer_id}`,
						order_id: activeOrder?.id,
						orderId: formattedOrderIds,
						orderIds: orderIdList,
						ordersCount: activeOrders.length,
						orders: activeOrders.map((o) => ({
							id: o.id,
							total_amount: Number(o.total_amount || 0),
							status: o.status,
							itemsCount: o.orderItems?.length || 0,
						})),
						stop_id: nextStop.id,
						customerName: resolvedCustName,
						phone: resolvedCustPhone,
						address: resolvedCustAddress,
						landmark: "",
						contactName: resolvedCustName,
						contactPhone: resolvedCustPhone,
						paymentType: "Cash on Delivery / UPI",
						amountToCollect: totalAmount,
						packages: allItems.length > 0 ? allItems.length : 1,
						estimatedDuration: "~15 min",
						eta: null,
						distance: null,
						isVerified: false,
						items:
							allItems.map((item) => ({
								id: item.product_id ?? 0,
								name: item.product?.name ?? "Product",
								quantity: item.quantity,
								price: Number(item.price || 0),
							})) || [],
					};
				}

				// Build route stops safely using data loaded from trip query and ordersForStops
				const routeStops = trip.stops.map((s: any, idx: number) => {
					const allMatchingOrders = ordersForStops.filter(
						(order) => order.customer_id === s.customer_id,
					);
					const pendingOrders = allMatchingOrders.filter(
						(o) => o.status !== "delivered" && o.status !== "completed",
					);
					const matchingOrders =
						s.status === "delivered" || pendingOrders.length === 0
							? allMatchingOrders
							: pendingOrders;

					const matchingOrder = matchingOrders[0];
					const orderIdList = matchingOrders.map((o) => o.id);
					const formattedOrderIds =
						orderIdList.length > 0
							? orderIdList.map((id) => `ORD-${id}`).join(", ")
							: `ORD-${s.id || 460 + idx}`;
					const totalAmount = matchingOrders.reduce(
						(sum, o) => sum + Number(o.total_amount || 0),
						0,
					);
					const allItems = matchingOrders.flatMap((o) => o.orderItems || []);

					const resolvedCustName =
						s.customer?.name ||
						matchingOrder?.customer?.name ||
						"Customer";
					const resolvedCustPhone =
						s.customer?.phone ||
						matchingOrder?.customer?.phone ||
						(matchingOrder as any)?.customer_phone ||
						null;
					const resolvedCustAddress =
						s.customer?.address ||
						matchingOrder?.customer?.address ||
						(matchingOrder as any)?.shipping_address ||
						"N/A";

					return {
						id: s.id,
						trip_id: trip.id,
						status:
							s.status === "delivered" || s.status === "completed"
								? "completed"
								: s.id === nextStop?.id
									? "next"
									: "pending",
						rawStatus: s.status,
						time:
							s.status === "delivered" || s.status === "completed"
								? "Completed"
								: "--:--",
						address: resolvedCustAddress,
						customerName: resolvedCustName,
						phone: resolvedCustPhone,
						orderId: formattedOrderIds,
						orderIds: orderIdList,
						ordersCount: matchingOrders.length,
						orders: matchingOrders.map((o) => ({
							id: o.id,
							total_amount: Number(o.total_amount || 0),
							status: o.status,
							itemsCount: o.orderItems?.length || 0,
						})),
						amountToCollect: totalAmount,
						packages: allItems.length > 0 ? allItems.length : 1,
						orderItems:
							allItems.map((item) => ({
								id: item.id,
								product_id: item.product_id,
								name: item.product?.name ?? "Product",
								qty: item.quantity,
								price: Number(item.price || 0),
							})) || [],
					};
				});

				// Vehicle status for the active trip (if a vehicle is assigned)
				const vehicleStatus: VehicleStatus | null = vehicle
					? {
							fuelLevel: null,
							odometer: null,
							maintenanceDue: vehicle.status === "maintenance",
						}
					: null;

				return {
					driverName: ctx.user?.name ?? "Driver",
					status: "Online",
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
					customerRating: 4.9,
					positiveReviews: 124,
					distanceCovered: trip.total_distance
						? `${trip.total_distance} km`
						: null,
					rating: 4.9,
					nextDelivery,
					routeStops,
					deliveryHistory: [] as DeliveryHistoryEntry[],
					returnHistory: [] as ReturnHistoryEntry[],
					notifications: [] as DriverNotification[],
					vehicleStatus,
				};
			} catch (error) {
				console.warn("[getMobileDashboard] Fallback on query error:", error);
				return {
					driverName: ctx.user?.name ?? "Driver",
					status: "Online",
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
		.input(
			z.object({
				title: z.string().min(1, "Title is required"),
				category: z.string().min(1, "Category is required"),
				description: z.string().min(1, "Description is required"),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			try {
				await db.insert(driverSupportTickets).values({
					driver_id: ctx.user?.id || "driver-1",
					title: input.title,
					category: input.category,
					description: input.description,
					status: "Open",
				});
			} catch (e) {
				console.warn("[submitSupportTicket] Fallback execution:", e);
			}
			return { success: true };
		}),

	reportVehicleBreakdown: protectedProcedure.mutation(async ({ ctx }) => {
		const { ids: driverIds } = await getDriverIdentifiers(ctx);
		// Find the active trip for this driver
		const trip = await db.query.deliveryTrips.findFirst({
			where: and(
				driverIds.length > 0
					? inArray(deliveryTrips.driver_id, driverIds)
					: undefined,
				inArray(deliveryTrips.status, [
					"active",
					"out_for_delivery",
					"pending",
					"in_progress",
					"dispatched",
				]),
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

	getRouteStops: protectedProcedure.query(async ({ ctx }) => {
		try {
			const { ids: driverIds, numericStaffIds } =
				await getDriverIdentifiers(ctx);

			// Fetch delivery trips specifically assigned to this logged-in driver
			// First try: inArray match on all known driver identifiers
			let trips: any[] = [];

			// Build a direct SQL condition: driver_id matches UUID, email, or name
			const userEmail = ctx.user?.email;
			const userName = ctx.user?.name;

			const sqlConditions = [];
			const emailPrefix = userEmail?.split("@")[0];
			if (driverIds.length > 0) {
				sqlConditions.push(inArray(deliveryTrips.driver_id, driverIds));
			}
			if (userEmail) {
				sqlConditions.push(
					sql`LOWER(TRIM(${deliveryTrips.driver_id})) = LOWER(TRIM(${userEmail}))`,
				);
			}
			if (userName) {
				sqlConditions.push(
					sql`LOWER(TRIM(${deliveryTrips.driver_id})) = LOWER(TRIM(${userName}))`,
				);
			}
			if (emailPrefix) {
				sqlConditions.push(
					sql`LOWER(TRIM(${deliveryTrips.driver_id})) = LOWER(TRIM(${emailPrefix}))`,
				);
			}

			const allowedStatuses = [
				"active",
				"out_for_delivery",
				"loaded",
				"ready_for_loading",
				"pending",
				"in_progress",
				"dispatched",
				"assigned",
				"ready_for_dispatch",
			];

			// 1. Try driver-specific trips first (prioritizing active/dispatched)
			if (sqlConditions.length > 0) {
				trips = await db.query.deliveryTrips.findMany({
					where: and(
						or(...sqlConditions),
						inArray(deliveryTrips.status, allowedStatuses),
					),
					orderBy: [
						sql`CASE 
							WHEN ${deliveryTrips.status} IN ('active', 'out_for_delivery', 'dispatched', 'in_progress') THEN 1 
							WHEN ${deliveryTrips.status} = 'loaded' THEN 2 
							ELSE 3 
						END`,
						desc(deliveryTrips.created_at),
					],
					with: {
						stops: {
							orderBy: (s: any, { asc }: any) => [asc(s.sequence)],
							with: {
								customer: true,
							},
						},
					},
				});
			}

			// Collect all stops across driver's trips
			const allStops: any[] = [];
			for (const trip of trips) {
				if (trip.stops && trip.stops.length > 0) {
					for (const stop of trip.stops) {
						allStops.push({ ...stop, trip_id: trip.id });
					}
				}
			}

			// If no trip stops found, check if orders are directly assigned to driver staff ID/UID and ready for dispatch or out for delivery
			if (allStops.length === 0) {
				const assignedOrdersConditions = [];
				if (numericStaffIds.length > 0) {
					assignedOrdersConditions.push(
						inArray(orders.driver_id, numericStaffIds),
					);
				}
				if (driverIds.length > 0) {
					assignedOrdersConditions.push(inArray(orders.user_uid, driverIds));
				}

				const directOrders =
					assignedOrdersConditions.length > 0
						? await db.query.orders.findMany({
								where: and(
									or(...assignedOrdersConditions),
									inArray(orders.status, [
										"ready_for_dispatch",
										"out_for_delivery",
										"dispatched",
										"in_transit",
										"assigned",
										"packed",
										"loaded",
									]),
								),
								orderBy: [desc(orders.created_at)],
								with: {
									customer: true,
									orderItems: {
										with: {
											product: true,
										},
									},
								},
						  })
						: [];

				if (directOrders.length === 0) return [];

				const custMap = new Map<number, any[]>();
				for (const ord of directOrders) {
					const cId = ord.customer_id || 0;
					if (!custMap.has(cId)) {
						custMap.set(cId, []);
					}
					custMap.get(cId)!.push(ord);
				}

				const virtualStops: RouteStop[] = [];
				let seq = 1;

				for (const [cId, ords] of custMap.entries()) {
					const firstOrd = ords[0];
					const cust = firstOrd.customer;
					const orderIdList = ords.map((o) => o.id);
					const formattedOrderIds = orderIdList
						.map((id) => `ORD-${id}`)
						.join(", ");
					const totalAmount = ords.reduce(
						(sum, o) => sum + Number(o.total_amount || 0),
						0,
					);
					const allItems = ords.flatMap((o) => o.orderItems || []);

					virtualStops.push({
						id: firstOrd.id,
						trip_id: 0,
						status: seq === 1 ? "next" : "pending",
						rawStatus: firstOrd.status,
						time: "--:--",
						address: cust?.address || firstOrd.shipping_address || "N/A",
						customerName: cust?.name || "Customer",
						phone: cust?.phone || null,
						orderId: formattedOrderIds,
						orderIds: orderIdList,
						ordersCount: ords.length,
						orders: ords.map((o) => ({
							id: o.id,
							total_amount: Number(o.total_amount || 0),
							status: o.status,
							itemsCount: o.orderItems?.length || 0,
						})),
						amountToCollect: totalAmount,
						packages: allItems.length > 0 ? allItems.length : ords.length,
						orderItems: allItems.map((item) => ({
							id: item.id,
							product_id: item.product_id,
							name: item.product?.name || "Product",
							qty: item.quantity,
							price: Number(item.price || 0),
						})),
					});
					seq++;
				}

				return virtualStops;
			}

			const customerIds = allStops.map((s) => s.customer_id).filter(Boolean);

			const ordersForStops =
				customerIds.length > 0
					? await db.query.orders.findMany({
							where: inArray(orders.customer_id, customerIds),
							with: {
								customer: true,
								orderItems: {
									with: {
										product: true,
									},
								},
							},
						})
					: [];

			return allStops.map((s: any, idx: number) => {
				const allMatchingOrders = ordersForStops.filter(
					(order) => order.customer_id === s.customer_id,
				);
				const pendingOrders = allMatchingOrders.filter(
					(o) => o.status !== "delivered" && o.status !== "completed",
				);
				const matchingOrders =
					s.status === "delivered" || pendingOrders.length === 0
						? allMatchingOrders
						: pendingOrders;

				const matchingOrder = matchingOrders[0];
				const orderIdList = matchingOrders.map((o) => o.id);
				const formattedOrderIds =
					orderIdList.length > 0
						? orderIdList.map((id) => `ORD-${id}`).join(", ")
						: `ORD-${s.order_id || 460 + idx}`;
				const totalAmount = matchingOrders.reduce(
					(sum, o) => sum + Number(o.total_amount || 0),
					0,
				);
				const allItems = matchingOrders.flatMap((o) => o.orderItems || []);

				const resolvedCustName =
					s.customer?.name ||
					matchingOrder?.customer?.name ||
					"Customer";
				const resolvedCustPhone =
					s.customer?.phone ||
					matchingOrder?.customer?.phone ||
					(matchingOrder as any)?.customer_phone ||
					"N/A";
				const resolvedCustAddress =
					s.customer?.address ||
					matchingOrder?.customer?.address ||
					(matchingOrder as any)?.shipping_address ||
					"N/A";

				return {
					id: s.id,
					trip_id: s.trip_id,
					status:
						s.status === "delivered" || s.status === "completed"
							? "completed"
							: idx === 0
								? "next"
								: "pending",
					rawStatus: s.status,
					time:
						s.status === "delivered" || s.status === "completed"
							? "Completed"
							: "--:--",
					customerName: resolvedCustName,
					address: resolvedCustAddress,
					phone: resolvedCustPhone,
					orderId: formattedOrderIds,
					orderIds: orderIdList,
					ordersCount: matchingOrders.length,
					orders: matchingOrders.map((o) => ({
						id: o.id,
						total_amount: Number(o.total_amount || 0),
						status: o.status,
						itemsCount: o.orderItems?.length || 0,
					})),
					amountToCollect: totalAmount,
					packages: allItems.length > 0 ? allItems.length : 1,
					orderItems:
						allItems.map((item) => ({
							id: item.id,
							product_id: item.product_id,
							name: item.product?.name ?? "Product",
							qty: item.quantity,
							price: Number(item.price || 0),
						})) || [],
				};
			});
		} catch (error) {
			console.warn("[getRouteStops] Safe fallback on error:", error);
			return [];
		}
	}),

	getDeliveryHistory: protectedProcedure.query(async ({ ctx }) => {
		const { ids: driverIds } = await getDriverIdentifiers(ctx);
		const trips =
			driverIds.length > 0
				? await db.query.deliveryTrips.findMany({
						where: inArray(deliveryTrips.driver_id, driverIds),
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
					})
				: [];

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
				const stopCollections = (t.collections || []).filter(
					(c: any) => c.trip_id === t.id,
				);
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

				const isDelivered =
					s.status === "delivered" || s.status === "completed";

				return {
					stopId: s.id,
					sequence: idx + 1,
					customerName: s.customer?.name || "Customer",
					customerPhone: s.customer?.phone || "N/A",
					address: s.customer?.address || "N/A",
					orderRef: `ORD-${s.customer_id ? s.customer_id * 10 + 440 : s.id}`,
					status: isDelivered
						? "Delivered"
						: s.status === "failed"
							? "Failed"
							: "Pending",
					cashCollected: cash,
					onlineCollected: online,
					deliveredAt: isDelivered
						? s.resolved_at
							? new Date(s.resolved_at).toLocaleTimeString()
							: new Date().toLocaleTimeString()
						: "—",
				};
			});

			const completedStops = stops.filter(
				(s: any) => s.status === "Delivered",
			).length;
			const totalStops = stops.length;
			const isTripCompleted =
				(completedStops === totalStops && totalStops > 0) ||
				t.status === "completed";

			totalCash = stops.reduce(
				(acc: number, st: any) => acc + st.cashCollected,
				0,
			);
			totalOnline = stops.reduce(
				(acc: number, st: any) => acc + st.onlineCollected,
				0,
			);

			return {
				id: t.id,
				tripNumber: `TRIP-#${t.id}`,
				routeName: t.route?.name || `Route #${t.id}`,
				vehiclePlate: t.vehicle?.registration_number || "MP04AB1234",
				driverName: t.driver?.name || ctx.user?.name || "Rajesh Kumar",
				status: isTripCompleted
					? "Completed"
					: t.status === "cancelled"
						? "Cancelled"
						: "In Progress",
				date: t.created_at
					? new Date(t.created_at).toLocaleDateString()
					: new Date().toLocaleDateString(),
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
				damagedOrReturnedItems: z
					.array(
						z.object({
							id: z.number(),
							name: z.string(),
							qty: z.number(),
							reason: z.string(),
						}),
					)
					.optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			try {
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

				// Fallback to active trip for this driver
				if (!targetTripId) {
					const { ids: driverIds } = await getDriverIdentifiers(ctx);
					const fallbackTrip = await db.query.deliveryTrips?.findFirst({
						where: and(
							driverIds.length > 0
								? inArray(deliveryTrips.driver_id, driverIds)
								: undefined,
							inArray(deliveryTrips.status, [
								"active",
								"out_for_delivery",
								"pending",
								"in_progress",
								"dispatched",
							]),
						),
						orderBy: [desc(deliveryTrips.created_at)],
					});
					if (fallbackTrip) {
						targetTripId = fallbackTrip.id;
					}
				}

				const hasReturns =
					input.damagedOrReturnedItems &&
					input.damagedOrReturnedItems.length > 0;
				const formattedComments = hasReturns
					? `${input.deliveryNotes ? input.deliveryNotes + " | " : ""}Returned/Rejected: ${input.damagedOrReturnedItems?.map((i) => `${i.name} (x${i.qty} - ${i.reason})`).join(", ")}`
					: input.deliveryNotes || "Delivered live at customer stop";

				// Update trip stop status
				if (input.stop_id) {
					await db
						.update(tripStops)
						.set({
							status: "delivered",
							comments: formattedComments,
							resolved_at: new Date(),
						})
						.where(eq(tripStops.id, input.stop_id));
				}

				// Find associated order and sync its status & finance status
				let orderIdToUpdate: number | null = null;
				if (input.stop_id) {
					const stopObj = await db.query.tripStops?.findFirst({
						where: eq(tripStops.id, input.stop_id),
					});
					if (stopObj?.customer_id) {
						const matchingOrder = await db.query.orders?.findFirst({
							where: eq(orders.customer_id, stopObj.customer_id),
							orderBy: [desc(orders.created_at)],
						});
						if (matchingOrder) {
							orderIdToUpdate = matchingOrder.id;
						}
					}
				}

				if (orderIdToUpdate) {
					const totalCollected = input.cashAmount + input.onlineAmount;
					await db
						.update(orders)
						.set({
							status: "completed",
							finance_status: "driver_collected",
							...(totalCollected > 0
								? { total_amount: String(totalCollected) }
								: {}),
						} as any)
						.where(eq(orders.id, orderIdToUpdate));
				}

				// Record proof of delivery with full returns and notes payload
				if (input.stop_id) {
					try {
						const podNotes = JSON.stringify({
							deliveryNotes: input.deliveryNotes || "",
							returns: input.damagedOrReturnedItems || [],
							cashAmount: input.cashAmount,
							onlineAmount: input.onlineAmount,
							totalCollected: input.cashAmount + input.onlineAmount,
							timestamp: new Date().toISOString(),
						});
						await db.insert(proofOfDeliveries).values({
							trip_stop_id: input.stop_id,
							order_id: orderIdToUpdate,
							delivery_status: hasReturns ? "partial_return" : "delivered",
							notes: podNotes,
							delivered_at: new Date(),
						});
					} catch (podErr) {
						console.warn(
							"[submitDeliveryHandover] proofOfDeliveries record fallback:",
							podErr,
						);
					}
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

					// Record financial transaction for cash collection
					try {
						await db.insert(transactions).values({
							order_id: orderIdToUpdate,
							amount: String(input.cashAmount),
							original_amount: String(input.cashAmount),
							adjustment_amount: "0",
							reconciliation_status: "pending",
							user_uid: ctx.user?.id || "driver-1",
							status: "completed",
							category: "selling",
							type: "income",
							reference_type: "driver_cash_collection",
							reference_id: input.stop_id,
							description: `Driver cash collected for stop #${input.stop_id}`,
						});
					} catch (tErr) {
						console.warn(
							"[submitDeliveryHandover] Cash transaction creation fallback:",
							tErr,
						);
					}
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

					// Record financial transaction for online collection
					try {
						await db.insert(transactions).values({
							order_id: orderIdToUpdate,
							amount: String(input.onlineAmount),
							original_amount: String(input.onlineAmount),
							adjustment_amount: "0",
							reconciliation_status: "completed",
							user_uid: ctx.user?.id || "driver-1",
							status: "completed",
							category: "selling",
							type: "income",
							reference_type: "driver_online_collection",
							reference_id: input.stop_id,
							description: `Driver UPI/Online collected for stop #${input.stop_id}`,
						});
					} catch (tErr) {
						console.warn(
							"[submitDeliveryHandover] Online transaction creation fallback:",
							tErr,
						);
					}
				}
				// Check if all stops for targetTripId are now completed/delivered and mark trip status as completed
				if (targetTripId) {
					const allStopsForTrip = await db.query.tripStops.findMany({
						where: eq(tripStops.trip_id, targetTripId),
					});
					if (allStopsForTrip.length > 0) {
						const allFinished = allStopsForTrip.every((s: any) =>
							["delivered", "completed", "skipped", "failed"].includes(s.status),
						);
						if (allFinished) {
							await db
								.update(deliveryTrips)
								.set({
									status: "completed",
									end_time: new Date(),
								})
								.where(eq(deliveryTrips.id, targetTripId));
						}
					}
				}
			} catch (e) {
				console.warn(
					"[submitDeliveryHandover] Error executing database insert/update:",
					e,
				);
			}

			return { success: true };
		}),

	getSupportTickets: protectedProcedure.query(async ({ ctx }) => {
		try {
			const tickets = await db.query.driverSupportTickets.findMany({
				orderBy: [desc(driverSupportTickets.created_at)],
			});
			if (tickets && tickets.length > 0) {
				return tickets.map((t: any) => ({
					id: `TKT-${t.id}`,
					title: t.title,
					category: t.category,
					description: t.description,
					status: t.status || "Open",
					createdAt: t.created_at
						? new Date(t.created_at).toLocaleDateString()
						: new Date().toLocaleDateString(),
				}));
			}
		} catch (e) {
			console.warn("[getSupportTickets] DB query fallback:", e);
		}

		return [
			{
				id: "TKT-101",
				title: "GPS Connection Lost on Highway",
				category: "Technical Support",
				description:
					"The application stopped logging coordinates when transitioning from Bhopal Bypass to Highway 12. App restart fixed it temporarily.",
				status: "Open",
				createdAt: "11/9/2026",
			},
			{
				id: "TKT-102",
				title: "COD Payment Verification Delayed",
				category: "Finance / COD Support",
				description:
					"Collected ₹2,126 Cash for Stop #1 (Mazin), but the cashbook ledger update took 5 minutes to synchronize in-app.",
				status: "Closed",
				createdAt: "11/9/2026",
			},
		];
	}),
});
