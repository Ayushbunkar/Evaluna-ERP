import { deliveryTrips } from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { router } from "../init";
import { permissionProcedure, roleProcedure } from "../init";
import { resolveStaffId } from "../util/audit";
import { createFinding } from "./audit-findings";

/**
 * Route audit: the Manager owns route planning. The auditor only verifies
 * EXECUTION (planned vs actual stops / cash) and flags deviations as findings —
 * it never edits routes or trips.
 */
export const routeAuditRouter = router({
	// ── Read: trips with planned-vs-actual deviation computed ─────────────────
	listTrips: permissionProcedure("route_audit", "read")
		.input(z.object({ status: z.string().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const rows = await ctx.db
				.select()
				.from(deliveryTrips)
				.where(input?.status ? eq(deliveryTrips.status, input.status) : undefined)
				.orderBy(desc(deliveryTrips.created_at));
			return rows.map((t: any) => {
				const expectedStops = t.expected_stops ?? 0;
				const completedStops = t.completed_stops ?? 0;
				const expectedCash = Number(t.expected_cash_collection ?? 0);
				const actualCash = Number(t.actual_cash_collection ?? 0);
				return {
					...t,
					stops_deviation: completedStops - expectedStops,
					cash_deviation: actualCash - expectedCash,
					has_deviation:
						(t.status === "completed" && completedStops !== expectedStops) ||
						Math.abs(actualCash - expectedCash) > 0.001,
				};
			});
		}),

	// ── Write: flag a route deviation → raise a route finding ─────────────────
	flagDeviation: permissionProcedure("route_audit", "write")
		.input(
			z.object({
				tripId: z.number(),
				severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
				description: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(ctx.db, ctx.user.email);
			return await ctx.db.transaction(async (tx: any) => {
				const [trip] = await tx
					.select()
					.from(deliveryTrips)
					.where(eq(deliveryTrips.id, input.tripId))
					.limit(1);
				if (!trip)
					throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found." });
				const { id } = await createFinding(tx, staffId, {
					findingType: "route",
					severity: input.severity,
					title: `Route deviation on trip #${input.tripId}`,
					description: input.description,
					referenceType: "delivery_trips",
					referenceId: input.tripId,
				});
				return { findingId: id };
			});
		}),

	// ── Dashboard: route management overview ────────────────────────
	getDashboardStats: roleProcedure(["admin", "manager", "delivery_manager"])
		.query(async ({ ctx }) => {
			const rows = await ctx.db
				.select()
				.from(deliveryTrips)
				.orderBy(desc(deliveryTrips.created_at));

			const tripsWithData = rows.map((t: any) => {
				const expectedStops = t.expected_stops ?? 0;
				const completedStops = t.completed_stops ?? 0;
				const expectedCash = Number(t.expected_cash_collection ?? 0);
				const actualCash = Number(t.actual_cash_collection ?? 0);
				return {
					...t,
					stops_deviation: completedStops - expectedStops,
					cash_deviation: actualCash - expectedCash,
					has_deviation:
						(t.status === "completed" && completedStops !== expectedStops) ||
						Math.abs(actualCash - expectedCash) > 0.001,
				};
			});

			const totalTrips = tripsWithData.length;
			const activeTrips = tripsWithData.filter(t => t.status === "active").length;
			const completedTrips = tripsWithData.filter(t => t.status === "completed").length;
			const pendingTrips = tripsWithData.filter(t => t.status === "pending").length;
			const tripsWithDeviation = tripsWithData.filter(t => t.has_deviation).length;

			return {
				totalTrips,
				activeTrips,
				completedTrips,
				pendingTrips,
				tripsWithDeviation,
				recentTrips: tripsWithData.slice(0, 10), // Return 10 most recent for dashboard
			};
		}),
});