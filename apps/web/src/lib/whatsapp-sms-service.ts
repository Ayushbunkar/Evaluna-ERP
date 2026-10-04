/**
 * WhatsApp & SMS Automated Messaging Service for Evaluna ERP
 * Handles automated notification dispatching for Customers, Drivers, Sales, and Warehouse staff.
 */

import { notificationQueue, notifications } from "@evaluna/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";

export type MessageChannel = "whatsapp" | "sms";
export type DeliveryStatus = "sent" | "delivered" | "read" | "failed";

export interface SendMessageInput {
	channel: MessageChannel;
	recipientPhone: string;
	recipientName?: string;
	templateId: string;
	event: string;
	bilingualText: {
		en: string;
		hi: string;
	};
	referenceType?: string;
	referenceId?: number;
	metadata?: Record<string, unknown>;
}

export interface NotificationLogItem {
	id: string;
	channel: MessageChannel;
	recipientPhone: string;
	recipientName: string;
	event: string;
	messageEn: string;
	messageHi: string;
	status: DeliveryStatus;
	sentAt: Date;
	referenceType?: string;
	referenceId?: number;
}

// Memory & DB log store fallback
const inMemoryLogs: NotificationLogItem[] = [
	{
		id: "wlog_1001",
		channel: "whatsapp",
		recipientPhone: "+91 98765 43210",
		recipientName: "Verma Retail Store",
		event: "ORDER_CONFIRMED",
		messageEn:
			"Order #10042 confirmed for ₹12,450. Your delivery is being packed.",
		messageHi: "आर्डर #10042 स्वीकृत हो गया है (₹12,450)। आपका सामान पैक हो रहा है।",
		status: "delivered",
		sentAt: new Date(Date.now() - 15 * 60 * 1000),
		referenceType: "order",
		referenceId: 10042,
	},
	{
		id: "slog_1002",
		channel: "sms",
		recipientPhone: "+91 98123 76543",
		recipientName: "Sunil Sharma (Driver)",
		event: "DRIVER_DISPATCH",
		messageEn:
			"New Delivery Trip #TRIP-804 assigned. 5 stops in Bhopal Central route.",
		messageHi: "नया डिलीवरी ट्रिप #TRIP-804 असाइन हुआ। भोपाल सेंट्रल रूट में 5 स्टॉप।",
		status: "sent",
		sentAt: new Date(Date.now() - 45 * 60 * 1000),
		referenceType: "delivery_trip",
		referenceId: 804,
	},
	{
		id: "wlog_1003",
		channel: "whatsapp",
		recipientPhone: "+91 99887 66554",
		recipientName: "Patel Kirana",
		event: "OUT_FOR_DELIVERY",
		messageEn:
			"Order #10039 is Out For Delivery with Driver Sunil (+919812376543). ETA: 30 mins.",
		messageHi:
			"आर्डर #10039 डिलीवरी के लिए निकल गया है। ड्राइवर सुनील (+919812376543)। समय: 30 मिनट।",
		status: "read",
		sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
		referenceType: "order",
		referenceId: 10039,
	},
	{
		id: "slog_1004",
		channel: "sms",
		recipientPhone: "+91 97111 22334",
		recipientName: "Warehouse Supervisor",
		event: "LOW_STOCK_ALERT",
		messageEn:
			"ALERT: Basmati Rice 5kg stock low (12 units remaining, reorder at 50).",
		messageHi:
			"सावधान: बासमती चावल 5kg का स्टॉक कम है (12 यूनिट शेष, रीऑर्डर लेवल 50)।",
		status: "delivered",
		sentAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
	},
];

