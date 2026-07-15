/**
 * Notification Service — Phase 40
 * Handles template rendering, channel dispatch, scheduling, and retry logic.
 * This is a server-side service used by TRPC procedures and triggered automatically
 * by business events (sales, purchases, low stock, etc.).
 */

import { db } from "@/lib/db";
import {
  notifications,
  notificationQueue,
  notificationTemplates,
  notificationPreferences,
} from "@evaluna/db/schema";
import { eq, and, lte, lt } from "drizzle-orm";

// ── Types ─────────────────────────────────────────────────────────────────────
export type NotificationType =
  | "low_stock"
  | "expiry"
  | "damage"
  | "purchase"
  | "sale"
  | "payment_due"
  | "birthday"
  | "loyalty"
  | "campaign"
  | "info"
  | "warning"
  | "error";

export type NotificationChannel = "in_app" | "email" | "sms" | "whatsapp" | "push";
export type NotificationPriority = "low" | "normal" | "high" | "critical";

export interface DispatchInput {
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  userId?: number;
  branchId?: number;
  referenceType?: string;
  referenceId?: number;
  metadata?: Record<string, unknown>;
  scheduledAt?: Date;
  channels?: NotificationChannel[];
}

// ── Template Renderer ─────────────────────────────────────────────────────────
/**
 * Simple Handlebars-style template renderer.
 * Replaces {{key}} placeholders with values from the data object.
 */
export function renderTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = data[key];
    return val !== undefined && val !== null ? String(val) : `{{${key}}}`;
  });
}

// ── Default Templates ─────────────────────────────────────────────────────────
export const DEFAULT_TEMPLATES: Record<NotificationType, { subject?: string; body: string }> = {
  low_stock: {
    subject: "⚠️ Low Stock Alert: {{product_name}}",
    body: "Product '{{product_name}}' is running low. Current stock: {{current_stock}} units (Reorder level: {{reorder_level}}).",
  },
  expiry: {
    subject: "🗓️ Expiry Alert: {{product_name}}",
    body: "Batch {{batch_number}} of '{{product_name}}' expires on {{expiry_date}}. Quantity: {{quantity}} units.",
  },
  damage: {
    subject: "🔴 Damage Report: {{product_name}}",
    body: "{{quantity}} units of '{{product_name}}' have been reported as damaged at branch {{branch_name}}.",
  },
  purchase: {
    subject: "📦 Purchase Order Received",
    body: "GRN {{grn_number}} from {{supplier_name}} worth ₹{{total_amount}} has been received.",
  },
  sale: {
    subject: "💰 New Sale Completed",
    body: "Order #{{order_id}} completed for ₹{{total_amount}}. Payment: {{payment_method}}.",
  },
  payment_due: {
    subject: "⏰ Payment Due: {{supplier_name}}",
    body: "Payment of ₹{{amount}} is due to {{supplier_name}} on {{due_date}}.",
  },
  birthday: {
    subject: "🎂 Happy Birthday {{customer_name}}!",
    body: "Wishing {{customer_name}} a very happy birthday! Use code BDAY{{year}} for a special discount today.",
  },
  loyalty: {
    subject: "⭐ Loyalty Update",
    body: "{{customer_name}} has earned {{points}} points! Total balance: {{total_points}} points. Tier: {{tier}}.",
  },
  campaign: {
    subject: "📢 {{campaign_name}}",
    body: "{{campaign_message}}",
  },
  info: {
    body: "{{message}}",
  },
  warning: {
    subject: "⚠️ Warning",
    body: "{{message}}",
  },
  error: {
    subject: "🔴 Error Alert",
    body: "{{message}}",
  },
};

// ── Channel Dispatchers ───────────────────────────────────────────────────────
async function dispatchEmail(recipient: string, subject: string, body: string): Promise<void> {
  // Stub: integrate with Resend / SendGrid / Nodemailer
  console.log(`[EMAIL → ${recipient}] Subject: ${subject}\n${body}`);
  // await resend.emails.send({ from: 'noreply@evaluna.app', to: recipient, subject, html: body });
}

async function dispatchSMS(recipient: string, body: string): Promise<void> {
  // Stub: integrate with Twilio / MSG91
  console.log(`[SMS → ${recipient}] ${body}`);
  // await twilio.messages.create({ to: recipient, from: process.env.TWILIO_FROM, body });
}

async function dispatchWhatsApp(recipient: string, body: string): Promise<void> {
  // Stub: integrate with Twilio WhatsApp / Interakt / AiSensy
  console.log(`[WHATSAPP → ${recipient}] ${body}`);
}

async function dispatchPush(deviceToken: string, title: string, body: string): Promise<void> {
  // Stub: integrate with Firebase Cloud Messaging
  console.log(`[PUSH → ${deviceToken}] ${title}: ${body}`);
  // await admin.messaging().send({ token: deviceToken, notification: { title, body } });
}

// ── Core Dispatch Function ────────────────────────────────────────────────────
/**
 * The main entry point for the notification system.
 * 1. Creates an in_app notification record.
 * 2. Enqueues external channel jobs based on user preferences.
 * 3. For immediate notifications, processes the queue synchronously.
 */
