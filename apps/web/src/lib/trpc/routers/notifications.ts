import {
	notificationPreferences,
	notificationQueue,
	notifications,
	notificationTemplates,
} from "@evaluna/db/schema";
import { and, count, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
	dispatchNotification,
	processNotificationQueue,
} from "@/lib/notification-service";
import { normalizeRole } from "@/lib/permissions";
import { protectedProcedure, router } from "../init";
import { resolveStaffId } from "../util/audit";

// ── Input Schemas ──────────────────────────────────────────────────────────────
const notificationTypeEnum = z.string();
const channelEnum = z.enum(["in_app", "email", "sms", "whatsapp", "push"]);

/**
 * Build SQL conditions enforcing strict role-based notification scoping.
 * Ensures users only receive notifications corresponding to their role and workflow.
 */
export function getRoleNotificationConditions(
	rawRole: string | undefined | null,
	staffId: number | null,
	branchId?: number,
) {
	const normalized = normalizeRole(rawRole || "customer");
	const isAdmin = normalized === "admin" || normalized === "super_admin";

	if (isAdmin) {
		return branchId ? eq(notifications.branch_id, branchId) : undefined;
	}

	const roleConditions: any[] = [];

	if (staffId) {
		roleConditions.push(eq(notifications.user_id, staffId));
	}

	let unassignedRoleFilter: any = null;

	switch (normalized) {
		case "sales_person":
			unassignedRoleFilter = and(
				isNull(notifications.user_id),
				or(
					inArray(notifications.type, [
						"sales",
						"sale",
						"order",
						"customer",
						"pos",
						"sales_alert",
						"callback",
						"shortage",
					]),
					inArray(notifications.reference_type, [
						"order",
						"orders",
						"customer",
						"customers",
						"sales_returns",
					]),
				),
			);
			break;

		case "picker":
			unassignedRoleFilter = and(
				isNull(notifications.user_id),
				or(
					inArray(notifications.type, [
						"picking",
						"picker",
						"pick_list",
						"pick_task",
						"warehouse_picking",
					]),
					inArray(notifications.reference_type, [
						"pick_lists",
						"pick_list",
						"picking",
					]),
				),
			);
			break;

		case "packer":
			unassignedRoleFilter = and(
				isNull(notifications.user_id),
				or(
					inArray(notifications.type, [
						"packing",
						"packer",
						"package",
						"pack_task",
						"warehouse_packing",
					]),
					inArray(notifications.reference_type, [
						"packages",
						"package",
						"packing",
					]),
				),
			);
			break;

		case "driver":
			unassignedRoleFilter = and(
				isNull(notifications.user_id),
				or(
					inArray(notifications.type, [
						"delivery",
						"driver",
						"dispatch",
						"trip",
						"route",
						"trip_stop",
					]),
					inArray(notifications.reference_type, [
						"trips",
						"delivery_trips",
						"route",
						"routes",
					]),
				),
			);
			break;

		case "finance":
			unassignedRoleFilter = and(
				isNull(notifications.user_id),
				or(
					inArray(notifications.type, [
						"finance",
						"payment",
						"payment_due",
						"accounting",
						"invoice",
						"refund",
						"cash",
						"cash_collection",
					]),
					inArray(notifications.reference_type, [
						"transactions",
						"payments",
						"invoices",
						"journal_entries",
						"sales_returns",
					]),
				),
			);
			break;

		case "manager":
		case "warehouse_supervisor":
			unassignedRoleFilter = and(
				isNull(notifications.user_id),
				or(
					inArray(notifications.type, [
						"approval",
						"manager",
						"escalation",
						"attendance",
						"low_stock",
						"expiry",
						"info",
						"warning",
						"error",
						"picking",
						"packing",
						"delivery",
					]),
					inArray(notifications.reference_type, [
						"approvals",
						"staff",
						"leaves",
						"payroll",
						"trips",
						"packages",
						"pick_lists",
					]),
				),
			);
			break;

		case "auditor":
			unassignedRoleFilter = and(
				isNull(notifications.user_id),
				or(
					inArray(notifications.type, [
						"audit",
						"auditor",
						"audit_finding",
						"price_change",
						"inspection",
						"upc",
						"warning",
					]),
					inArray(notifications.reference_type, [
						"audit_findings",
						"upc_tasks",
						"receiving_inspections",
						"placement_verifications",
					]),
				),
			);
			break;

		case "hr":
			unassignedRoleFilter = and(
				isNull(notifications.user_id),
				or(
					inArray(notifications.type, [
						"hr",
						"attendance",
						"leave",
						"payroll",
						"birthday",
					]),
					inArray(notifications.reference_type, [
						"leaves",
						"payroll",
						"staff",
					]),
				),
			);
			break;

		case "loader":
			unassignedRoleFilter = and(
				isNull(notifications.user_id),
				or(
					inArray(notifications.type, ["loader", "loading", "dispatch"]),
					inArray(notifications.reference_type, ["trips", "delivery_trips"]),
				),
			);
			break;

		case "procurement":
			unassignedRoleFilter = and(
				isNull(notifications.user_id),
				or(
					inArray(notifications.type, [
						"procurement",
						"purchase",
						"supplier",
						"grn",
						"low_stock",
					]),
					inArray(notifications.reference_type, ["purchases", "suppliers"]),
				),
			);
			break;

		case "customer":
			unassignedRoleFilter = and(
				isNull(notifications.user_id),
				inArray(notifications.type, ["sale", "order", "promotion", "loyalty"]),
			);
			break;

		default:
			unassignedRoleFilter = and(
				isNull(notifications.user_id),
				eq(notifications.type, "info"),
			);
			break;
	}

	if (unassignedRoleFilter) {
		roleConditions.push(unassignedRoleFilter);
	}

	const baseRoleFilter = roleConditions.length > 0 ? or(...roleConditions) : sql`1 = 0`;

	if (branchId) {
		return and(
			baseRoleFilter,
			or(eq(notifications.branch_id, branchId), isNull(notifications.branch_id)),
		);
	}

	return baseRoleFilter;
}

