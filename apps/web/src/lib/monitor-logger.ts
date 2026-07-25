/**
 * Monitoring Logger — Phase 41
 * Lightweight structured logger for capturing application events into event_logs.
 * Call from any TRPC procedure, service function, or middleware.
 */

import { db } from "@/lib/db";
import { eventLogs, systemMetrics, loginHistory, notificationQueue, importJobs } from "@evaluna/db/schema";
import { eq, and, desc, gte, count, avg, sql } from "drizzle-orm";

export type LogSeverity = "info" | "warning" | "error" | "critical";
export type LogCategory =
  | "auth" | "api" | "sync" | "db" | "import"
  | "inventory" | "payment" | "system" | "security";

export interface LogEntry {
  severity?: LogSeverity;
  category: LogCategory;
  event: string;
  message?: string;
  branchId?: number;
  userId?: string;
  metadata?: Record<string, unknown>;
  durationMs?: number;
  statusCode?: number;
  ipAddress?: string;
  userAgent?: string;
}

// ── Core Logger ──────────────────────────────────────────────────────────────
export async function logEvent(entry: LogEntry): Promise<void> {
  try {
    await db.insert(eventLogs).values({
      branch_id: entry.branchId,
      user_id: entry.userId,
      severity: entry.severity ?? "info",
      category: entry.category,
      event: entry.event,
      message: entry.message,
      metadata: entry.metadata as any,
      duration_ms: entry.durationMs,
      status_code: entry.statusCode,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
    });
  } catch (err) {
    // Never throw from logger — silently write to console as fallback
    console.error("[MonitorLogger] Failed to write event log:", err);
  }
}

// ── Convenience Helpers ──────────────────────────────────────────────────────
export const logger = {
  info: (category: LogCategory, event: string, data?: Partial<LogEntry>) =>
    logEvent({ severity: "info", category, event, ...data }),

  warn: (category: LogCategory, event: string, data?: Partial<LogEntry>) =>
    logEvent({ severity: "warning", category, event, ...data }),

  error: (category: LogCategory, event: string, data?: Partial<LogEntry>) =>
    logEvent({ severity: "error", category, event, ...data }),

  critical: (category: LogCategory, event: string, data?: Partial<LogEntry>) =>
    logEvent({ severity: "critical", category, event, ...data }),

  auth: (event: string, userId: string, data?: Partial<LogEntry>) =>
    logEvent({ severity: "info", category: "auth", event, userId, ...data }),

  loginFailed: (email: string, reason: string, ip?: string) =>
    logEvent({
      severity: "warning",
      category: "security",
      event: "login_failed",
      userId: email,
      message: reason,
      ipAddress: ip,
    }),

  api: (event: string, statusCode: number, durationMs: number, data?: Partial<LogEntry>) =>
    logEvent({ severity: statusCode >= 500 ? "error" : "info", category: "api", event, statusCode, durationMs, ...data }),
};

// ── Login History ─────────────────────────────────────────────────────────────
export async function recordLogin(opts: {
  userId: string;
  email: string;
  status: "success" | "failed" | "blocked";
  ip?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  failureReason?: string;
}): Promise<void> {
  try {
    await db.insert(loginHistory).values({
      user_id: opts.userId,
      user_email: opts.email,
      status: opts.status,
      ip_address: opts.ip,
      device_type: opts.deviceType,
      browser: opts.browser,
      os: opts.os,
      failure_reason: opts.failureReason,
    });
  } catch (err) {
    console.error("[MonitorLogger] Failed to write login history:", err);
  }
}

// ── System Metrics Collector ──────────────────────────────────────────────────
/**
 * Snapshots system state into system_metrics.
 * Should be called periodically (e.g. every 5 minutes).
 */
export async function collectSystemMetrics(): Promise<void> {
  try {
    // Node.js process memory
    const mem = process.memoryUsage();
    const memUsedMb = Math.round(mem.heapUsed / 1024 / 1024);
    const memTotalMb = Math.round(mem.heapTotal / 1024 / 1024);

    // Queue depths
    const [queuePending] = await db
      .select({ c: count() })
      .from(notificationQueue)
      .where(eq(notificationQueue.status, "queued"));

    const [importPending] = await db
      .select({ c: count() })
      .from(importJobs)
      .where(eq(importJobs.status, "pending"));

    // Recent API performance from event_logs
    const since = new Date(Date.now() - 60_000); // last 1 minute
    const [apiStats] = await db
      .select({
        reqCount: count(),
        avgMs: avg(eventLogs.duration_ms),
      })
      .from(eventLogs)
      .where(
        and(
          eq(eventLogs.category, "api"),
          gte(eventLogs.created_at, since)
        )
      );

    const [errorCount] = await db
      .select({ c: count() })
      .from(eventLogs)
      .where(
        and(
          eq(eventLogs.severity, "error"),
          gte(eventLogs.created_at, since)
        )
      );

    await db.insert(systemMetrics).values({
      memory_used_mb: memUsedMb,
      memory_total_mb: memTotalMb,
      api_requests_per_min: Number(apiStats?.reqCount ?? 0),
      api_avg_response_ms: apiStats?.avgMs ? Math.round(Number(apiStats.avgMs)) : null,
      api_error_count: Number(errorCount?.c ?? 0),
      notification_queue_pending: Number(queuePending?.c ?? 0),
      import_jobs_pending: Number(importPending?.c ?? 0),
    });
  } catch (err) {
    console.error("[MonitorLogger] collectSystemMetrics failed:", err);
  }
}
