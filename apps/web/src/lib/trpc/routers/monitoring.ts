import { z } from "zod";
import { router, protectedProcedure } from "../init";
import { db } from "@/lib/db";
import {
  systemMetrics,
  eventLogs,
  loginHistory,
  branchHealthSnapshots,
  branches,
  orders,
  transactions,
  notificationQueue,
  importJobs,
} from "@evaluna/db/schema";
import { eq, desc, and, gte, lte, count, avg, sql } from "drizzle-orm";
import { collectSystemMetrics } from "@/lib/monitor-logger";

const severityEnum = z.enum(["info", "warning", "error", "critical"]);
const categoryEnum = z.enum(["auth", "api", "sync", "db", "import", "inventory", "payment", "system", "security"]);

export const monitoringRouter = router({

  // ── System Overview ─────────────────────────────────────────────────────────
  getSystemOverview: protectedProcedure.query(async () => {
    // Latest metrics snapshot
    const [latestMetrics] = await db
      .select()
      .from(systemMetrics)
      .orderBy(desc(systemMetrics.recorded_at))
      .limit(1);

    // Error count last 24h
    const since24h = new Date(Date.now() - 86400_000);
    const [errors24h] = await db
      .select({ c: count() })
      .from(eventLogs)
      .where(and(eq(eventLogs.severity, "error"), gte(eventLogs.created_at, since24h)));

    const [warnings24h] = await db
      .select({ c: count() })
      .from(eventLogs)
      .where(and(eq(eventLogs.severity, "warning"), gte(eventLogs.created_at, since24h)));

    // Queue stats
    const [queuePending] = await db
      .select({ c: count() })
      .from(notificationQueue)
      .where(eq(notificationQueue.status, "queued"));

    const [queueFailed] = await db
      .select({ c: count() })
      .from(notificationQueue)
      .where(eq(notificationQueue.status, "failed"));

    // Today's orders
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const [todayOrders] = await db
      .select({ c: count() })
      .from(orders)
      .where(gte(orders.created_at, startOfDay));

    // Recent logins
    const [failedLogins] = await db
      .select({ c: count() })
      .from(loginHistory)
      .where(and(eq(loginHistory.status, "failed"), gte(loginHistory.created_at, since24h)));

    // Branch count
    const allBranches = await db.select().from(branches).limit(50);

    return {
      metrics: latestMetrics ?? null,
      errors_24h: Number(errors24h?.c ?? 0),
      warnings_24h: Number(warnings24h?.c ?? 0),
      queue_pending: Number(queuePending?.c ?? 0),
      queue_failed: Number(queueFailed?.c ?? 0),
      orders_today: Number(todayOrders?.c ?? 0),
      failed_logins_24h: Number(failedLogins?.c ?? 0),
      branch_count: allBranches.length,
    };
  }),

  // ── Metrics History (for charts) ────────────────────────────────────────────
  getMetricsHistory: protectedProcedure
    .input(z.object({ hours: z.number().default(24) }))
    .query(async ({ input }) => {
      const since = new Date(Date.now() - input.hours * 3600_000);
      return await db
        .select()
        .from(systemMetrics)
        .where(gte(systemMetrics.recorded_at, since))
        .orderBy(desc(systemMetrics.recorded_at))
        .limit(288); // 5-min intervals × 24h = 288
    }),

  // ── Collect metrics snapshot ─────────────────────────────────────────────────
  collectMetrics: protectedProcedure.mutation(async () => {
    await collectSystemMetrics();
    return { success: true };
  }),

  // ── Event Logs ──────────────────────────────────────────────────────────────
  getEventLogs: protectedProcedure
    .input(z.object({
      severity: severityEnum.optional(),
      category: categoryEnum.optional(),
      hours: z.number().default(24),
      limit: z.number().default(100),
    }))
    .query(async ({ input }) => {
      const since = new Date(Date.now() - input.hours * 3600_000);
      const conditions = [gte(eventLogs.created_at, since)];
      if (input.severity) conditions.push(eq(eventLogs.severity, input.severity));
      if (input.category) conditions.push(eq(eventLogs.category, input.category));
      return await db
        .select()
        .from(eventLogs)
        .where(and(...conditions))
        .orderBy(desc(eventLogs.created_at))
        .limit(input.limit);
    }),

  // ── Log an event (callable from frontend for client-side errors) ─────────────
  logEvent: protectedProcedure
    .input(z.object({
      severity: severityEnum.default("info"),
      category: categoryEnum,
      event: z.string(),
      message: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
      durationMs: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.insert(eventLogs).values({
        user_id: ctx.user.id,
        severity: input.severity,
        category: input.category,
        event: input.event,
        message: input.message,
        metadata: input.metadata as any,
        duration_ms: input.durationMs,
      });
      return { success: true };
    }),

  // ── Login History ────────────────────────────────────────────────────────────
  getLoginHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(50), userId: z.string().optional() }))
    .query(async ({ input }) => {
      const conditions = [];
      if (input.userId) conditions.push(eq(loginHistory.user_id, input.userId));
      return await db
        .select()
        .from(loginHistory)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(loginHistory.created_at))
        .limit(input.limit);
    }),

  // ── Branch Health ────────────────────────────────────────────────────────────
  getBranchHealth: protectedProcedure.query(async () => {
    return await db
      .select()
      .from(branchHealthSnapshots)
      .orderBy(desc(branchHealthSnapshots.recorded_at))
      .limit(50);
  }),

  // ── API Performance analytics ─────────────────────────────────────────────────
  getApiMetrics: protectedProcedure
    .input(z.object({ hours: z.number().default(24) }))
    .query(async ({ input }) => {
      const since = new Date(Date.now() - input.hours * 3600_000);

      // By category
      const byCategory = await db
        .select({
          category: eventLogs.category,
          total: count(),
          avg_ms: avg(eventLogs.duration_ms),
          errors: sql<number>`sum(case when ${eventLogs.severity} = 'error' then 1 else 0 end)`,
        })
        .from(eventLogs)
        .where(gte(eventLogs.created_at, since))
        .groupBy(eventLogs.category);

      // Slow queries: events with duration > 1000ms
      const slowEvents = await db
        .select()
        .from(eventLogs)
        .where(
          and(
            gte(eventLogs.created_at, since),
            sql`${eventLogs.duration_ms} > 1000`
          )
        )
        .orderBy(desc(eventLogs.duration_ms))
        .limit(20);

      // Error breakdown
      const errorBreakdown = await db
        .select({
          event: eventLogs.event,
          count: count(),
        })
        .from(eventLogs)
        .where(
          and(
            eq(eventLogs.severity, "error"),
            gte(eventLogs.created_at, since)
          )
        )
        .groupBy(eventLogs.event)
        .orderBy(desc(count()))
        .limit(10);

      return { byCategory, slowEvents, errorBreakdown };
    }),

  // ── Queue Status ─────────────────────────────────────────────────────────────
  getQueueStatus: protectedProcedure.query(async () => {
    const [pendingNotifs] = await db.select({ c: count() }).from(notificationQueue).where(eq(notificationQueue.status, "queued"));
    const [failedNotifs] = await db.select({ c: count() }).from(notificationQueue).where(eq(notificationQueue.status, "failed"));
    const [sentToday] = await db.select({ c: count() }).from(notificationQueue).where(
      and(eq(notificationQueue.status, "sent"), gte(notificationQueue.processed_at, new Date(new Date().setHours(0, 0, 0, 0))))
    );
    const [pendingImports] = await db.select({ c: count() }).from(importJobs).where(eq(importJobs.status, "pending"));

    return {
      notifications: {
        pending: Number(pendingNotifs?.c ?? 0),
        failed: Number(failedNotifs?.c ?? 0),
        sent_today: Number(sentToday?.c ?? 0),
      },
      imports: {
        pending: Number(pendingImports?.c ?? 0),
      },
    };
  }),
});