// ── Router ─────────────────────────────────────────────────────────────────────
export const notificationsRouter = router({
	// ── List / History ──────────────────────────────────────────────────────────
	list: protectedProcedure
		.input(
			z.object({
				branch_id: z.number().optional(),
				is_read: z.boolean().optional(),
				type: notificationTypeEnum.optional(),
				channel: channelEnum.optional(),
				limit: z.number().default(50),
			}),
		)
		.query(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(db, ctx.user.email);
			const roleFilter = getRoleNotificationConditions(
				ctx.user.role,
				staffId,
				input.branch_id,
			);

			const conditions: any[] = [];
			if (roleFilter) conditions.push(roleFilter);
			if (input.is_read !== undefined)
				conditions.push(eq(notifications.is_read, input.is_read));
			if (input.type) conditions.push(eq(notifications.type, input.type));
			if (input.channel)
				conditions.push(eq(notifications.channel, input.channel));

			return await db
				.select()
				.from(notifications)
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(desc(notifications.created_at))
				.limit(input.limit);
		}),

	// ── Unread Count ────────────────────────────────────────────────────────────
	unreadCount: protectedProcedure
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(db, ctx.user.email);
			const roleFilter = getRoleNotificationConditions(
				ctx.user.role,
				staffId,
				input.branch_id,
			);

			const conditions: any[] = [eq(notifications.is_read, false)];
			if (roleFilter) conditions.push(roleFilter);

			const [result] = await db
				.select({ count: count() })
				.from(notifications)
				.where(and(...conditions));
			return { count: result?.count ?? 0 };
		}),

	// ── Mark as Read ────────────────────────────────────────────────────────────
	markAsRead: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(db, ctx.user.email);
			const roleFilter = getRoleNotificationConditions(ctx.user.role, staffId);

			const conditions: any[] = [eq(notifications.id, input.id)];
			if (roleFilter) conditions.push(roleFilter);

			return await db
				.update(notifications)
				.set({ is_read: true, read_by: ctx.user.id, read_at: new Date() })
				.where(and(...conditions))
				.returning();
		}),

	markAllAsRead: protectedProcedure
		.input(z.object({ branch_id: z.number().optional() }))
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(db, ctx.user.email);
			const roleFilter = getRoleNotificationConditions(
				ctx.user.role,
				staffId,
				input.branch_id,
			);

			const conditions: any[] = [eq(notifications.is_read, false)];
			if (roleFilter) conditions.push(roleFilter);

			return await db
				.update(notifications)
				.set({ is_read: true, read_by: ctx.user.id, read_at: new Date() })
				.where(and(...conditions))
				.returning();
		}),

	// ── Send Manual Notification ────────────────────────────────────────────────
	send: protectedProcedure
		.input(
			z.object({
				type: notificationTypeEnum,
				title: z.string().min(1),
				message: z.string().min(1),
				priority: z
					.enum(["low", "normal", "high", "critical"])
					.default("normal"),
				userId: z.number().optional(),
				branchId: z.number().optional(),
				channels: z.array(channelEnum).default(["in_app"]),
				scheduledAt: z.string().optional(), // ISO string
				metadata: z.record(z.string(), z.unknown()).optional(),
			}),
		)
		.mutation(async ({ input }) => {
			await dispatchNotification({
				type: input.type,
				title: input.title,
				message: input.message,
				priority: input.priority,
				userId: input.userId,
				branchId: input.branchId,
				channels: input.channels,
				scheduledAt: input.scheduledAt
					? new Date(input.scheduledAt)
					: undefined,
				metadata: input.metadata,
			});
			return { success: true };
		}),

	// ── Templates ───────────────────────────────────────────────────────────────
	listTemplates: protectedProcedure.query(async () => {
		return await db
			.select()
			.from(notificationTemplates)
			.orderBy(notificationTemplates.name);
	}),

	createTemplate: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				type: notificationTypeEnum,
				channel: channelEnum,
				subject: z.string().optional(),
				body: z.string().min(1),
			}),
		)
		.mutation(async ({ input }) => {
			return await db.insert(notificationTemplates).values(input).returning();
		}),

	updateTemplate: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				subject: z.string().optional(),
				body: z.string().min(1),
				is_active: z.boolean().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const { id, ...rest } = input;
			return await db
				.update(notificationTemplates)
				.set(rest)
				.where(eq(notificationTemplates.id, id))
				.returning();
		}),

	// ── Preferences ─────────────────────────────────────────────────────────────
	getPreferences: protectedProcedure
		.input(z.object({ userId: z.number() }))
		.query(async ({ input }) => {
			return await db
				.select()
				.from(notificationPreferences)
				.where(eq(notificationPreferences.user_id, input.userId));
		}),

	savePreference: protectedProcedure
		.input(
			z.object({
				userId: z.number(),
				type: notificationTypeEnum,
				email_enabled: z.boolean().default(true),
				sms_enabled: z.boolean().default(false),
				whatsapp_enabled: z.boolean().default(false),
				push_enabled: z.boolean().default(true),
				in_app_enabled: z.boolean().default(true),
			}),
		)
		.mutation(async ({ input }) => {
			const existing = await db
				.select()
				.from(notificationPreferences)
				.where(
					and(
						eq(notificationPreferences.user_id, input.userId),
						eq(notificationPreferences.type, input.type),
					),
				)
				.limit(1);

			if (existing.length > 0) {
				return await db
					.update(notificationPreferences)
					.set({
						email_enabled: input.email_enabled,
						sms_enabled: input.sms_enabled,
						whatsapp_enabled: input.whatsapp_enabled,
						push_enabled: input.push_enabled,
						in_app_enabled: input.in_app_enabled,
					})
					.where(eq(notificationPreferences.id, existing[0].id))
					.returning();
			}
			return await db
				.insert(notificationPreferences)
				.values({
					user_id: input.userId,
					type: input.type,
					email_enabled: input.email_enabled,
					sms_enabled: input.sms_enabled,
					whatsapp_enabled: input.whatsapp_enabled,
					push_enabled: input.push_enabled,
					in_app_enabled: input.in_app_enabled,
				})
				.returning();
		}),

	// ── Queue Management ─────────────────────────────────────────────────────────
	listQueue: protectedProcedure
		.input(
			z.object({
				status: z.string().optional(),
				limit: z.number().default(50),
			}),
		)
		.query(async ({ input }) => {
			const rows = await db
				.select()
				.from(notificationQueue)
				.where(
					input.status ? eq(notificationQueue.status, input.status) : undefined,
				)
				.orderBy(desc(notificationQueue.created_at))
				.limit(input.limit);
			return rows;
		}),

	processQueue: protectedProcedure.mutation(async () => {
		await processNotificationQueue();
		return { success: true };
	}),
});
