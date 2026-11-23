import { z } from "zod";
import {
	getWhatsAppSmsLogs,
	type MessageChannel,
	sendWhatsAppOrSMS,
	WHATSAPP_SMS_TEMPLATES,
} from "@/lib/whatsapp-sms-service";
import { protectedProcedure, router } from "../init";

export const whatsappSmsRouter = router({
	getLogs: protectedProcedure
		.input(
			z
				.object({
					channel: z.enum(["all", "whatsapp", "sms"]).optional(),
					search: z.string().optional(),
					limit: z.number().default(50),
				})
				.optional(),
		)
		.query(async ({ input }) => {
			let logs = getWhatsAppSmsLogs();

			if (input?.channel && input.channel !== "all") {
				logs = logs.filter((l) => l.channel === input.channel);
			}

			if (input?.search?.trim()) {
				const q = input.search.trim().toLowerCase();
				logs = logs.filter(
					(l) =>
						l.recipientName.toLowerCase().includes(q) ||
						l.recipientPhone.toLowerCase().includes(q) ||
						l.event.toLowerCase().includes(q) ||
						l.messageEn.toLowerCase().includes(q),
				);
			}

			return logs.slice(0, input?.limit ?? 50);
		}),

	getTemplates: protectedProcedure.query(() => {
		return WHATSAPP_SMS_TEMPLATES;
	}),

	sendTestAlert: protectedProcedure
		.input(
			z.object({
				channel: z.enum(["whatsapp", "sms"]),
				recipientPhone: z.string().min(5),
				recipientName: z.string().optional(),
				templateId: z.string(),
				customMessageEn: z.string().optional(),
				customMessageHi: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const template = WHATSAPP_SMS_TEMPLATES.find(
				(t) => t.id === input.templateId,
			);

			const messageEn =
				input.customMessageEn ||
				template?.templateEn
					.replace(
						"{{customer_name}}",
						input.recipientName || "Valued Customer",
					)
					.replace("{{order_id}}", "10048")
					.replace("{{total_amount}}", "8,500") ||
				"Alert from Evaluna ERP";

			const messageHi =
				input.customMessageHi ||
				template?.templateHi
					.replace("{{customer_name}}", input.recipientName || "सम्मानित ग्राहक")
					.replace("{{order_id}}", "10048")
					.replace("{{total_amount}}", "8,500") ||
				"इवलूना ERP सूचना";

			const sent = await sendWhatsAppOrSMS({
				channel: input.channel as MessageChannel,
				recipientPhone: input.recipientPhone,
				recipientName: input.recipientName || "Test Recipient",
				templateId: input.templateId,
				event: input.templateId,
				bilingualText: {
					en: messageEn,
					hi: messageHi,
				},
			});

			return {
				success: true,
				log: sent,
			};
		}),

	getStats: protectedProcedure.query(() => {
		const logs = getWhatsAppSmsLogs();
		const totalSent = logs.length;
		const whatsappCount = logs.filter((l) => l.channel === "whatsapp").length;
		const smsCount = logs.filter((l) => l.channel === "sms").length;
		const deliveredCount = logs.filter(
			(l) => l.status === "delivered" || l.status === "read",
		).length;

		const deliveryRate =
			totalSent > 0 ? Math.round((deliveredCount / totalSent) * 100) : 100;

		return {
			totalSent,
			whatsappCount,
			smsCount,
			deliveredCount,
			deliveryRate,
		};
	}),
});
