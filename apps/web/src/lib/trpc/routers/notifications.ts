import { z } from "zod";
import { router, protectedProcedure } from "../init";
import { db } from "@/lib/db";
import {
  notifications,
  notificationTemplates,
  notificationPreferences,
  notificationQueue,
} from "@evaluna/db/schema";
import { eq, and, desc, lt, lte } from "drizzle-orm";
import { dispatchNotification, processNotificationQueue } from "@/lib/notification-service";

// ── Input Schemas ──────────────────────────────────────────────────────────────
const notificationTypeEnum = z.enum([
  "low_stock", "expiry", "damage", "purchase", "sale",
  "payment_due", "birthday", "loyalty", "campaign", "info", "warning", "error",
]);

const channelEnum = z.enum(["in_app", "email", "sms", "whatsapp", "push"]);

// ── Router ─────────────────────────────────────────────────────────────────────
export const notificationsRouter = router({

  // ── List / History ──────────────────────────────────────────────────────────
  list: protectedProcedure
    .input(z.object({
      branch_id: z.number().optional(),
      is_read: z.boolean().optional(),
      type: notificationTypeEnum.optional(),
      channel: channelEnum.optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const conditions: ReturnType<typeof eq>[] = [];
      if (input.branch_id) conditions.push(eq(notifications.branch_id, input.branch_id));
      if (input.is_read !== undefined) conditions.push(eq(notifications.is_read, input.is_read));
      if (input.type) conditions.push(eq(notifications.type, input.type));
      if (input.channel) conditions.push(eq(notifications.channel, input.channel));

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
      const conditions = [eq(notifications.is_read, false)];
      if (input.branch_id) conditions.push(eq(notifications.branch_id, input.branch_id));
      const rows = await db
        .select()
        .from(notifications)
        .where(and(...conditions));
      return { count: rows.length };
    }),

  // ── Mark as Read ────────────────────────────────────────────────────────────
  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await db
        .update(notifications)
        .set({ is_read: true, read_by: ctx.user.id, read_at: new Date() })
        .where(eq(notifications.id, input.id))
        .returning();
    }),

  markAllAsRead: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const conditions = [eq(notifications.is_read, false)];
      if (input.branch_id) conditions.push(eq(notifications.branch_id, input.branch_id));
      return await db
        .update(notifications)
        .set({ is_read: true, read_by: ctx.user.id, read_at: new Date() })
        .where(and(...conditions))
        .returning();
    }),

  // ── Send Manual Notification ────────────────────────────────────────────────
  send: protectedProcedure
    .input(z.object({
      type: notificationTypeEnum,
      title: z.string().min(1),
      message: z.string().min(1),
      priority: z.enum(["low", "normal", "high", "critical"]).default("normal"),
      userId: z.number().optional(),
      branchId: z.number().optional(),
      channels: z.array(channelEnum).default(["in_app"]),
      scheduledAt: z.string().optional(), // ISO string
      metadata: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ input }) => {
      await dispatchNotification({
        type: input.type,
        title: input.title,
        message: input.message,
        priority: input.priority,
        userId: input.userId,
        branchId: input.branchId,
        channels: input.channels,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
        metadata: input.metadata,
      });
      return { success: true };
    }),

  // ── Templates ───────────────────────────────────────────────────────────────
  listTemplates: protectedProcedure.query(async () => {
    return await db.select().from(notificationTemplates).orderBy(notificationTemplates.name);
  }),

  createTemplate: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      type: notificationTypeEnum,
      channel: channelEnum,
      subject: z.string().optional(),
      body: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      return await db.insert(notificationTemplates).values(input).returning();
    }),

  updateTemplate: protectedProcedure
    .input(z.object({
      id: z.number(),
      subject: z.string().optional(),
      body: z.string().min(1),
      is_active: z.boolean().optional(),
    }))
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
    .input(z.object({
      userId: z.number(),
      type: notificationTypeEnum,
      email_enabled: z.boolean().default(true),
      sms_enabled: z.boolean().default(false),
      whatsapp_enabled: z.boolean().default(false),
      push_enabled: z.boolean().default(true),
      in_app_enabled: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const existing = await db
        .select()
        .from(notificationPreferences)
        .where(
          and(
            eq(notificationPreferences.user_id, input.userId),
            eq(notificationPreferences.type, input.type),
          )
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
      } else {
        return await db.insert(notificationPreferences).values({
          user_id: input.userId,
          type: input.type,
          email_enabled: input.email_enabled,
          sms_enabled: input.sms_enabled,
          whatsapp_enabled: input.whatsapp_enabled,
          push_enabled: input.push_enabled,
          in_app_enabled: input.in_app_enabled,
        }).returning();
      }
    }),

  // ── Queue Management ─────────────────────────────────────────────────────────
  listQueue: protectedProcedure
    .input(z.object({ status: z.string().optional(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const rows = await db
        .select()
        .from(notificationQueue)
        .where(input.status ? eq(notificationQueue.status, input.status) : undefined)
        .orderBy(desc(notificationQueue.created_at))
        .limit(input.limit);
      return rows;
    }),

  processQueue: protectedProcedure.mutation(async () => {
    await processNotificationQueue();
    return { success: true };
  }),
});