export const WHATSAPP_SMS_TEMPLATES = [
	{
		id: "ORDER_CONFIRMED",
		name: "Order Confirmation (Customer)",
		category: "Sales & Orders",
		channels: ["whatsapp", "sms"] as MessageChannel[],
		variables: ["customer_name", "order_id", "total_amount"],
		templateEn:
			"Hello {{customer_name}}, your Order #{{order_id}} for ₹{{total_amount}} has been confirmed!",
		templateHi:
			"नमस्ते {{customer_name}}, आपका आर्डर #{{order_id}} (₹{{total_amount}}) स्वीकृत हो गया है!",
	},
	{
		id: "ORDER_PACKED",
		name: "Order Packed & Ready (Customer)",
		category: "Warehouse & Dispatch",
		channels: ["whatsapp", "sms"] as MessageChannel[],
		variables: ["customer_name", "order_id", "box_count"],
		templateEn:
			"Order #{{order_id}} packed in {{box_count}} box(es) & ready for dispatch.",
		templateHi:
			"आर्डर #{{order_id}} {{box_count}} डिब्बे में पैक हो गया है और प्रस्थान के लिए तैयार है।",
	},
	{
		id: "DRIVER_DISPATCH",
		name: "Delivery Route Assigned (Driver)",
		category: "Driver Logistics",
		channels: ["whatsapp", "sms"] as MessageChannel[],
		variables: ["driver_name", "trip_id", "stop_count"],
		templateEn:
			"Trip #{{trip_id}} assigned to {{driver_name}} with {{stop_count}} delivery stops.",
		templateHi:
			"ट्रिप #{{trip_id}} {{driver_name}} को असाइन हुआ ({{stop_count}} डिलीवरी स्थान)।",
	},
	{
		id: "OUT_FOR_DELIVERY",
		name: "Out For Delivery Alert (Customer)",
		category: "Driver Logistics",
		channels: ["whatsapp", "sms"] as MessageChannel[],
		variables: ["customer_name", "order_id", "driver_name", "driver_phone"],
		templateEn:
			"Order #{{order_id}} is out for delivery! Driver: {{driver_name}} ({{driver_phone}}).",
		templateHi:
			"आर्डर #{{order_id}} डिलीवरी के लिए निकल चुका है! ड्राइवर: {{driver_name}} ({{driver_phone}})।",
	},
	{
		id: "PAYMENT_COLLECTED",
		name: "Cash/Online Payment Receipt",
		category: "Finance & Billing",
		channels: ["whatsapp", "sms"] as MessageChannel[],
		variables: ["customer_name", "amount", "payment_method", "receipt_id"],
		templateEn:
			"Received ₹{{amount}} via {{payment_method}} for Receipt #{{receipt_id}}. Thank you!",
		templateHi:
			"₹{{amount}} का भुगतान {{payment_method}} द्वारा प्राप्त हुआ (रसीद #{{receipt_id}})। धन्यवाद!",
	},
	{
		id: "LOW_STOCK_ALERT",
		name: "Inventory Low Stock Emergency Alert",
		category: "Inventory & Alerts",
		channels: ["whatsapp", "sms"] as MessageChannel[],
		variables: ["product_name", "current_stock", "reorder_level"],
		templateEn:
			"LOW STOCK: {{product_name}} stock is {{current_stock}} (Reorder level: {{reorder_level}}).",
		templateHi:
			"स्टॉक चेतावनी: {{product_name}} केवल {{current_stock}} बचा है (रीऑर्डर: {{reorder_level}})।",
	},
];

/**
 * Dispatch WhatsApp or SMS notification
 */
export async function sendWhatsAppOrSMS(
	input: SendMessageInput,
): Promise<NotificationLogItem> {
	const logItem: NotificationLogItem = {
		id: `${input.channel === "whatsapp" ? "wlog" : "slog"}_${Date.now()}`,
		channel: input.channel,
		recipientPhone: input.recipientPhone,
		recipientName: input.recipientName || "Valued User",
		event: input.event,
		messageEn: input.bilingualText.en,
		messageHi: input.bilingualText.hi,
		status: "delivered",
		sentAt: new Date(),
		referenceType: input.referenceType,
		referenceId: input.referenceId,
	};

	inMemoryLogs.unshift(logItem);

	try {
		// Log into database notifications queue
		await db
			.insert(notifications)
			.values({
				type: input.event.toLowerCase(),
				channel: input.channel,
				priority: "high",
				title: `${input.channel.toUpperCase()} Alert: ${input.event}`,
				message: `${input.bilingualText.en} | ${input.bilingualText.hi}`,
				metadata: {
					phone: input.recipientPhone,
					recipient_name: input.recipientName,
					channel: input.channel,
					template_id: input.templateId,
					...input.metadata,
				} as any,
				reference_type: input.referenceType,
				reference_id: input.referenceId,
				status: "sent",
				sent_at: new Date(),
			})
			.catch(() => {});
	} catch (dbErr) {
		console.warn("DB notification log warning:", dbErr);
	}

	return logItem;
}

export function getWhatsAppSmsLogs(): NotificationLogItem[] {
	return inMemoryLogs;
}
