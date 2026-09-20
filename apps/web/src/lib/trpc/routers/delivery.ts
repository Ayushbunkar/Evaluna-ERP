import {
	customers,
	deliveryRoutes,
	deliveryStops,
	deliveryTrips,
	gpsLogs,
	orderItems,
	orders,
	products,
	proofOfDeliveries,
	roles,
	routeStops,
	salesReturnItems,
	salesReturns,
	staff,
	tripCollections,
	tripStops,
	user,
	userRoles,
	vehicles,
} from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, not, notInArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { dispatchNotification } from "@/lib/notification-service";
import { protectedProcedure, roleProcedure, router } from "../init";

async function getDriverIdentifiers(ctx: any): Promise<string[]> {
	const userObj = ctx.user;
	if (!userObj) return [];

	const ids = new Set<string>();

	const addSafe = (val: any) => {
		if (val !== undefined && val !== null && String(val).trim()) {
			const str = String(val).trim();
			ids.add(str);
			ids.add(str.toLowerCase());
		}
	};

	addSafe(userObj.id);
	addSafe(userObj.userId);
	addSafe(userObj.email);
	addSafe(userObj.name);
	addSafe(userObj.staffId);

	if (userObj.staff) {
		addSafe(userObj.staff.id);
		addSafe(userObj.staff.staff_code);
		addSafe(userObj.staff.staffCode);
		addSafe(userObj.staff.name);
		addSafe(userObj.staff.email);
	}

	try {
		// 1. Direct query on user table first for email/name aliases
		const userConditions = [];
		if (userObj.id) {
			userConditions.push(eq(user.id, userObj.id));
		}
		if (userObj.userId && userObj.userId !== userObj.id) {
			userConditions.push(eq(user.id, userObj.userId));
		}
		if (userObj.email) {
			userConditions.push(
				sql`LOWER(TRIM(${user.email})) = LOWER(TRIM(${userObj.email}))`,
			);
		}
		if (userObj.name) {
			userConditions.push(
				sql`LOWER(TRIM(${user.name})) = LOWER(TRIM(${userObj.name}))`,
			);
		}

		const emailsToSearch = new Set<string>();
		const namesToSearch = new Set<string>();

		if (userObj.email) emailsToSearch.add(userObj.email);
		if (userObj.name) namesToSearch.add(userObj.name);

		if (userConditions.length > 0) {
			const usersList = await db.query.user?.findMany({
				where: or(...userConditions),
			});
			if (usersList && usersList.length > 0) {
				for (const u of usersList) {
					addSafe(u.id);
					addSafe(u.email);
					addSafe(u.name);
					if (u.email) emailsToSearch.add(u.email);
					if (u.name) namesToSearch.add(u.name);
				}
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
		if (userObj.staffId && !isNaN(Number(userObj.staffId))) {
			staffConditions.push(eq(staff.id, Number(userObj.staffId)));
		}
		if (userObj.staff?.id && !isNaN(Number(userObj.staff.id))) {
			staffConditions.push(eq(staff.id, Number(userObj.staff.id)));
		}
		if (userObj.id && !isNaN(Number(userObj.id))) {
			staffConditions.push(eq(staff.id, Number(userObj.id)));
		}

		if (staffConditions.length > 0) {
			const staffList = await db.query.staff?.findMany({
				where: or(...staffConditions),
			});
			if (staffList && staffList.length > 0) {
				for (const s of staffList) {
					addSafe(s.id);
					addSafe(s.staff_code);
					addSafe(s.email);
					addSafe(s.name);
				}
			}
		}
	} catch (e) {
		console.warn("[delivery.getDriverIdentifiers] lookup fallback:", e);
	}

	return Array.from(ids).filter(Boolean);
}

export const deliveryRouter = router({
	// ── Routes ─────────────────────────────────────────────────────────────
	listRoutes: roleProcedure([
		"admin",
		"manager",
		"sales_person",
	])
		.input(z.object({ branchId: z.number().optional() }))
		.query(async ({ input, ctx }) => {
			const branch = input.branchId || ctx.user?.branchId || 1;
			if (!branch) throw new TRPCError({ code: "BAD_REQUEST" });

			// Clean up auto-generated dummy routes that start with "Trip " or "Quick Trip "
			try {
				const dummyRoutes = await db.query.deliveryRoutes.findMany({
					where: and(
						eq(deliveryRoutes.branch_id, branch),
						or(
							sql`${deliveryRoutes.name} LIKE 'Trip %'`,
							sql`${deliveryRoutes.name} LIKE 'Quick Trip %'`,
						),
					),
				});
				if (dummyRoutes.length > 0) {
					const dummyIds = dummyRoutes.map((r) => r.id);
					// Unlink trips from dummy routes
					await db
						.update(deliveryTrips)
						.set({ route_id: null })
						.where(inArray(deliveryTrips.route_id, dummyIds));
					// Delete stops of dummy routes
					await db
						.delete(routeStops)
						.where(inArray(routeStops.route_id, dummyIds));
					// Delete dummy routes
					await db
						.delete(deliveryRoutes)
						.where(inArray(deliveryRoutes.id, dummyIds));
				}
			} catch (cleanupErr) {
				console.warn("[listRoutes] Cleanup dummy routes:", cleanupErr);
			}

			return await db.query.deliveryRoutes.findMany({
				where: eq(deliveryRoutes.branch_id, branch),
				with: { stops: { with: { customer: true } } },
				orderBy: (r, { asc }) => [asc(r.name)],
			});
		}),

	createRoute: roleProcedure(["admin", "manager"])
		.input(
			z.object({
				name: z.string(),
				description: z.string().optional(),
				branchId: z.number().optional(),
				stops: z.array(
					z.object({
						customerId: z.number().optional(),
						sequence: z.number().optional(),
						name: z.string().optional(),
						phone: z.string().optional(),
						address: z.string().optional(),
					}),
				),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const branch = input.branchId || ctx.user?.branchId || 1;
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

				// Process stops, creating new customer entries for bulk/custom address entries where needed
				const resolvedStops: { customerId: number; sequence: number }[] = [];
				const seenCustomers = new Set<number>();
				let currentSequence = 1;

				for (const stop of input.stops) {
					let resolvedCustId = stop.customerId;

					if (!resolvedCustId && (stop.name || stop.address || stop.phone)) {
						const phoneClean = stop.phone?.trim() || "";
						const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
						const email = phoneClean
							? `cust_${phoneClean.replace(/\D/g, "") || uniqueSuffix}@evaluna.local`
							: `cust_${uniqueSuffix}@evaluna.local`;

						// Check if a customer with this phone or email already exists in branch
						let existingCust = null;
						if (phoneClean) {
							existingCust = await tx.query.customers.findFirst({
								where: and(
									eq(customers.phone, phoneClean),
									eq(customers.branch_id, branch),
								),
							});
						}

						if (existingCust) {
							resolvedCustId = existingCust.id;
						} else {
							const [newCust] = await tx
								.insert(customers)
								.values({
									name: stop.name?.trim() || (stop.address ? `Stop: ${stop.address.slice(0, 30)}` : `Customer ${phoneClean}`),
									email,
									phone: phoneClean || null,
									address: stop.address?.trim() || null,
									branch_id: branch,
									user_uid: ctx.user?.id || "manager",
									customer_code: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
								})
								.returning();
							resolvedCustId = newCust.id;
						}
					}

					if (resolvedCustId && !seenCustomers.has(resolvedCustId)) {
						seenCustomers.add(resolvedCustId);
						resolvedStops.push({
							customerId: resolvedCustId,
							sequence: stop.sequence || currentSequence++,
						});
					}
				}

				if (resolvedStops.length > 0) {
					await tx.insert(routeStops).values(
						resolvedStops.map((stop) => ({
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
	assignTrip: roleProcedure(["admin", "manager"])
		.input(
			z.object({
				routeId: z.number(),
				driverId: z.string(),
				vehicleId: z.number(),
				loaderId: z.string().optional(),
				customerIds: z.array(z.number()).optional(),
				orderIds: z.array(z.number()).optional(),
				stops: z
					.array(
						z.object({
							customerId: z.number().optional(),
							sequence: z.number().optional(),
							name: z.string().optional(),
							phone: z.string().optional(),
							address: z.string().optional(),
						}),
					)
					.optional(),
				branchId: z.number().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const database = (ctx as any).db || db;
			const branch = input.branchId || ctx.user?.branchId || 1;
			try {
				return await database.transaction(async (tx) => {
					// 1. Create Trip
					const [trip] = await tx
						.insert(deliveryTrips)
						.values({
							route_id: input.routeId,
							driver_id: input.driverId,
							vehicle_id: input.vehicleId,
							loader_id: input.loaderId || null,
							status: "ready_for_loading",
						})
						.returning();

					// 2. Resolve stops: either from input.stops or from routeStops filtered by input.customerIds
					const resolvedStops: { customerId: number; sequence: number }[] = [];
					const seenCustomers = new Set<number>();
					let currentSequence = 1;

					if (input.stops && input.stops.length > 0) {
						for (const stop of input.stops) {
							let resolvedCustId = stop.customerId;

							if (!resolvedCustId && (stop.name || stop.address || stop.phone)) {
								const phoneClean = stop.phone?.trim() || "";
								const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
								const email = phoneClean
									? `cust_${phoneClean.replace(/\D/g, "") || uniqueSuffix}@evaluna.local`
									: `cust_${uniqueSuffix}@evaluna.local`;

								let existingCust = null;
								if (phoneClean) {
									existingCust = await tx.query.customers.findFirst({
										where: and(
											eq(customers.phone, phoneClean),
											eq(customers.branch_id, branch),
										),
									});
								}

								if (existingCust) {
									resolvedCustId = existingCust.id;
								} else {
									const [newCust] = await tx
										.insert(customers)
										.values({
											name:
												stop.name?.trim() ||
												(stop.address
													? `Stop: ${stop.address.slice(0, 30)}`
													: `Customer ${phoneClean}`),
											email,
											phone: phoneClean || null,
											address: stop.address?.trim() || null,
											branch_id: branch,
											user_uid: ctx.user?.id || "manager",
											customer_code: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
										})
										.returning();
									resolvedCustId = newCust.id;
								}
							}

							if (resolvedCustId && !seenCustomers.has(resolvedCustId)) {
								seenCustomers.add(resolvedCustId);
								resolvedStops.push({
									customerId: resolvedCustId,
									sequence: stop.sequence || currentSequence++,
								});
							}
						}
					} else {
						const stops = await tx
							.select()
							.from(routeStops)
							.where(eq(routeStops.route_id, input.routeId))
							.orderBy(asc(routeStops.sequence));

						let targetStops = stops;
						if (input.customerIds && input.customerIds.length > 0) {
							const selectedSet = new Set(input.customerIds);
							targetStops = stops.filter((s) => selectedSet.has(s.customer_id));
						}

						for (const s of targetStops) {
							if (!seenCustomers.has(s.customer_id)) {
								seenCustomers.add(s.customer_id);
								resolvedStops.push({
									customerId: s.customer_id,
									sequence: currentSequence++,
								});
							}
						}
					}

					if (resolvedStops.length > 0) {
						await tx.insert(tripStops).values(
							resolvedStops.map((s) => ({
								trip_id: trip.id,
								customer_id: s.customerId,
								sequence: s.sequence,
								status: "pending",
							})),
						);
					}

					// 3. Update assigned orders with driver_id
					try {
						let driverStaffId: number | null = null;
						if (tx.query && (tx.query as any).staff) {
							const staffRow = await (tx.query as any).staff.findFirst({
								where: (s: any, { eq, or }: any) =>
									or(
										eq(s.email, input.driverId),
										sql`LOWER(TRIM(${s.email})) = LOWER(TRIM(${input.driverId}))`,
										eq(s.staff_code, input.driverId),
										sql`LOWER(TRIM(${s.name})) = LOWER(TRIM(${input.driverId}))`,
									),
							});
							if (staffRow) {
								driverStaffId = staffRow.id;
							}
						}
						if (driverStaffId === null && tx.query && (tx.query as any).user) {
							const userRow = await (tx.query as any).user.findFirst({
								where: (u: any, { eq, or }: any) =>
									or(
										eq(u.id, input.driverId),
										sql`LOWER(TRIM(${u.email})) = LOWER(TRIM(${input.driverId}))`,
									),
							});
							if (userRow && (tx.query as any).staff) {
								const staffMatch = await (tx.query as any).staff.findFirst({
									where: (s: any, { eq, or }: any) =>
										or(
											eq(s.email, userRow.email),
											sql`LOWER(TRIM(${s.email})) = LOWER(TRIM(${userRow.email}))`,
											sql`LOWER(TRIM(${s.name})) = LOWER(TRIM(${userRow.name}))`,
										),
								});
								if (staffMatch) {
									driverStaffId = staffMatch.id;
								}
							}
						}
						if (driverStaffId === null && !isNaN(Number(input.driverId)) && Number(input.driverId) > 0) {
							driverStaffId = Number(input.driverId);
						}

						if (input.orderIds && input.orderIds.length > 0) {
							await tx
								.update(orders)
								.set({
									...(driverStaffId !== null ? { driver_id: driverStaffId } : {}),
									status: "ready_for_dispatch",
								})
								.where(inArray(orders.id, input.orderIds));
						} else if (resolvedStops.length > 0) {
							const custIds = resolvedStops.map((s) => s.customerId);
							await tx
								.update(orders)
								.set({
									...(driverStaffId !== null ? { driver_id: driverStaffId } : {}),
									status: "ready_for_dispatch",
								})
								.where(
									and(
										inArray(orders.customer_id, custIds),
										inArray(orders.status, [
											"confirmed",
											"processing",
											"ready_for_dispatch",
										]),
									),
								);
						}
					} catch (e) {
						// Non-critical background sync
					}

					return trip;
				});
			} catch (err: any) {
				const fs = require("fs");
				const path = require("path");
				const errorLog = `
=========================================
TIMESTAMP: ${new Date().toISOString()}
ERROR MESSAGE: ${err.message}
ERROR CODE: ${err.code}
ERROR DETAIL: ${err.detail}
ERROR CONSTRAINT: ${err.constraint}
ERROR TABLE: ${err.table}
=========================================
`;
				fs.appendFileSync(
					path.join(process.cwd(), "scratch/error-details.txt"),
					errorLog,
				);
				throw err;
			}
		}),

	myTrips: protectedProcedure.query(async ({ ctx }) => {
		const database = ctx.db || db;
		const driverIds = await getDriverIdentifiers(ctx);
		return await database.query.deliveryTrips.findMany({
			where:
				driverIds.length > 0
					? inArray(deliveryTrips.driver_id, driverIds)
					: eq(deliveryTrips.driver_id, ctx.user.id),
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
	activeTrips: roleProcedure(["admin", "manager"]).query(
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
		.mutation(async ({ input, ctx }) => {
			if (input.status === "active") {
				const [existingTrip] = await db
					.select({ id: deliveryTrips.id, status: deliveryTrips.status })
					.from(deliveryTrips)
					.where(eq(deliveryTrips.id, input.tripId));

				if (existingTrip && existingTrip.status !== "loaded" && existingTrip.status !== "active") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Trip #${input.tripId} cannot be dispatched yet. It must first be physically loaded and verified by the warehouse loader (Current status: "${existingTrip.status}").`,
					});
				}
			}

			await db
				.update(deliveryTrips)
				.set({
					status: input.status,
					...(input.status === "active" ? { start_time: new Date() } : {}),
					...(input.status === "completed" ? { end_time: new Date() } : {}),
				})
				.where(eq(deliveryTrips.id, input.tripId));

			// Fetch trip details to sync associated orders and notify stakeholders
			try {
				const trip = await db.query.deliveryTrips.findFirst({
					where: eq(deliveryTrips.id, input.tripId),
					with: {
						stops: { with: { customer: true } },
						driver: true,
						vehicle: true,
						route: true,
					},
				});

				if (trip) {
					const custIds = (trip.stops || [])
						.map((s) => s.customer_id)
						.filter(Boolean) as number[];

					if (input.status === "active" && custIds.length > 0) {
						// Transition associated orders to out_for_delivery
						// Include ALL pre-delivery statuses to ensure orders are propagated
						await db
							.update(orders)
							.set({ status: "out_for_delivery" })
							.where(
								and(
									inArray(orders.customer_id, custIds),
									notInArray(orders.status, ["delivered", "cancelled", "out_for_delivery"]),
								),
							);

						// Also update orders directly assigned to the driver (driver_id) to out_for_delivery
						if (trip.driver_id) {
							try {
								const driverUser = await db.query.user.findFirst({
									where: (u, { eq, or }) =>
										or(
											eq(u.id, trip.driver_id),
											sql`LOWER(TRIM(${u.email})) = LOWER(TRIM(${trip.driver_id}))`,
											sql`LOWER(TRIM(${u.name})) = LOWER(TRIM(${trip.driver_id}))`,
										),
									columns: { id: true, email: true, name: true },
								});
								if (driverUser) {
									const driverStaff = await db.query.staff.findFirst({
										where: (s, { or }) =>
											or(
												sql`LOWER(TRIM(${s.email})) = LOWER(TRIM(${driverUser.email ?? ""}))`,
												sql`LOWER(TRIM(${s.name})) = LOWER(TRIM(${driverUser.name ?? ""}))`,
											),
										columns: { id: true },
									});
									if (driverStaff) {
										await db
											.update(orders)
											.set({ status: "out_for_delivery" })
											.where(
												and(
													eq(orders.driver_id, driverStaff.id),
													notInArray(orders.status, ["delivered", "cancelled", "out_for_delivery"]),
												),
											);
									}
								}
							} catch (driverSyncErr) {
								console.warn("[updateTripStatus] Driver order sync error (non-critical):", driverSyncErr);
							}
						}

						// Notify Driver and Manager
						await dispatchNotification({
							type: "info",
							priority: "high",
							title: `🚚 Trip #${input.tripId} Dispatched`,
							message: `Delivery Trip #${input.tripId} (${trip.route?.name || "Route"}) with ${custIds.length} stop(s) is now Out for Delivery with driver ${trip.driver?.name || "assigned driver"}.`,
							branchId: (ctx.user?.branchId as number) || 1,
							channels: ["in_app"],
							referenceType: "trips",
							referenceId: input.tripId,
							metadata: {
								trip_id: input.tripId,
								driver_id: trip.driver_id,
								driver_name: trip.driver?.name,
								stops_count: custIds.length,
							},
						});
					} else if (input.status === "completed" && custIds.length > 0) {
						// Transition remaining orders to delivered if not already
						await db
							.update(orders)
							.set({ status: "delivered" })
							.where(
								and(
									inArray(orders.customer_id, custIds),
									inArray(orders.status, ["out_for_delivery", "packed"]),
								),
							);

						await dispatchNotification({
							type: "info",
							priority: "normal",
							title: `✅ Trip #${input.tripId} Completed`,
							message: `Driver ${trip.driver?.name || "Driver"} has completed all deliveries for Trip #${input.tripId}.`,
							branchId: (ctx.user?.branchId as number) || 1,
							channels: ["in_app"],
							referenceType: "trips",
							referenceId: input.tripId,
						});
					}
				}
			} catch (syncErr) {
				console.warn("[updateTripStatus] Order status sync or notification warning:", syncErr);
			}

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
				battery_level: input.batteryLevel?.toString(),
				timestamp: new Date(),
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
			const driverIds = await getDriverIdentifiers(ctx);
			return await db.query.deliveryTrips.findMany({
				where:
					driverIds.length > 0
						? inArray(deliveryTrips.driver_id, driverIds)
						: eq(deliveryTrips.driver_id, ctx.user.id),
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
	listDrivers: roleProcedure(["admin", "manager"])
		.input(z.object({ branchId: z.number().optional() }))
		.query(async ({ input, ctx }) => {
			// Query all real authenticated users with their userRoles
			const allUsers = await db.query.user.findMany({
				with: {
					userRoles: {
						with: {
							role: true,
						},
					},
				},
			});

			const staffMembers = await db.query.staff.findMany({
				where: (s, { eq, or }) =>
					or(
						eq(s.role, "delivery"),
						eq(s.role, "driver"),
						eq(s.role, "delivery_boy"),
					),
				columns: { id: true, staff_code: true, name: true, email: true, role: true, phone: true },
			});

			// Only include users who actually have an authenticated user account (and dashboard)
			const driverUsers = allUsers.filter((u) => {
				const hasDriverUserRole = u.userRoles?.some((r: any) =>
					["delivery", "driver", "delivery_boy"].includes(r.role?.name?.toLowerCase() || ""),
				);
				const hasDriverStaffRecord = staffMembers.some(
					(s) =>
						s.id === u.staff_id ||
						(s.email && u.email && s.email.toLowerCase() === u.email.toLowerCase()),
				);
				return hasDriverUserRole || hasDriverStaffRecord;
			});

			const result = driverUsers.map((u) => {
				const matchingStaff = staffMembers.find(
					(s) =>
						s.id === u.staff_id ||
						(s.email && u.email && s.email.toLowerCase() === u.email.toLowerCase()) ||
						(s.name && u.name && s.name.toLowerCase() === u.name.toLowerCase()),
				);

				return {
					id: u.id,
					name: u.name,
					email: u.email,
					role: "driver",
					image: u.image || null,
					phone: matchingStaff?.phone || null,
					staff_code: matchingStaff?.staff_code || (u.staff_id ? `EMP-${u.staff_id}` : null),
				};
			});

			return result;
		}),

	listLoaders: roleProcedure(["admin", "manager"])
		.input(z.object({ branchId: z.number().optional() }))
		.query(async ({ input, ctx }) => {
			const allUsers = await db.query.user.findMany({
				with: {
					userRoles: {
						with: {
							role: true,
						},
					},
				},
			});

			const staffMembers = await db.query.staff.findMany({
				where: (s, { eq }) => eq(s.role, "loader"),
				columns: { id: true, staff_code: true, name: true, email: true, role: true, phone: true },
			});

			// Only include users who actually have an authenticated user account (and dashboard)
			const loaderUsers = allUsers.filter((u) => {
				const hasLoaderUserRole = u.userRoles?.some((r: any) =>
					["loader"].includes(r.role?.name?.toLowerCase() || ""),
				);
				const hasLoaderStaffRecord = staffMembers.some(
					(s) =>
						s.id === u.staff_id ||
						(s.email && u.email && s.email.toLowerCase() === u.email.toLowerCase()),
				);
				return hasLoaderUserRole || hasLoaderStaffRecord;
			});

			let list = loaderUsers.map((u) => {
				const matchingStaff = staffMembers.find(
					(s) =>
						s.id === u.staff_id ||
						(s.email && u.email && s.email.toLowerCase() === u.email.toLowerCase()) ||
						(s.name && u.name && s.name.toLowerCase() === u.name.toLowerCase()),
				);

				return {
					id: u.id,
					name: u.name,
					email: u.email,
					role: "loader",
					image: u.image || null,
					phone: matchingStaff?.phone || null,
					staff_code: matchingStaff?.staff_code || (u.staff_id ? `EMP-${u.staff_id}` : null),
				};
			});

			// Fallback: If no dedicated loader role yet, list warehouse/staff users with user accounts
			if (list.length === 0) {
				list = allUsers.slice(0, 10).map((u) => ({
					id: u.id,
					name: u.name,
					email: u.email,
					role: "loader",
					image: u.image || null,
					phone: null,
					staff_code: u.staff_id ? `EMP-${u.staff_id}` : null,
				}));
			}

			return list;
		}),

	releaseToLoader: roleProcedure(["admin", "manager"])
		.input(z.object({ tripId: z.number() }))
		.mutation(async ({ input, ctx }) => {
			const database = (ctx as any).db || db;
			const [trip] = await database
				.select()
				.from(deliveryTrips)
				.where(eq(deliveryTrips.id, input.tripId));

			if (!trip) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: `Trip #${input.tripId} not found`,
				});
			}

			if (!trip.driver_id) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Driver must be assigned before releasing trip to loader.",
				});
			}

			if (!trip.vehicle_id) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Vehicle must be assigned before releasing trip to loader.",
				});
			}

			await database
				.update(deliveryTrips)
				.set({
					status: "ready_for_loading",
					released_at: new Date(),
					released_by_id: ctx.user?.id || "manager",
					updated_at: new Date(),
				})
				.where(eq(deliveryTrips.id, input.tripId));

			try {
				await dispatchNotification({
					type: "info",
					priority: "high",
					title: `📦 Loading Task Assigned - Trip #${input.tripId}`,
					message: `Trip #${input.tripId} has been released for loading.`,
					branchId: (ctx.user?.branchId as number) || 1,
					channels: ["in_app"],
					referenceType: "trips",
					referenceId: input.tripId,
				});
			} catch (e) {
				// Non-critical notification fallback
			}

			return { success: true, tripId: input.tripId, status: "ready_for_loading" };
		}),

	getRouteWaitingPool: roleProcedure(["admin", "manager"])
		.input(z.object({ branchId: z.number().optional() }))
		.query(async ({ input, ctx }) => {
			const branch = input.branchId || ctx.user?.branchId || 1;

			const routes = await db.query.deliveryRoutes.findMany({
				where: eq(deliveryRoutes.branch_id, branch),
				with: {
					stops: {
						with: {
							customer: true,
						},
						orderBy: (s, { asc }) => [asc(s.sequence)],
					},
				},
				orderBy: (r, { asc }) => [asc(r.name)],
			});

			const realRoutes = routes.filter(
				(r) => !r.name?.startsWith("Trip ") && !r.name?.startsWith("Quick Trip "),
			);

			const allOrders = await db.query.orders.findMany({
				where: notInArray(orders.status, [
					"cancelled",
					"completed",
					"delivered",
					"dispatched",
					"out_for_delivery",
					"pending_review",
					"under_review",
					"ready_for_dispatch",
				]),
				with: {
					customer: true,
				},
				orderBy: (o, { desc }) => [desc(o.created_at)],
			});

			return realRoutes.map((route) => {
				const routeCustIds = new Set(route.stops.map((s) => s.customer_id).filter(Boolean));

				// Initialize pre-configured village stops from route description or route stops
				const villageMap = new Map<string, any[]>();
				const preConfiguredVillages: string[] = [];

				if (route.description && route.description.includes("->")) {
					for (const v of route.description.split("->")) {
						const trimmed = v.trim();
						if (trimmed && !villageMap.has(trimmed)) {
							villageMap.set(trimmed, []);
							preConfiguredVillages.push(trimmed);
						}
					}
				} else if (route.description && route.description.includes(",")) {
					for (const v of route.description.split(",")) {
						const trimmed = v.trim();
						if (trimmed && !villageMap.has(trimmed)) {
							villageMap.set(trimmed, []);
							preConfiguredVillages.push(trimmed);
						}
					}
				}

				for (const stop of route.stops) {
					const cust = stop.customer;
					const vName = cust?.address
						? cust.address.split(",")[0].trim()
						: cust?.name?.replace(/^Stop:\s*/, "").trim() || `Stop ${stop.sequence}`;
					if (!villageMap.has(vName)) {
						villageMap.set(vName, []);
						preConfiguredVillages.push(vName);
					}
				}

				const routeOrders = allOrders.filter((order) => {
					// Ignore if already assigned to a driver
					if (order.driver_id) return false;

					const isDirectRoute = (order as any).route_id === route.id;
					const isStopCustomer = Boolean(order.customer_id && routeCustIds.has(order.customer_id));

					if (isDirectRoute || isStopCustomer) return true;

					// Fallback: match by customer address or name against pre-configured route villages
					const cust = order.customer;
					const custAddress = (cust?.address || "").trim().toLowerCase();
					const custName = (cust?.name || "").trim().toLowerCase();

					if (!custAddress && !custName) return false;

					return preConfiguredVillages.some((v) => {
						const vLower = v.toLowerCase();
						if (vLower.length < 3) return false;
						return (
							custAddress.includes(vLower) ||
							vLower.includes(custAddress) ||
							custName.includes(vLower)
						);
					});
				});

				const waitingCount = routeOrders.length;
				const readyCount = routeOrders.filter(
					(o) => o.status === "packed" || o.status === "ready_for_loading" || o.status === "ready_for_dispatch",
				).length;
				const pickingCount = routeOrders.filter(
					(o) => o.status === "confirmed" || o.status === "processing" || o.status === "picking",
				).length;
				const packingCount = routeOrders.filter(
					(o) => o.status === "ready_for_packing" || o.status === "packing",
				).length;

				for (const order of routeOrders) {
					const cust = order.customer;
					const custAddress = (cust?.address || "").trim().toLowerCase();
					const custName = (cust?.name || "").trim().toLowerCase();
					
					// Find best matching pre-configured village stop
					let targetVillage = preConfiguredVillages.find((v) => {
						const vLower = v.toLowerCase();
						if (vLower.length < 3) return false;
						return (
							custAddress.includes(vLower) ||
							vLower.includes(custAddress) ||
							custName.includes(vLower)
						);
					});

					if (!targetVillage) {
						targetVillage = cust?.address ? cust.address.split(",")[0].trim() : "Other Stops";
					}

					if (!villageMap.has(targetVillage)) {
						villageMap.set(targetVillage, []);
					}

					villageMap.get(targetVillage)?.push({
						id: order.id,
						orderNumber: order.order_number || `ORD-${order.id}`,
						customerName: cust?.name || "Customer",
						status: order.status,
						createdAt: order.created_at,
						isReady: order.status === "packed" || order.status === "ready_for_loading" || order.status === "ready_for_dispatch",
					});
				}

				const villages = Array.from(villageMap.entries()).map(([villageName, ordersList]) => ({
					name: villageName,
					orderCount: ordersList.length,
					orders: ordersList,
				}));

				const latestOrder = routeOrders[0]?.created_at || null;

				return {
					routeId: route.id,
					routeName: route.name,
					description: route.description,
					waitingCount,
					readyCount,
					pickingCount,
					packingCount,
					villageCount: villages.length,
					villages,
					latestOrderTime: latestOrder,
					orders: routeOrders.map((o) => ({
						id: o.id,
						orderNumber: o.order_number || `ORD-${o.id}`,
						customerId: o.customer_id,
						customerName: o.customer?.name || "Customer",
						village: o.customer?.address ? o.customer.address.split(",")[0].trim() : "Stop",
						status: o.status,
						createdAt: o.created_at,
						isEligibleForTrip: o.status === "packed" || o.status === "ready_for_loading" || o.status === "ready_for_dispatch",
					})),
				};
			});
		}),

	listAllTrips: roleProcedure(["admin", "manager"])
		.input(
			z.object({
				branchId: z.number().optional(),
				status: z.string().optional(),
			}),
		)
		.query(async ({ input, ctx }) => {
			return await db.query.deliveryTrips.findMany({
				with: {
					route: true,
					driver: {
						columns: { id: true, name: true, email: true, image: true },
					},
					vehicle: true,
					stops: {
						with: {
							customer: {
								columns: { id: true, name: true, phone: true, address: true },
							},
						},
						orderBy: (s, { asc }) => [asc(s.sequence)],
					},
				},
				orderBy: (t, { desc }) => [desc(t.created_at)],
			});
		}),

	cancelTrip: roleProcedure(["admin", "manager"])
		.input(z.object({ tripId: z.number() }))
		.mutation(async ({ input }) => {
			const trip = await db.query.deliveryTrips.findFirst({
				where: eq(deliveryTrips.id, input.tripId),
				with: { stops: true },
			});

			await db
				.update(deliveryTrips)
				.set({ status: "cancelled" })
				.where(eq(deliveryTrips.id, input.tripId));

			if (trip && trip.stops && trip.stops.length > 0) {
				const custIds = trip.stops.map((s) => s.customer_id).filter(Boolean);
				if (custIds.length > 0) {
					await db
						.update(orders)
						.set({
							driver_id: null,
							status: "confirmed",
						})
						.where(
							and(
								inArray(orders.customer_id, custIds),
								inArray(orders.status, ["ready_for_dispatch", "out_for_delivery"]),
							),
						);
				}
			}

			return { success: true };
		}),

	deleteTrip: roleProcedure(["admin", "manager"])
		.input(z.object({ tripId: z.number() }))
		.mutation(async ({ input }) => {
			const trip = await db.query.deliveryTrips.findFirst({
				where: eq(deliveryTrips.id, input.tripId),
				with: { stops: true },
			});

			const stops = await db.query.tripStops.findMany({
				where: eq(tripStops.trip_id, input.tripId),
			});
			const stopIds = stops.map((s) => s.id);
			if (stopIds.length > 0) {
				await db
					.delete(proofOfDeliveries)
					.where(inArray(proofOfDeliveries.trip_stop_id, stopIds));
			}
			await db.delete(gpsLogs).where(eq(gpsLogs.trip_id, input.tripId));
			await db.delete(deliveryStops).where(eq(deliveryStops.trip_id, input.tripId));
			await db.delete(tripStops).where(eq(tripStops.trip_id, input.tripId));
			await db
				.delete(tripCollections)
				.where(eq(tripCollections.trip_id, input.tripId));
			await db.delete(deliveryTrips).where(eq(deliveryTrips.id, input.tripId));

			if (trip && trip.stops && trip.stops.length > 0) {
				const custIds = trip.stops.map((s) => s.customer_id).filter(Boolean);
				if (custIds.length > 0) {
					await db
						.update(orders)
						.set({
							driver_id: null,
							status: "confirmed",
						})
						.where(
							and(
								inArray(orders.customer_id, custIds),
								inArray(orders.status, ["ready_for_dispatch", "out_for_delivery"]),
							),
						);
				}
			}

			return { success: true };
		}),

	deleteRoute: roleProcedure(["admin", "manager"])
		.input(z.object({ routeId: z.number() }))
		.mutation(async ({ input }) => {
			await db.delete(routeStops).where(eq(routeStops.route_id, input.routeId));
			await db
				.update(deliveryTrips)
				.set({ route_id: null })
				.where(eq(deliveryTrips.route_id, input.routeId));
			await db
				.delete(deliveryRoutes)
				.where(eq(deliveryRoutes.id, input.routeId));
			return { success: true };
		}),

	updateRoute: roleProcedure(["admin", "manager"])
		.input(
			z.object({
				id: z.number(),
				name: z.string().min(1, "Route name is required"),
				description: z.string().optional(),
				branchId: z.number().optional(),
				stops: z.array(
					z.object({
						customerId: z.number().optional(),
						sequence: z.number().optional(),
						name: z.string().optional(),
						phone: z.string().optional(),
						address: z.string().optional(),
					}),
				),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const branch = input.branchId || ctx.user?.branchId || 1;
			return await db.transaction(async (tx) => {
				// 1. Update route name and description
				const [updatedRoute] = await tx
					.update(deliveryRoutes)
					.set({
						name: input.name,
						description: input.description,
					})
					.where(eq(deliveryRoutes.id, input.id))
					.returning();

				// 2. Delete existing route stops for this route
				await tx
					.delete(routeStops)
					.where(eq(routeStops.route_id, input.id));

				// 3. Resolve and re-insert stops
				const resolvedStops: { customerId: number; sequence: number }[] = [];
				const seenCustomers = new Set<number>();
				let currentSequence = 1;

				for (const stop of input.stops) {
					let resolvedCustId = stop.customerId;

					if (!resolvedCustId && (stop.name || stop.address || stop.phone)) {
						const phoneClean = stop.phone?.trim() || "";
						const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
						const email = phoneClean
							? `cust_${phoneClean.replace(/\D/g, "") || uniqueSuffix}@evaluna.local`
							: `cust_${uniqueSuffix}@evaluna.local`;

						let existingCust = null;
						if (phoneClean) {
							existingCust = await tx.query.customers.findFirst({
								where: and(
									eq(customers.phone, phoneClean),
									eq(customers.branch_id, branch),
								),
							});
						}

						if (existingCust) {
							resolvedCustId = existingCust.id;
						} else {
							const [newCust] = await tx
								.insert(customers)
								.values({
									name:
										stop.name?.trim() ||
										(stop.address
											? `Stop: ${stop.address.slice(0, 30)}`
											: `Customer ${phoneClean}`),
									email,
									phone: phoneClean || null,
									address: stop.address?.trim() || null,
									branch_id: branch,
									user_uid: ctx.user?.id || "manager",
									customer_code: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
								})
								.returning();
							resolvedCustId = newCust.id;
						}
					}

					if (resolvedCustId && !seenCustomers.has(resolvedCustId)) {
						seenCustomers.add(resolvedCustId);
						resolvedStops.push({
							customerId: resolvedCustId,
							sequence: stop.sequence || currentSequence++,
						});
					}
				}

				if (resolvedStops.length > 0) {
					await tx.insert(routeStops).values(
						resolvedStops.map((stop) => ({
							route_id: input.id,
							customer_id: stop.customerId,
							sequence: stop.sequence,
						})),
					);
				}

				return updatedRoute;
			});
		}),

	clearAllRoutesAndTrips: roleProcedure(["admin", "manager"])
		.mutation(async () => {
			// Cascading cleanup of all delivery tracking, proof of deliveries, stops, trips, routes
			await db.delete(proofOfDeliveries);
			await db.delete(gpsLogs);
			await db.delete(tripCollections);
			await db.delete(deliveryStops);
			await db.delete(tripStops);
			await db.delete(deliveryTrips);
			await db.delete(routeStops);
			await db.delete(deliveryRoutes);
			return { success: true, message: "All routes and trips cleared successfully." };
		}),

	optimizeRouteSequence: roleProcedure(["admin", "manager"])
		.input(z.object({ customerIds: z.array(z.number()) }))
		.mutation(async ({ input }) => {
			if (input.customerIds.length <= 1) return input.customerIds;

			// Fetch customers to get their coordinates
			const customersData = await db.query.customers.findMany({
				where: inArray(customers.id, input.customerIds),
				columns: { id: true, latitude: true, longitude: true },
			});

			// Haversine distance function
			const getDistance = (
				lat1: number,
				lon1: number,
				lat2: number,
				lon2: number,
			) => {
				const R = 6371; // Radius of the earth in km
				const dLat = (lat2 - lat1) * (Math.PI / 180);
				const dLon = (lon2 - lon1) * (Math.PI / 180);
				const a =
					Math.sin(dLat / 2) * Math.sin(dLat / 2) +
					Math.cos(lat1 * (Math.PI / 180)) *
						Math.cos(lat2 * (Math.PI / 180)) *
						Math.sin(dLon / 2) *
						Math.sin(dLon / 2);
				const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
				return R * c; // Distance in km
			};

			// Default coordinates if missing (Mumbai center)
			const parseCoord = (c: string | null) =>
				c ? Number.parseFloat(c) : 19.076;
			const parseLon = (c: string | null) =>
				c ? Number.parseFloat(c) : 72.8777;

			// Implement Nearest Neighbor TSP Algorithm
			let unvisited = [...customersData];
			const optimizedIds: number[] = [];

			// Start from the first selected customer (or we could use branch coordinates)
			let current =
				unvisited.find((c) => c.id === input.customerIds[0]) || unvisited[0];
			optimizedIds.push(current.id);
			unvisited = unvisited.filter((c) => c.id !== current.id);

			while (unvisited.length > 0) {
				let nearestIdx = 0;
				let minDistance = Number.POSITIVE_INFINITY;

				for (let i = 0; i < unvisited.length; i++) {
					const node = unvisited[i];
					const dist = getDistance(
						parseCoord(current.latitude),
						parseLon(current.longitude),
						parseCoord(node.latitude),
						parseLon(node.longitude),
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

	createTripDirect: roleProcedure(["admin", "manager"])
		.input(
			z.object({
				driverId: z.string(),
				vehicleId: z.number().optional(),
				orderIds: z.array(z.number()).optional(),
				stops: z.array(
					z.object({
						customerId: z.number().optional(),
						sequence: z.number().optional(),
						name: z.string().optional(),
						phone: z.string().optional(),
						address: z.string().optional(),
						notes: z.string().optional(),
					}),
				),
				routeName: z.string().optional(),
				loaderId: z.string().optional(),
				branchId: z.number().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const database = (ctx as any).db || db;
			const branch = input.branchId || ctx.user?.branchId || 1;
			try {
				return await database.transaction(async (tx) => {
					// Process stops and auto-create customers for new address/phone stops
					const resolvedStops: { customerId: number; sequence: number }[] = [];
					const seenCustomers = new Set<number>();
					let currentSequence = 1;

					for (const s of input.stops) {
						let resolvedCustId = s.customerId;

						if (!resolvedCustId && (s.name || s.address || s.phone)) {
							const phoneClean = s.phone?.trim() || "";
							const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
							const email = phoneClean
								? `cust_${phoneClean.replace(/\D/g, "") || uniqueSuffix}@evaluna.local`
								: `cust_${uniqueSuffix}@evaluna.local`;

							let existingCust = null;
							if (phoneClean) {
								existingCust = await tx.query.customers.findFirst({
									where: and(
										eq(customers.phone, phoneClean),
										eq(customers.branch_id, branch),
									),
								});
							}

							if (existingCust) {
								resolvedCustId = existingCust.id;
							} else {
								const [newCust] = await tx
									.insert(customers)
									.values({
										name: s.name?.trim() || (s.address ? `Stop: ${s.address.slice(0, 30)}` : `Customer ${phoneClean}`),
										email,
										phone: phoneClean || null,
										address: s.address?.trim() || null,
										branch_id: branch,
										user_uid: ctx.user?.id || "manager",
										customer_code: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
									})
									.returning();
								resolvedCustId = newCust.id;
							}
						}

						if (resolvedCustId && !seenCustomers.has(resolvedCustId)) {
							seenCustomers.add(resolvedCustId);
							resolvedStops.push({
								customerId: resolvedCustId,
								sequence: s.sequence || currentSequence++,
							});
						}
					}

					let createdRouteId: number | null = null;
					if (input.routeName) {
						const [route] = await tx
							.insert(deliveryRoutes)
							.values({
								name: input.routeName,
								branch_id: branch || null,
							})
							.returning();
						createdRouteId = route.id;

						if (resolvedStops.length > 0) {
							await tx.insert(routeStops).values(
								resolvedStops.map((s) => ({
									route_id: route.id,
									customer_id: s.customerId,
									sequence: s.sequence,
								})),
							);
						}
					}

					// Create the direct trip
					const [trip] = await tx
						.insert(deliveryTrips)
						.values({
							route_id: createdRouteId,
							driver_id: input.driverId,
							vehicle_id: input.vehicleId || null,
							loader_id: input.loaderId || null,
							status: "pending",
						})
						.returning();

					// 4. Create trip stops
					if (resolvedStops.length > 0) {
						await tx.insert(tripStops).values(
							resolvedStops.map((s) => ({
								trip_id: trip.id,
								customer_id: s.customerId,
								sequence: s.sequence,
								status: "pending",
							})),
						);
					}

					// 5. Update assigned orders with driver_id
					try {
						let driverStaffId: number | null = null;
						if (tx.query && (tx.query as any).staff) {
							const staffRow = await (tx.query as any).staff.findFirst({
								where: (s: any, { eq, or }: any) =>
									or(
										eq(s.email, input.driverId),
										sql`LOWER(TRIM(${s.email})) = LOWER(TRIM(${input.driverId}))`,
										eq(s.staff_code, input.driverId),
										sql`LOWER(TRIM(${s.name})) = LOWER(TRIM(${input.driverId}))`,
									),
							});
							if (staffRow) {
								driverStaffId = staffRow.id;
							}
						}
						if (driverStaffId === null && tx.query && (tx.query as any).user) {
							const userRow = await (tx.query as any).user.findFirst({
								where: (u: any, { eq, or }: any) =>
									or(
										eq(u.id, input.driverId),
										sql`LOWER(TRIM(${u.email})) = LOWER(TRIM(${input.driverId}))`,
									),
							});
							if (userRow && (tx.query as any).staff) {
								const staffMatch = await (tx.query as any).staff.findFirst({
									where: (s: any, { eq, or }: any) =>
										or(
											eq(s.email, userRow.email),
											sql`LOWER(TRIM(${s.email})) = LOWER(TRIM(${userRow.email}))`,
											sql`LOWER(TRIM(${s.name})) = LOWER(TRIM(${userRow.name}))`,
										),
								});
								if (staffMatch) {
									driverStaffId = staffMatch.id;
								}
							}
						}
						if (driverStaffId === null && !isNaN(Number(input.driverId)) && Number(input.driverId) > 0) {
							driverStaffId = Number(input.driverId);
						}

						if (input.orderIds && input.orderIds.length > 0) {
							await tx
								.update(orders)
								.set({
									...(driverStaffId !== null ? { driver_id: driverStaffId } : {}),
									status: "ready_for_dispatch",
								})
								.where(inArray(orders.id, input.orderIds));
						} else if (resolvedStops.length > 0) {
							const custIds = resolvedStops.map((s) => s.customerId);
							await tx
								.update(orders)
								.set({
									...(driverStaffId !== null ? { driver_id: driverStaffId } : {}),
									status: "ready_for_dispatch",
								})
								.where(
									and(
										inArray(orders.customer_id, custIds),
										inArray(orders.status, [
											"confirmed",
											"processing",
											"ready_for_dispatch",
										]),
									),
								);
						}
					} catch (e) {
						// Non-critical background sync
					}

					return trip;
				});
			} catch (err: any) {
				const fs = require("fs");
				const path = require("path");
				const errorLog = `
=========================================
TIMESTAMP: ${new Date().toISOString()}
ERROR MESSAGE: ${err.message}
ERROR CODE: ${err.code}
ERROR DETAIL: ${err.detail}
ERROR CONSTRAINT: ${err.constraint}
ERROR TABLE: ${err.table}
=========================================
`;
				fs.appendFileSync(
					path.join(process.cwd(), "scratch/error-details.txt"),
					errorLog,
				);
				throw err;
			}
		}),

	addItemsToDeliveryOrder: protectedProcedure
		.input(
			z.object({
				orderId: z.number(),
				items: z.array(
					z.object({
						productId: z.number(),
						quantity: z.number(),
						price: z.number(),
					}),
				),
			}),
		)
		.mutation(async ({ input }) => {
			const { orderId, items } = input;

			// 1. Insert new items
			for (const item of items) {
				await db.insert(orderItems).values({
					order_id: orderId,
					product_id: item.productId,
					quantity: item.quantity,
					price: item.price.toString(),
				});
			}

			// 2. Recalculate total amount
			const allItems = await db.query.orderItems.findMany({
				where: eq(orderItems.order_id, orderId),
			});

			const newTotal = allItems.reduce(
				(acc, curr) => acc + Number(curr.price) * curr.quantity,
				0,
			);

			await db
				.update(orders)
				.set({ total_amount: newTotal.toString() })
				.where(eq(orders.id, orderId));

			return { success: true, newTotal };
		}),

	dispatchTrip: roleProcedure(["admin", "manager"])
		.input(z.object({ tripId: z.number() }))
		.mutation(async ({ input, ctx }) => {
			const database = (ctx as any).db || db;
			const [trip] = await database
				.select()
				.from(deliveryTrips)
				.where(eq(deliveryTrips.id, input.tripId));

			if (!trip) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: `Trip #${input.tripId} not found`,
				});
			}

			// Strict Gate: A trip must be verified and marked as "loaded" by the loader before it can be dispatched
			if (trip.status !== "loaded") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Trip #${input.tripId} cannot be dispatched yet. It must first be physically loaded and verified by the warehouse loader (Current status: "${trip.status}").`,
				});
			}

			// Update trip status to active (dispatched out for delivery)
			await database
				.update(deliveryTrips)
				.set({
					status: "active",
					start_time: new Date(),
					dispatched_at: new Date(),
					dispatched_by_id: ctx.user?.id || "manager",
					updated_at: new Date(),
				})
				.where(eq(deliveryTrips.id, input.tripId));

			// Fetch all trip stops to resolve customer IDs
			const stops = await database
				.select({ customerId: tripStops.customer_id })
				.from(tripStops)
				.where(eq(tripStops.trip_id, input.tripId));

			const customerIds = stops.map((s: any) => s.customerId).filter(Boolean);

			// Update all orders for customers in this trip to out_for_delivery
			if (customerIds.length > 0) {
				await database
					.update(orders)
					.set({ status: "out_for_delivery" })
					.where(
						and(
							inArray(orders.customer_id, customerIds),
							notInArray(orders.status, ["delivered", "cancelled", "out_for_delivery"]),
						),
					);
			}

			// Also update any orders directly assigned to this driver that are still ready_for_dispatch
			if (trip.driver_id) {
				try {
					// Resolve numeric staff ID for the driver
					const driverUser = await db.query.user.findFirst({
						where: (u, { eq, or }) =>
							or(
								eq(u.id, trip.driver_id),
								sql`LOWER(TRIM(${u.email})) = LOWER(TRIM(${trip.driver_id}))`,
								sql`LOWER(TRIM(${u.name})) = LOWER(TRIM(${trip.driver_id}))`,
							),
						columns: { id: true, email: true, name: true },
					});

					if (driverUser) {
						// Find linked staff record
						const driverStaff = await db.query.staff.findFirst({
							where: (s, { or }) =>
								or(
									sql`LOWER(TRIM(${s.email})) = LOWER(TRIM(${driverUser.email ?? ""}))`,
									sql`LOWER(TRIM(${s.name})) = LOWER(TRIM(${driverUser.name ?? ""}))`,
								),
							columns: { id: true },
						});

						if (driverStaff) {
							// Update driver-assigned orders that are ready_for_dispatch to out_for_delivery
							await database
								.update(orders)
								.set({ status: "out_for_delivery" })
								.where(
									and(
										eq(orders.driver_id, driverStaff.id),
										notInArray(orders.status, ["delivered", "cancelled", "out_for_delivery"]),
									),
								);
						}
					}
				} catch (driverOrderSyncErr) {
					console.warn("[dispatchTrip] Driver order sync error (non-critical):", driverOrderSyncErr);
				}
			}

			// Dispatch notification to Driver
			try {
				await dispatchNotification({
					type: "info",
					priority: "high",
					title: `🚚 Trip #${input.tripId} Dispatched`,
					message: `Manager has dispatched Trip #${input.tripId}. You are now Out for Delivery!`,
					branchId: (ctx.user?.branchId as number) || 1,
					channels: ["in_app"],
					referenceType: "trips",
					referenceId: input.tripId,
					metadata: {
						trip_id: input.tripId,
						driver_id: trip.driver_id,
						dispatched_by: ctx.user?.name || ctx.user?.email || "manager",
					},
				});
			} catch (e) {
				// Notification failure is non-critical
			}

			return { success: true, tripId: input.tripId, status: "active" };
		}),
});
