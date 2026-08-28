import {
	employees,
	salaryChangeRequest,
	salaryStructure,
	staff,
	statutoryDeductionConfig,
} from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import {
	and,
	asc,
	desc,
	eq,
	gt,
	gte,
	inArray,
	isNull,
	lt,
	lte,
	sql,
} from "drizzle-orm";
import { z } from "zod";
import { roleProcedure, router } from "../init";

export const salaryRouter = router({
	// Salary Structure Management
	getSalaryStructure: roleProcedure(["admin", "hr", "manager"])
		.input(
			z.object({
				employeeId: z.number().optional(),
				branchId: z.number().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			let query = db.select().from(salaryStructure);

			if (input.employeeId) {
				query = query.where(eq(salaryStructure.employeeId, input.employeeId));
			}
			if (input.branchId) {
				// Join with staff to get branch
				query = query
					.innerJoin(staff, eq(salaryStructure.employeeId, staff.id))
					.where(eq(staff.branch_id, input.branchId));
			}

			const results = await query.orderBy(desc(salaryStructure.effectiveFrom));

			// If joined with staff, we need to adjust the result shape
			if (input.branchId) {
				return results.map((row) => row.salaryStructure);
			}
			return results;
		}),

	createSalaryStructure: roleProcedure(["admin", "hr"])
		.input(
			z.object({
				employeeId: z.number(),
				effectiveFrom: z.date(),
				effectiveTo: z.date().optional().nullable(),
				componentType: z.enum(["earning", "deduction", "reimbursement"]),
				category: z.enum([
					"basic",
					"hra",
					"conveyance",
					"special_allowance",
					"bonus",
					"incentive",
					"pf",
					"esi",
					"tds",
					"professional_tax",
					"loan_recovery",
					"salary_advance",
					"medical",
					"travel",
					"food",
					"other",
				]),
				componentName: z.string().max(100),
				amount: z.number().positive(),
				isActive: z.boolean().default(true),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;

			// Validate employee exists
			const [employee] = await db
				.select()
				.from(staff)
				.where(eq(staff.id, input.employeeId));
			if (!employee) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Employee not found",
				});
			}

			// Check for overlapping effective dates for same employee and component
			const [overlap] = await db
				.select({ id: salaryStructure.id })
				.from(salaryStructure)
				.where(
					and(
						eq(salaryStructure.employeeId, input.employeeId),
						eq(salaryStructure.componentType, input.componentType),
						eq(salaryStructure.category, input.category),
						eq(salaryStructure.componentName, input.componentName),
						// Check date range overlap
						gt(
							salaryStructure.effectiveFrom,
							input.effectiveTo ?? sql`'9999-12-31'`,
						),
						lt(
							sql`COALESCE(${salaryStructure.effectiveTo}, '9999-12-31')`,
							input.effectiveFrom,
						),
					),
				)
				.limit(1);

			if (overlap) {
				throw new TRPCError({
					code: "CONFLICT",
					message:
						"Salary component with overlapping effective dates already exists",
				});
			}

			const [result] = await db
				.insert(salaryStructure)
				.values({
					employeeId: input.employeeId,
					effectiveFrom: input.effectiveFrom,
					effectiveTo: input.effectiveTo ?? null,
					componentType: input.componentType,
					category: input.category,
					componentName: input.componentName,
					amount: input.amount,
					isActive: input.isActive,
				})
				.returning();

			return result;
		}),

	updateSalaryStructure: roleProcedure(["admin", "hr"])
		.input(
			z.object({
				id: z.number(),
				effectiveFrom: z.date().optional(),
				effectiveTo: z.date().optional().nullable(),
				componentType: z
					.enum(["earning", "deduction", "reimbursement"])
					.optional(),
				category: z
					.enum([
						"basic",
						"hra",
						"conveyance",
						"special_allowance",
						"bonus",
						"incentive",
						"pf",
						"esi",
						"tds",
						"professional_tax",
						"loan_recovery",
						"salary_advance",
						"medical",
						"travel",
						"food",
						"other",
					])
					.optional(),
				componentName: z.string().max(100).optional(),
				amount: z.number().positive().optional(),
				isActive: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;

			const [existing] = await db
				.select()
				.from(salaryStructure)
				.where(eq(salaryStructure.id, input.id))
				.limit(1);

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Salary structure not found",
				});
			}

			// If changing dates, check for overlaps
			const newEffectiveFrom = input.effectiveFrom ?? existing.effectiveFrom;
			const newEffectiveTo = input.effectiveTo ?? existing.effectiveTo;

			if (
				input.effectiveFrom !== undefined ||
				input.effectiveTo !== undefined ||
				input.componentType !== undefined ||
				input.category !== undefined ||
				input.componentName !== undefined
			) {
				const [overlap] = await db
					.select({ id: salaryStructure.id })
					.from(salaryStructure)
					.where(
						and(
							eq(salaryStructure.employeeId, existing.employeeId),
							eq(salaryStructure.id, input.id).not(),
							eq(
								salaryStructure.componentType,
								input.componentType ?? existing.componentType,
							),
							eq(salaryStructure.category, input.category ?? existing.category),
							eq(
								salaryStructure.componentName,
								input.componentName ?? existing.componentName,
							),
							gt(
								salaryStructure.effectiveFrom,
								sql`COALESCE(${newEffectiveTo}, '9999-12-31')`,
							),
							lt(
								sql`COALESCE(${salaryStructure.effectiveTo}, '9999-12-31')`,
								newEffectiveFrom,
							),
						),
					)
					.limit(1);

				if (overlap) {
					throw new TRPCError({
						code: "CONFLICT",
						message:
							"Updated salary component would overlap with another effective date range",
					});
				}
			}

			const [result] = await db
				.update(salaryStructure)
				.set({
					effectiveFrom: input.effectiveFrom,
					effectiveTo: input.effectiveTo ?? null,
					componentType: input.componentType,
					category: input.category,
					componentName: input.componentName,
					amount: input.amount,
					isActive: input.isActive,
					updatedAt: new Date(),
				})
				.where(eq(salaryStructure.id, input.id))
				.returning();

			return result;
		}),

	deleteSalaryStructure: roleProcedure(["admin", "hr"])
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const [existing] = await db
				.select()
				.from(salaryStructure)
				.where(eq(salaryStructure.id, input.id))
				.limit(1);

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Salary structure not found",
				});
			}

			await db.delete(salaryStructure).where(eq(salaryStructure.id, input.id));
			return { success: true };
		}),

	// Salary Change Requests
	requestSalaryChange: roleProcedure(["hr", "manager", "employee"])
		.input(
			z.object({
				employeeId: z.number(),
				effectiveFrom: z.date(),
				changes: z.array(
					z.object({
						componentId: z.number(),
						newAmount: z.number().positive(),
						reason: z.string().max(255),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;

			// Validate employee exists
			const [employee] = await db
				.select()
				.from(staff)
				.where(eq(staff.id, input.employeeId));
			if (!employee) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Employee not found",
				});
			}

			// Validate each componentId exists and belongs to employee
			const componentIds = input.changes.map((c) => c.componentId);
			const components = await db
				.select({
					id: salaryStructure.id,
					employeeId: salaryStructure.employeeId,
				})
				.from(salaryStructure)
				.where(
					and(
						inArray(salaryStructure.id, componentIds),
						eq(salaryStructure.employeeId, input.employeeId),
					),
				);

			if (components.length !== componentIds.length) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"One or more salary components do not exist or do not belong to the employee",
				});
			}

			// Determine requestedBy: if user is employee, then self-request; else HR/manager
			const requestedBy = ctx.user.id; // assuming ctx.user.id is staff userUid? Actually we need to map user to staff.
			// For simplicity, we'll use ctx.user.id as staff id (need to adjust later)
			// We'll get staff id from userUid
			const [staffRecord] = await db
				.select({ id: staff.id })
				.from(staff)
				.where(eq(staff.userUid, ctx.user.id))
				.limit(1);

			if (!staffRecord) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Staff record not found for user",
				});
			}

			const [result] = await db
				.insert(salaryChangeRequest)
				.values({
					employeeId: input.employeeId,
					requestedBy: staffRecord.id,
					effectiveFrom: input.effectiveFrom,
					changes: input.changes,
					status: "pending",
				})
				.returning();

			return result;
		}),

	getSalaryChangeRequests: roleProcedure(["admin", "hr", "manager"])
		.input(
			z.object({
				employeeId: z.number().optional(),
				status: z.enum(["pending", "approved", "rejected"]).optional(),
				branchId: z.number().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			let query = db
				.select({
					id: salaryChangeRequest.id,
					employeeId: salaryChangeRequest.employeeId,
					employeeName: staff.name,
					requestedByName: staffRequested.name,
					approvedByName: staffApproved?.name,
					effectiveFrom: salaryChangeRequest.effectiveFrom,
					changes: salaryChangeRequest.changes,
					status: salaryChangeRequest.status,
					createdAt: salaryChangeRequest.createdAt,
				})
				.from(salaryChangeRequest)
				.innerJoin(staff, eq(salaryChangeRequest.employeeId, staff.id))
				.innerJoin(
					staff as staffRequested,
					eq(salaryChangeRequest.requestedBy, staffRequested.id),
				)
				.leftJoin(
					staff as staffApproved,
					eq(salaryChangeRequest.approvedBy, staffApproved.id),
				)
				.leftJoin(
					staff as staffEmpBranch,
					eq(salaryChangeRequest.employeeId, staffEmpBranch.id),
				);

			if (input.employeeId) {
				query = query.where(
					eq(salaryChangeRequest.employeeId, input.employeeId),
				);
			}
			if (input.status) {
				query = query.where(eq(salaryChangeRequest.status, input.status));
			}
			if (input.branchId) {
				query = query.where(eq(staffEmpBranch.branch_id, input.branchId));
			}

			const results = await query.orderBy(desc(salaryChangeRequest.createdAt));
			return results;
		}),

	approveSalaryChange: roleProcedure(["admin", "hr"])
		.input(
			z.object({
				id: z.number(),
				approvedBy: z.number().optional(), // optional, defaults to current user
				comments: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;

			const [request] = await db
				.select()
				.from(salaryChangeRequest)
				.where(eq(salaryChangeRequest.id, input.id))
				.limit(1);

			if (!request) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Salary change request not found",
				});
			}

			if (request.status !== "pending") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Cannot approve request with status '${request.status}'`,
				});
			}

			const approverId = input.approvedBy ?? ctx.user.id; // need to map to staff id
			// For simplicity, assume ctx.user.id is staff id; we'll get staff from userUid
			const [staffRecord] = await db
				.select({ id: staff.id })
				.from(staff)
				.where(eq(staff.userUid, ctx.user.id))
				.limit(1);

			const finalApproverId = staffRecord?.id ?? approverId;

			// Apply changes: update salaryStructure amounts
			const updates = request.changes.map((change) =>
				db
					.update(salaryStructure)
					.set({ amount: change.newAmount, updatedAt: new Date() })
					.where(eq(salaryStructure.id, change.componentId)),
			);

			await db.transaction(async (tx) => {
				// Update salary structures
				for (const update of updates) {
					await tx
						.update(salaryStructure)
						.set({ amount: change.newAmount, updatedAt: new Date() })
						.where(eq(salaryStructure.id, change.componentId));
				}

				// Update request as approved
				await tx
					.update(salaryChangeRequest)
					.set({
						status: "approved",
						approvedBy: finalApproverId,
						approvedAt: new Date(),
						comments: input.comments,
						updatedAt: new Date(),
					})
					.where(eq(salaryChangeRequest.id, input.id));
			});

			return { success: true };
		}),

	rejectSalaryChange: roleProcedure(["admin", "hr"])
		.input(
			z.object({
				id: z.number(),
				comments: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;

			const [request] = await db
				.select()
				.from(salaryChangeRequest)
				.where(eq(salaryChangeRequest.id, input.id))
				.limit(1);

			if (!request) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Salary change request not found",
				});
			}

			if (request.status !== "pending") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Cannot reject request with status '${request.status}'`,
				});
			}

			await db
				.update(salaryChangeRequest)
				.set({
					status: "rejected",
					comments: input.comments,
					updatedAt: new Date(),
				})
				.where(eq(salaryChangeRequest.id, input.id));

			return { success: true };
		}),

	// Statutory Deduction Configuration
	getStatutoryDeductionConfig: roleProcedure(["admin", "hr", "finance"])
		.input(
			z.object({
				branchId: z.number().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			let query = db.select().from(statutoryDeductionConfig);

			if (input.branchId) {
				query = query.where(
					eq(statutoryDeductionConfig.branchId, input.branchId),
				);
			}

			const results = await query.orderBy(
				desc(statutoryDeductionConfig.effectiveFrom),
			);
			return results;
		}),

	createStatutoryDeductionConfig: roleProcedure(["admin", "hr", "finance"])
		.input(
			z.object({
				branchId: z.number(),
				effectiveFrom: z.date(),
				effectiveTo: z.date().optional().nullable(),
				pfRate: z.number().min(0).max(1).default(0.12),
				esiRate: z.number().min(0).max(1).default(0.0075),
				professionalTaxSlabs: z.array(
					z.object({
						from: z.number(),
						to: z.number().nullable(),
						amount: z.number(),
					}),
				),
				tdsConfig: z.object({
					applicable: z.boolean(),
					threshold: z.number().optional(),
					slabs: z
						.array(
							z.object({
								from: z.number(),
								to: z.number().nullable(),
								rate: z.number(),
							}),
						)
						.optional(),
				}),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;

			// Validate branch exists
			const [branch] = await db
				.select()
				.from(branches)
				.where(eq(branches.id, input.branchId))
				.limit(1);
			if (!branch) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Branch not found" });
			}

			// Check for overlapping effective dates for same branch
			const [overlap] = await db
				.select({ id: statutoryDeductionConfig.id })
				.from(statutoryDeductionConfig)
				.where(
					and(
						eq(statutoryDeductionConfig.branchId, input.branchId),
						gt(
							statutoryDeductionConfig.effectiveFrom,
							input.effectiveTo ?? sql`'9999-12-31'`,
						),
						lt(
							sql`COALESCE(${statutoryDeductionConfig.effectiveTo}, '9999-12-31')`,
							input.effectiveFrom,
						),
					),
				)
				.limit(1);

			if (overlap) {
				throw new TRPCError({
					code: "CONFLICT",
					message:
						"Statutory config with overlapping effective dates already exists for this branch",
				});
			}

			const [result] = await db
				.insert(statutoryDeductionConfig)
				.values({
					branchId: input.branchId,
					effectiveFrom: input.effectiveFrom,
					effectiveTo: input.effectiveTo ?? null,
					pfRate: input.pfRate,
					esiRate: input.esiRate,
					professionalTaxSlabs: input.professionalTaxSlabs,
					tdsConfig: input.tdsConfig,
				})
				.returning();

			return result;
		}),

	updateStatutoryDeductionConfig: roleProcedure(["admin", "hr", "finance"])
		.input(
			z.object({
				id: z.number(),
				effectiveFrom: z.date().optional(),
				effectiveTo: z.date().optional().nullable(),
				pfRate: z.number().min(0).max(1).optional(),
				esiRate: z.number().min(0).max(1).optional(),
				professionalTaxSlabs: z
					.array(
						z.object({
							from: z.number(),
							to: z.number().nullable(),
							amount: z.number(),
						}),
					)
					.optional(),
				tdsConfig: z
					.object({
						applicable: z.boolean().optional(),
						threshold: z.number().optional(),
						slabs: z
							.array(
								z.object({
									from: z.number(),
									to: z.number().nullable(),
									rate: z.number(),
								}),
							)
							.optional(),
					})
					.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;

			const [existing] = await db
				.select()
				.from(statutoryDeductionConfig)
				.where(eq(statutoryDeductionConfig.id, input.id))
				.limit(1);

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Statutory deduction config not found",
				});
			}

			const newEffectiveFrom = input.effectiveFrom ?? existing.effectiveFrom;
			const newEffectiveTo = input.effectiveTo ?? existing.effectiveTo;

			// Check for overlap if dates changed
			if (
				input.effectiveFrom !== undefined ||
				input.effectiveTo !== undefined
			) {
				const [overlap] = await db
					.select({ id: statutoryDeductionConfig.id })
					.from(statutoryDeductionConfig)
					.where(
						and(
							eq(statutoryDeductionConfig.branchId, existing.branchId),
							eq(statutoryDeductionConfig.id, input.id).not(),
							gt(
								statutoryDeductionConfig.effectiveFrom,
								sql`COALESCE(${newEffectiveTo}, '9999-12-31')`,
							),
							lt(
								sql`COALESCE(${statutoryDeductionConfig.effectiveTo}, '9999-12-31')`,
								newEffectiveFrom,
							),
						),
					)
					.limit(1);

				if (overlap) {
					throw new TRPCError({
						code: "CONFLICT",
						message:
							"Updated statutory config would overlap with another effective date range for the same branch",
					});
				}
			}

			const [result] = await db
				.update(statutoryDeductionConfig)
				.set({
					effectiveFrom: input.effectiveFrom,
					effectiveTo: input.effectiveTo ?? null,
					pfRate: input.pfRate,
					esiRate: input.esiRate,
					professionalTaxSlabs: input.professionalTaxSlabs,
					tdsConfig: input.tdsConfig,
					updatedAt: new Date(),
				})
				.where(eq(statutoryDeductionConfig.id, input.id))
				.returning();

			return result;
		}),

	deleteStatutoryDeductionConfig: roleProcedure(["admin", "hr", "finance"])
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const [existing] = await db
				.select()
				.from(statutoryDeductionConfig)
				.where(eq(statutoryDeductionConfig.id, input.id))
				.limit(1);

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Statutory deduction config not found",
				});
			}

			await db
				.delete(statutoryDeductionConfig)
				.where(eq(statutoryDeductionConfig.id, input.id));
			return { success: true };
		}),
});
