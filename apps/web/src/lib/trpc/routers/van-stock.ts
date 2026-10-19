import {
	branchInventory,
	branches,
	products,
	staff,
	stockLedger,
	user,
	vanStockAudits,
	vanStockExceptions,
	vanStockPlanItems,
	vanStockPlans,
	vehicles,
} from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db as defaultDb } from "@/lib/db";
import { roleProcedure, router } from "../init";

export const vanStockRouter = router({
	// ── 1. Planning Metadata (Vehicles, Drivers, Products with live stock) ───
	getPlanningMetadata: roleProcedure(["admin", "manager"])
		.input(z.object({ branchId: z.number().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const db: any = ctx.db || defaultDb;
			const branchId = input?.branchId || ctx.user?.branchId || 1;

			// Fetch branch vehicles
			const vehicleRows = await db.query.vehicles.findMany({
				where: eq(vehicles.branch_id, branchId),
				orderBy: [vehicles.name],
			});

			// Check which vehicles currently have an active plan (not completed/cancelled)
			const activePlans = await db.query.vanStockPlans.findMany({
				where: and(
					eq(vanStockPlans.branch_id, branchId),
					sql`${vanStockPlans.status} NOT IN ('COMPLETED', 'CANCELLED', 'DRAFT')`,
				),
				columns: { vehicle_id: true, status: true, plan_code: true, id: true },
			});
			const activeVehicleMap = new Map<number, any>(
				activePlans.map((p: any) => [p.vehicle_id, p]),
			);

			const vehicleList = vehicleRows.map((v: any) => {
				const activePlan: any = activeVehicleMap.get(v.id);
				return {
					id: v.id,
					name: v.name,
					registrationNumber: v.registration_number,
					type: v.type,
					capacityKg: v.capacity_kg ? Number(v.capacity_kg) : null,
					status: v.status || "available",
					isBusy: Boolean(activePlan),
					activePlanCode: activePlan?.plan_code || null,
					activePlanId: activePlan?.id || null,
					activePlanStatus: activePlan?.status || null,
				};
			});

			// Fetch eligible drivers (users with driver roles or staff with driver roles)
			const staffDrivers: any[] = await db.query.staff.findMany({
				where: or(
					eq(staff.role, "driver"),
					eq(staff.role, "delivery"),
					eq(staff.role, "delivery_boy"),
				),
				columns: { id: true, name: true, email: true, phone: true, staff_code: true },
			});

			const allUsers: any[] = await db.query.user.findMany({
				with: { userRoles: { with: { role: true } } },
			});

			const driverUsers = allUsers.filter((u: any) => {
				const hasRole = u.userRoles?.some((r: any) =>
					["delivery", "driver", "delivery_boy"].includes(
						r.role?.name?.toLowerCase() || "",
					),
				);
				const hasStaff = staffDrivers.some(
					(s: any) => s.id === u.staff_id || (s.email && u.email && s.email.toLowerCase() === u.email.toLowerCase()),
				);
				return hasRole || hasStaff;
			});

			const driverList = driverUsers.map((u: any) => {
				const staffMatch = staffDrivers.find(
					(s: any) => s.id === u.staff_id || (s.email && u.email && s.email.toLowerCase() === u.email.toLowerCase()),
				);
				return {
					id: u.id,
					name: u.name,
					email: u.email,
					phone: staffMatch?.phone || null,
					staffCode: staffMatch?.staff_code || (u.staff_id ? `EMP-${u.staff_id}` : null),
				};
			});

			// If no specific driver users matched, fallback to staff drivers directly
			if (driverList.length === 0 && staffDrivers.length > 0) {
				for (const s of staffDrivers) {
					driverList.push({
						id: String(s.id),
						name: s.name,
						email: s.email,
						phone: s.phone,
						staffCode: s.staff_code,
					});
				}
			}

			// Fetch active warehouse products with branch inventory
			const productRows: any[] = await db.query.products.findMany({
				where: (p: any, { and, eq }: any) => and(eq(p.is_deleted, false), eq(p.is_hidden, false)),
				columns: { id: true, name: true, sku: true, unit: true, price: true, buying_price: true },
			});

			const inventoryRows: any[] = await db.query.branchInventory.findMany({
				where: eq(branchInventory.branch_id, branchId),
			});
			const invMap = new Map<number, any>(inventoryRows.map((inv: any) => [inv.product_id, inv]));

			const productList = productRows.map((p: any) => {
				const inv: any = invMap.get(p.id);
				const inStock = Number(inv?.in_stock || 0);
				const reserved = Number(inv?.reserved_stock || 0);
				const available = Math.max(0, inStock - reserved);
				return {
					id: p.id,
					name: p.name,
					sku: p.sku || `SKU-${p.id}`,
					unit: p.unit || "pcs",
					price: Number(p.price || 0),
					buyingPrice: Number(p.buying_price || 0),
					inStock,
					reservedStock: reserved,
					availableStock: Number(available.toFixed(3)),
				};
			});

			return {
				vehicles: vehicleList,
				drivers: driverList,
				products: productList,
			};
		}),

	// ── 2. List Van Stock Plans ──────────────────────────────────────────────
	listPlans: roleProcedure(["admin", "manager", "picker", "packer", "loader", "driver", "auditor"])
		.input(
			z
				.object({
					status: z.string().optional(),
					stage: z.enum(["planning", "picking", "packing", "verification", "loading", "dispatch", "return", "all"]).optional(),
					vehicleId: z.number().optional(),
					driverId: z.string().optional(),
					dispatchDate: z.string().optional(),
					branchId: z.number().optional(),
					limit: z.number().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const db: any = ctx.db || defaultDb;
			const branchId = input?.branchId || ctx.user?.branchId || 1;

			// Define status filters per stage
			const stageFilterMap: Record<string, string[]> = {
				planning: ["DRAFT", "PENDING_PICKING"],
				picking: ["PENDING_PICKING", "PICKING_IN_PROGRESS"],
				packing: ["PENDING_PACKING", "PACKING_IN_PROGRESS"],
				verification: ["PENDING_MANAGER_VERIFICATION", "MANAGER_VERIFICATION_REJECTED"],
				loading: ["PENDING_LOADING", "LOADING_IN_PROGRESS"],
				dispatch: ["PENDING_FINAL_DISPATCH_APPROVAL", "DISPATCH_REJECTED", "DISPATCHED"],
				return: ["DISPATCHED", "RETURN_IN_PROGRESS", "PENDING_RETURN_VERIFICATION", "RETURN_REJECTED", "RETURN_VERIFIED", "COMPLETED", "RECONCILED"],
			};

			const conditions: any[] = [eq(vanStockPlans.branch_id, branchId)];

			if (input?.status) {
				conditions.push(eq(vanStockPlans.status, input.status));
			} else if (input?.stage && input.stage !== "all" && stageFilterMap[input.stage]) {
				conditions.push(inArray(vanStockPlans.status, stageFilterMap[input.stage]));
			}

			if (input?.vehicleId) {
				conditions.push(eq(vanStockPlans.vehicle_id, input.vehicleId));
			}

			if (input?.driverId) {
				conditions.push(eq(vanStockPlans.driver_id, input.driverId));
			}

			if (input?.dispatchDate) {
				conditions.push(eq(vanStockPlans.dispatch_date, input.dispatchDate));
			}

			const plans = await db.query.vanStockPlans.findMany({
				where: and(...conditions),
				orderBy: [desc(vanStockPlans.id)],
				limit: input?.limit,
				with: {
					vehicle: true,
					driver: { columns: { id: true, name: true, email: true } },
					items: {
						with: {
							product: { columns: { id: true, name: true, sku: true, unit: true } },
						},
					},
					exceptions: true,
				},
			});

			return plans.map((p: any) => {
				const totalPlanned = p.items.reduce(
					(sum: number, it: any) => sum + Number(it.planned_quantity),
					0,
				);
				const totalPicked = p.items.reduce(
					(sum: number, it: any) => sum + Number(it.picked_quantity),
					0,
				);
				const totalPacked = p.items.reduce(
					(sum: number, it: any) => sum + Number(it.packed_quantity),
					0,
				);
				const totalVerified = p.items.reduce(
					(sum: number, it: any) => sum + Number(it.verified_quantity),
					0,
				);
				const totalLoaded = p.items.reduce(
					(sum: number, it: any) => sum + Number(it.loaded_quantity),
					0,
				);
				const totalReturned = p.items.reduce(
					(sum: number, it: any) => sum + Number(it.returned_quantity),
					0,
				);
				const pendingExceptionsCount = p.exceptions.filter(
					(e: any) => e.status === "PENDING",
				).length;

				return {
					id: p.id,
					planCode: p.plan_code,
					dispatchReference: p.dispatch_reference,
					dispatchDate: p.dispatch_date,
					status: p.status,
					revision: p.revision,
					vehicle: {
						id: p.vehicle.id,
						name: p.vehicle.name,
						registrationNumber: p.vehicle.registration_number,
						type: p.vehicle.type,
						capacityKg: p.vehicle.capacity_kg ? Number(p.vehicle.capacity_kg) : null,
					},
					driver: p.driver
						? { id: p.driver.id, name: p.driver.name, email: p.driver.email }
						: null,
					itemCount: p.items.length,
					totalPlanned: Number(totalPlanned.toFixed(3)),
					totalPicked: Number(totalPicked.toFixed(3)),
					totalPacked: Number(totalPacked.toFixed(3)),
					totalVerified: Number(totalVerified.toFixed(3)),
					totalLoaded: Number(totalLoaded.toFixed(3)),
					totalReturned: Number(totalReturned.toFixed(3)),
					pendingExceptionsCount,
					createdByName: p.created_by_name || "Manager",
					createdAt: p.created_at.toISOString(),
					dispatchedAt: p.dispatched_at ? p.dispatched_at.toISOString() : null,
					returnedAt: p.returned_at ? p.returned_at.toISOString() : null,
				};
			});
		}),

	// ── 3. Plan Detail ────────────────────────────────────────────────────────
	getPlanDetail: roleProcedure(["admin", "manager", "picker", "packer", "loader", "driver", "auditor"])
		.input(
			z.object({
				id: z.union([z.number(), z.string()]).optional(),
				planId: z.union([z.number(), z.string()]).optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db: any = ctx.db || defaultDb;
			const targetId = Number(input.id || input.planId);
			if (!targetId || isNaN(targetId)) {
				throw new TRPCError({ code: "BAD_REQUEST", message: "A valid plan ID is required." });
			}

			const plan = await db.query.vanStockPlans.findFirst({
				where: eq(vanStockPlans.id, targetId),
				with: {
					vehicle: true,
					driver: { columns: { id: true, name: true, email: true } },
					items: {
						with: {
							product: {
								columns: {
									id: true,
									name: true,
									sku: true,
									unit: true,
									price: true,
									buying_price: true,
								},
							},
						},
						orderBy: [vanStockPlanItems.id],
					},
					exceptions: {
						with: {
							product: { columns: { id: true, name: true, sku: true, unit: true } },
						},
						orderBy: [desc(vanStockExceptions.id)],
					},
					audits: {
						orderBy: [desc(vanStockAudits.id)],
					},
				},
			});

			if (!plan) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: `Van stock plan #${input.id} not found.`,
				});
			}

			// Also fetch available stock for each item product in the plan
			const branchId = plan.branch_id;
			const productIds: number[] = plan.items.map((i: any) => i.product_id);
			const inventories: any[] = productIds.length > 0
				? await db.query.branchInventory.findMany({
						where: and(
							eq(branchInventory.branch_id, branchId),
							inArray(branchInventory.product_id, productIds),
						),
				  })
				: [];
			const invMap = new Map<number, any>(inventories.map((inv: any) => [inv.product_id, inv]));

			const mappedItems = plan.items.map((it: any) => {
				const inv = invMap.get(it.product_id);
				const inStock = Number(inv?.in_stock || 0);
				const reserved = Number(inv?.reserved_stock || 0);
				const available = Math.max(0, inStock - reserved);

				return {
					id: it.id,
					productId: it.product_id,
					productName: it.product.name,
					sku: it.product.sku || `SKU-${it.product_id}`,
					unit: it.product.unit || "pcs",
					unitPrice: Number(it.product.price || 0),
					availableStock: Number(available.toFixed(3)),
					isAdditional: it.is_additional,
					additionalReason: it.additional_reason,
					plannedQuantity: Number(it.planned_quantity),
					pickedQuantity: Number(it.picked_quantity),
					pickingShortage: Number(it.picking_shortage),
					pickingNotes: it.picking_notes,
					packedQuantity: Number(it.packed_quantity),
					packingDamaged: Number(it.packing_damaged),
					packingStatus: it.packing_status,
					packingNotes: it.packing_notes,
					verifiedQuantity: Number(it.verified_quantity),
					verificationNotes: it.verification_notes,
					loadedQuantity: Number(it.loaded_quantity),
					loadingStatus: it.loading_status,
					loadingNotes: it.loading_notes,
					deliveredQuantity: Number(it.delivered_quantity),
					returnedQuantity: Number(it.returned_quantity),
					damagedReturnQuantity: Number(it.damaged_return_quantity),
					returnReasonCode: it.return_reason_code,
					returnNotes: it.return_notes,
					verifiedReturnQuantity: Number(it.verified_return_quantity),
				};
			});

			return {
				id: plan.id,
				planCode: plan.plan_code,
				planNumber: plan.plan_code,
				dispatchReference: plan.dispatch_reference,
				dispatchDate: plan.dispatch_date,
				vehicleId: plan.vehicle_id,
				driverId: plan.driver_id,
				status: plan.status,
				revision: plan.revision,
				notes: plan.notes,
				specialInstructions: plan.special_instructions,
				createdById: plan.created_by_id,
				createdByName: plan.created_by_name || "Manager",
				createdAt: plan.created_at.toISOString(),
				pickedAt: plan.picked_at ? plan.picked_at.toISOString() : null,
				packedAt: plan.packed_at ? plan.packed_at.toISOString() : null,
				verifiedAt: plan.verified_at ? plan.verified_at.toISOString() : null,
				verificationNotes: plan.verification_notes,
				loadedAt: plan.loaded_at ? plan.loaded_at.toISOString() : null,
				loadingNotes: plan.loading_notes,
				loadingChecklist: plan.loading_checklist,
				dispatchedAt: plan.dispatched_at ? plan.dispatched_at.toISOString() : null,
				returnedAt: plan.returned_at ? plan.returned_at.toISOString() : null,
				returnVerifiedAt: plan.return_verified_at ? plan.return_verified_at.toISOString() : null,
				returnVerificationNotes: plan.return_verification_notes,
				rejectionReason: plan.rejection_reason,
				rejectionStage: plan.rejection_stage,
				vehicle: {
					id: plan.vehicle.id,
					name: plan.vehicle.name,
					registrationNumber: plan.vehicle.registration_number,
					type: plan.vehicle.type,
					capacityKg: plan.vehicle.capacity_kg ? Number(plan.vehicle.capacity_kg) : null,
					status: plan.vehicle.status,
				},
				driver: plan.driver
					? { id: plan.driver.id, name: plan.driver.name, email: plan.driver.email }
					: null,
				items: mappedItems,
				exceptions: plan.exceptions.map((ex: any) => ({
					id: ex.id,
					productId: ex.product_id,
					productName: ex.product.name,
					sku: ex.product.sku || `SKU-${ex.product_id}`,
					unit: ex.product.unit || "pcs",
					stage: ex.stage,
					quantity: Number(ex.quantity),
					reason: ex.reason,
					status: ex.status,
					requestedByName: ex.requested_by_name || "Staff",
					reviewedByName: ex.reviewed_by_name,
					reviewNotes: ex.review_notes,
					reviewedAt: ex.reviewed_at ? ex.reviewed_at.toISOString() : null,
					createdAt: ex.created_at.toISOString(),
				})),
				audits: plan.audits.map((a: any) => ({
					id: a.id,
					actorName: a.actor_name,
					actorRole: a.actor_role,
					stage: a.stage,
					action: a.action,
					previousStatus: a.previous_status,
					newStatus: a.new_status,
					revision: a.revision,
					reason: a.reason,
					notes: a.notes,
					metadata: a.metadata,
					createdAt: a.created_at.toISOString(),
				})),
			};
		}),

	// ── 4. Create Plan (Manager) ─────────────────────────────────────────────
	createPlan: roleProcedure(["admin", "manager"])
		.input(
			z.object({
				vehicleId: z.union([z.number(), z.string()]).transform(Number),
				driverId: z.string().optional(),
				dispatchDate: z.string(), // YYYY-MM-DD
				notes: z.string().optional(),
				specialInstructions: z.string().optional(),
				isDraft: z.boolean().optional(),
				submitForPicking: z.boolean().optional(),
				items: z
					.array(
						z.object({
							productId: z.union([z.number(), z.string()]).transform(Number),
							quantity: z.number().positive().optional(),
							plannedQty: z.number().positive().optional(),
							isAdditional: z.boolean().default(false),
							additionalReason: z.string().optional(),
							notes: z.string().optional(),
						}),
					)
					.min(1, "At least one item is required in the stock plan."),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db: any = ctx.db || defaultDb;
			const branchId = ctx.user?.branchId || 1;
			const actorName = ctx.user?.name || "Manager";
			const isDraftPlan = input.isDraft ?? (input.submitForPicking === false);

			// Verify vehicle exists and is in branch
			const vehicle = await db.query.vehicles.findFirst({
				where: and(eq(vehicles.id, input.vehicleId), eq(vehicles.branch_id, branchId)),
			});
			if (!vehicle) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Selected vehicle does not belong to your branch.",
				});
			}

			// Conflict guard: verify vehicle doesn't already have an active plan for this date
			const existingConflict = await db.query.vanStockPlans.findFirst({
				where: and(
					eq(vanStockPlans.vehicle_id, input.vehicleId),
					eq(vanStockPlans.dispatch_date, input.dispatchDate),
					sql`${vanStockPlans.status} NOT IN ('COMPLETED', 'CANCELLED')`,
				),
			});
			if (existingConflict) {
				throw new TRPCError({
					code: "CONFLICT",
					message: `Van ${vehicle.registration_number} already has an active plan (${existingConflict.plan_code}) scheduled for ${input.dispatchDate}.`,
				});
			}

			// Validate all products exist
			const productIds = input.items.map((i) => i.productId);
			const validProducts = await db.query.products.findMany({
				where: and(inArray(products.id, productIds), eq(products.is_deleted, false)),
			});
			if (validProducts.length !== productIds.length) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "One or more selected products are invalid or deleted.",
				});
			}

			// Generate clean Plan Code: VSP-YYYYMMDD-XXXX
			const dateStr = input.dispatchDate.replace(/-/g, "");
			const randomSuffix = Math.floor(1000 + Math.random() * 9000);
			const planCode = `VSP-${dateStr}-${randomSuffix}`;
			const initialStatus = isDraftPlan ? "DRAFT" : "PENDING_PICKING";

			return await db.transaction(async (tx: any) => {
				const [plan] = await tx
					.insert(vanStockPlans)
					.values({
						plan_code: planCode,
						vehicle_id: input.vehicleId,
						driver_id: input.driverId || null,
						branch_id: branchId,
						dispatch_date: input.dispatchDate,
						status: initialStatus,
						revision: 1,
						notes: input.notes?.trim() || null,
						special_instructions: input.specialInstructions?.trim() || null,
						created_by_id: ctx.user.id,
						created_by_name: actorName,
					})
					.returning();

				// Insert plan items
				await tx.insert(vanStockPlanItems).values(
					input.items.map((it) => ({
						plan_id: plan.id,
						product_id: it.productId,
						is_additional: Boolean(it.isAdditional),
						additional_reason: it.additionalReason?.trim() || null,
						planned_quantity: (it.quantity ?? it.plannedQty ?? 0).toString(),
						picked_quantity: "0",
						packed_quantity: "0",
						verified_quantity: "0",
						loaded_quantity: "0",
					})),
				);

				// Audit record
				await tx.insert(vanStockAudits).values({
					plan_id: plan.id,
					actor_id: ctx.user.id,
					actor_name: actorName,
					actor_role: "manager",
					stage: "PLANNING",
					action: isDraftPlan ? "PLAN_DRAFT_SAVED" : "PLAN_SUBMITTED_FOR_PICKING",
					previous_status: null,
					new_status: initialStatus,
					revision: 1,
					notes: isDraftPlan ? "Draft created" : "Stock plan created and released to Picker",
					metadata: {
						vehicleRegistration: vehicle.registration_number,
						itemCount: input.items.length,
					},
				});

				return {
					success: true,
					planId: plan.id,
					planCode: plan.plan_code,
					status: plan.status,
				};
			});
		}),

	// ── 5. Start Picking (Picker) ────────────────────────────────────────────
	startPicking: roleProcedure(["admin", "manager", "picker"])
		.input(z.object({ planId: z.union([z.number(), z.string()]).transform(Number) }))
		.mutation(async ({ ctx, input }) => {
			const db: any = ctx.db || defaultDb;
			const actorName = ctx.user?.name || "Picker";

			const plan = await db.query.vanStockPlans.findFirst({
				where: eq(vanStockPlans.id, input.planId),
			});
			if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found." });

			if (plan.status !== "PENDING_PICKING" && plan.status !== "PICKING_IN_PROGRESS") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Cannot start picking for a plan in '${plan.status}' status.`,
				});
			}

			if (plan.status === "PENDING_PICKING") {
				await db
					.update(vanStockPlans)
					.set({
						status: "PICKING_IN_PROGRESS",
						assigned_picker_id: ctx.user.id,
					})
					.where(eq(vanStockPlans.id, input.planId));

				await db.insert(vanStockAudits).values({
					plan_id: plan.id,
					actor_id: ctx.user.id,
					actor_name: actorName,
					actor_role: "picker",
					stage: "PICKING",
					action: "PICKING_STARTED",
					previous_status: "PENDING_PICKING",
					new_status: "PICKING_IN_PROGRESS",
					revision: plan.revision,
					notes: "Picker started physical warehouse picking",
				});
			}

			return { success: true };
		}),

	// ── 6. Submit Picking Completion (Picker) ────────────────────────────────
	submitPicking: roleProcedure(["admin", "manager", "picker"])
		.input(
			z.object({
				planId: z.union([z.number(), z.string()]).transform(Number),
				items: z
					.array(
						z.object({
							itemId: z.union([z.number(), z.string()]).transform(Number).optional(),
							planItemId: z.union([z.number(), z.string()]).transform(Number).optional(),
							pickedQuantity: z.number().nonnegative().optional(),
							pickedQty: z.number().nonnegative().optional(),
							shortage: z.number().nonnegative().default(0).optional(),
							shortageQty: z.number().nonnegative().default(0).optional(),
							shortageReason: z.string().optional(),
							notes: z.string().optional(),
						}),
					)
					.min(1),
				notes: z.string().optional(),
				pickerNotes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db: any = ctx.db || defaultDb;
			const actorName = ctx.user?.name || "Picker";

			return await db.transaction(async (tx: any) => {
				const plan = await tx.query.vanStockPlans.findFirst({
					where: eq(vanStockPlans.id, input.planId),
					with: { items: true },
				});
				if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found." });

				if (plan.status !== "PICKING_IN_PROGRESS" && plan.status !== "PENDING_PICKING") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Cannot submit picking. Current status is '${plan.status}'.`,
					});
				}

				// Update item actual picked quantities and record shortages
				for (const itemInput of input.items) {
					const targetItemId = itemInput.itemId ?? itemInput.planItemId ?? 0;
					const picked = itemInput.pickedQuantity ?? itemInput.pickedQty ?? 0;
					const shortage = itemInput.shortage ?? itemInput.shortageQty ?? 0;
					const itemNote = itemInput.notes || itemInput.shortageReason || null;

					await tx
						.update(vanStockPlanItems)
						.set({
							picked_quantity: picked.toString(),
							picking_shortage: shortage.toString(),
							picking_notes: itemNote,
						})
						.where(eq(vanStockPlanItems.id, targetItemId));

					// Transactional Stock Reservation:
					// Find item product to increase reserved_stock in branch_inventory
					const planItem = plan.items.find((i: any) => i.id === targetItemId);
					if (planItem && picked > 0) {
						const [existingInv] = await tx
							.select()
							.from(branchInventory)
							.where(
								and(
									eq(branchInventory.branch_id, plan.branch_id),
									eq(branchInventory.product_id, planItem.product_id),
								),
							);
						if (existingInv) {
							const currentReserved = Number(existingInv.reserved_stock || 0);
							const nextReserved = Number(
								(currentReserved + picked).toFixed(3),
							);
							await tx
								.update(branchInventory)
								.set({ reserved_stock: nextReserved.toString() })
								.where(eq(branchInventory.id, existingInv.id));
						}
					}
				}

				// Transition to PENDING_PACKING
				await tx
					.update(vanStockPlans)
					.set({
						status: "PENDING_PACKING",
						assigned_picker_id: ctx.user.id,
						picked_at: new Date(),
						notes: input.notes ? `${plan.notes || ""}\n[Picker]: ${input.notes}`.trim() : plan.notes,
					})
					.where(eq(vanStockPlans.id, input.planId));

				await tx.insert(vanStockAudits).values({
					plan_id: plan.id,
					actor_id: ctx.user.id,
					actor_name: actorName,
					actor_role: "picker",
					stage: "PICKING",
					action: "PICKING_COMPLETED",
					previous_status: plan.status,
					new_status: "PENDING_PACKING",
					revision: plan.revision,
					notes: input.notes || "Items picked, reserved in warehouse, and sent to Packer",
				});

				return { success: true, status: "PENDING_PACKING" };
			});
		}),

	// ── 7. Start Packing (Packer) ────────────────────────────────────────────
	startPacking: roleProcedure(["admin", "manager", "packer"])
		.input(z.object({ planId: z.union([z.number(), z.string()]).transform(Number) }))
		.mutation(async ({ ctx, input }) => {
			const db: any = ctx.db || defaultDb;
			const actorName = ctx.user?.name || "Packer";

			const plan = await db.query.vanStockPlans.findFirst({
				where: eq(vanStockPlans.id, input.planId),
			});
			if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found." });

			if (plan.status !== "PENDING_PACKING" && plan.status !== "PACKING_IN_PROGRESS") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Plan is in '${plan.status}' status, cannot start packing.`,
				});
			}

			if (plan.status === "PENDING_PACKING") {
				await db
					.update(vanStockPlans)
					.set({
						status: "PACKING_IN_PROGRESS",
						assigned_packer_id: ctx.user.id,
					})
					.where(eq(vanStockPlans.id, input.planId));

				await db.insert(vanStockAudits).values({
					plan_id: plan.id,
					actor_id: ctx.user.id,
					actor_name: actorName,
					actor_role: "packer",
					stage: "PACKING",
					action: "PACKING_STARTED",
					previous_status: "PENDING_PACKING",
					new_status: "PACKING_IN_PROGRESS",
					revision: plan.revision,
					notes: "Packer started packing boxes/crates for van dispatch",
				});
			}

			return { success: true };
		}),

	// ── 8. Submit Packing Completion (Packer) ────────────────────────────────
	submitPacking: roleProcedure(["admin", "manager", "packer"])
		.input(
			z.object({
				planId: z.union([z.number(), z.string()]).transform(Number),
				items: z
					.array(
						z.object({
							itemId: z.union([z.number(), z.string()]).transform(Number).optional(),
							planItemId: z.union([z.number(), z.string()]).transform(Number).optional(),
							packedQuantity: z.number().nonnegative().optional(),
							packedQty: z.number().nonnegative().optional(),
							damagedQuantity: z.number().nonnegative().default(0).optional(),
							damagedQty: z.number().nonnegative().default(0).optional(),
							packingStatus: z.string().optional(),
							discrepancyReason: z.string().optional(),
							notes: z.string().optional(),
						}),
					)
					.min(1),
				notes: z.string().optional(),
				packerNotes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db: any = ctx.db || defaultDb;
			const actorName = ctx.user?.name || "Packer";

			return await db.transaction(async (tx: any) => {
				const plan = await tx.query.vanStockPlans.findFirst({
					where: eq(vanStockPlans.id, input.planId),
				});
				if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found." });

				if (plan.status !== "PACKING_IN_PROGRESS" && plan.status !== "PENDING_PACKING") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Cannot submit packing. Current status is '${plan.status}'.`,
					});
				}

				// Update packed quantities and statuses
				for (const itemInput of input.items) {
					const targetItemId = itemInput.itemId ?? itemInput.planItemId ?? 0;
					const packed = itemInput.packedQuantity ?? itemInput.packedQty ?? 0;
					const damaged = itemInput.damagedQuantity ?? itemInput.damagedQty ?? 0;
					const status = (itemInput.packingStatus || "packed").toLowerCase();
					const note = itemInput.notes || itemInput.discrepancyReason || null;

					await tx
						.update(vanStockPlanItems)
						.set({
							packed_quantity: packed.toString(),
							packing_damaged: damaged.toString(),
							packing_status: status,
							packing_notes: note,
						})
						.where(eq(vanStockPlanItems.id, targetItemId));
				}

				// Move to PENDING_MANAGER_VERIFICATION
				await tx
					.update(vanStockPlans)
					.set({
						status: "PENDING_MANAGER_VERIFICATION",
						assigned_packer_id: ctx.user.id,
						packed_at: new Date(),
						notes: input.notes ? `${plan.notes || ""}\n[Packer]: ${input.notes}`.trim() : plan.notes,
					})
					.where(eq(vanStockPlans.id, input.planId));

				await tx.insert(vanStockAudits).values({
					plan_id: plan.id,
					actor_id: ctx.user.id,
					actor_name: actorName,
					actor_role: "packer",
					stage: "PACKING",
					action: "PACKING_COMPLETED",
					previous_status: plan.status,
					new_status: "PENDING_MANAGER_VERIFICATION",
					revision: plan.revision,
					notes: input.notes || "Packing manifest finalized and submitted for Manager Verification",
				});

				return { success: true, status: "PENDING_MANAGER_VERIFICATION" };
			});
		}),

	// ── 9. Manager Verification & Van/Driver Assignment ──────────────────────
	verifyPacking: roleProcedure(["admin", "manager"])
		.input(
			z.object({
				planId: z.union([z.number(), z.string()]).transform(Number),
				action: z.string().optional(),
				decision: z.string().optional(),
				reason: z.string().optional(),
				rejectionReason: z.string().optional(),
				vehicleId: z.union([z.number(), z.string()]).transform(Number).optional(),
				driverId: z.union([z.number(), z.string()]).transform(String).optional(),
				notes: z.string().optional(),
				specialInstructions: z.string().optional(),
				items: z
					.array(
						z.object({
							itemId: z.union([z.number(), z.string()]).transform(Number).optional(),
							planItemId: z.union([z.number(), z.string()]).transform(Number).optional(),
							verifiedQuantity: z.number().nonnegative().optional(),
							verifiedQty: z.number().nonnegative().optional(),
							notes: z.string().optional(),
						}),
					)
					.optional(),
				verifiedItems: z
					.array(
						z.object({
							itemId: z.union([z.number(), z.string()]).transform(Number).optional(),
							planItemId: z.union([z.number(), z.string()]).transform(Number).optional(),
							verifiedQuantity: z.number().nonnegative().optional(),
							verifiedQty: z.number().nonnegative().optional(),
							notes: z.string().optional(),
						}),
					)
					.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db: any = ctx.db || defaultDb;
			const actorName = ctx.user?.name || "Manager";

			return await db.transaction(async (tx: any) => {
				const plan = await tx.query.vanStockPlans.findFirst({
					where: eq(vanStockPlans.id, input.planId),
					with: { items: true, vehicle: true },
				});
				if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found." });

				if (plan.status !== "PENDING_MANAGER_VERIFICATION") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Plan is in '${plan.status}' status, cannot perform manager verification.`,
					});
				}

				const action = (input.action || input.decision || "APPROVE").toUpperCase();
				const reason = input.reason || input.rejectionReason || "";

				// Handle Rejection / Routing back
				if (action !== "APPROVE") {
					if (!reason.trim()) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "A mandatory rejection/return reason is required.",
						});
					}

					let nextStatus = "MANAGER_VERIFICATION_REJECTED";
					if (action === "RETURN_TO_PICKER" || action === "SEND_BACK_PICKER") nextStatus = "PENDING_PICKING";
					if (action === "RETURN_TO_PACKER" || action === "SEND_BACK_PACKER") nextStatus = "PENDING_PACKING";

					await tx
						.update(vanStockPlans)
						.set({
							status: nextStatus,
							rejection_reason: reason.trim(),
							rejection_stage: "MANAGER_VERIFICATION",
							revision: plan.revision + 1,
						})
						.where(eq(vanStockPlans.id, input.planId));

					await tx.insert(vanStockAudits).values({
						plan_id: plan.id,
						actor_id: ctx.user.id,
						actor_name: actorName,
						actor_role: "manager",
						stage: "VERIFICATION",
						action: `VERIFICATION_${action}`,
						previous_status: plan.status,
						new_status: nextStatus,
						revision: plan.revision + 1,
						reason: reason.trim(),
						notes: `Manager returned plan: ${reason.trim()}`,
					});

					return { success: true, nextStatus };
				}

				// Approval Flow:
				// Validate Van & Driver Assignment
				const vehicleId = input.vehicleId || plan.vehicle_id;
				const driverId = input.driverId || plan.driver_id;

				if (!driverId) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Please assign an eligible driver before approving for loading.",
					});
				}

				// Update verified quantities for each item
				const itemsToVerify = input.verifiedItems || input.items || [];
				if (itemsToVerify.length > 0) {
					for (const vi of itemsToVerify) {
						const targetItemId = vi.itemId ?? vi.planItemId ?? 0;
						const vQty = vi.verifiedQuantity ?? vi.verifiedQty ?? 0;
						await tx
							.update(vanStockPlanItems)
							.set({
								verified_quantity: vQty.toString(),
								verification_notes: vi.notes?.trim() || null,
							})
							.where(eq(vanStockPlanItems.id, targetItemId));
					}
				} else {
					// Default verified quantities to packed quantities
					for (const item of plan.items) {
						await tx
							.update(vanStockPlanItems)
							.set({
								verified_quantity: item.packed_quantity,
							})
							.where(eq(vanStockPlanItems.id, item.id));
					}
				}

				// Transition to PENDING_LOADING
				await tx
					.update(vanStockPlans)
					.set({
						status: "PENDING_LOADING",
						vehicle_id: vehicleId,
						driver_id: driverId,
						verified_by_id: ctx.user.id,
						verified_at: new Date(),
						special_instructions: input.specialInstructions?.trim() || plan.special_instructions,
					})
					.where(eq(vanStockPlans.id, input.planId));

				await tx.insert(vanStockAudits).values({
					plan_id: plan.id,
					actor_id: ctx.user.id,
					actor_name: actorName,
					actor_role: "manager",
					stage: "VERIFICATION",
					action: "MANAGER_VERIFIED_AND_ASSIGNED",
					previous_status: plan.status,
					new_status: "PENDING_LOADING",
					revision: plan.revision,
					notes: "Packing manifest verified and vehicle/driver assigned for physical loading",
					metadata: { vehicleId, driverId },
				});

				return { success: true, status: "PENDING_LOADING", nextStatus: "PENDING_LOADING" };
			});
		}),

	// ── 10. Start Loading (Loader) ───────────────────────────────────────────
	startLoading: roleProcedure(["admin", "manager", "loader"])
		.input(z.object({ planId: z.union([z.number(), z.string()]).transform(Number) }))
		.mutation(async ({ ctx, input }) => {
			const db: any = ctx.db || defaultDb;
			const actorName = ctx.user?.name || "Loader";

			const plan = await db.query.vanStockPlans.findFirst({
				where: eq(vanStockPlans.id, input.planId),
			});
			if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found." });

			if (plan.status !== "PENDING_LOADING" && plan.status !== "LOADING_IN_PROGRESS") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Plan is in '${plan.status}' status, cannot start loading.`,
				});
			}

			if (plan.status === "PENDING_LOADING") {
				await db
					.update(vanStockPlans)
					.set({
						status: "LOADING_IN_PROGRESS",
						assigned_loader_id: ctx.user.id,
					})
					.where(eq(vanStockPlans.id, input.planId));

				await db.insert(vanStockAudits).values({
					plan_id: plan.id,
					actor_id: ctx.user.id,
					actor_name: actorName,
					actor_role: "loader",
					stage: "LOADING",
					action: "LOADING_STARTED",
					previous_status: "PENDING_LOADING",
					new_status: "LOADING_IN_PROGRESS",
					revision: plan.revision,
					notes: "Loader commenced physical vehicle loading and inspection",
				});
			}

			return { success: true };
		}),

	// ── 11. Report Extra Stock Exception (Loader) ───────────────────────────
	reportLoadingException: roleProcedure(["admin", "manager", "loader"])
		.input(
			z.object({
				planId: z.union([z.number(), z.string()]).transform(Number),
				productId: z.union([z.number(), z.string()]).transform(Number).optional(),
				planItemId: z.union([z.number(), z.string()]).transform(Number).optional(),
				type: z.string().optional(),
				quantity: z.number().positive("Quantity must be greater than zero."),
				reason: z.string().min(1, "A descriptive reason is required."),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db: any = ctx.db || defaultDb;
			const actorName = ctx.user?.name || "Loader";

			const plan = await db.query.vanStockPlans.findFirst({
				where: eq(vanStockPlans.id, input.planId),
			});
			if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found." });

			let targetProductId = input.productId;
			if (!targetProductId && input.planItemId) {
				const [item] = await db
					.select({ product_id: vanStockPlanItems.product_id })
					.from(vanStockPlanItems)
					.where(eq(vanStockPlanItems.id, input.planItemId));
				targetProductId = item?.product_id;
			}
			if (!targetProductId) {
				throw new TRPCError({ code: "BAD_REQUEST", message: "Product or item must be specified." });
			}

			const [exception] = await db
				.insert(vanStockExceptions)
				.values({
					plan_id: input.planId,
					product_id: targetProductId,
					stage: "LOADING",
					requested_by_id: ctx.user.id,
					requested_by_name: actorName,
					quantity: input.quantity.toString(),
					reason: input.reason.trim(),
					status: "PENDING",
				})
				.returning();

			await db.insert(vanStockAudits).values({
				plan_id: plan.id,
				actor_id: ctx.user.id,
				actor_name: actorName,
				actor_role: "loader",
				stage: "LOADING",
				action: "EXTRA_STOCK_EXCEPTION_RAISED",
				previous_status: plan.status,
				new_status: plan.status,
				revision: plan.revision,
				notes: `Extra stock reported: ${input.quantity} units. Reason: ${input.reason.trim()}`,
				metadata: { exceptionId: exception.id, productId: targetProductId, quantity: input.quantity },
			});

			return { success: true, exceptionId: exception.id };
		}),

	// ── 12. Resolve Exception (Manager) ──────────────────────────────────────
	resolveException: roleProcedure(["admin", "manager"])
		.input(
			z.object({
				exceptionId: z.union([z.number(), z.string()]).transform(Number),
				action: z.string().optional(),
				decision: z.string().optional(),
				reviewNotes: z.string().optional(),
				resolutionNotes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db: any = ctx.db || defaultDb;
			const actorName = ctx.user?.name || "Manager";
			const rawAction = input.action || input.decision || "APPROVE";
			const action = rawAction.toUpperCase() === "REJECT" ? "REJECT" : "APPROVE";
			const reviewNotes = input.reviewNotes || input.resolutionNotes || "";

			return await db.transaction(async (tx: any) => {
				const exception = await tx.query.vanStockExceptions.findFirst({
					where: eq(vanStockExceptions.id, input.exceptionId),
					with: { plan: true },
				});
				if (!exception) throw new TRPCError({ code: "NOT_FOUND", message: "Exception not found." });

				if (exception.status !== "PENDING") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Exception has already been resolved with status '${exception.status}'.`,
					});
				}

				const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

				await tx
					.update(vanStockExceptions)
					.set({
						status: newStatus,
						reviewed_by_id: ctx.user.id,
						reviewed_by_name: actorName,
						review_notes: reviewNotes.trim() || null,
						reviewed_at: new Date(),
					})
					.where(eq(vanStockExceptions.id, input.exceptionId));

				// If approved, create a new item on the plan manifest and increment revision
				if (action === "APPROVE") {
					await tx.insert(vanStockPlanItems).values({
						plan_id: exception.plan_id,
						product_id: exception.product_id,
						is_additional: true,
						additional_reason: `[Loader Exception Approved]: ${exception.reason}`,
						planned_quantity: "0",
						picked_quantity: exception.quantity,
						packed_quantity: exception.quantity,
						verified_quantity: exception.quantity,
						loaded_quantity: exception.quantity,
						loading_status: "loaded",
					});

					await tx
						.update(vanStockPlans)
						.set({ revision: exception.plan.revision + 1 })
						.where(eq(vanStockPlans.id, exception.plan_id));
				}

				await tx.insert(vanStockAudits).values({
					plan_id: exception.plan_id,
					actor_id: ctx.user.id,
					actor_name: actorName,
					actor_role: "manager",
					stage: "EXCEPTION_RESOLUTION",
					action: `EXCEPTION_${newStatus}`,
					previous_status: exception.plan.status,
					new_status: exception.plan.status,
					revision: action === "APPROVE" ? exception.plan.revision + 1 : exception.plan.revision,
					notes: `Exception #${exception.id} ${newStatus}: ${reviewNotes || exception.reason}`,
				});

				return { success: true };
			});
		}),

	// ── 13. Submit Loading Completion (Loader) ───────────────────────────────
	submitLoading: roleProcedure(["admin", "manager", "loader"])
		.input(
			z.object({
				planId: z.union([z.number(), z.string()]).transform(Number),
				checklist: z
					.record(z.string(), z.any())
					.optional()
					.default({
						packagingChecked: true,
						sealChecked: true,
						vehicleClean: true,
						docsChecked: true,
					}),
				items: z
					.array(
						z.object({
							itemId: z.union([z.number(), z.string()]).transform(Number).optional(),
							planItemId: z.union([z.number(), z.string()]).transform(Number).optional(),
							loadedQuantity: z.number().nonnegative().optional(),
							loadedQty: z.number().nonnegative().optional(),
							loadingStatus: z.string().optional().default("loaded"),
							notes: z.string().optional(),
						}),
					)
					.min(1),
				notes: z.string().optional(),
				loaderNotes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db: any = ctx.db || defaultDb;
			const actorName = ctx.user?.name || "Loader";

			return await db.transaction(async (tx: any) => {
				const plan = await tx.query.vanStockPlans.findFirst({
					where: eq(vanStockPlans.id, input.planId),
					with: { exceptions: true },
				});
				if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found." });

				if (plan.status !== "LOADING_IN_PROGRESS" && plan.status !== "PENDING_LOADING") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Cannot submit loading. Current status is '${plan.status}'.`,
					});
				}

				// Check for blocking unresolved exceptions
				const pendingExceptions = plan.exceptions.filter((e: any) => e.status === "PENDING");
				if (pendingExceptions.length > 0) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Loading cannot be finalized while there are ${pendingExceptions.length} pending extra-stock exception(s). Manager must approve or reject them first.`,
					});
				}

				// Verify checklist items if explicitly specified
				const {
					packagingChecked = true,
					sealChecked = true,
					vehicleClean = true,
					docsChecked = true,
				} = input.checklist || {};
				if (!packagingChecked || !sealChecked || !vehicleClean || !docsChecked) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "All vehicle safety and documentation checks must be completed before submission.",
					});
				}

				// Update item loaded quantities
				for (const itemInput of input.items) {
					const targetItemId = itemInput.itemId ?? itemInput.planItemId ?? 0;
					const loaded = itemInput.loadedQuantity ?? itemInput.loadedQty ?? 0;
					const lStatus = (itemInput.loadingStatus || "loaded") as "loaded" | "damaged" | "missing" | "excess";
					await tx
						.update(vanStockPlanItems)
						.set({
							loaded_quantity: loaded.toString(),
							loading_status: lStatus,
							loading_notes: itemInput.notes?.trim() || null,
						})
						.where(eq(vanStockPlanItems.id, targetItemId));
				}

				// Move to PENDING_FINAL_DISPATCH_APPROVAL
				const finalNotes = input.notes || input.loaderNotes;
				await tx
					.update(vanStockPlans)
					.set({
						status: "PENDING_FINAL_DISPATCH_APPROVAL",
						assigned_loader_id: ctx.user.id,
						loaded_at: new Date(),
						loading_checklist: input.checklist,
						loading_notes: finalNotes?.trim() || null,
					})
					.where(eq(vanStockPlans.id, input.planId));

				await tx.insert(vanStockAudits).values({
					plan_id: plan.id,
					actor_id: ctx.user.id,
					actor_name: actorName,
					actor_role: "loader",
					stage: "LOADING",
					action: "LOADING_COMPLETED",
					previous_status: plan.status,
					new_status: "PENDING_FINAL_DISPATCH_APPROVAL",
					revision: plan.revision,
					notes: finalNotes || "Vehicle physically loaded, seal verified, and submitted for final dispatch approval",
				});

				return { success: true, status: "PENDING_FINAL_DISPATCH_APPROVAL" };
			});
		}),

	// ── 14. Final Dispatch Decision (Manager) ────────────────────────────────
	approveFinalDispatch: roleProcedure(["admin", "manager"])
		.input(
			z.object({
				planId: z.union([z.number(), z.string()]).transform(Number),
				action: z.string().optional(),
				decision: z.string().optional(),
				reason: z.string().optional(),
				rejectionReason: z.string().optional(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db: any = ctx.db || defaultDb;
			const actorName = ctx.user?.name || "Manager";
			const rawAction = input.action || input.decision || "APPROVE";
			const action = rawAction.toUpperCase() === "REJECT" ? "REJECT" : "APPROVE";
			const reason = input.reason || input.rejectionReason || input.notes || "";

			return await db.transaction(async (tx: any) => {
				const plan = await tx.query.vanStockPlans.findFirst({
					where: eq(vanStockPlans.id, input.planId),
					with: {
						items: { with: { product: true } },
						vehicle: true,
						driver: true,
					},
				});
				if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found." });

				// Idempotency guard: if already dispatched, return cleanly
				if (plan.status === "DISPATCHED") {
					return {
						success: true,
						dispatchReference: plan.dispatch_reference,
						status: "DISPATCHED",
					};
				}

				if (plan.status !== "PENDING_FINAL_DISPATCH_APPROVAL") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Cannot dispatch plan in '${plan.status}' status. Requires Loader completion first.`,
					});
				}

				// Rejection Flow
				if (action === "REJECT") {
					if (!reason.trim()) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "A mandatory rejection reason is required.",
						});
					}

					await tx
						.update(vanStockPlans)
						.set({
							status: "DISPATCH_REJECTED",
							rejection_reason: reason.trim(),
							rejection_stage: "FINAL_DISPATCH",
						})
						.where(eq(vanStockPlans.id, input.planId));

					await tx.insert(vanStockAudits).values({
						plan_id: plan.id,
						actor_id: ctx.user.id,
						actor_name: actorName,
						actor_role: "manager",
						stage: "FINAL_DISPATCH",
						action: "DISPATCH_REJECTED",
						previous_status: plan.status,
						new_status: "DISPATCH_REJECTED",
						revision: plan.revision,
						reason: reason.trim(),
						notes: `Dispatch rejected: ${reason.trim()}`,
					});

					return { success: true, status: "DISPATCH_REJECTED" };
				}

				// Approval Flow
				// Generate unique Dispatch Reference: DSP-VAN-YYYYMMDD-XXXX
				const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
				const dispatchRef = `DSP-VAN-${dateStr}-${plan.id}`;

				// Deduct stock from warehouse branch inventory & clear reservations
				for (const item of plan.items) {
					const loadedQty = Number(item.loaded_quantity || 0);
					if (loadedQty > 0) {
						const [inv] = await tx
							.select()
							.from(branchInventory)
							.where(
								and(
									eq(branchInventory.branch_id, plan.branch_id),
									eq(branchInventory.product_id, item.product_id),
								),
							);

						if (inv) {
							const currentInStock = Number(inv.in_stock || 0);
							const currentReserved = Number(inv.reserved_stock || 0);

							const nextInStock = Math.max(0, Number((currentInStock - loadedQty).toFixed(3)));
							const nextReserved = Math.max(0, Number((currentReserved - loadedQty).toFixed(3)));

							await tx
								.update(branchInventory)
								.set({
									in_stock: nextInStock.toString(),
									reserved_stock: nextReserved.toString(),
								})
								.where(eq(branchInventory.id, inv.id));
						}

						// Post traceable stock movement into stockLedger
						const unitCost = Number(item.product.buying_price || 0);
						await tx.insert(stockLedger).values({
							branch_id: plan.branch_id,
							product_id: item.product_id,
							transaction_type: "out",
							quantity: (-loadedQty).toString(),
							unit_cost: unitCost.toFixed(2),
							total_cost: (loadedQty * unitCost).toFixed(2),
							reference_id: plan.id,
							reference_type: "VAN_DISPATCH",
						});
					}
				}

				// Update Vehicle status to 'in_use'
				await tx
					.update(vehicles)
					.set({ status: "in_use" })
					.where(eq(vehicles.id, plan.vehicle_id));

				// Update Plan to DISPATCHED
				await tx
					.update(vanStockPlans)
					.set({
						status: "DISPATCHED",
						dispatched_by_id: ctx.user.id,
						dispatched_at: new Date(),
						dispatch_reference: dispatchRef,
					})
					.where(eq(vanStockPlans.id, input.planId));

				await tx.insert(vanStockAudits).values({
					plan_id: plan.id,
					actor_id: ctx.user.id,
					actor_name: actorName,
					actor_role: "manager",
					stage: "FINAL_DISPATCH",
					action: "DISPATCH_APPROVED",
					previous_status: plan.status,
					new_status: "DISPATCHED",
					revision: plan.revision,
					notes: `Dispatch approved! Vehicle departed with manifest reference ${dispatchRef}`,
					metadata: { dispatchReference: dispatchRef },
				});

				return {
					success: true,
					dispatchReference: dispatchRef,
					status: "DISPATCHED",
				};
			});
		}),

	// ── 15. Driver: Get Assigned Dispatches ──────────────────────────────────
	getMyDispatches: roleProcedure(["admin", "manager", "driver"])
		.query(async ({ ctx }) => {
			const db: any = ctx.db || defaultDb;
			const userId = ctx.user.id;

			// Also match driver by email or staff code
			const staffRecord = await db.query.staff.findFirst({
				where: (s: any, { eq, or }: any) =>
					or(
						eq(s.email, ctx.user.email || ""),
						eq(s.name, ctx.user.name || ""),
					),
			});

			const driverMatches = [userId];
			if (staffRecord) {
				driverMatches.push(String(staffRecord.id));
			}

			const plans = await db.query.vanStockPlans.findMany({
				where: and(
					inArray(vanStockPlans.driver_id, driverMatches),
					sql`${vanStockPlans.status} IN ('DISPATCHED', 'RETURN_IN_PROGRESS', 'PENDING_RETURN_VERIFICATION', 'RETURN_REJECTED', 'RETURN_VERIFIED', 'COMPLETED', 'RECONCILED')`,
				),
				orderBy: [desc(vanStockPlans.dispatched_at), desc(vanStockPlans.id)],
				with: {
					vehicle: true,
					items: {
						with: {
							product: { columns: { id: true, name: true, sku: true, unit: true, price: true } },
						},
					},
				},
			});

			return plans.map((p: any) => ({
				id: p.id,
				planCode: p.plan_code,
				dispatchReference: p.dispatch_reference,
				dispatchDate: p.dispatch_date,
				status: p.status,
				vehicle: {
					name: p.vehicle.name,
					registrationNumber: p.vehicle.registration_number,
				},
				dispatchedAt: p.dispatched_at ? p.dispatched_at.toISOString() : null,
				returnedAt: p.returned_at ? p.returned_at.toISOString() : null,
				items: p.items.map((i: any) => ({
					id: i.id,
					productId: i.product_id,
					productName: i.product.name,
					sku: i.product.sku || `SKU-${i.product_id}`,
					unit: i.product.unit || "pcs",
					loadedQuantity: Number(i.loaded_quantity),
					deliveredQuantity: Number(i.delivered_quantity),
					returnedQuantity: Number(i.returned_quantity),
					damagedReturnQuantity: Number(i.damaged_return_quantity),
					returnReasonCode: i.return_reason_code,
					returnNotes: i.return_notes,
				})),
			}));
		}),

	// ── 16. Driver: Submit Return Stock ──────────────────────────────────────
	submitReturnStock: roleProcedure(["admin", "manager", "driver"])
		.input(
			z.object({
				planId: z.union([z.number(), z.string()]).transform(Number),
				driverNotes: z.string().optional(),
				notes: z.string().optional(),
				items: z
					.array(
						z.object({
							itemId: z.union([z.number(), z.string()]).transform(Number).optional(),
							planItemId: z.union([z.number(), z.string()]).transform(Number).optional(),
							deliveredQuantity: z.number().nonnegative().optional(),
							deliveredQty: z.number().nonnegative().optional(),
							returnedQuantity: z.number().nonnegative().optional(),
							returnedQty: z.number().nonnegative().optional(),
							damagedReturnQuantity: z.number().nonnegative().default(0).optional(),
							reasonCode: z.string().optional(),
							returnReason: z.string().optional(),
							notes: z.string().optional(),
						}),
					)
					.min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db: any = ctx.db || defaultDb;
			const actorName = ctx.user?.name || "Driver";
			const driverNotes = input.driverNotes || input.notes;

			return await db.transaction(async (tx: any) => {
				const plan = await tx.query.vanStockPlans.findFirst({
					where: eq(vanStockPlans.id, input.planId),
				});
				if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found." });

				if (plan.status !== "DISPATCHED" && plan.status !== "RETURN_IN_PROGRESS" && plan.status !== "RETURN_REJECTED") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Cannot record return stock for a plan in '${plan.status}' status.`,
					});
				}

				// Update each item's physical return details
				for (const itemInput of input.items) {
					const targetItemId = itemInput.itemId ?? itemInput.planItemId ?? 0;
					const delivered = itemInput.deliveredQuantity ?? itemInput.deliveredQty ?? 0;
					const returned = itemInput.returnedQuantity ?? itemInput.returnedQty ?? 0;
					const damaged = itemInput.damagedReturnQuantity ?? 0;
					const rReason = itemInput.reasonCode || itemInput.returnReason || null;

					await tx
						.update(vanStockPlanItems)
						.set({
							delivered_quantity: delivered.toString(),
							returned_quantity: returned.toString(),
							damaged_return_quantity: damaged.toString(),
							return_reason_code: rReason,
							return_notes: itemInput.notes?.trim() || null,
						})
						.where(eq(vanStockPlanItems.id, targetItemId));
				}

				// Transition to PENDING_RETURN_VERIFICATION
				await tx
					.update(vanStockPlans)
					.set({
						status: "PENDING_RETURN_VERIFICATION",
						returned_at: new Date(),
						driver_return_notes: driverNotes?.trim() || null,
					})
					.where(eq(vanStockPlans.id, input.planId));

				await tx.insert(vanStockAudits).values({
					plan_id: plan.id,
					actor_id: ctx.user.id,
					actor_name: actorName,
					actor_role: "driver",
					stage: "RETURN",
					action: "RETURN_STOCK_SUBMITTED",
					previous_status: plan.status,
					new_status: "PENDING_RETURN_VERIFICATION",
					revision: plan.revision,
					notes: driverNotes || "Driver submitted physical return stock counts for Manager reconciliation",
				});

				return { success: true, status: "PENDING_RETURN_VERIFICATION" };
			});
		}),

	// ── 17. Manager: Verify and Post Return Stock ────────────────────────────
	verifyReturnStock: roleProcedure(["admin", "manager"])
		.input(
			z.object({
				planId: z.union([z.number(), z.string()]).transform(Number),
				action: z.string().optional(),
				decision: z.string().optional(),
				reason: z.string().optional(),
				rejectionReason: z.string().optional(),
				notes: z.string().optional(),
				verifiedItems: z
					.array(
						z.object({
							itemId: z.union([z.number(), z.string()]).transform(Number).optional(),
							planItemId: z.union([z.number(), z.string()]).transform(Number).optional(),
							verifiedReturnQuantity: z.number().nonnegative().optional(),
							verifiedReturnQty: z.number().nonnegative().optional(),
							notes: z.string().optional(),
						}),
					)
					.optional(),
				items: z
					.array(
						z.object({
							itemId: z.union([z.number(), z.string()]).transform(Number).optional(),
							planItemId: z.union([z.number(), z.string()]).transform(Number).optional(),
							verifiedReturnQuantity: z.number().nonnegative().optional(),
							verifiedReturnQty: z.number().nonnegative().optional(),
							notes: z.string().optional(),
						}),
					)
					.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db: any = ctx.db || defaultDb;
			const actorName = ctx.user?.name || "Manager";
			const rawAction = input.action || input.decision || "APPROVE";
			const action = rawAction.toUpperCase() === "REJECT" ? "REJECT" : "APPROVE";
			const reason = input.reason || input.rejectionReason || input.notes || "";

			return await db.transaction(async (tx: any) => {
				const plan = await tx.query.vanStockPlans.findFirst({
					where: eq(vanStockPlans.id, input.planId),
					with: {
						items: { with: { product: true } },
						vehicle: true,
					},
				});
				if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found." });

				// Idempotency: prevent double return credit
				if (plan.status === "RETURN_VERIFIED" || plan.status === "COMPLETED" || plan.status === "RECONCILED") {
					return { success: true, status: "RECONCILED" };
				}

				if (plan.status !== "PENDING_RETURN_VERIFICATION") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Cannot verify return stock for plan in '${plan.status}' status.`,
					});
				}

				// Rejection Flow
				if (action === "REJECT") {
					if (!reason.trim()) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "A mandatory rejection reason is required for return rejection.",
						});
					}

					await tx
						.update(vanStockPlans)
						.set({
							status: "RETURN_REJECTED",
							rejection_reason: reason.trim(),
							rejection_stage: "RETURN_VERIFICATION",
						})
						.where(eq(vanStockPlans.id, input.planId));

					await tx.insert(vanStockAudits).values({
						plan_id: plan.id,
						actor_id: ctx.user.id,
						actor_name: actorName,
						actor_role: "manager",
						stage: "RETURN_VERIFICATION",
						action: "RETURN_REJECTED",
						previous_status: plan.status,
						new_status: "RETURN_REJECTED",
						revision: plan.revision,
						reason: reason.trim(),
						notes: `Return verification rejected: ${reason.trim()}`,
					});

					return { success: true, status: "RETURN_REJECTED" };
				}

				// Approval Flow:
				// Map verified quantities
				const vList = input.verifiedItems || input.items || [];
				const verifiedQtyMap = new Map(
					vList.map((vi) => [
						vi.itemId ?? vi.planItemId ?? 0,
						vi.verifiedReturnQuantity ?? vi.verifiedReturnQty ?? 0,
					]),
				);

				for (const item of plan.items) {
					const acceptedQty = verifiedQtyMap.has(item.id)
						? Number(verifiedQtyMap.get(item.id))
						: Number(item.returned_quantity || 0);

					await tx
						.update(vanStockPlanItems)
						.set({
							verified_return_quantity: acceptedQty.toString(),
						})
						.where(eq(vanStockPlanItems.id, item.id));

					// Credit back accepted returned stock into warehouse branchInventory
					if (acceptedQty > 0) {
						const [inv] = await tx
							.select()
							.from(branchInventory)
							.where(
								and(
									eq(branchInventory.branch_id, plan.branch_id),
									eq(branchInventory.product_id, item.product_id),
								),
							);

						if (inv) {
							const currentInStock = Number(inv.in_stock || 0);
							const nextInStock = Number((currentInStock + acceptedQty).toFixed(3));
							await tx
								.update(branchInventory)
								.set({ in_stock: nextInStock.toString() })
								.where(eq(branchInventory.id, inv.id));
						}

						// Post traceable stock movement into stockLedger
						const unitCost = Number(item.product.buying_price || 0);
						await tx.insert(stockLedger).values({
							branch_id: plan.branch_id,
							product_id: item.product_id,
							transaction_type: "in",
							quantity: acceptedQty.toString(),
							unit_cost: unitCost.toFixed(2),
							total_cost: (acceptedQty * unitCost).toFixed(2),
							reference_id: plan.id,
							reference_type: "VAN_RETURN",
						});
					}
				}

				// Release vehicle back to 'available'
				await tx
					.update(vehicles)
					.set({ status: "available" })
					.where(eq(vehicles.id, plan.vehicle_id));

				// Finalize Plan Status to RECONCILED / COMPLETED
				await tx
					.update(vanStockPlans)
					.set({
						status: "RECONCILED",
						return_verified_by_id: ctx.user.id,
						return_verified_at: new Date(),
						return_verification_notes: input.notes?.trim() || null,
					})
					.where(eq(vanStockPlans.id, input.planId));

				await tx.insert(vanStockAudits).values({
					plan_id: plan.id,
					actor_id: ctx.user.id,
					actor_name: actorName,
					actor_role: "manager",
					stage: "RETURN_VERIFICATION",
					action: "RETURN_VERIFIED_AND_POSTED",
					previous_status: plan.status,
					new_status: "RECONCILED",
					revision: plan.revision,
					notes: input.notes || "Return verified. Accepted inventory credited back to warehouse stock, vehicle released, workflow closed.",
				});

				return { success: true, status: "RECONCILED" };
			});
		}),
});