export async function dispatchNotification(input: DispatchInput): Promise<void> {
  const channels = input.channels ?? ["in_app"];

  // 1. Create the notification record
  const [notification] = await db
    .insert(notifications)
    .values({
      branch_id: input.branchId,
      user_id: input.userId,
      type: input.type,
      channel: "in_app",
      priority: input.priority ?? "normal",
      title: input.title,
      message: input.message,
      metadata: input.metadata as any,
      reference_type: input.referenceType,
      reference_id: input.referenceId,
      scheduled_at: input.scheduledAt,
      status: input.scheduledAt ? "pending" : "sent",
      sent_at: input.scheduledAt ? undefined : new Date(),
    })
    .returning();

  if (!notification) return;

  // 2. Enqueue external channel deliveries
  for (const channel of channels) {
    if (channel === "in_app") continue; // Already recorded as in-app

    const template = DEFAULT_TEMPLATES[input.type];
    const rendered = renderTemplate(template.body, (input.metadata as Record<string, unknown>) ?? {});
    const subject = template.subject
      ? renderTemplate(template.subject, (input.metadata as Record<string, unknown>) ?? {})
      : input.title;

    // Determine recipient from metadata
    const recipient =
      (input.metadata?.email as string) ??
      (input.metadata?.phone as string) ??
      (input.metadata?.device_token as string) ??
      "";

    if (!recipient) continue;

    await db.insert(notificationQueue).values({
      notification_id: notification.id,
      channel,
      recipient,
      payload: { title: subject, body: rendered, subject } as any,
      status: input.scheduledAt ? "queued" : "queued",
      next_retry_at: input.scheduledAt ?? new Date(),
    });
  }
}

// ── Alert Trigger Helpers ─────────────────────────────────────────────────────
export async function triggerLowStockAlert(opts: {
  productName: string;
  currentStock: number;
  reorderLevel: number;
  branchId: number;
}): Promise<void> {
  await dispatchNotification({
    type: "low_stock",
    priority: "high",
    title: `Low Stock: ${opts.productName}`,
    message: `Only ${opts.currentStock} units remaining (reorder at ${opts.reorderLevel})`,
    branchId: opts.branchId,
    metadata: {
      product_name: opts.productName,
      current_stock: opts.currentStock,
      reorder_level: opts.reorderLevel,
    },
    channels: ["in_app", "push"],
  });
}

export async function triggerPaymentDueAlert(opts: {
  supplierName: string;
  amount: number;
  dueDate: string;
  userId: number;
}): Promise<void> {
  await dispatchNotification({
    type: "payment_due",
    priority: "high",
    title: `Payment Due: ${opts.supplierName}`,
    message: `₹${opts.amount} due on ${opts.dueDate}`,
    userId: opts.userId,
    metadata: {
      supplier_name: opts.supplierName,
      amount: opts.amount,
      due_date: opts.dueDate,
    },
    channels: ["in_app", "email"],
  });
}

export async function triggerBirthdayAlert(opts: {
  customerName: string;
  email: string;
  year: number;
}): Promise<void> {
  await dispatchNotification({
    type: "birthday",
    priority: "normal",
    title: `Happy Birthday, ${opts.customerName}!`,
    message: `Sending birthday wishes and promo code to ${opts.customerName}`,
    metadata: {
      customer_name: opts.customerName,
      email: opts.email,
      year: opts.year,
    },
    channels: ["in_app", "email", "whatsapp"],
  });
}

export async function triggerSaleAlert(opts: {
  orderId: number;
  totalAmount: number;
  paymentMethod: string;
  branchId: number;
}): Promise<void> {
  await dispatchNotification({
    type: "sale",
    priority: "low",
    title: `Sale Completed — ₹${opts.totalAmount}`,
    message: `Order #${opts.orderId} completed via ${opts.paymentMethod}`,
    branchId: opts.branchId,
    referenceType: "order",
    referenceId: opts.orderId,
    metadata: {
      order_id: opts.orderId,
      total_amount: opts.totalAmount,
      payment_method: opts.paymentMethod,
    },
    channels: ["in_app"],
  });
}

// ── Queue Processor (Retry Engine) ────────────────────────────────────────────
/**
 * Process pending/failed items in the notification_queue.
 * Should be called by a cron/setInterval background job.
 * Retries up to 3 times with exponential backoff (1m, 5m, 15m).
 */
const MAX_RETRIES = 3;

export async function processNotificationQueue(): Promise<void> {
  const due = await db
    .select()
    .from(notificationQueue)
    .where(
      and(
        eq(notificationQueue.status, "queued"),
        lte(notificationQueue.next_retry_at, new Date()),
        lt(notificationQueue.retry_count, MAX_RETRIES)
      )
    )
    .limit(50);

  for (const item of due) {
    const payload = item.payload as { title: string; body: string; subject?: string };

    try {
      // Mark as processing
      await db
        .update(notificationQueue)
        .set({ status: "processing" })
        .where(eq(notificationQueue.id, item.id));

      if (item.channel === "email") {
        await dispatchEmail(item.recipient, payload.subject ?? payload.title, payload.body);
      } else if (item.channel === "sms") {
        await dispatchSMS(item.recipient, payload.body);
      } else if (item.channel === "whatsapp") {
        await dispatchWhatsApp(item.recipient, payload.body);
      } else if (item.channel === "push") {
        await dispatchPush(item.recipient, payload.title, payload.body);
      }

      // Mark as sent
      await db
        .update(notificationQueue)
        .set({ status: "sent", processed_at: new Date() })
        .where(eq(notificationQueue.id, item.id));
    } catch (err) {
      const newRetryCount = (item.retry_count ?? 0) + 1;
      // Exponential backoff: 1min, 5min, 15min
      const backoffMinutes = [1, 5, 15][newRetryCount - 1] ?? 15;
      const nextRetry = new Date(Date.now() + backoffMinutes * 60 * 1000);

      await db
        .update(notificationQueue)
        .set({
          status: newRetryCount >= MAX_RETRIES ? "failed" : "queued",
          retry_count: newRetryCount,
          next_retry_at: nextRetry,
          last_error: err instanceof Error ? err.message : "Unknown error",
        })
        .where(eq(notificationQueue.id, item.id));
    }
  }
}
